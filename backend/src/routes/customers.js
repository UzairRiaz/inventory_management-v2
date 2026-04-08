import { Router } from 'express';
import mongoose from 'mongoose';
import { requireTenant, withTenantFilter } from '../middleware/tenant.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { Customer } from '../models/Customer.js';
import { CustomerPayment } from '../models/CustomerPayment.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { logActivity } from '../utils/activity.js';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const customers = await Customer.find(withTenantFilter(req)).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

router.get('/payments', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const payments = await CustomerPayment.find(withTenantFilter(req))
      .sort({ paidAt: -1 })
      .lean();

    const payload = payments.map((payment) => ({
      ...payment,
      paymentAmount: payment.amount,
      paymentDate: payment.paidAt,
      remainingOutstanding: payment.openingBalanceAfter,
    }));

    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const customer = await Customer.create({
      organization: new mongoose.Types.ObjectId(req.tenant.organizationId),
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      openingBalance: Number(req.body.openingBalance || 0),
    });

    await logActivity(req, 'CUSTOMER_CREATE', 'Customer', customer._id, {
      name: customer.name,
    });

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

router.put('/:customerId', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      withTenantFilter(req, { _id: req.params.customerId }),
      {
        $set: {
          ...(req.body.name !== undefined && { name: req.body.name }),
          ...(req.body.phone !== undefined && { phone: req.body.phone }),
          ...(req.body.email !== undefined && { email: req.body.email }),
          ...(req.body.address !== undefined && { address: req.body.address }),
        },
      },
      { new: true },
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await logActivity(req, 'CUSTOMER_UPDATE', 'Customer', customer._id, { name: customer.name });

    res.json(customer);
  } catch (error) {
    next(error);
  }
});

router.post('/:customerId/payments', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);
    const { customerId } = req.params;
    const amount = Number(req.body.amount || 0);

    if (!customerId) {
      return res.status(400).json({ message: 'customerId is required' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'amount must be greater than 0' });
    }

    const customer = await Customer.findOne({ _id: customerId, organization });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found for tenant' });
    }

    const openingBalanceBefore = Number(customer.openingBalance || 0);
    if (amount > openingBalanceBefore) {
      return res.status(400).json({ message: 'amount exceeds outstanding opening balance' });
    }

    const openingBalanceAfter = Number((openingBalanceBefore - amount).toFixed(2));
    customer.openingBalance = openingBalanceAfter;
    await customer.save();

    const paidAt = req.body.paidAt ? new Date(req.body.paidAt) : new Date();
    const ledgerEntry = await LedgerEntry.create({
      organization,
      createdBy: new mongoose.Types.ObjectId(req.auth.sub),
      entryDate: paidAt,
      description: `Opening balance payment from ${customer.name}`,
      amount,
      type: 'credit',
    });

    const payment = await CustomerPayment.create({
      organization,
      customer: customer._id,
      customerName: customer.name,
      amount,
      note: req.body.note,
      paidAt,
      receivedBy: req.auth.name || req.auth.email,
      openingBalanceBefore,
      openingBalanceAfter,
      ledgerEntry: ledgerEntry._id,
    });

    await logActivity(req, 'CUSTOMER_PAYMENT', 'Customer', customer._id, {
      customerName: customer.name,
      amount,
      openingBalanceBefore,
      openingBalanceAfter,
    });

    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
});

export default router;
