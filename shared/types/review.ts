// Review types

export interface IReview {
  _id: string;
  order: string;
  product: string;
  reviewer: string;       // buyer who left the review
  seller: string;         // seller being reviewed
  rating: number;         // 1-5
  comment: string;
  reply?: string;         // seller's reply
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IReviewPopulated extends Omit<IReview, 'reviewer' | 'seller' | 'product'> {
  reviewer: {
    _id: string;
    name: string;
    avatar?: string;
  };
  seller: {
    _id: string;
    name: string;
    avatar?: string;
  };
  product: {
    _id: string;
    title: string;
    images: { url: string; publicId: string }[];
  };
}

export interface ICreateReviewPayload {
  orderId: string;
  rating: number;
  comment: string;
}

export interface ISellerRating {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>; // { 1: count, 2: count, ... 5: count }
}
