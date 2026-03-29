import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
  },
  { timestamps: true }
);

warehouseSchema.index({ organization: 1, name: 1 }, { unique: true });

export const Warehouse = mongoose.model('Warehouse', warehouseSchema);
