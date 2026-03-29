export function requireTenant(req, res, next) {
  const organizationId = req.auth?.organizationId || req.header('x-org-id');
  const userId = req.auth?.sub || req.header('x-user-id');

  if (!organizationId) {
    return res.status(400).json({ message: 'Missing required header: x-org-id' });
  }

  if (req.auth?.role !== 'superadmin' && req.auth?.organizationId && req.auth.organizationId !== organizationId) {
    return res.status(403).json({ message: 'Forbidden: tenant mismatch' });
  }

  req.tenant = { organizationId, userId: userId || null };
  next();
}

export function withTenantFilter(req, extra = {}) {
  return {
    organization: req.tenant.organizationId,
    ...extra,
  };
}
