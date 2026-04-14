import { Router } from 'express';
import organizationRoutes from './organizations.js';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import warehouseRoutes from './warehouses.js';
import itemRoutes from './items.js';
import stockRoutes from './stock.js';
import noteRoutes from './notes.js';
import saleRoutes from './sales.js';
import customerRoutes from './customers.js';
import superadminRoutes from './superadmin.js';
import ledgerRoutes from './ledger.js';
import activityRoutes from './activity.js';
import purchaseRoutes from './purchases.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/superadmin', superadminRoutes);
router.use('/users', userRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/items', itemRoutes);
router.use('/customers', customerRoutes);
router.use('/stock', stockRoutes);
router.use('/notes', noteRoutes);
router.use('/sales', saleRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/activity', activityRoutes);
router.use('/purchases', purchaseRoutes);

export default router;
