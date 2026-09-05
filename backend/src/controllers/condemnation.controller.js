import mongoose from 'mongoose';
import Condemnation from '../models/Condemnation.model.js';
import Item from '../models/Item.model.js';
import StockLedger from '../models/StockLedger.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { CONDEMNATION_STATUS, USER_ROLES, SOCKET_EVENTS } from '../utils/constants.js';
import { getIO } from '../socket/index.js';
import { createActivityLog } from '../utils/helpers.js';

// Helper to get current balance of an item at a unit
const getCurrentBalance = async (itemId, establishmentId) => {
  const lastTransaction = await StockLedger.findOne({
    item: itemId,
    establishment: establishmentId,
  }).sort({ createdAt: -1 });
  
  return lastTransaction ? lastTransaction.closingBalance : 0;
};

// @desc    Initiate a Condemnation Board
// @route   POST /api/v1/condemnations
// @access  Private
export const createCondemnationBoard = asyncHandler(async (req, res) => {
  const { boardNo, date, presidingOfficer, boardMembers, items, remarks } = req.body;
  const establishmentId = req.user._id;

  // Check unique board number
  const existingBoard = await Condemnation.findOne({ boardNo });
  if (existingBoard) {
    throw ApiError.conflict('Board proceedings number already exists');
  }

  // Verify stock levels at establishment unit
  for (const itemObj of items) {
    const currentBal = await getCurrentBalance(itemObj.item, establishmentId);
    if (currentBal < itemObj.qty) {
      const itemInfo = await Item.findById(itemObj.item);
      throw ApiError.badRequest(
        `Cannot condemn item "${itemInfo?.nomenclature || 'Unknown'}". Available stock is ${currentBal}, requested ${itemObj.qty} for write-off.`
      );
    }
  }

  const board = await Condemnation.create({
    boardNo,
    date,
    establishment: establishmentId,
    presidingOfficer,
    boardMembers,
    items,
    remarks,
    status: CONDEMNATION_STATUS.PENDING,
    disposalStatus: 'Pending HQ Approval',
  });

  // Log activity
  await createActivityLog(req.user._id, 'condemnation_create', `Initiated condemnation board ${boardNo}`, req);

  // Notify socket
  const io = getIO();
  if (io) {
    io.emit(SOCKET_EVENTS.CONDEMNATION_CREATED, {
      boardId: board._id,
      boardNo: board.boardNo,
      establishment: req.user.establishmentName,
    });
  }

  res.status(201).json(ApiResponse.created(board, 'Condemnation board submitted successfully'));
});

// @desc    Get all Condemnation Boards
// @route   GET /api/v1/condemnations
// @access  Private
export const getCondemnations = asyncHandler(async (req, res) => {
  const { status, limit = 100, page = 1 } = req.query;

  const query = {};
  if (status) query.status = status;

  if (req.user.role === USER_ROLES.ESTABLISHMENT) {
    query.establishment = req.user._id;
  }

  const skip = (page - 1) * limit;

  const boards = await Condemnation.find(query)
    .populate('establishment', 'establishmentName firstName lastName')
    .populate('approvedBy', 'firstName lastName designation')
    .populate('items.item', 'nomenclature unitOfIssue ledgerFolio')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Condemnation.countDocuments(query);

  res.status(200).json(
    ApiResponse.success({
      boards,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// @desc    Get Condemnation Board Details
// @route   GET /api/v1/condemnations/:id
// @access  Private
export const getCondemnationById = asyncHandler(async (req, res) => {
  const board = await Condemnation.findById(req.params.id)
    .populate('establishment', 'establishmentName firstName lastName designation serviceNumber')
    .populate('approvedBy', 'firstName lastName designation serviceNumber')
    .populate('items.item', 'nomenclature unitOfIssue ledgerFolio description');

  if (!board) {
    throw ApiError.notFound('Condemnation board record not found');
  }

  if (req.user.role === USER_ROLES.ESTABLISHMENT && board.establishment._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have access to view this board');
  }

  res.status(200).json(ApiResponse.success(board));
});

// @desc    Approve/Write-off Condemnation Board
// @route   POST /api/v1/condemnations/:id/approve
// @access  Private (Master Only)
export const approveCondemnationBoard = asyncHandler(async (req, res) => {
  if (req.user.role !== USER_ROLES.MASTER) {
    throw ApiError.forbidden('Only Master HQ can approve condemnation boards');
  }

  const board = await Condemnation.findById(req.params.id);
  if (!board) {
    throw ApiError.notFound('Condemnation board record not found');
  }

  if (board.status !== CONDEMNATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Board status is already "${board.status}"`);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const establishmentId = board.establishment;

    // Apply ledger decrements for each condemned item
    for (const itemObj of board.items) {
      const currentBal = await getCurrentBalance(itemObj.item, establishmentId);
      const newBal = currentBal - itemObj.qty;

      if (newBal < 0) {
        throw new Error(`Insufficient stock for item decrement during condemnation: ${itemObj.item}`);
      }

      // Create Ledger Entry
      await StockLedger.create([{
        item: itemObj.item,
        establishment: establishmentId,
        openingBalance: currentBal,
        quantity: -itemObj.qty,
        closingBalance: newBal,
        transactionType: 'condemnation',
        remarks: `Condemnation Board: ${board.boardNo}`,
      }], { session });
    }

    // Update board state
    board.status = CONDEMNATION_STATUS.APPROVED;
    board.disposalStatus = 'Approved for Disposal';
    board.approvedBy = req.user._id;
    await board.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Log action
    await createActivityLog(req.user._id, 'condemnation_approve', `Approved condemnation write-off for board ${board.boardNo}`, req);

    // Sockets
    const io = getIO();
    if (io) {
      io.emit(SOCKET_EVENTS.CONDEMNATION_APPROVED, {
        boardId: board._id,
        boardNo: board.boardNo,
      });
      io.emit(SOCKET_EVENTS.LEDGER_UPDATED, {
        establishmentId: establishmentId,
      });
    }

    res.status(200).json(ApiResponse.success(board, 'Condemnation board approved and items written-off from stock register'));
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw ApiError.internal(`Condemnation approval transaction failed: ${err.message}`);
  }
});

// @desc    Update disposal status of approved condemnation items
// @route   PATCH /api/v1/condemnations/:id/disposal
// @access  Private
export const updateDisposalStatus = asyncHandler(async (req, res) => {
  const { disposalStatus, disposalDate, remarks } = req.body;

  const board = await Condemnation.findById(req.params.id);
  if (!board) {
    throw ApiError.notFound('Condemnation board record not found');
  }

  // Only the owning unit or Master HQ can update disposal status
  if (req.user.role === USER_ROLES.ESTABLISHMENT && board.establishment.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Unauthorized access');
  }

  if (board.status !== CONDEMNATION_STATUS.APPROVED && board.status !== CONDEMNATION_STATUS.DISPOSED) {
    throw ApiError.badRequest('Disposal status can only be updated for approved boards');
  }

  board.disposalStatus = disposalStatus;
  if (disposalDate) board.disposalDate = disposalDate;
  if (remarks) board.remarks = remarks;
  board.status = CONDEMNATION_STATUS.DISPOSED;

  await board.save();

  // Log action
  await createActivityLog(req.user._id, 'condemnation_disposal', `Updated disposal details for board ${board.boardNo}`, req);

  res.status(200).json(ApiResponse.success(board, 'Disposal details updated successfully'));
});
