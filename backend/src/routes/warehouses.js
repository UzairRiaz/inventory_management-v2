import { Router } from 'express';
import mongoose from 'mongoose';
import { requireTenant, withTenantFilter } from '../middleware/tenant.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { Warehouse } from '../models/Warehouse.js';
import { logActivity } from '../utils/activity.js';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find(withTenantFilter(req)).sort({ name: 1 });
    res.json(warehouses);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const warehouse = await Warehouse.create({
      organization: new mongoose.Types.ObjectId(req.tenant.organizationId),
      name: req.body.name,
      location: req.body.location,
    });

    await logActivity(req, 'WAREHOUSE_CREATE', 'Warehouse', warehouse._id, {
      name: warehouse.name,
    });

    res.status(201).json(warehouse);
  } catch (error) {
    next(error);
  }
});

export default router;
