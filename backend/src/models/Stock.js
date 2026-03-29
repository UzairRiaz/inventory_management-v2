import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema(
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
      index: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

stockSchema.index({ organization: 1, warehouse: 1, item: 1 }, { unique: true });

export const Stock = mongoose.model('Stock', stockSchema);
