import { Router } from 'express';
import {
  createReview,
  getSellerReviews,
  getProductReviews,
  getSellerRating,
  replyToReview,
  getOrderReview,
  hasReviewed,
} from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';
import { isSeller } from '../middleware/roleCheck';

const router = Router();

// Public review routes
router.get('/seller/:sellerId', getSellerReviews);
router.get('/product/:productId', getProductReviews);
router.get('/seller/:sellerId/rating', getSellerRating);

// Protected review routes
router.post('/', authenticate, createReview);
router.get('/order/:orderId', authenticate, getOrderReview);
router.get('/order/:orderId/has-reviewed', authenticate, hasReviewed);
router.post('/:id/reply', authenticate, isSeller, replyToReview);

export default router;
