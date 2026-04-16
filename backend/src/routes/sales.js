import { Router } from 'express';
import mongoose from 'mongoose';
import { requireTenant, withTenantFilter } from '../middleware/tenant.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { Sale } from '../models/Sale.js';
import { Item } from '../models/Item.js';
import { Stock } from '../models/Stock.js';
import { Warehouse } from '../models/Warehouse.js';
import { Customer } from '../models/Customer.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { logActivity } from '../utils/activity.js';

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const dateFilter = {};
    if (req.query.from || req.query.to) {
      dateFilter.soldAt = {};
      if (req.query.from) {
        dateFilter.soldAt.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        dateFilter.soldAt.$lte = new Date(req.query.to);
      }
    }

    const sales = await Sale.find(withTenantFilter(req, dateFilter))
      .populate('warehouse', 'name')
      .populate('customer', 'name email phone')
      .populate('items.item', 'name sku')
      .sort({ soldAt: -1 });

    res.json(sales);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);
    const { warehouseId, customerId, customerName, items = [], soldAt, paymentType = 'cash', amountPaid } = req.body;

    if (!warehouseId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'warehouseId and at least one item are required' });
    }

    if (!customerId && !customerName) {
      return res.status(400).json({ message: 'customerId or customerName is required' });
    }

    const runSaleCreation = async (session = null) => {
      const attachSession = (query) => (session ? query.session(session) : query);

      const warehouse = await attachSession(Warehouse.findOne({ _id: warehouseId, organization }));
      if (!warehouse) {
        return { status: 404, body: { message: 'Warehouse not found for tenant' } };
      }

      const saleLines = [];
      let manufacturingTotal = 0;
      let sellingTotal = 0;

      let resolvedCustomer = null;
      let resolvedCustomerName = customerName;

      if (customerId) {
        resolvedCustomer = await attachSession(Customer.findOne({ _id: customerId, organization }));
        if (!resolvedCustomer) {
          return { status: 404, body: { message: 'Customer not found for tenant' } };
        }
        resolvedCustomerName = resolvedCustomer.name;
      }

      for (const line of items) {
        const quantity = Number(line.quantity || 0);
        if (!line.itemId || quantity <= 0) {
          throw new Error('Each sale line requires itemId and quantity (>0)');
        }

        const item = await attachSession(Item.findOne({ _id: line.itemId, organization }));
        if (!item) {
          throw new Error(`Item not found: ${line.itemId}`);
        }

        const stock = await attachSession(
          Stock.findOne({
            organization,
            warehouse: warehouseId,
            item: line.itemId,
          })
        );

        if (!stock || stock.quantity < quantity) {
          throw new Error(`Insufficient stock for item: ${item.name}`);
        }

        stock.quantity -= quantity;
        await stock.save(session ? { session } : undefined);

        const unitManufacturingPrice = Number(line.unitManufacturingPrice ?? item.manufacturingPrice);
        const unitSellingPrice = Number(line.unitSellingPrice ?? item.sellingPrice);

        const lineManufacturingTotal = unitManufacturingPrice * quantity;
        const lineSellingTotal = unitSellingPrice * quantity;
        const lineProfit = lineSellingTotal - lineManufacturingTotal;

        manufacturingTotal += lineManufacturingTotal;
        sellingTotal += lineSellingTotal;

        saleLines.push({
          item: item._id,
          quantity,
          unitManufacturingPrice,
          unitSellingPrice,
          lineManufacturingTotal,
          lineSellingTotal,
          lineProfit,
        });
      }

      let initialAmountPaid = Number(amountPaid ?? 0);
      if (paymentType === 'cash') {
        initialAmountPaid = sellingTotal;
      }

      if (initialAmountPaid < 0 || initialAmountPaid > sellingTotal) {
        throw new Error('Invalid amountPaid for sale total');
      }

      const remainingAmount = sellingTotal - initialAmountPaid;

      const createdSale = await Sale.create(
        [
          {
            organization,
            warehouse: warehouseId,
            customer: resolvedCustomer?._id,
            customerName: resolvedCustomerName,
            soldAt: soldAt ? new Date(soldAt) : new Date(),
            items: saleLines,
            paymentType,
            amountPaid: initialAmountPaid,
            remainingAmount,
            payments:
              initialAmountPaid > 0
                ? [
                    {
                      amount: initialAmountPaid,
                      paidAt: soldAt ? new Date(soldAt) : new Date(),
                      note: paymentType === 'cash' ? 'Full payment at sale' : 'Initial partial payment',
                      receivedBy: req.auth.name || req.auth.email,
                    },
                  ]
                : [],
            manufacturingTotal,
            sellingTotal,
            profit: sellingTotal - manufacturingTotal,
          },
        ],
        session ? { session } : undefined
      );

      const sale = createdSale[0];

      if (paymentType === 'cash' && sale.payments.length > 0) {
        const paidAt = sale.payments[0].paidAt || sale.soldAt || new Date();
        const ledgerEntry = await LedgerEntry.create(
          [
            {
              organization,
              createdBy: new mongoose.Types.ObjectId(req.auth.sub),
              entryDate: paidAt,
              description: `Cash sale received from ${sale.customerName}`,
              amount: sellingTotal,
              type: 'credit',
              linkedSale: sale._id,
            },
          ],
          session ? { session } : undefined
        );

        sale.payments[0].ledgerEntry = ledgerEntry[0]._id;
        await sale.save(session ? { session } : undefined);
      }

      return {
        sale,
        activity: {
          customerName,
          sellingTotal,
          manufacturingTotal,
          profit: sellingTotal - manufacturingTotal,
          paymentType,
          amountPaid: initialAmountPaid,
          remainingAmount,
        },
      };
    };

    let result;
    let session;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
      result = await runSaleCreation(session);
      if (result?.status) {
        await session.abortTransaction();
        return res.status(result.status).json(result.body);
      }
      await session.commitTransaction();
    } catch (transactionError) {
      if (session?.inTransaction()) {
        await session.abortTransaction();
      }

      const transactionNotSupported = /Transaction numbers are only allowed on a replica set member or mongos/i.test(
        transactionError?.message || ''
      );

      if (!transactionNotSupported) {
        throw transactionError;
      }

      result = await runSaleCreation();
      if (result?.status) {
        return res.status(result.status).json(result.body);
      }
    } finally {
      session?.endSession();
    }

    await logActivity(req, 'SALE_CREATE', 'Sale', result.sale._id, result.activity);
    res.status(201).json(result.sale);
  } catch (error) {
    next(error);
  }
});

