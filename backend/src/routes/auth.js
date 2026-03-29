import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';

const router = Router();

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

router.post('/superadmin/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await SuperAdmin.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({
      sub: String(user._id),
      role: 'superadmin',
      userType: 'superadmin',
      email: user.email,
      name: user.name,
    });

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'superadmin',
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/organization/login', async (req, res, next) => {
  try {
    const { organizationId, organizationCode, email, password } = req.body;
    if ((!organizationId && !organizationCode) || !email || !password) {
      return res.status(400).json({ message: 'organizationId/organizationCode, email and password are required' });
    }

    let resolvedOrganizationId = organizationId;
    if (!resolvedOrganizationId && organizationCode) {
      const organization = await Organization.findOne({ code: String(organizationCode).toUpperCase().trim() });
      if (!organization) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      resolvedOrganizationId = organization._id;
    }

    const user = await User.findOne({
      organization: resolvedOrganizationId,
      email: email.toLowerCase().trim(),
      role: { $in: ['admin', 'manager', 'staff'] },
      isActive: true,
    }).populate('organization', 'name');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash || '');
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({
      sub: String(user._id),
      role: user.role,
      userType: 'organization-user',
      organizationId: String(user.organization._id),
      email: user.email,
      name: user.name,
    });

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organization._id,
        organizationName: user.organization.name,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
