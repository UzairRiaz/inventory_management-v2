import mongoose from 'mongoose';

const saleLineSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    unitManufacturingPrice: { type: Number, required: true, min: 0 },
    unitSellingPrice: { type: Number, required: true, min: 0 },
    lineManufacturingTotal: { type: Number, required: true, min: 0 },
    lineSellingTotal: { type: Number, required: true, min: 0 },
    lineProfit: { type: Number, required: true },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: { type: String, required: true, trim: true },
    soldAt: { type: Date, required: true, default: Date.now },
    items: { type: [saleLineSchema], validate: [(v) => v.length > 0, 'At least one item is required'] },
    paymentType: { type: String, enum: ['cash', 'credit'], default: 'cash' },
    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    remainingAmount: { type: Number, required: true, min: 0, default: 0 },
    payments: [
      {
        amount: { type: Number, required: true, min: 0 },
        paidAt: { type: Date, default: Date.now },
        note: { type: String, trim: true },
        receivedBy: { type: String, trim: true },
        ledgerEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'LedgerEntry' },
      },
    ],
    manufacturingTotal: { type: Number, required: true, min: 0 },
    sellingTotal: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
  },
  { timestamps: true }
);

saleSchema.index({ organization: 1, soldAt: -1 });

export const Sale = mongoose.model('Sale', saleSchema);
