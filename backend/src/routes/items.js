import { Router } from 'express';
import mongoose from 'mongoose';
import { requireTenant, withTenantFilter } from '../middleware/tenant.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { Item } from '../models/Item.js';
import { logActivity } from '../utils/activity.js';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const items = await Item.find(withTenantFilter(req)).sort({ name: 1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const tags = Array.isArray(req.body.tags)
      ? req.body.tags
      : String(req.body.tags || '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);

    const item = await Item.create({
      organization: new mongoose.Types.ObjectId(req.tenant.organizationId),
      name: req.body.name,
      sku: req.body.sku,
      tags,
      manufacturingPrice: Number(req.body.manufacturingPrice || 0),
      sellingPrice: Number(req.body.sellingPrice || 0),
    });

    await logActivity(req, 'ITEM_CREATE', 'Item', item._id, {
      name: item.name,
      sku: item.sku,
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const item = await Item.findOneAndUpdate(
      withTenantFilter(req, { _id: req.params.id }),
      {
        $set: {
          ...(req.body.name !== undefined && { name: req.body.name }),
          ...(req.body.sku !== undefined && { sku: req.body.sku }),
          ...(req.body.tags !== undefined && {
            tags: Array.isArray(req.body.tags)
              ? req.body.tags
              : String(req.body.tags)
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
          }),
          ...(req.body.manufacturingPrice !== undefined && { manufacturingPrice: Number(req.body.manufacturingPrice) }),
          ...(req.body.sellingPrice !== undefined && { sellingPrice: Number(req.body.sellingPrice) }),
        },
      },
      { new: true },
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await logActivity(req, 'ITEM_UPDATE', 'Item', item._id, { name: item.name });

    res.json(item);
  } catch (error) {
    next(error);
  }
});

export default router;
