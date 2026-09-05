import { Router } from 'express';
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} from '../controllers/item.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadProductImages, handleMulterError } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate); // Secure all routes

// uploadProductImages handles up to 5 files in the 'images' field
router.route('/')
  .post(uploadProductImages, handleMulterError, createItem)
  .get(getItems);

router.route('/:id')
  .get(getItemById)
  .put(uploadProductImages, handleMulterError, updateItem)
  .delete(deleteItem);

export default router;
