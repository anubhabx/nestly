import { User } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { validate } from '../middleware/validation.js';
import { body, param } from 'express-validator';

// Update user validation
const updateUserValidation = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]{10,}$/)
    .withMessage('Please provide a valid phone number'),
  validate,
];

export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';

    // Build query
    const query = {
      $or: [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ],
    };

    if (role) {
      query.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    
    // Only allow users to update their own profile, except admins
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      throw new AppError('Not authorized to update this user', 403);
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent changing email to one that's already taken by another user
    const { email } = req.body;
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError('Email already in use', 409);
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    ).select('-password');

    logger.info(`User ${id} updated`);

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const id = req.params.id;

    // Don't allow deleting yourself or admin accounts
    if (id === req.user._id.toString()) {
      throw new AppError('Cannot delete your own account', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Soft delete
    user.deletedAt = Date.now();
    user.isActive = false;
    await user.save();

    logger.info(`User ${id} soft deleted by admin`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const userValidators = {
  update: updateUserValidation,
};
