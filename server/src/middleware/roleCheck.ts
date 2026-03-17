import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';

/**
 * Middleware to check if user has required role(s)
 * Must be used after authenticate middleware
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};

/**
 * Check if user is admin
 */
export const isAdmin = authorize('admin');

/**
 * Check if user is seller or admin
 */
export const isSeller = authorize('seller', 'admin');

/**
 * Check if user is the resource owner or admin
 */
export const isOwnerOrAdmin = (
  getResourceOwnerId: (req: Request) => string
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    const ownerId = getResourceOwnerId(req);
    const isOwner = req.user._id.toString() === ownerId;
    const isAdminUser = req.user.role === 'admin';

    if (!isOwner && !isAdminUser) {
      return next(
        ApiError.forbidden('You are not authorized to perform this action.')
      );
    }

    next();
  };
};
