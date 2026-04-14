import { Router } from 'express';
import mongoose from 'mongoose';
import { requireTenant, withTenantFilter } from '../middleware/tenant.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { Purchase } from '../models/Purchase.js';
import { Item } from '../models/Item.js';
import { Stock } from '../models/Stock.js';
import { Warehouse } from '../models/Warehouse.js';
import { logActivity } from '../utils/activity.js';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

// GET /api/purchases — list all purchases
router.get('/', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const purchases = await Purchase.find(withTenantFilter(req))
      .populate('item', 'name sku manufacturingPrice sellingPrice')
      .populate('warehouse', 'name')
      .sort({ purchasedAt: -1 });

    res.json(purchases);
  } catch (err) {
    next(err);
  }
});

// GET /api/purchases/summary — total credit purchases outstanding (amount we owe)
router.get('/summary', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const match = withTenantFilter(req, { paymentType: 'credit', remainingAmount: { $gt: 0 } });

    const result = await Purchase.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(req.tenant.organizationId), paymentType: 'credit', remainingAmount: { $gt: 0 } } },
      { $group: { _id: null, totalToPay: { $sum: '$remainingAmount' } } },
    ]);

    res.json({ totalToPay: result[0]?.totalToPay || 0 });
  } catch (err) {
    next(err);
  }
});

// POST /api/purchases — create purchase (+ adjusts stock, + updates item mfg price)
router.post('/', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);
    const {
      warehouseId,
      itemId,
      quantity,
      unitPrice,
      supplier,
      note,
      paymentType = 'cash',
      purchasedAt,
    } = req.body;

    const qty = Number(quantity || 0);
    if (!warehouseId || !itemId || qty <= 0) {
      return res.status(400).json({ message: 'warehouseId, itemId, and quantity (>0) are required' });
    }

    const [warehouse, item] = await Promise.all([
      Warehouse.findOne({ _id: warehouseId, organization }),
      Item.findOne({ _id: itemId, organization }),
    ]);

    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found for tenant' });
    if (!item) return res.status(404).json({ message: 'Item not found for tenant' });

    const price = Number(unitPrice || 0);
    const totalAmount = qty * price;
    const paidAmount = paymentType === 'cash' ? totalAmount : 0;
    const remainingAmount = totalAmount - paidAmount;

    // Update item manufacturing price if a price is given
    if (price > 0) {
      item.manufacturingPrice = price;
      await item.save();
    }

    // Adjust stock (upsert then increment)
    const stock = await Stock.findOneAndUpdate(
      { organization, warehouse: warehouseId, item: itemId },
      { $setOnInsert: { organization, warehouse: warehouseId, item: itemId, quantity: 0 } },
      { new: true, upsert: true },
    );
    stock.quantity = stock.quantity + qty;
    await stock.save();

    const purchaseDate = purchasedAt ? new Date(purchasedAt) : new Date();

    // Create purchase record
    const purchase = await Purchase.create({
      organization,
      warehouse: warehouseId,
      item: itemId,
      quantity: qty,
      unitPrice: price,
      totalAmount,
      supplier: supplier || '',
      note: note || '',
      paymentType,
      paidAmount,
      remainingAmount,
      purchasedAt: purchaseDate,
      payments:
        paidAmount > 0
          ? [
              {
                amount: paidAmount,
                paidAt: purchaseDate,
                note: 'Full payment at purchase',
                recordedBy: req.auth.name || req.auth.email,
              },
            ]
          : [],
    });

    await logActivity(req, 'PURCHASE_CREATE', 'Purchase', purchase._id, {
      itemId,
      itemName: item.name,
      quantity: qty,
      paymentType,
      totalAmount,
      supplier: supplier || '',
    });

    res.status(201).json(purchase);
  } catch (err) {
    next(err);
  }
});

// PUT /api/purchases/:id — edit supplier / note / date
router.put('/:id', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);
    const { supplier, note, purchasedAt } = req.body;

    const update = {};
    if (supplier !== undefined) update.supplier = supplier;
    if (note !== undefined) update.note = note;
    if (purchasedAt !== undefined) update.purchasedAt = new Date(purchasedAt);

    const purchase = await Purchase.findOneAndUpdate(
      { _id: req.params.id, organization },
      { $set: update },
      { new: true },
    )
      .populate('item', 'name sku')
      .populate('warehouse', 'name');

    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });

    await logActivity(req, 'PURCHASE_UPDATE', 'Purchase', purchase._id, { supplier, note });

    res.json(purchase);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/purchases/:id — void purchase and reverse stock
router.delete('/:id', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);
    const purchase = await Purchase.findOne({ _id: req.params.id, organization });

    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });

    // Reverse stock
    await Stock.findOneAndUpdate(
      { organization, warehouse: purchase.warehouse, item: purchase.item },
      { $inc: { quantity: -purchase.quantity } },
    );

    await logActivity(req, 'PURCHASE_DELETE', 'Purchase', purchase._id, {
      quantity: purchase.quantity,
      totalAmount: purchase.totalAmount,
    });

    await purchase.deleteOne();

    res.json({ message: 'Purchase voided and stock reversed' });
  } catch (err) {
    next(err);
  }
});

// POST /api/purchases/:id/payments — record a repayment on a credit purchase
router.post('/:id/payments', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);
    const { amount, note } = req.body;

    const pmtAmount = Number(amount || 0);
    if (pmtAmount <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });

    const purchase = await Purchase.findOne({ _id: req.params.id, organization })
      .populate('item', 'name sku')
      .populate('warehouse', 'name');

    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
    if (purchase.paymentType !== 'credit') return res.status(400).json({ message: 'Only credit purchases accept payments' });
    if (pmtAmount > purchase.remainingAmount) {
      return res.status(400).json({ message: `Amount exceeds remaining balance of ${purchase.remainingAmount}` });
    }

    purchase.payments.push({
      amount: pmtAmount,
      paidAt: new Date(),
      note: note || '',
      recordedBy: req.auth.name || req.auth.email || '',
    });
    purchase.paidAmount += pmtAmount;
    purchase.remainingAmount = Math.max(0, purchase.remainingAmount - pmtAmount);

    await purchase.save();

    await logActivity(req, 'PURCHASE_PAYMENT', 'Purchase', purchase._id, {
      amount: pmtAmount,
      remainingAmount: purchase.remainingAmount,
    });

    res.json(purchase);
  } catch (err) {
    next(err);
  }
});

export default router;
