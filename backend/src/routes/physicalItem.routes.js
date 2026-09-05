import { Router } from 'express';
import {
  getPhysicalItems,
  getPhysicalItem,
  reportDefect,
  resolveDefect,
  scheduleMaintenance,
  scanRfid
} from '../controllers/physicalItem.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Global scan endpoint (simulated tag scans)
router.route('/scan')
  .post(scanRfid);

router.route('/')
  .get(getPhysicalItems);

router.route('/:id')
  .get(getPhysicalItem);

router.route('/:id/defects')
  .post(reportDefect);

router.route('/:id/defects/:defectId/resolve')
  .patch(resolveDefect);

router.route('/:id/maintenance')
  .post(scheduleMaintenance);

export default router;
