import User from '../models/User.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import AuthService from '../services/auth.service.js';
import EmailService from '../services/email.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createActivityLog } from '../utils/helpers.js';
import logger from '../utils/logger.js';

// @desc    Register new user (Admin-only or restricted registration)
// @route   POST /api/v1/auth/register
// @access  Public (in production LAN environment, usually locked down or seeded)
export const register = asyncHandler(async (req, res) => {
  const { password, firstName, lastName, phone, role, establishmentName, designation, serviceNumber } = req.body;
  const email = req.body.email.toLowerCase();

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    phone,
    role,
    establishmentName,
    designation,
    serviceNumber,
    isEmailVerified: true, // Auto-verified for local LAN usage
    isPhoneVerified: true,
  });

  // Generate tokens
  const accessToken = AuthService.generateAccessToken(user._id);
  const refreshToken = await AuthService.createRefreshToken(user._id, req.ip);

  // Set cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json(
    ApiResponse.created(
      {
        user: AuthService.sanitizeUser(user),
        accessToken,
        refreshToken,
      },
      'User registration successful.'
    )
  );
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  logger.info(`[LOGIN REQUEST] logging in: ${email}`);
  
  const emailLower = email ? email.toLowerCase().trim() : '';
  const user = await User.findOne({ email: emailLower }).select('+password');
  
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('Your account has been deactivated');
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Update last login
  user.lastLoginAt = new Date();
  user.loginCount += 1;
  await user.save();

  // Generate tokens
  const accessToken = AuthService.generateAccessToken(user._id);
  const refreshToken = await AuthService.createRefreshToken(user._id, req.ip);

  // Set cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
  });

  // Log activity
  await createActivityLog(user._id, 'login', `User logged in: ${user.email}`, req);

  res.status(200).json(
    ApiResponse.success(
      {
        user: AuthService.sanitizeUser(user),
        accessToken,
        refreshToken,
      },
      'Login successful'
    )
  );
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (token) {
    await AuthService.revokeRefreshToken(token, req.ip);
  }

  // Log activity
  await createActivityLog(req.user._id, 'logout', 'User logged out', req);

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json(ApiResponse.success(null, 'Logged out successfully'));
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    throw ApiError.unauthorized('Refresh token required');
  }

  const result = await AuthService.refreshAccessToken(token, req.ip);

  // Set new cookies
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json(ApiResponse.success(result, 'Token refreshed'));
});

// @desc    Verify email OTP (Legacy helper)
// @route   POST /api/v1/auth/verify-email
// @access  Public
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.isEmailVerified) {
    throw ApiError.badRequest('Email already verified');
  }

  const isValid = user.verifyOTP(otp, 'email_verification');
  if (!isValid) {
    throw ApiError.badRequest('Invalid or expired OTP');
  }

  user.isEmailVerified = true;
  user.otp = undefined;
  await user.save();

  res.status(200).json(ApiResponse.success(null, 'Email verified successfully'));
});

// @desc    Resend verification email (Legacy helper)
// @route   POST /api/v1/auth/resend-verification
// @access  Public
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.isEmailVerified) {
    throw ApiError.badRequest('Email already verified');
  }

  const otp = user.generateOTP('email_verification');
  await user.save();

  try {
    await EmailService.sendVerificationEmail(user, otp);
  } catch (emailError) {
    console.log(`✉️ Local SMTP not configured. Seeded code: ${otp}`);
  }

  res.status(200).json(ApiResponse.success(null, 'Verification code sent'));
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(200).json(
      ApiResponse.success(null, 'If an account exists, a reset code has been sent')
    );
  }

  const otp = user.generateOTP('password_reset');
  await user.save();

  try {
    await EmailService.sendPasswordResetEmail(user, otp);
  } catch (emailError) {
    console.log(`✉️ Local SMTP not configured. Reset code for ${user.email}: ${otp}`);
  }

  res.status(200).json(
    ApiResponse.success(null, 'If an account exists, a reset code has been sent')
  );
});

// @desc    Verify password reset OTP
// @route   POST /api/v1/auth/verify-reset-otp
// @access  Public
export const verifyResetOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isValid = user.verifyOTP(otp, 'password_reset');
  if (!isValid) {
    throw ApiError.badRequest('Invalid or expired OTP');
  }

  res.status(200).json(ApiResponse.success(null, 'OTP verified'));
});

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isValid = user.verifyOTP(otp, 'password_reset');
  if (!isValid) {
    throw ApiError.badRequest('Invalid or expired OTP');
  }

  user.password = password;
  user.otp = undefined;
  await user.save();

  await AuthService.revokeAllUserTokens(user._id, req.ip);
  await createActivityLog(user._id, 'password_change', 'Password reset successful', req);

  res.status(200).json(ApiResponse.success(null, 'Password reset successful'));
});

// @desc    Change password
// @route   POST /api/v1/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  await RefreshToken.updateMany(
    { user: user._id, isRevoked: false },
    { isRevoked: true, revokedAt: new Date(), revokedByIp: req.ip }
  );

  await createActivityLog(user._id, 'password_change', 'Password changed successfully', req);

  res.status(200).json(ApiResponse.success(null, 'Password changed successfully'));
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json(
    ApiResponse.success({ user: AuthService.sanitizeUser(user) })
  );
});
