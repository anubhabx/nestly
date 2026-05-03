import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const role = (req.query.role as string) || '';

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

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

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
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

export const getCurrentUser = async (req: Request & { user?: InstanceType<typeof User> }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const userResponse = req.user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request & { user?: InstanceType<typeof User> }, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    
    // Only allow users to update their own profile, except admins
    if (req.user && req.user._id.toString() !== id && req.user.role !== 'admin') {
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
      { ...req.body, updatedBy: req.user?._id || undefined },
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

export const deleteUser = async (req: Request & { user?: InstanceType<typeof User> }, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;

    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    // Don't allow deleting yourself or admin accounts
    if (id === req.user._id.toString()) {
      throw new AppError('Cannot delete your own account', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Soft delete
    user.deletedAt = new Date();
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
