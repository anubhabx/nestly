import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

interface JwtPayload {
  id: string;
}

export const protect = async (
  req: Request & { user?: InstanceType<typeof User> },
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Not authorized to access this route', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string | number) as JwtPayload;
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('User account is deactivated', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${(error as Error).message}`);
    next(error);
  }
};

export const optionalAuth = async (
  req: Request & { user?: InstanceType<typeof User> },
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string | number) as JwtPayload;
      req.user = await User.findById(decoded.id);
    }

    next();
  } catch (error) {
    // Token invalid or expired, continue without user
    next();
  }
};
