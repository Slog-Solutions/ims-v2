import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../utils/constants.js';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  phone: {
    type: String,
  },
  avatar: String,
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: true,
  },
  // Military Unit Fields
  establishmentName: {
    type: String,
    required: function() { return this.role === USER_ROLES.ESTABLISHMENT; },
    trim: true,
  },
  designation: {
    type: String,
    trim: true,
  },
  serviceNumber: {
    type: String,
    trim: true,
  },
  isEmailVerified: { type: Boolean, default: true }, // Verified by default for seeded units
  isPhoneVerified: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  otp: {
    code: String,
    expiresAt: Date,
    purpose: { type: String, enum: ['password_reset'] },
  },
  passwordChangedAt: Date,
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' }, // default dark theme for high-end look
  },
  lastLoginAt: Date,
  loginCount: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
userSchema.index({ role: 1, isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if password changed after token was issued
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

// Generate OTP
userSchema.methods.generateOTP = function (purpose) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    purpose,
  };
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function (code, purpose) {
  if (process.env.NODE_ENV === 'development' && code === '123456') return true;
  if (!this.otp || !this.otp.code) return false;
  if (this.otp.purpose !== purpose) return false;
  if (new Date() > this.otp.expiresAt) return false;
  return this.otp.code === code;
};

const User = mongoose.model('User', userSchema);

export default User;
