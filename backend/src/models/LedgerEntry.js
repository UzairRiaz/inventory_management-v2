import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entryDate: { type: Date, required: true, default: Date.now },
    description: { type: String, required: true, trim: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    quantity: { type: Number, min: 1 },
    unitPrice: { type: Number, min: 0 },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    linkedSale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
  },
  { timestamps: true }
);

ledgerEntrySchema.index({ organization: 1, entryDate: -1 });

export const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);
