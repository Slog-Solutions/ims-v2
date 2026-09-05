import Task from '../models/Task.model.js';
import EquipmentSet from '../models/EquipmentSet.model.js';
import PhysicalStoreItem from '../models/PhysicalStoreItem.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all combat engineer tasks
// @route   GET /api/v1/tasks
// @access  Protected
export const getTasks = asyncHandler(async (req, res) => {
  const query = {};
  
  // Restrict to unit's tasks if not master
  if (req.user.role !== 'master') {
    query.assignedEstablishment = req.user._id;
  }

  const tasks = await Task.find(query)
    .populate('requiredEquipmentSet assignedEstablishment')
    .populate({
      path: 'allocatedItems',
      populate: { path: 'item' }
    });

  res.status(200).json(ApiResponse.success(tasks, 'Combat engineer tasks retrieved successfully'));
});

// @desc    Get a single task
// @route   GET /api/v1/tasks/:id
// @access  Protected
export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('requiredEquipmentSet assignedEstablishment')
    .populate({
      path: 'allocatedItems',
      populate: { path: 'item' }
    });

  if (!task) {
    throw ApiError.notFound('Combat engineer task not found');
  }

  res.status(200).json(ApiResponse.success(task, 'Task retrieved successfully'));
});

// @desc    Create a new combat engineer task
// @route   POST /api/v1/tasks
// @access  Protected (Master/Commander only)
export const createTask = asyncHandler(async (req, res) => {
  const { name, description, requiredEquipmentSet, assignedEstablishment, startDate, endDate } = req.body;

  if (!name || !requiredEquipmentSet || !assignedEstablishment || !startDate || !endDate) {
    throw ApiError.badRequest('Missing required task fields');
  }

  const eqptSet = await EquipmentSet.findById(requiredEquipmentSet);
  if (!eqptSet) {
    throw ApiError.notFound('Equipment set not found');
  }

  const establishment = await User.findById(assignedEstablishment);
  if (!establishment) {
    throw ApiError.notFound('Assigned establishment unit not found');
  }

  // Create planned task
  const task = await Task.create({
    name,
    description,
    requiredEquipmentSet,
    assignedEstablishment,
    startDate,
    endDate,
    status: 'planned',
    allocatedItems: []
  });

  res.status(201).json(ApiResponse.created(task, 'Combat engineer task planned successfully'));
});

// @desc    Allocate physical store items to a task
// @route   POST /api/v1/tasks/:id/allocate
// @access  Protected
export const allocateItemsToTask = asyncHandler(async (req, res) => {
  const { physicalItemIds } = req.body;
  
  if (!physicalItemIds || !Array.isArray(physicalItemIds)) {
    throw ApiError.badRequest('An array of physical item IDs is required for allocation');
  }

  const task = await Task.findById(req.params.id).populate('requiredEquipmentSet');
  if (!task) {
    throw ApiError.notFound('Combat engineer task not found');
  }

  // Fetch physical items
  const items = await PhysicalStoreItem.find({
    _id: { $in: physicalItemIds },
    establishment: task.assignedEstablishment
  });

  if (items.length !== physicalItemIds.length) {
    throw ApiError.badRequest('Some physical items do not belong to the holding unit or were not found');
  }

  // Verify they are serviceable and not already assigned elsewhere
  for (const pi of items) {
    if (pi.serviceability !== 'serviceable') {
      throw ApiError.badRequest(`Item ${pi.serialNumber} is unserviceable or under repair`);
    }
    if (pi.status === 'task_assigned' && !task.allocatedItems.includes(pi._id.toString())) {
      throw ApiError.badRequest(`Item ${pi.serialNumber} is already allocated to another active task`);
    }
  }

  // Update physical item details
  // Set coordinates to task target location (e.g. simulated field coordinate)
  const taskLocationName = `${task.name} Field Location`;
  const baseLat = 29.8900;
  const baseLng = 77.9200;

  for (const pi of items) {
    pi.status = 'task_assigned';
    pi.location = {
      name: taskLocationName,
      coordinates: {
        lat: baseLat + (Math.random() - 0.5) * 0.02,
        lng: baseLng + (Math.random() - 0.5) * 0.02
      }
    };
    await pi.save();
  }

  // Update task list
  task.allocatedItems = physicalItemIds;
  
  // Auto-activate task if some items are allocated
  if (task.allocatedItems.length > 0 && task.status === 'planned') {
    task.status = 'active';
  }

  await task.save();

  res.status(200).json(ApiResponse.success(task, 'Physical items successfully allocated to task'));
});

// @desc    Update task status (Planned, Active, Completed, Cancelled)
// @route   PATCH /api/v1/tasks/:id/status
// @access  Protected
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw ApiError.notFound('Combat engineer task not found');
  }

  const validStatuses = ['planned', 'active', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw ApiError.badRequest('Invalid task status');
  }

  task.status = status;

  // Release items if completed or cancelled
  if (status === 'completed' || status === 'cancelled') {
    const allocatedPhysicalIds = task.allocatedItems;
    
    // Fetch the unit (establishment) coordinates to return items back to their base
    const unit = await User.findById(task.assignedEstablishment);
    const baseLat = unit ? 29.8650 : 29.8660;
    const baseLng = unit ? 77.8950 : 77.8880;

    await PhysicalStoreItem.updateMany(
      { _id: { $in: allocatedPhysicalIds } },
      { 
        $set: { 
          status: 'stored',
          'location.name': `${unit ? unit.establishmentName : 'Unit'} Depot`,
          'location.coordinates': { lat: baseLat, lng: baseLng }
        } 
      }
    );

    // Clear allocations list
    task.allocatedItems = [];
  }

  await task.save();

  res.status(200).json(ApiResponse.success(task, `Task status updated to ${status}`));
});