router.get('/profit/summary', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const match = withTenantFilter(req);

    if (req.query.from || req.query.to) {
      match.soldAt = {};
      if (req.query.from) {
        match.soldAt.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        match.soldAt.$lte = new Date(req.query.to);
      }
    }

    const summary = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          manufacturingTotal: { $sum: '$manufacturingTotal' },
          sellingTotal: { $sum: '$sellingTotal' },
          profit: { $sum: '$profit' },
          totalSales: { $sum: 1 },
        },
      },
    ]);

    const data = summary[0] || {
      manufacturingTotal: 0,
      sellingTotal: 0,
      profit: 0,
      totalSales: 0,
    };

    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/credits/outstanding', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const outstandingSales = await Sale.find(
      withTenantFilter(req, {
        paymentType: 'credit',
        remainingAmount: { $gt: 0 },
      })
    )
      .populate('warehouse', 'name')
      .populate('customer', 'name email phone')
      .populate('items.item', 'name sku')
      .sort({ soldAt: -1 });

    res.json(outstandingSales);
  } catch (error) {
    next(error);
  }
});

router.get('/credits/outstanding-by-customer', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const match = withTenantFilter(req, {
      paymentType: 'credit',
      remainingAmount: { $gt: 0 },
    });

    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);
    const customers = await Customer.find({ organization }).select('name openingBalance').lean();

    const summary = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: { customer: '$customer', customerName: '$customerName' },
          totalOutstanding: { $sum: '$remainingAmount' },
          totalSales: { $sum: 1 },
          lastSaleDate: { $max: '$soldAt' },
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id.customer',
          foreignField: '_id',
          as: 'customerInfo',
        },
      },
      {
        $addFields: {
          customerName: {
            $ifNull: [{ $arrayElemAt: ['$customerInfo.name', 0] }, '$_id.customerName'],
          },
          openingBalance: {
            $ifNull: [{ $arrayElemAt: ['$customerInfo.openingBalance', 0] }, 0],
          },
        },
      },
      {
        $project: {
          customerId: '$_id.customer',
          customerName: 1,
          totalOutstanding: 1,
          openingBalance: 1,
          totalSales: 1,
          lastSaleDate: 1,
          // totalRemaining from sale + totalOutstanding from User opening balance
          totalRemaining: { $sum: ['$totalOutstanding', { $ifNull: ['$openingBalance', 0] }] },
        },
      },
    ]);

    const getKey = (row) => (row.customerId ? `id:${row.customerId}` : `name:${row.customerName || 'unknown'}`);

    const summaryByCustomer = new Map(summary.map((row) => [getKey(row), row]));

    const merged = summary.map((row) => {
      const openingBalance = Number(row.openingBalance || 0);
      return {
        ...row,
        totalOutstanding: Number(row.totalOutstanding || 0) + openingBalance,
      };
    });

    for (const customer of customers) {
      const key = `id:${customer._id}`;
      if (!summaryByCustomer.has(key) && Number(customer.openingBalance || 0) > 0) {
        merged.push({
          customerId: customer._id,
          customerName: customer.name,
          openingBalance: Number(customer.openingBalance || 0),
          totalOutstanding: Number(customer.openingBalance || 0),
          totalSales: 0,
          lastSaleDate: null,
        });
      }
    }

    merged.sort((a, b) => Number(b.totalOutstanding || 0) - Number(a.totalOutstanding || 0));

    res.json(merged);
  } catch (error) {
    next(error);
  }
});

