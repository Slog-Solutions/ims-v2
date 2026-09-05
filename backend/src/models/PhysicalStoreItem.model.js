import mongoose from 'mongoose';

const defectSchema = new mongoose.Schema({
  defectDescription: {
    type: String,
    required: true,
    trim: true,
  },
  reportedDate: {
    type: Date,
    default: Date.now,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'critical'],
    default: 'low',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open',
  },
  resolvedDate: Date,
});

const serviceRecordSchema = new mongoose.Schema({
  serviceDate: {
    type: Date,
    required: true,
  },
  serviceType: {
    type: String,
    enum: ['routine', 'repair', 'overhaul'],
    default: 'routine',
  },
  description: {
    type: String,
    trim: true,
  },
  cost: {
    type: Number,
    default: 0,
  },
  servicedBy: String,
  nextServiceDueDate: Date,
});

const physicalStoreItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true,
  },
  rfidTag: {
    type: String,
    required: [true, 'RFID Tag ID is required'],
    unique: true,
    trim: true,
  },
  equipmentSet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EquipmentSet',
  },
  establishment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  procurementYear: {
    type: Number,
    required: [true, 'Procurement year is required'],
  },
  serviceability: {
    type: String,
    enum: ['serviceable', 'unserviceable', 'under_repair'],
    default: 'serviceable',
  },
  status: {
    type: String,
    enum: ['stored', 'deployed', 'task_assigned'],
    default: 'stored',
  },
  location: {
    name: {
      type: String,
      required: true,
      default: 'HQ Store',
    },
    coordinates: {
      lat: { type: Number, default: 29.8660 },
      lng: { type: Number, default: 77.8880 },
    }
  },
  defects: [defectSchema],
  maintenanceHistory: [serviceRecordSchema],
  nextServiceDate: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for calculating Age
physicalStoreItemSchema.virtual('age').get(function() {
  const currentYear = new Date().getFullYear();
  return currentYear - this.procurementYear;
});

// Indexes
physicalStoreItemSchema.index({ serialNumber: 1, rfidTag: 1 });
physicalStoreItemSchema.index({ item: 1, establishment: 1 });
physicalStoreItemSchema.index({ equipmentSet: 1 });

const PhysicalStoreItem = mongoose.model('PhysicalStoreItem', physicalStoreItemSchema);

export default PhysicalStoreItem;
