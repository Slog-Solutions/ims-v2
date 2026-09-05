import PhysicalStoreItem from '../models/PhysicalStoreItem.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getIO } from '../socket/index.js';

// @desc    Get all physical store items
// @route   GET /api/v1/physical-items
// @access  Protected
export const getPhysicalItems = asyncHandler(async (req, res) => {
  const { itemId, serviceability, status, search } = req.query;
  const query = {};

  // Restrict to user's establishment if not master
  if (req.user.role !== 'master') {
    query.establishment = req.user._id;
  }

  if (itemId) query.item = itemId;
  if (serviceability) query.serviceability = serviceability;
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { serialNumber: { $regex: search, $options: 'i' } },
      { rfidTag: { $regex: search, $options: 'i' } },
    ];
  }

  const items = await PhysicalStoreItem.find(query).populate('item establishment');
  res.status(200).json(ApiResponse.success(items, 'Physical store items retrieved successfully'));
});

// @desc    Get a single physical store item
// @route   GET /api/v1/physical-items/:id
// @access  Protected
export const getPhysicalItem = asyncHandler(async (req, res) => {
  const item = await PhysicalStoreItem.findById(req.params.id).populate('item establishment');
  if (!item) {
    throw ApiError.notFound('Physical store item not found');
  }
  res.status(200).json(ApiResponse.success(item, 'Physical store item retrieved successfully'));
});

// @desc    Report a new defect on a physical store item
// @route   POST /api/v1/physical-items/:id/defects
// @access  Protected
export const reportDefect = asyncHandler(async (req, res) => {
  const { defectDescription, severity } = req.body;
  const item = await PhysicalStoreItem.findById(req.params.id);

  if (!item) {
    throw ApiError.notFound('Physical store item not found');
  }

  // Add defect
  item.defects.push({
    defectDescription,
    severity,
    status: 'open',
    reportedDate: new Date(),
  });

  // Update serviceability based on severity
  if (severity === 'critical') {
    item.serviceability = 'unserviceable';
  } else if (severity === 'medium') {
    item.serviceability = 'under_repair';
  } // 'low' severity retains 'serviceable' state

  await item.save();

  // Socket notification
  const io = getIO();
  if (io) {
    io.emit('item:defect', {
      itemId: item._id,
      serialNumber: item.serialNumber,
      serviceability: item.serviceability,
      defect: item.defects[item.defects.length - 1],
    });
  }

  res.status(200).json(ApiResponse.success(item, 'Defect reported successfully'));
});

// @desc    Resolve a defect on a physical store item
// @route   PATCH /api/v1/physical-items/:id/defects/:defectId/resolve
// @access  Protected
export const resolveDefect = asyncHandler(async (req, res) => {
  const { id, defectId } = req.params;
  const item = await PhysicalStoreItem.findById(id);

  if (!item) {
    throw ApiError.notFound('Physical store item not found');
  }

  const defect = item.defects.id(defectId);
  if (!defect) {
    throw ApiError.notFound('Defect record not found');
  }

  defect.status = 'resolved';
  defect.resolvedDate = new Date();

  // Reset serviceability if all defects are resolved
  const openDefects = item.defects.filter(d => d.status === 'open' || d.status === 'in_progress');
  if (openDefects.length === 0) {
    item.serviceability = 'serviceable';
  } else {
    // Set to the highest remaining severity
    const hasCritical = openDefects.some(d => d.severity === 'critical');
    item.serviceability = hasCritical ? 'unserviceable' : 'under_repair';
  }

  await item.save();

  res.status(200).json(ApiResponse.success(item, 'Defect resolved successfully'));
});

// @desc    Schedule/Log maintenance service on a physical store item
// @route   POST /api/v1/physical-items/:id/maintenance
// @access  Protected
export const scheduleMaintenance = asyncHandler(async (req, res) => {
  const { serviceDate, serviceType, description, cost, servicedBy, nextServiceDueDate } = req.body;
  const item = await PhysicalStoreItem.findById(req.params.id);

  if (!item) {
    throw ApiError.notFound('Physical store item not found');
  }

  item.maintenanceHistory.push({
    serviceDate: serviceDate || new Date(),
    serviceType,
    description,
    cost: cost || 0,
    servicedBy,
    nextServiceDueDate,
  });

  if (nextServiceDueDate) {
    item.nextServiceDate = nextServiceDueDate;
  }

  // If serviced, we resolve "under_repair" status to "serviceable"
  if (item.serviceability === 'under_repair') {
    item.serviceability = 'serviceable';
  }

  await item.save();

  res.status(200).json(ApiResponse.success(item, 'Maintenance service logged successfully'));
});

// @desc    Simulate scanning an RFID tag (updates location and status)
// @route   POST /api/v1/physical-items/scan
// @access  Protected
export const scanRfid = asyncHandler(async (req, res) => {
  const { rfidTag, locationName, lat, lng, status } = req.body;
  
  if (!rfidTag || !locationName) {
    throw ApiError.badRequest('RFID Tag ID and Location Name are required');
  }

  const item = await PhysicalStoreItem.findOne({ rfidTag }).populate('item establishment');
  if (!item) {
    throw ApiError.notFound(`Physical item with RFID tag ${rfidTag} not found`);
  }

  // Update details
  item.location.name = locationName;
  if (lat && lng) {
    item.location.coordinates = { lat, lng };
  }
  if (status) {
    item.status = status;
  }

  await item.save();

  // Socket notification to broadcast the location update instantly
  const io = getIO();
  if (io) {
    io.emit('rfid:scan', {
      itemId: item._id,
      serialNumber: item.serialNumber,
      rfidTag: item.rfidTag,
      nomenclature: item.item.nomenclature,
      locationName: item.location.name,
      coordinates: item.location.coordinates,
      status: item.status,
      updatedAt: item.updatedAt,
    });
  }

  res.status(200).json(ApiResponse.success(item, 'RFID scan simulated successfully'));
});
