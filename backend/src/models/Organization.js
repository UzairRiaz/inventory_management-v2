import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
  },
  { timestamps: true }
);

export const Organization = mongoose.model('Organization', organizationSchema);
