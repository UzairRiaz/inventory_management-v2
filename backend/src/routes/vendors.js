import { Router } from 'express';
import mongoose from 'mongoose';
import { requireTenant, withTenantFilter } from '../middleware/tenant.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { Vendor } from '../models/Vendor.js';
import { logActivity } from '../utils/activity.js';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const vendors = await Vendor.find(withTenantFilter(req)).sort({ name: 1 });
    res.json(vendors);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const vendor = await Vendor.create({
      organization: new mongoose.Types.ObjectId(req.tenant.organizationId),
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
    });

    await logActivity(req, 'VENDOR_CREATE', 'Vendor', vendor._id, { name: vendor.name });

    res.status(201).json(vendor);
  } catch (error) {
    next(error);
  }
});

router.put('/:vendorId', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const vendor = await Vendor.findOneAndUpdate(
      withTenantFilter(req, { _id: req.params.vendorId }),
      {
        $set: {
          ...(req.body.name !== undefined && { name: req.body.name }),
          ...(req.body.phone !== undefined && { phone: req.body.phone }),
          ...(req.body.email !== undefined && { email: req.body.email }),
          ...(req.body.address !== undefined && { address: req.body.address }),
          ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
        },
      },
      { new: true },
    );

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    await logActivity(req, 'VENDOR_UPDATE', 'Vendor', vendor._id, { name: vendor.name });

    res.json(vendor);
  } catch (error) {
    next(error);
  }
});

export default router;
