import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    customerName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    linkedTransactionId: { type: String, trim: true },
    noteDate: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

noteSchema.index({ organization: 1, noteDate: -1 });

export const Note = mongoose.model('Note', noteSchema);
