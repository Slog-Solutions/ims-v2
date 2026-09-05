import mongoose from 'mongoose';
import Voucher from '../models/Voucher.model.js';
import Item from '../models/Item.model.js';
import StockLedger from '../models/StockLedger.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { VOUCHER_STATUS, VOUCHER_TYPES, USER_ROLES, SOCKET_EVENTS } from '../utils/constants.js';
import { getIO } from '../socket/index.js';
import { createActivityLog } from '../utils/helpers.js';
import logger from '../utils/logger.js';

// Helper to get current balance of an item at a unit
const getCurrentBalance = async (itemId, establishmentId) => {
  const lastTransaction = await StockLedger.findOne({
    item: itemId,
    establishment: establishmentId,
  }).sort({ createdAt: -1 });
  
  return lastTransaction ? lastTransaction.closingBalance : 0;
};

// @desc    Create a pending Voucher (Issue or Receipt)
// @route   POST /api/v1/vouchers
// @access  Private
export const createVoucher = asyncHandler(async (req, res) => {
  const { voucherNo, type, date, origin, destination, items, remarks } = req.body;

  // Verify unique voucher number
  const existingVoucher = await Voucher.findOne({ voucherNo });
  if (existingVoucher) {
    throw ApiError.conflict('Voucher number already exists');
  }

  // If issue voucher, verify sufficient stock at origin
  if (type === VOUCHER_TYPES.ISSUE) {
    // Only establishments can issue stock from their inventory
    const establishmentId = req.user._id;

    for (const itemObj of items) {
      const currentBal = await getCurrentBalance(itemObj.item, establishmentId);
      if (currentBal < itemObj.qty) {
        const itemInfo = await Item.findById(itemObj.item);
        throw ApiError.badRequest(
          `Insufficient stock for item "${itemInfo?.nomenclature || 'Unknown'}". Current balance is ${currentBal}, requested ${itemObj.qty}.`
        );
      }
    }
  }

  const voucher = await Voucher.create({
    voucherNo,
    type,
    date,
    origin,
    destination,
    items,
    remarks,
    submittedBy: req.user._id,
    status: VOUCHER_STATUS.PENDING,
  });

  // Log activity
  await createActivityLog(req.user._id, 'voucher_create', `Created pending ${type} voucher ${voucherNo}`, req);

  // Notify Master HQ via socket
  const io = getIO();
  if (io) {
    io.emit(SOCKET_EVENTS.VOUCHER_CREATED, {
      voucherId: voucher._id,
      voucherNo: voucher.voucherNo,
      type: voucher.type,
      submittedBy: req.user.establishmentName || req.user.fullName,
    });
  }

  res.status(201).json(ApiResponse.created(voucher, 'Voucher submitted and pending approval'));
});

