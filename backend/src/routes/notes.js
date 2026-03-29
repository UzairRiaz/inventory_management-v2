import { Router } from 'express';
import mongoose from 'mongoose';
import { requireTenant, withTenantFilter } from '../middleware/tenant.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { Note } from '../models/Note.js';
import { logActivity } from '../utils/activity.js';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const notes = await Note.find(withTenantFilter(req)).sort({ noteDate: -1 });
    res.json(notes);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const note = await Note.create({
      organization: new mongoose.Types.ObjectId(req.tenant.organizationId),
      type: req.body.type,
      customerName: req.body.customerName,
      amount: Number(req.body.amount || 0),
      description: req.body.description,
      linkedTransactionId: req.body.linkedTransactionId,
      noteDate: req.body.noteDate ? new Date(req.body.noteDate) : new Date(),
    });

    await logActivity(req, 'NOTE_CREATE', 'Note', note._id, {
      type: note.type,
      customerName: note.customerName,
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

export default router;
