import mongoose, { Document, Schema } from 'mongoose';

export interface ICouponDocument extends Document {
  code: string;
  seller: mongoose.Types.ObjectId;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  startsAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICouponDocument>(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: 100,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startsAt: Date,
    expiresAt: Date,
  },
  { timestamps: true }
);

couponSchema.index({ code: 1, seller: 1 }, { unique: true });

export default mongoose.model<ICouponDocument>('Coupon', couponSchema);
