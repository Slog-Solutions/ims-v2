import mongoose from 'mongoose';
import { VOUCHER_STATUS, VOUCHER_TYPES } from '../utils/constants.js';

const voucherItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  remarks: {
    type: String,
    trim: true,
  },
}, { _id: false });

const voucherSchema = new mongoose.Schema({
  voucherNo: {
    type: String,
    required: [true, 'Voucher number is required'],
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(VOUCHER_TYPES),
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  // If type is receipt, origin is where items came from (e.g. "Central Depot" or another unit).
  // If type is issue, origin is the current unit.
  origin: {
    type: String,
    required: true,
    trim: true,
  },
  // If type is receipt, destination is the current unit.
  // If type is issue, destination is where it's going.
  destination: {
    type: String,
    required: true,
    trim: true,
  },
  items: [voucherItemSchema],
  status: {
    type: String,
    enum: Object.values(VOUCHER_STATUS),
    default: VOUCHER_STATUS.PENDING,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  attachment: {
    type: String, // Local filepath on server for scanned copy
  },
  remarks: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

voucherSchema.index({ type: 1, status: 1 });
voucherSchema.index({ submittedBy: 1 });

const Voucher = mongoose.model('Voucher', voucherSchema);

export default Voucher;
