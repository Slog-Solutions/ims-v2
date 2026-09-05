import mongoose from 'mongoose';
import { ITEM_UNITS } from '../utils/constants.js';

const itemSchema = new mongoose.Schema({
  nomenclature: {
    type: String,
    required: [true, 'Item nomenclature is required'],
    unique: true,
    trim: true,
  },
  unitOfIssue: {
    type: String,
    required: [true, 'Unit of issue is required'],
    enum: Object.values(ITEM_UNITS),
  },
  ledgerFolio: {
    type: String,
    required: [true, 'Ledger folio number is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  minStockLevel: {
    type: Number,
    default: 0,
    min: [0, 'Minimum stock level cannot be negative'],
  },
  images: {
    type: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    default: [],
    validate: {
      validator: (arr) => arr.length <= 5,
      message: 'A maximum of 5 images are allowed per item',
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

itemSchema.index({ nomenclature: 'text', ledgerFolio: 'text' });

const Item = mongoose.model('Item', itemSchema);

export default Item;
