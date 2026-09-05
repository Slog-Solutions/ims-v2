import mongoose from 'mongoose';

const equipmentSetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment set name is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  items: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    requiredQuantity: {
      type: Number,
      required: true,
      min: [1, 'Required quantity must be at least 1'],
    }
  }],
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

equipmentSetSchema.index({ name: 'text' });

const EquipmentSet = mongoose.model('EquipmentSet', equipmentSetSchema);

export default EquipmentSet;
