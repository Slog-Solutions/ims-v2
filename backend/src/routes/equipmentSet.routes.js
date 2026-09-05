import { Router } from 'express';
import {
  getEquipmentSets,
  getEquipmentSet,
  getEquipmentSetStats
} from '../controllers/equipmentSet.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.route('/')
  .get(getEquipmentSets);

router.route('/:id')
  .get(getEquipmentSet);

router.route('/:id/stats')
  .get(getEquipmentSetStats);

export default router;
