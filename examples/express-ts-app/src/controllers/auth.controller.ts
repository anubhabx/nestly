import { Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { body } from 'express-validator';

interface JwtPayload {
  id: string;
}

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRATION || '1h',
  });
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET as string;
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
    });

    // Generate tokens
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Hide password in response
    const userResponse = user.toObject();
    delete userResponse.password;

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRATION || '1h',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Rate limiting
    try {
      await loginLimiter.consume(req.ip);
    } catch (rateLimitError) {
      throw new AppError('Too many login attempts, please try again later', 429);
    }

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      // Increment failed login attempts
      if (user) {
        user.loginAttempts += 1;
        
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        }
        
        await user.save({ validateBeforeSave: false });
      }

      throw new AppError('Invalid email or password', 401);
    }

    // Check if account is locked
    if (await user.isLocked()) {
      throw new AppError('Account is temporarily locked due to too many failed attempts', 403);
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Hide password in response
    const userResponse = user.toObject();
    delete userResponse.password;

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: userResponse,
        token,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRATION || '1h',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newToken = generateToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRATION || '1h',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request & { user?: User }, res: Response, next: NextFunction) => {
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
