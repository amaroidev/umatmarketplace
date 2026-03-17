import { Router } from 'express';
import { body } from 'express-validator';
import {
  createDispute,
  getMyDisputes,
  getDispute,
  updateDisputeStatus,
  getAllDisputes,
} from '../controllers/dispute.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// @route   POST /api/disputes
router.post(
  '/',
  authenticate,
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('reason').notEmpty().withMessage('Reason is required'),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    validate,
  ],
  createDispute
);

// @route   GET /api/disputes/my
router.get('/my', authenticate, getMyDisputes);

// @route   GET /api/disputes (admin)
router.get('/', authenticate, authorize('admin'), getAllDisputes);

// @route   GET /api/disputes/:id
router.get('/:id', authenticate, getDispute);

// @route   PATCH /api/disputes/:id/status (admin)
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  [
    body('status')
      .isIn(['open', 'under_review', 'resolved', 'closed'])
      .withMessage('Invalid status'),
    validate,
  ],
  updateDisputeStatus
);

export default router;
