import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  allocateItemsToTask,
  updateTaskStatus
} from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask);

router.route('/:id/allocate')
  .post(allocateItemsToTask);

router.route('/:id/status')
  .patch(updateTaskStatus);

export default router;
