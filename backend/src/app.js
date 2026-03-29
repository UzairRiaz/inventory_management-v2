import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRoutes from './routes/index.js';
import { connectDB } from './config/db.js';
import { ensureDefaultSuperAdmin } from './utils/bootstrap.js';

dotenv.config();

let cachedApp;

export async function getApp() {
  if (cachedApp) {
    return cachedApp;
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in environment variables');
  }

  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || '*',
    })
  );
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', apiRoutes);

  app.use((error, _req, res, _next) => {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    if (error?.code === 11000) {
      return res
        .status(409)
        .json({ message: 'Duplicate value for unique field in tenant scope' });
    }

    if (error?.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid identifier provided' });
    }

    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  });

  await connectDB(process.env.MONGODB_URI);
  await ensureDefaultSuperAdmin();

  cachedApp = app;
  return cachedApp;
}