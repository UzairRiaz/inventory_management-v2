import { ActivityLog } from '../models/ActivityLog.js';

export async function logActivity(req, actionType, resourceType, resourceId, details = {}) {
  if (!req?.tenant?.organizationId || !req?.auth) {
    return;
  }

  const requestData = req?.body && Object.keys(req.body).length > 0 ? { ...req.body } : undefined;
  const payloadDetails = requestData ? { ...details, requestData } : details;

  await ActivityLog.create({
    organization: req.tenant.organizationId,
    actorId: req.auth.sub,
    actorName: req.auth.name || req.auth.email || 'Unknown',
    actorRole: req.auth.role,
    actionType,
    resourceType,
    resourceId: String(resourceId),
    details: payloadDetails,
  });
}
