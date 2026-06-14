import { Router } from 'express';
import mongoose from 'mongoose';
import { requireTenant, withTenantFilter } from '../middleware/tenant.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { Customer } from '../models/Customer.js';
import { CustomerPayment } from '../models/CustomerPayment.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Sale } from '../models/Sale.js';
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

router.get('/:customerId/account', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);
    const { customerId } = req.params;

    const customer = await Customer.findOne({ _id: customerId, organization }).lean();
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const sales = await Sale.find(withTenantFilter(req, { customer: customerId }))
      .populate('warehouse', 'name')
      .populate('customer', 'name email phone')
      .populate('items.item', 'name sku')
      .sort({ soldAt: -1 })
      .lean();

    const openingBalancePayments = await CustomerPayment.find({ organization, customer: customerId })
      .sort({ paidAt: -1 })
      .lean();

    const creditSalesOutstanding = sales
      .filter((sale) => sale.paymentType === 'credit')
      .reduce((sum, sale) => sum + Number(sale.remainingAmount || 0), 0);

    const openingBalance = Number(customer.openingBalance || 0);
    const totalOutstanding = openingBalance + creditSalesOutstanding;

    const lastSaleDate = sales.length > 0 ? sales[0].soldAt : null;

    const salePayments = sales.flatMap((sale) =>
      (sale.payments || []).map((payment) => ({
        paymentId: payment._id,
        saleId: sale._id,
        type: 'sale_payment',
        customerName: sale.customerName,
        amount: payment.amount,
        paymentAmount: payment.amount,
        paidAt: payment.paidAt,
        paymentDate: payment.paidAt,
        note: payment.note,
        receivedBy: payment.receivedBy,
        remainingAmount: sale.remainingAmount,
        paymentType: sale.paymentType,
      }))
    );

    const openingPayments = openingBalancePayments.map((payment) => ({
      paymentId: payment._id,
      customerId: customerId,
      type: 'opening_balance_payment',
      customerName: payment.customerName,
      amount: payment.amount,
      paymentAmount: payment.amount,
      paidAt: payment.paidAt,
      paymentDate: payment.paidAt,
      note: payment.note,
      receivedBy: payment.receivedBy,
      remainingOutstanding: payment.openingBalanceAfter,
      openingBalanceBefore: payment.openingBalanceBefore,
      openingBalanceAfter: payment.openingBalanceAfter,
    }));

    const payments = [...salePayments, ...openingPayments].sort(
      (a, b) => new Date(b.paidAt || b.paymentDate) - new Date(a.paidAt || a.paymentDate)
    );

    const timeline = [
      ...sales.map((sale) => ({
        kind: 'sale',
        date: sale.soldAt,
        id: sale._id,
        label: `Sale — ${Number(sale.sellingTotal || 0).toLocaleString()}`,
        sublabel: String(sale.paymentType || '').toUpperCase(),
        amount: sale.sellingTotal,
        remainingAmount: sale.remainingAmount,
        record: sale,
      })),
      ...payments.map((payment) => ({
        kind: 'payment',
        date: payment.paidAt || payment.paymentDate,
        id: payment.paymentId,
        label: payment.type === 'opening_balance_payment' ? 'Opening balance payment' : 'Sale payment',
        sublabel: payment.note || '',
        amount: payment.amount,
        record: payment,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        openingBalance,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
      },
      summary: {
        openingBalance,
        creditSalesOutstanding,
        totalOutstanding,
        totalSalesCount: sales.length,
        lastSaleDate,
        lifetimeSellingTotal: sales.reduce((sum, sale) => sum + Number(sale.sellingTotal || 0), 0),
        lifetimePaid: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      },
      sales,
      payments,
      timeline,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:customerId', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const customer = await Customer.findOne(
      withTenantFilter(req, { _id: req.params.customerId })
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
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
          ...(req.body.openingBalance !== undefined && { openingBalance: Number(req.body.openingBalance) }),
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

router.delete('/:customerId/payments/:paymentId', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);
    const { customerId, paymentId } = req.params;

    const payment = await CustomerPayment.findOne({
      _id: paymentId,
      customer: customerId,
      organization,
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const customer = await Customer.findOne({ _id: customerId, organization });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const amount = Number(payment.amount || 0);
    customer.openingBalance = Number((Number(customer.openingBalance || 0) + amount).toFixed(2));
    await customer.save();

    if (payment.ledgerEntry) {
      await LedgerEntry.findOneAndDelete(
        withTenantFilter(req, { _id: payment.ledgerEntry }),
      );
    }

    await payment.deleteOne();

    await logActivity(req, 'CUSTOMER_PAYMENT_DELETE', 'Customer', customer._id, {
      customerName: customer.name,
      amount,
      openingBalance: customer.openingBalance,
    });

    res.json({
      message: 'Payment deleted',
      customer: {
        _id: customer._id,
        openingBalance: customer.openingBalance,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
