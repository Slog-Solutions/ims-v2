import Item from '../models/Item.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { USER_ROLES } from '../utils/constants.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

/**
 * Upload all files in req.files array to Cloudinary
 * Returns array of { url, publicId }
 */
const uploadFiles = async (files, folder = 'nomenclature-items') => {
  if (!files || files.length === 0) return [];
  return Promise.all(
    files.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer, folder);
      return { url: result.secure_url, publicId: result.public_id };
    })
  );
};

// @desc    Create new Nomenclature Item
// @route   POST /api/v1/items
// @access  Private (Master Only)
export const createItem = asyncHandler(async (req, res) => {
  if (req.user.role !== USER_ROLES.MASTER) {
    throw ApiError.forbidden('Only Master HQ can create nomenclature items');
  }

  const { nomenclature, unitOfIssue, ledgerFolio, description, minStockLevel } = req.body;

  // Check duplicates
  const existingNomenclature = await Item.findOne({ nomenclature });
  if (existingNomenclature) {
    throw ApiError.conflict('An item with this nomenclature already exists');
  }
  const existingFolio = await Item.findOne({ ledgerFolio });
  if (existingFolio) {
    throw ApiError.conflict('An item with this ledger folio already exists');
  }

  // Upload all images (req.files is an array from uploadMultipleImages middleware)
  const images = await uploadFiles(req.files);

  const item = await Item.create({
    nomenclature,
    unitOfIssue,
    ledgerFolio,
    description,
    minStockLevel,
    images,
  });

  res.status(201).json(ApiResponse.created(item, 'Nomenclature item created successfully'));
});

// @desc    Get all Nomenclature Items
// @route   GET /api/v1/items
// @access  Private
export const getItems = asyncHandler(async (req, res) => {
  const { search, limit = 100, page = 1 } = req.query;

  const query = { isActive: true };

  if (search) {
    query.$or = [
      { nomenclature: { $regex: search, $options: 'i' } },
      { ledgerFolio: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const items = await Item.find(query)
    .sort({ nomenclature: 1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Item.countDocuments(query);

  res.status(200).json(
    ApiResponse.success({
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// @desc    Get single item details
// @route   GET /api/v1/items/:id
// @access  Private
export const getItemById = asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, isActive: true });
  if (!item) throw ApiError.notFound('Item not found');
  res.status(200).json(ApiResponse.success(item));
});

// @desc    Update nomenclature details (adds new images; does NOT delete existing ones unless removeImageIds is sent)
// @route   PUT /api/v1/items/:id
// @access  Private (Master Only)
export const updateItem = asyncHandler(async (req, res) => {
  if (req.user.role !== USER_ROLES.MASTER) {
    throw ApiError.forbidden('Only Master HQ can modify nomenclature items');
  }

  const { nomenclature, unitOfIssue, ledgerFolio, description, minStockLevel, removeImageIds } = req.body;

  const item = await Item.findById(req.params.id);
  if (!item) throw ApiError.notFound('Item not found');

  if (nomenclature && nomenclature !== item.nomenclature) {
    const existing = await Item.findOne({ nomenclature });
    if (existing) throw ApiError.conflict('An item with this nomenclature already exists');
    item.nomenclature = nomenclature;
  }
  if (ledgerFolio && ledgerFolio !== item.ledgerFolio) {
    const existing = await Item.findOne({ ledgerFolio });
    if (existing) throw ApiError.conflict('An item with this ledger folio already exists');
    item.ledgerFolio = ledgerFolio;
  }
  if (unitOfIssue) item.unitOfIssue = unitOfIssue;
  if (description !== undefined) item.description = description;
  if (minStockLevel !== undefined) item.minStockLevel = minStockLevel;

  // Remove images by publicId if requested
  if (removeImageIds) {
    const toRemove = Array.isArray(removeImageIds) ? removeImageIds : [removeImageIds];
    await Promise.all(toRemove.map((pid) => deleteFromCloudinary(pid)));
    item.images = item.images.filter((img) => !toRemove.includes(img.publicId));
  }

  // Upload new images and append (capped at 5 total)
  if (req.files && req.files.length > 0) {
    const slots = 5 - item.images.length;
    if (slots <= 0) {
      throw ApiError.badRequest('Maximum 5 images reached. Remove some before adding new ones.');
    }
    const newImages = await uploadFiles(req.files.slice(0, slots));
    item.images = [...item.images, ...newImages];
  }

  await item.save();
  res.status(200).json(ApiResponse.success(item, 'Item updated successfully'));
});

// @desc    Soft-delete Nomenclature Item (also removes all Cloudinary images)
// @route   DELETE /api/v1/items/:id
// @access  Private (Master Only)
export const deleteItem = asyncHandler(async (req, res) => {
  if (req.user.role !== USER_ROLES.MASTER) {
    throw ApiError.forbidden('Only Master HQ can remove nomenclature items');
  }

  const item = await Item.findById(req.params.id);
  if (!item) throw ApiError.notFound('Item not found');

  // Delete all Cloudinary images
  if (item.images && item.images.length > 0) {
    await Promise.all(item.images.map((img) => deleteFromCloudinary(img.publicId)));
    item.images = [];
  }

  item.isActive = false;
  await item.save();

  res.status(200).json(ApiResponse.success(null, 'Item deleted successfully'));
});
