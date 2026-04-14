import mongoose from 'mongoose';

const purchasePaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now },
    note: { type: String, trim: true },
    recordedBy: { type: String, trim: true },
  },
  { _id: true },
);

const purchaseSchema = new mongoose.Schema(
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
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0 },
    supplier: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' },
    paymentType: { type: String, enum: ['cash', 'credit'], default: 'cash' },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    purchasedAt: { type: Date, default: Date.now },
    payments: [purchasePaymentSchema],
  },
  { timestamps: true },
);

purchaseSchema.index({ organization: 1, purchasedAt: -1 });

export const Purchase = mongoose.model('Purchase', purchaseSchema);
