import { Router } from 'express';
import mongoose from 'mongoose';
import { requireTenant, withTenantFilter } from '../middleware/tenant.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { Purchase } from '../models/Purchase.js';
import { Item } from '../models/Item.js';
import { Vendor } from '../models/Vendor.js';
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
      .populate('item', 'name sku manufacturingPrice sellingPrice itemType')
      .populate('warehouse', 'name')
      .populate('vendor', 'name phone email')
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
      vendorId,
      purchaseCategory = 'item',
      note,
      paymentType = 'cash',
      purchasedAt,
    } = req.body;

    const qty = Number(quantity || 0);
    if (!warehouseId || !itemId || qty <= 0) {
      return res.status(400).json({ message: 'warehouseId, itemId, and quantity (>0) are required' });
    }

    const category = purchaseCategory === 'raw_material' ? 'raw_material' : 'item';
    const expectedItemType = category === 'raw_material' ? 'raw_material' : 'finished_good';

    if (category === 'raw_material' && !vendorId) {
      return res.status(400).json({ message: 'vendorId is required for raw material purchases' });
    }

    const [warehouse, item, vendor] = await Promise.all([
      Warehouse.findOne({ _id: warehouseId, organization }),
      Item.findOne({ _id: itemId, organization }),
      vendorId ? Vendor.findOne({ _id: vendorId, organization }) : Promise.resolve(null),
    ]);

    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found for tenant' });
    if (!item) return res.status(404).json({ message: 'Item not found for tenant' });
    if (vendorId && !vendor) return res.status(404).json({ message: 'Vendor not found for tenant' });

    const itemType = item.itemType || 'finished_good';
    if (itemType !== expectedItemType) {
      return res.status(400).json({
        message:
          category === 'raw_material'
            ? 'Selected item must be a raw material'
            : 'Selected item must be a finished good',
      });
    }

    const supplierName = vendor?.name || supplier || '';

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
      purchaseCategory: category,
      vendor: vendor?._id,
      quantity: qty,
      unitPrice: price,
      totalAmount,
      supplier: supplierName,
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
      purchaseCategory: category,
      quantity: qty,
      paymentType,
      totalAmount,
      supplier: supplierName,
      vendorId: vendor?._id,
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
    const { supplier, note, purchasedAt, vendorId } = req.body;

    const update = {};
    if (supplier !== undefined) update.supplier = supplier;
    if (note !== undefined) update.note = note;
    if (purchasedAt !== undefined) update.purchasedAt = new Date(purchasedAt);
    if (vendorId !== undefined) {
      if (vendorId) {
        const vendor = await Vendor.findOne({ _id: vendorId, organization });
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
        update.vendor = vendor._id;
        update.supplier = vendor.name;
      } else {
        update.vendor = null;
      }
    }

    const purchase = await Purchase.findOneAndUpdate(
      { _id: req.params.id, organization },
      { $set: update },
      { new: true },
    )
      .populate('item', 'name sku itemType')
      .populate('warehouse', 'name')
      .populate('vendor', 'name phone email');

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

// DELETE /api/purchases/:id/payments/:paymentId — reverse a recorded payment
router.delete('/:id/payments/:paymentId', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);
    const purchase = await Purchase.findOne({ _id: req.params.id, organization });

    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });

    const payment = purchase.payments.id(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const amount = Number(payment.amount || 0);
    purchase.paidAmount = Math.max(0, Number(purchase.paidAmount || 0) - amount);
    purchase.remainingAmount = Number(purchase.remainingAmount || 0) + amount;

    payment.deleteOne();
    await purchase.save();

    await logActivity(req, 'PURCHASE_PAYMENT_DELETE', 'Purchase', purchase._id, {
      amount,
      remainingAmount: purchase.remainingAmount,
    });

    res.json({ message: 'Payment deleted', purchase });
  } catch (err) {
    next(err);
  }
});

export default router;
