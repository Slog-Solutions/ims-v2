import { Router } from 'express';
import {
  getEstablishmentInventory,
  getConsolidatedStockReport,
  getItemLedgerHistory,
  exportLedgerToExcel,
} from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate); // Secure all routes

router.get('/inventory/:establishmentId', getEstablishmentInventory);
router.get('/consolidated', getConsolidatedStockReport);
router.get('/ledger', getItemLedgerHistory);
router.get('/export/excel', exportLedgerToExcel);

export default router;
