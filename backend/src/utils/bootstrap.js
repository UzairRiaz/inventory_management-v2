import bcrypt from 'bcryptjs';
import { SuperAdmin } from '../models/SuperAdmin.js';

export async function ensureDefaultSuperAdmin() {
  const email = (process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.SUPERADMIN_PASSWORD || '';
  const name = process.env.SUPERADMIN_NAME || 'Super Admin';

  if (!email || !password) {
    return;
  }

  const existing = await SuperAdmin.findOne({ email });
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await SuperAdmin.create({ email, passwordHash, name });
  console.log('Default superadmin created from environment variables');
}
