import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { requireTenant, withTenantFilter } from '../middleware/tenant.js';
import { ActivityLog } from '../models/ActivityLog.js';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);
router.use(requireRoles('admin', 'manager'));

router.get('/', async (req, res, next) => {
  try {
    const logs = await ActivityLog.find(withTenantFilter(req)).sort({ createdAt: -1 }).limit(300);
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

export default router;
