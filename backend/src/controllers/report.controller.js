import ExcelJS from 'exceljs';
import StockLedger from '../models/StockLedger.model.js';
import Item from '../models/Item.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { USER_ROLES } from '../utils/constants.js';

// Helper to get latest stock balances for an establishment
const getEstablishmentInventoryHelper = async (establishmentId) => {
  const items = await Item.find({ isActive: true }).sort({ nomenclature: 1 });
  const inventoryList = [];

  for (const item of items) {
    const lastTx = await StockLedger.findOne({
      item: item._id,
      establishment: establishmentId,
    }).sort({ createdAt: -1 });

    const balance = lastTx ? lastTx.closingBalance : 0;
    inventoryList.push({
      item,
      balance,
    });
  }

  return inventoryList;
};

// @desc    Get current inventory list of an establishment
// @route   GET /api/v1/reports/inventory/:establishmentId
// @access  Private
export const getEstablishmentInventory = asyncHandler(async (req, res) => {
  let establishmentId = req.params.establishmentId;

  // Establishments can only view their own inventory
  if (req.user.role === USER_ROLES.ESTABLISHMENT) {
    establishmentId = req.user._id.toString();
  }

  const inventory = await getEstablishmentInventoryHelper(establishmentId);

  res.status(200).json(ApiResponse.success({ inventory }));
});

// @desc    Get consolidated stock balances of all items across all establishments
// @route   GET /api/v1/reports/consolidated
// @access  Private (Master Only)
export const getConsolidatedStockReport = asyncHandler(async (req, res) => {
  if (req.user.role !== USER_ROLES.MASTER) {
    throw ApiError.forbidden('Only Master HQ can view the consolidated report');
  }

  const items = await Item.find({ isActive: true }).sort({ nomenclature: 1 });
  const establishments = await User.find({ role: USER_ROLES.ESTABLISHMENT, isActive: true }).sort({ establishmentName: 1 });

  const report = [];

  for (const item of items) {
    const balances = {};
    let totalQty = 0;

    for (const est of establishments) {
      const lastTx = await StockLedger.findOne({
        item: item._id,
        establishment: est._id,
      }).sort({ createdAt: -1 });

      const bal = lastTx ? lastTx.closingBalance : 0;
      balances[est._id] = bal;
      totalQty += bal;
    }

    report.push({
      item,
      balances,
      totalQty,
    });
  }

  res.status(200).json(ApiResponse.success({
    establishments: establishments.map(e => ({ _id: e._id, name: e.establishmentName })),
    report,
  }));
});

// @desc    Get detailed ledger transactions of an item at an establishment
// @route   GET /api/v1/reports/ledger
// @access  Private
export const getItemLedgerHistory = asyncHandler(async (req, res) => {
  const { itemId } = req.query;
  let { establishmentId } = req.query;

  if (!itemId) {
    throw ApiError.badRequest('Item ID is required');
  }

  if (req.user.role === USER_ROLES.ESTABLISHMENT) {
    establishmentId = req.user._id.toString();
  } else if (!establishmentId) {
    throw ApiError.badRequest('Establishment ID is required for Master user queries');
  }

  const itemInfo = await Item.findById(itemId);
  if (!itemInfo) {
    throw ApiError.notFound('Item not found');
  }

  const establishmentInfo = await User.findById(establishmentId);
  if (!establishmentInfo) {
    throw ApiError.notFound('Establishment not found');
  }

  const history = await StockLedger.find({
    item: itemId,
    establishment: establishmentId,
  })
    .populate('voucherId', 'voucherNo type date origin destination')
    .sort({ createdAt: 1 }); // Chronological order

  res.status(200).json(ApiResponse.success({
    item: itemInfo,
    establishment: {
      _id: establishmentInfo._id,
      name: establishmentInfo.establishmentName,
    },
    history,
  }));
});

// @desc    Export Ledger card to Excel
// @route   GET /api/v1/reports/export/excel
// @access  Private
export const exportLedgerToExcel = asyncHandler(async (req, res) => {
  const { itemId, establishmentId } = req.query;

  if (!itemId || !establishmentId) {
    throw ApiError.badRequest('itemId and establishmentId are required');
  }

  const item = await Item.findById(itemId);
  const establishment = await User.findById(establishmentId);

  if (!item || !establishment) {
    throw ApiError.notFound('Item or Establishment records not found');
  }

  const history = await StockLedger.find({ item: itemId, establishment: establishmentId })
    .populate('voucherId', 'voucherNo type origin destination')
    .sort({ createdAt: 1 });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ledger Card');

  // Title blocks
  worksheet.mergeCells('A1:G1');
  worksheet.getCell('A1').value = 'MILITARY INVENTORY CONTROL - STOCK LEDGER CARD';
  worksheet.getCell('A1').font = { size: 14, bold: true };
  worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.getCell('A3').value = 'Establishment:';
  worksheet.getCell('B3').value = establishment.establishmentName;
  worksheet.getCell('A4').value = 'Nomenclature:';
  worksheet.getCell('B4').value = item.nomenclature;
  worksheet.getCell('E3').value = 'Ledger Folio:';
  worksheet.getCell('F3').value = item.ledgerFolio;
  worksheet.getCell('E4').value = 'Unit of Issue:';
  worksheet.getCell('F4').value = item.unitOfIssue;

  // Formatting headers
  worksheet.getRow(3).font = { bold: true };
  worksheet.getRow(4).font = { bold: true };

  // Ledger Table Headers
  const headerRow = ['S.No', 'Date', 'Transaction Details / Remarks', 'Voucher No', 'Receipt Qty', 'Issue Qty', 'Balance Qty'];
  worksheet.addRow([]); // Blank row
  worksheet.addRow(headerRow);
  worksheet.getRow(6).font = { bold: true };
  worksheet.getRow(6).alignment = { horizontal: 'center' };

  // Write history records
  history.forEach((tx, idx) => {
    const rowValues = [
      idx + 1,
      new Date(tx.createdAt).toLocaleDateString('en-IN'),
      tx.transactionType === 'seeding' ? 'Initial Seeding' : tx.remarks || `${tx.transactionType.toUpperCase()}`,
      tx.voucherId ? tx.voucherId.voucherNo : 'N/A',
      tx.quantity > 0 ? tx.quantity : '-',
      tx.quantity < 0 ? Math.abs(tx.quantity) : '-',
      tx.closingBalance
    ];
    worksheet.addRow(rowValues);
  });

  // Adjust column widths
  worksheet.columns.forEach((col, idx) => {
    col.width = [10, 15, 35, 20, 15, 15, 15][idx];
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=Ledger-${item.nomenclature.replace(/ /g, '_')}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});
