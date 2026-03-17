import mongoose, { Document, Schema } from 'mongoose';

export interface IReviewDocument extends Document {
  _id: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  reply?: string;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReviewDocument>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [5, 'Comment must be at least 5 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    reply: {
      type: String,
      trim: true,
      maxlength: [1000, 'Reply cannot exceed 1000 characters'],
    },
    repliedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// One review per order
reviewSchema.index({ order: 1 }, { unique: true });
// Lookup reviews by seller or product
reviewSchema.index({ seller: 1, createdAt: -1 });
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1 });

const Review = mongoose.model<IReviewDocument>('Review', reviewSchema);

export default Review;
