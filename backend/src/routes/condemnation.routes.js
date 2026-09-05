import { Router } from 'express';
import {
  createCondemnationBoard,
  getCondemnations,
  getCondemnationById,
  approveCondemnationBoard,
  updateDisposalStatus,
} from '../controllers/condemnation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate); // Secure all routes

router.route('/')
  .post(createCondemnationBoard)
  .get(getCondemnations);

router.route('/:id')
  .get(getCondemnationById);

router.post('/:id/approve', approveCondemnationBoard);
router.patch('/:id/disposal', updateDisposalStatus);

export default router;
