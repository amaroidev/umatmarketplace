import { Request, Response, NextFunction } from 'express';
import reviewService from '../services/review.service';
import ApiError from '../utils/ApiError';
import Order from '../models/Order';

/**
 * @route   POST /api/reviews
 * @desc    Create a review for a completed order
 * @access  Private
 */
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const review = await reviewService.createReview(
      req.user!._id.toString(),
      req.body.orderId,
      req.body.rating,
      req.body.comment
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/seller/:sellerId
 * @desc    Get reviews for a seller (paginated)
 * @access  Public
 */
export const getSellerReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = req.query;
    const result = await reviewService.getSellerReviews(
      req.params.sellerId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );

    res.status(200).json({
      success: true,
      data: { reviews: result.reviews },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/product/:productId
 * @desc    Get reviews for a product (paginated)
 * @access  Public
 */
export const getProductReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = req.query;
    const result = await reviewService.getProductReviews(
      req.params.productId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );

    res.status(200).json({
      success: true,
      data: { reviews: result.reviews },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/seller/:sellerId/rating
 * @desc    Get seller's average rating and distribution
 * @access  Public
 */
export const getSellerRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rating = await reviewService.getSellerRating(req.params.sellerId);

    res.status(200).json({
      success: true,
      data: { rating },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/reviews/:id/reply
 * @desc    Seller replies to a review
 * @access  Private (seller)
 */
export const replyToReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const review = await reviewService.replyToReview(
      req.params.id,
      req.user!._id.toString(),
      req.body.reply
    );

    res.status(200).json({
      success: true,
      message: 'Reply submitted successfully',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/order/:orderId
 * @desc    Check if an order has been reviewed and get the review
 * @access  Private (buyer or seller)
 */
export const getOrderReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.orderId).select('buyer seller');
    if (!order) throw ApiError.notFound('Order not found');

    const userId = req.user!._id.toString();
    const isOwner =
      order.buyer.toString() === userId ||
      order.seller.toString() === userId ||
      req.user!.role === 'admin';

    if (!isOwner) throw ApiError.forbidden('Not authorized to view this order review');

    const review = await reviewService.getOrderReview(req.params.orderId);

    res.status(200).json({
      success: true,
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/order/:orderId/has-reviewed
 * @desc    Check if an order has been reviewed
 * @access  Private (buyer)
 */
export const hasReviewed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.orderId).select('buyer');
    if (!order) throw ApiError.notFound('Order not found');

    if (
      order.buyer.toString() !== req.user!._id.toString() &&
      req.user!.role !== 'admin'
    ) {
      throw ApiError.forbidden('Only the buyer can check review status for this order');
    }

    const hasReviewed = await reviewService.hasReviewed(req.params.orderId);

    res.status(200).json({
      success: true,
      data: { hasReviewed },
    });
  } catch (error) {
    next(error);
  }
};
