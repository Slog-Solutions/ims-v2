import Item from '../models/Item.model.js';
import User from '../models/User.model.js';
import Voucher from '../models/Voucher.model.js';
import Condemnation from '../models/Condemnation.model.js';
import StockLedger from '../models/StockLedger.model.js';
import PhysicalStoreItem from '../models/PhysicalStoreItem.model.js';
import Task from '../models/Task.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { USER_ROLES, VOUCHER_STATUS, CONDEMNATION_STATUS } from '../utils/constants.js';

// Helper to get latest stock balances for an establishment
const getLowStockCount = async (establishmentId) => {
  const items = await Item.find({ isActive: true });
  let lowStockCount = 0;

  for (const item of items) {
    const lastTx = await StockLedger.findOne({
      item: item._id,
      establishment: establishmentId,
    }).sort({ createdAt: -1 });

    const balance = lastTx ? lastTx.closingBalance : 0;
    if (balance < item.minStockLevel) {
      lowStockCount++;
    }
  }

  return lowStockCount;
};

// @desc    Get Dashboard statistics depending on the user role
// @route   GET /api/v1/analytics/dashboard
// @access  Private
export const getDashboardStats = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;

  if (role === USER_ROLES.MASTER) {
    // HQ Master statistics
    const nomenclatureCount = await Item.countDocuments({ isActive: true });
    const establishmentCount = await User.countDocuments({ role: USER_ROLES.ESTABLISHMENT, isActive: true });
    const pendingVouchers = await Voucher.countDocuments({ status: VOUCHER_STATUS.PENDING });
    const pendingCondemnations = await Condemnation.countDocuments({ status: CONDEMNATION_STATUS.PENDING });
    
    // Physical store metrics
    const totalPhysicalItems = await PhysicalStoreItem.countDocuments();
    const serviceableCount = await PhysicalStoreItem.countDocuments({ serviceability: 'serviceable' });
    const underRepairCount = await PhysicalStoreItem.countDocuments({ serviceability: 'under_repair' });
    const activeTasksCount = await Task.countDocuments({ status: { $in: ['planned', 'active'] } });

    const recentVouchers = await Voucher.find()
      .populate('submittedBy', 'establishmentName firstName lastName')
      .sort({ createdAt: -1 })
      .limit(6);

    const recentCondemnations = await Condemnation.find()
      .populate('establishment', 'establishmentName')
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json(
      ApiResponse.success({
        summary: {
          nomenclatureCount,
          establishmentCount,
          pendingVouchers,
          pendingCondemnations,
          totalPhysicalItems,
          serviceableCount,
          underRepairCount,
          activeTasksCount,
        },
        recentVouchers,
        recentCondemnations,
      })
    );
  } else {
    // Establishment Unit statistics
    const pendingVouchers = await Voucher.countDocuments({ submittedBy: _id, status: VOUCHER_STATUS.PENDING });
    const pendingCondemnations = await Condemnation.countDocuments({ establishment: _id, status: CONDEMNATION_STATUS.PENDING });
    
    // Physical store metrics for specific unit
    const totalPhysicalItems = await PhysicalStoreItem.countDocuments({ establishment: _id });
    const serviceableCount = await PhysicalStoreItem.countDocuments({ establishment: _id, serviceability: 'serviceable' });
    const underRepairCount = await PhysicalStoreItem.countDocuments({ establishment: _id, serviceability: 'under_repair' });
    const activeTasksCount = await Task.countDocuments({ assignedEstablishment: _id, status: { $in: ['planned', 'active'] } });

    // Find count of items with positive balances
    const ledgerItems = await StockLedger.aggregate([
      { $match: { establishment: _id } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$item', lastBalance: { $first: '$closingBalance' } } },
      { $match: { lastBalance: { $gt: 0 } } }
    ]);
    
    const stockItemsCount = ledgerItems.length;
    const lowStockCount = await getLowStockCount(_id);

    const recentVouchers = await Voucher.find({ submittedBy: _id })
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json(
      ApiResponse.success({
        summary: {
          stockItemsCount,
          pendingVouchers,
          pendingCondemnations,
          lowStockCount,
          totalPhysicalItems,
          serviceableCount,
          underRepairCount,
          activeTasksCount,
        },
        recentVouchers,
      })
    );
  }
});
