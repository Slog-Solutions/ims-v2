import mongoose from 'mongoose';
import { CONDEMNATION_STATUS } from '../utils/constants.js';

const condemnationItemSchema = new mongoose.Schema({
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
  condition: {
    type: String,
    required: true, // e.g. "Unserviceable", "Damaged", "Obsolete"
    trim: true,
  },
  recommendation: {
    type: String,
    required: true, // e.g. "Write-off", "Salvage", "Sell by Auction", "Repair"
    trim: true,
  },
}, { _id: false });

const condemnationSchema = new mongoose.Schema({
  boardNo: {
    type: String,
    required: [true, 'Board proceedings number is required'],
    unique: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  establishment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  presidingOfficer: {
    type: String,
    required: [true, 'Presiding Officer is required'],
    trim: true,
  },
  boardMembers: [{
    type: String,
    trim: true,
  }],
  items: [condemnationItemSchema],
  status: {
    type: String,
    enum: Object.values(CONDEMNATION_STATUS),
    default: CONDEMNATION_STATUS.PENDING,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  disposalStatus: {
    type: String, // e.g. "Pending Disposal", "Destroyed", "Auctioned", "Returned to Depot"
    default: 'Pending Approval',
  },
  disposalDate: {
    type: Date,
  },
  proceedingsAttachment: {
    type: String, // Local filepath on server for signed board proceedings PDF
  },
  remarks: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

condemnationSchema.index({ establishment: 1, status: 1 });

const Condemnation = mongoose.model('Condemnation', condemnationSchema);

export default Condemnation;
