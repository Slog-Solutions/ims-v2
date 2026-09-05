import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import AuthService from '../services/auth.service.js';

// @desc    Update user profile details
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, designation, serviceNumber } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  if (designation !== undefined) user.designation = designation;
  if (serviceNumber !== undefined) user.serviceNumber = serviceNumber;

  await user.save();

  res.status(200).json(
    ApiResponse.success(
      { user: AuthService.sanitizeUser(user) },
      'Profile details updated successfully'
    )
  );
});

// @desc    Get all users (establishments listing)
// @route   GET /api/v1/users
// @access  Private
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true }).select('-password');
  
  res.status(200).json(
    ApiResponse.success({
      users: users.map(u => AuthService.sanitizeUser(u))
    })
  );
});
