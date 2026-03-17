import api from './api';
import { PaginationInfo, ReviewPopulated, SellerRating } from '../types';

export interface CreateReviewData {
  orderId: string;
  rating: number;
  comment: string;
}

interface ReviewResponse {
  success: boolean;
  message?: string;
  data: { review: ReviewPopulated | null };
}

interface ReviewListResponse {
  success: boolean;
  data: { reviews: ReviewPopulated[] };
  pagination: PaginationInfo;
}

interface SellerRatingResponse {
  success: boolean;
  data: { rating: SellerRating };
}

interface HasReviewedResponse {
  success: boolean;
  data: { hasReviewed: boolean };
}

const reviewService = {
  createReview: async (data: CreateReviewData): Promise<ReviewResponse> => {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  getSellerReviews: async (
    sellerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ReviewListResponse> => {
    const response = await api.get(`/reviews/seller/${sellerId}`, { params: { page, limit } });
    return response.data;
  },

  getProductReviews: async (
    productId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ReviewListResponse> => {
    const response = await api.get(`/reviews/product/${productId}`, { params: { page, limit } });
    return response.data;
  },

  getSellerRating: async (sellerId: string): Promise<SellerRatingResponse> => {
    const response = await api.get(`/reviews/seller/${sellerId}/rating`);
    return response.data;
  },

  replyToReview: async (reviewId: string, reply: string): Promise<ReviewResponse> => {
    const response = await api.post(`/reviews/${reviewId}/reply`, { reply });
    return response.data;
  },

  getOrderReview: async (orderId: string): Promise<ReviewResponse> => {
    const response = await api.get(`/reviews/order/${orderId}`);
    return response.data;
  },

  hasReviewed: async (orderId: string): Promise<HasReviewedResponse> => {
    const response = await api.get(`/reviews/order/${orderId}/has-reviewed`);
    return response.data;
  },
};

export default reviewService;
