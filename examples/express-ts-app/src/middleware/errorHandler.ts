import { Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

interface ErrorObject extends Error {
  name?: string | undefined;
  code?: number;
  errors?: any;
}

export const errorHandler = (err: ErrorObject, _req: any, res: Response, _next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log error to console (and external logging service in production)
  logger.error(`Server Error: ${err.message}\n${err.stack}`);

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && err.code === 11000) {
    error = new AppError('Duplicate field value entered', 400);
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    error = new AppError('Resource not found', 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    error = new AppError(messages.join(', '), 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  const statusCode = (error as AppError).statusCode || 500;
  const status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';

  res.status(statusCode).json({
    success: false,
    status,
    message: (error as AppError).message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
