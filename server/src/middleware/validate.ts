import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError';

/**
 * Middleware to check express-validator results
 */
export const validate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err: any) => err.msg)
      .join(', ');

    return next(ApiError.badRequest(errorMessages));
  }

  next();
};
