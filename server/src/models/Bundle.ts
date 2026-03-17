import mongoose, { Document, Schema } from 'mongoose';

export interface IBundleDocument extends Document {
  seller: mongoose.Types.ObjectId;
  name: string;
  productIds: mongoose.Types.ObjectId[];
  discountPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bundleSchema = new Schema<IBundleDocument>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    productIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 90,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

bundleSchema.index({ seller: 1, isActive: 1 });

export default mongoose.model<IBundleDocument>('Bundle', bundleSchema);
