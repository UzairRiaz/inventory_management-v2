import mongoose from 'mongoose';

const customerPaymentSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    customerName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true },
    paidAt: { type: Date, default: Date.now, index: true },
    receivedBy: { type: String, trim: true },
    openingBalanceBefore: { type: Number, required: true, min: 0 },
    openingBalanceAfter: { type: Number, required: true, min: 0 },
    ledgerEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'LedgerEntry' },
  },
  { timestamps: true }
);

customerPaymentSchema.index({ organization: 1, paidAt: -1 });

export const CustomerPayment = mongoose.model('CustomerPayment', customerPaymentSchema);
