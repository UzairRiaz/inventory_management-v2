import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRoutes from './routes/index.js';
import { connectDB } from './config/db.js';
import { ensureDefaultSuperAdmin } from './utils/bootstrap.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required in environment variables');
  process.exit(1);
}

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
    return res.status(409).json({ message: 'Duplicate value for unique field in tenant scope' });
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier provided' });
  }

  return res.status(500).json({ message: error.message || 'Internal Server Error' });
});

connectDB(process.env.MONGODB_URI)
  .then(async () => {
    await ensureDefaultSuperAdmin();
    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed', error);
    process.exit(1);
  });