// @desc    Get list of Vouchers
// @route   GET /api/v1/vouchers
// @access  Private
export const getVouchers = asyncHandler(async (req, res) => {
  const { type, status, limit = 100, page = 1 } = req.query;

  const query = {};
  if (type) query.type = type;
  if (status) query.status = status;

  // Establishments can only view their own vouchers (either submitted by them, or originating/destined for them)
  if (req.user.role === USER_ROLES.ESTABLISHMENT) {
    query.submittedBy = req.user._id;
  }

  const skip = (page - 1) * limit;

  const vouchers = await Voucher.find(query)
    .populate('submittedBy', 'firstName lastName establishmentName designation')
    .populate('approvedBy', 'firstName lastName designation')
    .populate('items.item', 'nomenclature unitOfIssue ledgerFolio')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Voucher.countDocuments(query);

  res.status(200).json(
    ApiResponse.success({
      vouchers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// @desc    Get Voucher by ID
// @route   GET /api/v1/vouchers/:id
// @access  Private
export const getVoucherById = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id)
    .populate('submittedBy', 'firstName lastName establishmentName designation serviceNumber')
    .populate('approvedBy', 'firstName lastName designation serviceNumber')
    .populate('items.item', 'nomenclature unitOfIssue ledgerFolio description');

  if (!voucher) {
    throw ApiError.notFound('Voucher not found');
  }

  // Security check: Establishments can only view their own vouchers
  if (req.user.role === USER_ROLES.ESTABLISHMENT && voucher.submittedBy._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have access to view this voucher');
  }

  res.status(200).json(ApiResponse.success(voucher));
});

// @desc    Approve pending Voucher
// @route   POST /api/v1/vouchers/:id/approve
// @access  Private (Master Only)
export const approveVoucher = asyncHandler(async (req, res) => {
  if (req.user.role !== USER_ROLES.MASTER) {
    throw ApiError.forbidden('Only Master HQ can approve vouchers');
  }

  const voucher = await Voucher.findById(req.params.id);
  if (!voucher) {
    throw ApiError.notFound('Voucher not found');
  }

  if (voucher.status !== VOUCHER_STATUS.PENDING) {
    throw ApiError.badRequest(`Voucher cannot be approved because its status is already "${voucher.status}"`);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const establishmentId = voucher.submittedBy;

    // Apply ledger updates for each item in the voucher
    for (const itemObj of voucher.items) {
      const currentBal = await getCurrentBalance(itemObj.item, establishmentId);

      let qtyChange = 0;
      let newBal = 0;

      if (voucher.type === VOUCHER_TYPES.RECEIPT) {
        qtyChange = itemObj.qty;
        newBal = currentBal + qtyChange;
      } else if (voucher.type === VOUCHER_TYPES.ISSUE) {
        qtyChange = -itemObj.qty;
        newBal = currentBal + qtyChange; // currentBal - qty

        // Validate final balance isn't negative
        if (newBal < 0) {
          throw new Error(`Insufficient stock for issue voucher approval on item: ${itemObj.item}`);
        }
      }

      // Create Ledger Entry
      await StockLedger.create([{
        item: itemObj.item,
        establishment: establishmentId,
        openingBalance: currentBal,
        quantity: qtyChange,
        closingBalance: newBal,
        transactionType: voucher.type,
        voucherId: voucher._id,
        remarks: `Voucher approval: ${voucher.voucherNo}`,
      }], { session });
    }

    // Update Voucher status
    voucher.status = VOUCHER_STATUS.APPROVED;
    voucher.approvedBy = req.user._id;
    voucher.approvedAt = new Date();
    await voucher.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Log action
    await createActivityLog(req.user._id, 'voucher_approve', `Approved ${voucher.type} voucher ${voucher.voucherNo}`, req);

    // Notify users via sockets
    const io = getIO();
    if (io) {
      io.emit(SOCKET_EVENTS.VOUCHER_APPROVED, {
        voucherId: voucher._id,
        voucherNo: voucher.voucherNo,
        type: voucher.type,
      });
      io.emit(SOCKET_EVENTS.LEDGER_UPDATED, {
        establishmentId: establishmentId,
      });
    }

    res.status(200).json(ApiResponse.success(voucher, 'Voucher approved and ledger balances updated successfully'));
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Error during voucher approval transaction:', err);
    throw ApiError.internal(`Voucher approval transaction failed: ${err.message}`);
  }
});

// @desc    Reject pending Voucher
// @route   POST /api/v1/vouchers/:id/reject
// @access  Private (Master Only)
export const rejectVoucher = asyncHandler(async (req, res) => {
  if (req.user.role !== USER_ROLES.MASTER) {
    throw ApiError.forbidden('Only Master HQ can reject vouchers');
  }

  const { remarks } = req.body;

  const voucher = await Voucher.findById(req.params.id);
  if (!voucher) {
    throw ApiError.notFound('Voucher not found');
  }

  if (voucher.status !== VOUCHER_STATUS.PENDING) {
    throw ApiError.badRequest(`Voucher cannot be rejected because its status is already "${voucher.status}"`);
  }

  voucher.status = VOUCHER_STATUS.REJECTED;
  voucher.remarks = remarks || voucher.remarks;
  voucher.approvedBy = req.user._id;
  voucher.approvedAt = new Date();
  await voucher.save();

  // Log action
  await createActivityLog(req.user._id, 'voucher_reject', `Rejected voucher ${voucher.voucherNo}`, req);

  // Notify socket
  const io = getIO();
  if (io) {
    io.emit(SOCKET_EVENTS.VOUCHER_REJECTED, {
      voucherId: voucher._id,
      voucherNo: voucher.voucherNo,
    });
  }

  res.status(200).json(ApiResponse.success(voucher, 'Voucher rejected successfully'));
});