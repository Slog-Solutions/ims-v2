import EquipmentSet from '../models/EquipmentSet.model.js';
import PhysicalStoreItem from '../models/PhysicalStoreItem.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all equipment sets
// @route   GET /api/v1/equipment-sets
// @access  Protected
export const getEquipmentSets = asyncHandler(async (req, res) => {
  const sets = await EquipmentSet.find({ isActive: true }).populate('items.item');
  res.status(200).json(ApiResponse.success(sets, 'Equipment sets retrieved successfully'));
});

// @desc    Get a single equipment set
// @route   GET /api/v1/equipment-sets/:id
// @access  Protected
export const getEquipmentSet = asyncHandler(async (req, res) => {
  const set = await EquipmentSet.findById(req.params.id).populate('items.item');
  if (!set) {
    throw ApiError.notFound('Equipment set not found');
  }
  res.status(200).json(ApiResponse.success(set, 'Equipment set retrieved successfully'));
});

// @desc    Get interconnected categories of data for an equipment set
// @route   GET /api/v1/equipment-sets/:id/stats
// @access  Protected
export const getEquipmentSetStats = asyncHandler(async (req, res) => {
  const set = await EquipmentSet.findById(req.params.id).populate('items.item');
  if (!set) {
    throw ApiError.notFound('Equipment set not found');
  }

  // Determine establishment filter. HQ (master) can filter by establishment query param, or check across all
  const { establishmentId } = req.query;
  const filter = {};
  if (establishmentId) {
    filter.establishment = establishmentId;
  } else if (req.user.role !== 'master') {
    // If not master, restrict to the user's establishment
    filter.establishment = req.user._id;
  }

  // Get item IDs associated with this equipment set
  const itemIds = set.items.map(i => i.item._id);
  
  // Find all physical items of these nomenclatures
  const physicalItems = await PhysicalStoreItem.find({
    item: { $in: itemIds },
    ...filter
  }).populate('item establishment');

  // Categorize 1: Store Held and Location (Holding State)
  const holdingState = set.items.map(setItem => {
    const itemPhysicals = physicalItems.filter(pi => pi.item._id.toString() === setItem.item._id.toString());
    const held = itemPhysicals.length;
    const serviceableCount = itemPhysicals.filter(pi => pi.serviceability === 'serviceable').length;
    const underRepairCount = itemPhysicals.filter(pi => pi.serviceability === 'under_repair').length;
    const unserviceableCount = itemPhysicals.filter(pi => pi.serviceability === 'unserviceable').length;
    const deployed = itemPhysicals.filter(pi => pi.status === 'deployed' || pi.status === 'task_assigned').length;
    const stored = itemPhysicals.filter(pi => pi.status === 'stored').length;

    return {
      itemId: setItem.item._id,
      nomenclature: setItem.item.nomenclature,
      unitOfIssue: setItem.item.unitOfIssue,
      required: setItem.requiredQuantity,
      held,
      serviceable: serviceableCount,
      underRepair: underRepairCount,
      unserviceable: unserviceableCount,
      deployed,
      stored,
      deficiency: Math.max(0, setItem.requiredQuantity - serviceableCount),
    };
  });

  // Categorize 2: Vintage (Procurement age & lifespan)
  const vintages = physicalItems.map(pi => ({
    id: pi._id,
    serialNumber: pi.serialNumber,
    rfidTag: pi.rfidTag,
    nomenclature: pi.item.nomenclature,
    procurementYear: pi.procurementYear,
    age: pi.age,
    serviceability: pi.serviceability,
    location: pi.location.name,
  }));

  // Group vintage by year for chart analysis
  const vintageChart = {};
  physicalItems.forEach(pi => {
    vintageChart[pi.procurementYear] = (vintageChart[pi.procurementYear] || 0) + 1;
  });

  // Categorize 3: Maintenance, Service Records, and Defects
  let defects = [];
  let serviceRecords = [];
  
  physicalItems.forEach(pi => {
    // Collect defects
    if (pi.defects && pi.defects.length > 0) {
      pi.defects.forEach(d => {
        defects.push({
          itemId: pi._id,
          serialNumber: pi.serialNumber,
          rfidTag: pi.rfidTag,
          nomenclature: pi.item.nomenclature,
          defectDescription: d.defectDescription,
          reportedDate: d.reportedDate,
          severity: d.severity,
          status: d.status,
          id: d._id,
        });
      });
    }

    // Collect maintenance logs
    if (pi.maintenanceHistory && pi.maintenanceHistory.length > 0) {
      pi.maintenanceHistory.forEach(mr => {
        serviceRecords.push({
          itemId: pi._id,
          serialNumber: pi.serialNumber,
          nomenclature: pi.item.nomenclature,
          serviceDate: mr.serviceDate,
          serviceType: mr.serviceType,
          description: mr.description,
          cost: mr.cost,
          servicedBy: mr.servicedBy,
        });
      });
    }
  });

  // Sort maintenance history by date descending
  serviceRecords.sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));

  // Categorize 4: RF Tagging and Sensor Logs (automated sensor mockups)
  const rfidLogs = physicalItems.map(pi => ({
    id: pi._id,
    serialNumber: pi.serialNumber,
    rfidTag: pi.rfidTag,
    nomenclature: pi.item.nomenclature,
    status: 'Active',
    signalStrength: Math.floor(Math.random() * 30) + 70 + '%', // Mock signal strength (70% - 100%)
    batteryLevel: Math.floor(Math.random() * 40) + 60 + '%', // Mock battery level (60% - 100%)
    lastScanDate: pi.updatedAt,
    location: pi.location.name,
  }));

  // Geolocation Plot data
  const mapPlotData = physicalItems.map(pi => ({
    id: pi._id,
    serialNumber: pi.serialNumber,
    nomenclature: pi.item.nomenclature,
    serviceability: pi.serviceability,
    status: pi.status,
    locationName: pi.location.name,
    lat: pi.location.coordinates.lat,
    lng: pi.location.coordinates.lng,
    establishmentName: pi.establishment?.establishmentName || 'Unknown Unit',
  }));

  res.status(200).json(ApiResponse.success({
    equipmentSet: {
      id: set._id,
      name: set.name,
      description: set.description,
    },
    holdingState,
    vintages,
    vintageChart,
    defects,
    serviceRecords,
    rfidLogs,
    mapPlotData
  }, 'Interconnected categories retrieved successfully'));
});
