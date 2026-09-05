import { Router } from 'express';
import {
  createVoucher,
  getVouchers,
  getVoucherById,
  approveVoucher,
  rejectVoucher,
} from '../controllers/voucher.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate); // Secure all routes

router.route('/')
  .post(createVoucher)
  .get(getVouchers);

router.route('/:id')
  .get(getVoucherById);

router.post('/:id/approve', approveVoucher);
router.post('/:id/reject', rejectVoucher);

export default router;
