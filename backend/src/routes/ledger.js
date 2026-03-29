import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { requireTenant, withTenantFilter } from '../middleware/tenant.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Item } from '../models/Item.js';
import { logActivity } from '../utils/activity.js';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const query = withTenantFilter(req);
    if (req.query.from || req.query.to) {
      query.entryDate = {};
      if (req.query.from) query.entryDate.$gte = new Date(req.query.from);
      if (req.query.to) query.entryDate.$lte = new Date(req.query.to);
    }

    const entries = await LedgerEntry.find(query)
      .populate('createdBy', 'name email role')
      .populate('item', 'name sku sellingPrice manufacturingPrice')
      .sort({ entryDate: -1 });
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const payload = {
      organization: new mongoose.Types.ObjectId(req.tenant.organizationId),
      createdBy: new mongoose.Types.ObjectId(req.auth.sub),
      entryDate: req.body.entryDate ? new Date(req.body.entryDate) : new Date(),
      description: req.body.description,
      amount: Number(req.body.amount || 0),
      type: req.body.type,
      linkedSale: req.body.linkedSale || undefined,
    };

    if (req.body.itemId) {
      const item = await Item.findOne({
        _id: req.body.itemId,
        organization: req.tenant.organizationId,
      });

      if (!item) {
        return res.status(404).json({ message: 'Item not found for organization' });
      }

      const quantity = Number(req.body.quantity || 1);
      const unitPrice = Number(req.body.unitPrice ?? item.sellingPrice ?? 0);
      const calculatedAmount = Number(req.body.amount || quantity * unitPrice);

      payload.item = item._id;
      payload.quantity = quantity;
      payload.unitPrice = unitPrice;
      payload.amount = calculatedAmount;

      if (!payload.description) {
        payload.description = `Ledger entry for item ${item.name}`;
      }
    }

    if (!payload.description || !payload.type) {
      return res.status(400).json({ message: 'description and type are required' });
    }

    const entry = await LedgerEntry.create({
      ...payload,
    });

    await logActivity(req, 'LEDGER_CREATE', 'LedgerEntry', entry._id, {
      amount: entry.amount,
      type: entry.type,
    });

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const entry = await LedgerEntry.findOneAndUpdate(
      withTenantFilter(req, { _id: req.params.id }),
      {
        $set: {
          entryDate: req.body.entryDate ? new Date(req.body.entryDate) : undefined,
          description: req.body.description,
          amount: req.body.amount !== undefined ? Number(req.body.amount) : undefined,
          type: req.body.type,
        },
      },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ message: 'Ledger entry not found' });
    }

    await logActivity(req, 'LEDGER_UPDATE', 'LedgerEntry', entry._id);
    res.json(entry);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRoles('admin'), async (req, res, next) => {
  try {
    const entry = await LedgerEntry.findOneAndDelete(withTenantFilter(req, { _id: req.params.id }));

    if (!entry) {
      return res.status(404).json({ message: 'Ledger entry not found' });
    }

    await logActivity(req, 'LEDGER_DELETE', 'LedgerEntry', entry._id);
    res.json({ message: 'Ledger entry deleted' });
  } catch (error) {
    next(error);
  }
});

router.get('/profit/summary', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const match = withTenantFilter(req, {
      type: { $in: ['credit', 'debit'] },
    });

    if (req.query.from || req.query.to) {
      match.entryDate = {};
      if (req.query.from) {
        match.entryDate.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        match.entryDate.$lte = new Date(req.query.to);
      }
    }

    const result = await LedgerEntry.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          creditTotal: {
            $sum: {
              $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0],
            },
          },
          debitTotal: {
            $sum: {
              $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0],
            },
          },
          totalEntries: { $sum: 1 },
        },
      },
    ]);

    const summary = result[0] || { creditTotal: 0, debitTotal: 0, totalEntries: 0 };
    res.json({
      ...summary,
      profit: summary.creditTotal - summary.debitTotal,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
