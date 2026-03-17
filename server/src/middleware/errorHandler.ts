import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import ApiError from '../utils/ApiError';
import env from '../config/env';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    isOperational = true;
  }

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    isOperational = true;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'CSV file is too large. Maximum size is 2MB.';
    } else {
      message = err.message;
    }
  }

  if (err.message.includes('Invalid file type. Only CSV files are allowed.')) {
    statusCode = 400;
    message = err.message;
    isOperational = true;
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    statusCode = 409;
    const field = Object.keys((err as any).keyValue || {})[0];
    message = `An account with this ${field || 'value'} already exists.`;
    isOperational = true;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format.';
    isOperational = true;
  }

  // Log error in development
  if (env.NODE_ENV === 'development') {
    console.error('Error:', {
      statusCode,
      message: err.message,
      stack: err.stack,
    });
  } else if (!isOperational) {
    // Log unexpected errors in production
    console.error('Unexpected Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};
