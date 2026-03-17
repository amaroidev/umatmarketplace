import mongoose from 'mongoose';
import Review, { IReviewDocument } from '../models/Review';
import Order from '../models/Order';
import ApiError from '../utils/ApiError';

class ReviewService {
  /**
   * Create a review for a completed order
   */
  async createReview(
    reviewerId: string,
    orderId: string,
    rating: number,
    comment: string
  ): Promise<IReviewDocument> {
    // Fetch order
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    // Only the buyer can review
    if (order.buyer.toString() !== reviewerId) {
      throw ApiError.forbidden('Only the buyer can leave a review');
    }

    // Must be completed
    if (order.status !== 'completed') {
      throw ApiError.badRequest('You can only review completed orders');
    }

    // Check if already reviewed
    const existing = await Review.findOne({ order: orderId });
    if (existing) {
      throw ApiError.badRequest('You have already reviewed this order');
    }

    const review = await Review.create({
      order: orderId,
      product: order.items[0].product,
      reviewer: reviewerId,
      seller: order.seller,
      rating,
      comment,
    });

    return review.populate([
      { path: 'reviewer', select: 'name avatar' },
      { path: 'seller', select: 'name avatar' },
      { path: 'product', select: 'title images' },
    ]);
  }

  /**
   * Get reviews for a seller (paginated)
   */
  async getSellerReviews(
    sellerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ reviews: IReviewDocument[]; pagination: any }> {
    const skip = (page - 1) * limit;
    const total = await Review.countDocuments({ seller: sellerId });

    const reviews = await Review.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviewer', 'name avatar')
      .populate('product', 'title images');

    return {
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get reviews for a product
   */
  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ reviews: IReviewDocument[]; pagination: any }> {
    const skip = (page - 1) * limit;
    const total = await Review.countDocuments({ product: productId });

    const reviews = await Review.find({ product: productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviewer', 'name avatar');

    return {
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get seller's average rating + distribution
   */
  async getSellerRating(sellerId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }> {
    const stats = await Review.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const distribution = await Review.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      ratingDistribution[d._id] = d.count;
    });

    return {
      averageRating: stats[0]?.averageRating ? Math.round(stats[0].averageRating * 10) / 10 : 0,
      totalReviews: stats[0]?.totalReviews || 0,
      ratingDistribution,
    };
  }

  /**
   * Seller replies to a review
   */
  async replyToReview(
    reviewId: string,
    sellerId: string,
    reply: string
  ): Promise<IReviewDocument> {
    const review = await Review.findById(reviewId);
    if (!review) throw ApiError.notFound('Review not found');

    if (review.seller.toString() !== sellerId) {
      throw ApiError.forbidden('Only the seller can reply to this review');
    }

    if (review.reply) {
      throw ApiError.badRequest('You have already replied to this review');
    }

    review.reply = reply;
    review.repliedAt = new Date();
    await review.save();

    return review.populate([
      { path: 'reviewer', select: 'name avatar' },
      { path: 'product', select: 'title images' },
    ]);
  }

  /**
   * Check if an order has been reviewed
   */
  async hasReviewed(orderId: string): Promise<boolean> {
    const review = await Review.findOne({ order: orderId });
    return !!review;
  }

  /**
   * Get review for a specific order
   */
  async getOrderReview(orderId: string): Promise<IReviewDocument | null> {
    return Review.findOne({ order: orderId })
      .populate('reviewer', 'name avatar')
      .populate('seller', 'name avatar')
      .populate('product', 'title images');
  }
}

export default new ReviewService();