router.get('/payments', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const sales = await Sale.find(
      withTenantFilter(req, {
        'payments.0': { $exists: true },
      })
    ).sort({ soldAt: -1 });

    const paymentRecords = sales.flatMap((sale) =>
      (sale.payments || []).map((payment) => ({
        paymentId: payment._id,
        saleId: sale._id,
        customerName: sale.customerName,
        soldAt: sale.soldAt,
        paymentType: sale.paymentType,
        paymentAmount: payment.amount,
        paymentDate: payment.paidAt,
        receivedBy: payment.receivedBy,
        note: payment.note,
        remainingAmount: sale.remainingAmount,
      }))
    );

    res.json(paymentRecords.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)));
  } catch (error) {
    next(error);
  }
});

router.get('/by-customer', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const { customerId, customerName } = req.query;

    if (!customerId && !customerName) {
      return res.status(400).json({ message: 'customerId or customerName is required' });
    }

    const filter = withTenantFilter(req, {});

    if (customerId) {
      filter.customer = customerId;
    } else {
      filter.customerName = customerName;
    }

    const sales = await Sale.find(filter)
      .populate('warehouse', 'name')
      .populate('customer', 'name email phone')
      .populate('items.item', 'name sku')
      .sort({ soldAt: -1 });

    res.json(sales);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/payments', requireRoles('admin', 'manager', 'staff'), async (req, res, next) => {
  try {
    const sale = await Sale.findOne(withTenantFilter(req, { _id: req.params.id }));
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (sale.paymentType !== 'credit') {
      return res.status(400).json({ message: 'Payments module is for credit sales only' });
    }

    const incomingAmount = Number(req.body.amount || 0);
    if (incomingAmount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than 0' });
    }

    if (incomingAmount > sale.remainingAmount) {
      return res.status(400).json({ message: 'Payment exceeds remaining amount' });
    }

    const paidAt = req.body.paidAt ? new Date(req.body.paidAt) : new Date();
    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);

    const ledgerEntry = await LedgerEntry.create({
      organization,
      createdBy: new mongoose.Types.ObjectId(req.auth.sub),
      entryDate: paidAt,
      description: `Payment received from ${sale.customerName}`,
      amount: incomingAmount,
      type: 'credit',
      linkedSale: sale._id,
    });

    sale.amountPaid += incomingAmount;
    sale.remainingAmount -= incomingAmount;
    sale.payments.push({
      amount: incomingAmount,
      paidAt,
      note: req.body.note,
      receivedBy: req.auth.name || req.auth.email,
      ledgerEntry: ledgerEntry._id,
    });

    await sale.save();

    await logActivity(req, 'SALE_PAYMENT_RECEIVED', 'Sale', sale._id, {
      incomingAmount,
      remainingAmount: sale.remainingAmount,
    });

    res.json(sale);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);
    const sale = await Sale.findOne(withTenantFilter(req, { _id: req.params.id }));
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const { customerId, customerName, paymentType, soldAt, items } = req.body;

    // ── Update basic fields ────────────────────────────────────────
    if (soldAt !== undefined) sale.soldAt = new Date(soldAt);
    if (paymentType !== undefined) sale.paymentType = paymentType;

    if (customerId) {
      const customer = await Customer.findOne({ _id: customerId, organization });
      if (!customer) return res.status(404).json({ message: 'Customer not found for tenant' });
      sale.customer = customer._id;
      sale.customerName = customer.name;
    } else if (customerName !== undefined) {
      sale.customer = undefined;
      sale.customerName = customerName;
    }

    // ── Update items (restore old stock, apply new stock) ──────────
    if (Array.isArray(items) && items.length > 0) {
      // Restore stock for all old sale lines
      for (const line of sale.items) {
        const stock = await Stock.findOne({
          organization,
          warehouse: sale.warehouse,
          item: line.item,
        });
        if (stock) {
          stock.quantity += Number(line.quantity || 0);
          await stock.save();
        }
      }

      // Build new sale lines and deduct stock
      const newLines = [];
      let manufacturingTotal = 0;
      let sellingTotal = 0;

      for (const line of items) {
        const quantity = Number(line.quantity || 0);
        if (!line.itemId || quantity <= 0) {
          return res.status(400).json({ message: 'Each sale line requires itemId and quantity > 0' });
        }

        const item = await Item.findOne({ _id: line.itemId, organization });
        if (!item) return res.status(404).json({ message: `Item not found: ${line.itemId}` });

        const stock = await Stock.findOne({ organization, warehouse: sale.warehouse, item: line.itemId });
        if (!stock || stock.quantity < quantity) {
          return res.status(400).json({ message: `Insufficient stock for item: ${item.name}` });
        }

        stock.quantity -= quantity;
        await stock.save();

        const unitManufacturingPrice = Number(line.unitManufacturingPrice ?? item.manufacturingPrice);
        const unitSellingPrice = Number(line.unitSellingPrice ?? item.sellingPrice);
        const lineManufacturingTotal = unitManufacturingPrice * quantity;
        const lineSellingTotal = unitSellingPrice * quantity;
        const lineProfit = lineSellingTotal - lineManufacturingTotal;

        manufacturingTotal += lineManufacturingTotal;
        sellingTotal += lineSellingTotal;

        newLines.push({ item: item._id, quantity, unitManufacturingPrice, unitSellingPrice, lineManufacturingTotal, lineSellingTotal, lineProfit });
      }

      sale.items = newLines;
      sale.manufacturingTotal = manufacturingTotal;
      sale.sellingTotal = sellingTotal;
      sale.profit = sellingTotal - manufacturingTotal;

      // Recalculate amountPaid/remaining based on actual payments recorded
      const totalPaid = sale.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      if (sale.paymentType === 'cash') {
        sale.amountPaid = sellingTotal;
        sale.remainingAmount = 0;
      } else {
        sale.amountPaid = Math.min(totalPaid, sellingTotal);
        sale.remainingAmount = Math.max(0, sellingTotal - sale.amountPaid);
      }
    }

    await sale.save();

    await logActivity(req, 'SALE_UPDATE', 'Sale', sale._id, {
      customerName: sale.customerName,
      sellingTotal: sale.sellingTotal,
      paymentType: sale.paymentType,
    });

    const updated = await Sale.findById(sale._id)
      .populate('warehouse', 'name')
      .populate('customer', 'name email phone')
      .populate('items.item', 'name sku');

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const sale = await Sale.findOne(withTenantFilter(req, { _id: req.params.id }));
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const organization = new mongoose.Types.ObjectId(req.tenant.organizationId);

    for (const line of sale.items) {
      const stock = await Stock.findOne({
        organization,
        warehouse: sale.warehouse,
        item: line.item,
      });

      if (stock) {
        stock.quantity += Number(line.quantity || 0);
        await stock.save();
      }
    }

    for (const payment of sale.payments || []) {
      if (payment.ledgerEntry) {
        await LedgerEntry.findOneAndDelete(
          withTenantFilter(req, {
            _id: payment.ledgerEntry,
          })
        );
      }
    }

    await Sale.deleteOne({ _id: sale._id });

    await logActivity(req, 'SALE_DELETE', 'Sale', sale._id, {
      customerName: sale.customerName,
      sellingTotal: sale.sellingTotal,
      paymentType: sale.paymentType,
    });

    res.json({ message: 'Sale deleted' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:saleId/payments/:paymentId', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const sale = await Sale.findOne(withTenantFilter(req, { _id: req.params.saleId }));
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const payment = sale.payments.id(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.ledgerEntry) {
      await LedgerEntry.findOneAndDelete(
        withTenantFilter(req, {
          _id: payment.ledgerEntry,
        })
      );
    }

    const amount = Number(payment.amount || 0);
    sale.amountPaid = Math.max(0, Number(sale.amountPaid || 0) - amount);
    sale.remainingAmount = Number(sale.remainingAmount || 0) + amount;

    payment.deleteOne();
    await sale.save();

    await logActivity(req, 'SALE_PAYMENT_DELETE', 'Sale', sale._id, {
      amount,
      remainingAmount: sale.remainingAmount,
    });

    res.json({ message: 'Payment deleted', sale });
  } catch (error) {
    next(error);
  }
});

export default router;
