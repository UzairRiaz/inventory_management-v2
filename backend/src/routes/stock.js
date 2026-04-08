import { Router } from 'express';
import mongoose from 'mongoose';
import { requireTenant, withTenantFilter } from '../middleware/tenant.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { Stock } from '../models/Stock.js';
import { Warehouse } from '../models/Warehouse.js';
import { Item } from '../models/Item.js';
import { logActivity } from '../utils/activity.js';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const query = withTenantFilter(req, req.query.warehouseId ? { warehouse: req.query.warehouseId } : {});

    const stock = await Stock.find(query)
      .populate('warehouse', 'name location')
      .populate('item', 'name sku tags manufacturingPrice sellingPrice')
      .sort({ updatedAt: -1 });

    res.json(stock);
  } catch (error) {
    next(error);
  }
});

router.post('/adjust', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const { warehouseId, itemId, quantity, type, manufacturingPrice } = req.body;
    const qty = Number(quantity || 0);

    if (!warehouseId || !itemId || qty <= 0 || !['IN', 'OUT'].includes(type)) {
      return res.status(400).json({ message: 'warehouseId, itemId, quantity (>0), type (IN/OUT) are required' });
    }

    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);

    const [warehouse, item] = await Promise.all([
      Warehouse.findOne({ _id: warehouseId, organization }),
      Item.findOne({ _id: itemId, organization }),
    ]);

    if (!warehouse || !item) {
      return res.status(404).json({ message: 'Warehouse or item not found for tenant' });
    }

    // Update manufacturing price on the item if provided with an IN adjustment
    if (type === 'IN' && manufacturingPrice !== undefined && manufacturingPrice !== '') {
      const newMfgPrice = Number(manufacturingPrice);
      if (!isNaN(newMfgPrice) && newMfgPrice >= 0) {
        item.manufacturingPrice = newMfgPrice;
        await item.save();
      }
    }

    const stock = await Stock.findOneAndUpdate(
      {
        organization,
        warehouse: warehouseId,
        item: itemId,
      },
      {
        $setOnInsert: {
          organization,
          warehouse: warehouseId,
          item: itemId,
          quantity: 0,
        },
      },
      { new: true, upsert: true }
    );

    const nextQty = type === 'IN' ? stock.quantity + qty : stock.quantity - qty;

    if (nextQty < 0) {
      return res.status(400).json({ message: 'Insufficient stock for OUT adjustment' });
    }

    stock.quantity = nextQty;
    await stock.save();

    await logActivity(req, 'STOCK_ADJUST', 'Stock', stock._id, {
      warehouseId,
      itemId,
      type,
      quantity: qty,
      resultingQuantity: stock.quantity,
      ...(type === 'IN' && manufacturingPrice !== undefined && manufacturingPrice !== '' ? { manufacturingPriceUpdated: Number(manufacturingPrice) } : {}),
    });

    res.json(stock);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const stock = await Stock.findOneAndDelete(withTenantFilter(req, { _id: req.params.id }));

    if (!stock) {
      return res.status(404).json({ message: 'Stock entry not found' });
    }

    await logActivity(req, 'STOCK_DELETE', 'Stock', stock._id, {
      warehouseId: stock.warehouse,
      itemId: stock.item,
      quantity: stock.quantity,
    });

    res.json({ message: 'Stock entry deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
