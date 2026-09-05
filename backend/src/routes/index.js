import { Router } from 'express';
import authRoutes from './auth.routes.js';
import itemRoutes from './item.routes.js';
import voucherRoutes from './voucher.routes.js';
import condemnationRoutes from './condemnation.routes.js';
import reportRoutes from './report.routes.js';
import analyticsRoutes from './analytics.routes.js';
import userRoutes from './user.routes.js';
import equipmentSetRoutes from './equipmentSet.routes.js';
import physicalItemRoutes from './physicalItem.routes.js';
import taskRoutes from './task.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/condemnations', condemnationRoutes);
router.use('/reports', reportRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', userRoutes);
router.use('/equipment-sets', equipmentSetRoutes);
router.use('/physical-items', physicalItemRoutes);
router.use('/tasks', taskRoutes);

export default router;
