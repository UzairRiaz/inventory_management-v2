import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { requireTenant, withTenantFilter } from '../middleware/tenant.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { logActivity } from '../utils/activity.js';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const users = await User.find(withTenantFilter(req)).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('admin'), async (req, res, next) => {
  try {
    const targetRole = req.body.role || 'staff';

    if (['superadmin', 'admin'].includes(targetRole)) {
      return res.status(403).json({ message: 'Admins can only create manager/staff users' });
    }

    if (!req.body.password) {
      return res.status(400).json({ message: 'password is required' });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);

    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);
    const user = await User.create({
      organization,
      name: req.body.name,
      email: req.body.email,
      passwordHash,
      role: targetRole,
    });

    await logActivity(req, 'USER_CREATE', 'User', user._id, {
      userEmail: user.email,
      role: user.role,
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
