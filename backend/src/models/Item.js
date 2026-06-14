import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    itemType: {
      type: String,
      enum: ['finished_good', 'raw_material'],
      default: 'finished_good',
    },
    manufacturingPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

itemSchema.index({ organization: 1, name: 1 }, { unique: true });

export const Item = mongoose.model('Item', itemSchema);
