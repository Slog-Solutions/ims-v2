import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Task name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  requiredEquipmentSet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EquipmentSet',
    required: true,
  },
  assignedEstablishment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'cancelled'],
    default: 'planned',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  allocatedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PhysicalStoreItem',
  }],
}, {
  timestamps: true,
});

taskSchema.index({ name: 'text' });
taskSchema.index({ assignedEstablishment: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
