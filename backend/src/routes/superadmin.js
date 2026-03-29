import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { requireAuth, requireSuperadmin } from '../middleware/auth.js';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';

const router = Router();

router.use(requireAuth);
router.use(requireSuperadmin);

router.post('/organizations', async (req, res, next) => {
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

router.post('/admins', async (req, res, next) => {
  try {
    const { organizationId, name, email, password } = req.body;

    if (!organizationId || !name || !email || !password) {
      return res.status(400).json({ message: 'organizationId, name, email and password are required' });
    }

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await User.create({
      organization: new mongoose.Types.ObjectId(organizationId),
      name,
      email,
      passwordHash,
      role: 'admin',
    });

    res.status(201).json(admin);
  } catch (error) {
    next(error);
  }
});

router.post('/organizations/with-admin', async (req, res, next) => {
  try {
    const { organizationName, organizationCode, adminName, adminEmail, adminPassword } = req.body;

    if (!organizationName || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        message: 'organizationName, adminName, adminEmail and adminPassword are required',
      });
    }

    const organization = await Organization.create({
      name: organizationName,
      code: String(organizationCode || organizationName).trim().replace(/\s+/g, '_').toUpperCase(),
    });

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await User.create({
      organization: organization._id,
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
    });

    res.status(201).json({ organization, admin });
  } catch (error) {
    next(error);
  }
});

export default router;
