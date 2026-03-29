import mongoose from 'mongoose';

const superAdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);
