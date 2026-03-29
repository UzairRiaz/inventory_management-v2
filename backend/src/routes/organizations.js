import { Router } from 'express';
import { Organization } from '../models/Organization.js';
import { requireAuth, requireSuperadmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireSuperadmin);

router.get('/', async (_req, res, next) => {
  try {
    const organizations = await Organization.find().sort({ createdAt: -1 });
    res.json(organizations);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const organization = await Organization.create({
      name: req.body.name,
      code: String(req.body.code || req.body.name || '').trim().replace(/\s+/g, '_').toUpperCase(),
    });
    res.status(201).json(organization);
  } catch (error) {
    next(error);
  }
});

export default router;
