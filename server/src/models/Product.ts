import mongoose, { Document, Schema } from 'mongoose';

export interface IProductImage {
  url: string;
  publicId: string;
}

export interface IProductDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  price: number;
  category: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  images: IProductImage[];
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  status: 'active' | 'sold' | 'reserved' | 'draft' | 'removed';
  deliveryOption: 'pickup' | 'delivery' | 'both';
  pickupLocation: string;
  tags: string[];
  stock: number;
  availableFrom?: Date;
  availableUntil?: Date;
  flashSalePrice?: number;
  flashSaleEndsAt?: Date;
  views: number;
  isFeatured: boolean;
  isFlagged: boolean;
  flagReason: string;
  createdAt: Date;
  updatedAt: Date;
}

const productImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new Schema<IProductDocument>(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.5, 'Price must be at least GHS 0.50'],
      max: [100000, 'Price cannot exceed GHS 100,000'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
    images: {
      type: [productImageSchema],
      validate: {
        validator: function (v: IProductImage[]) {
          return v.length <= 5;
        },
        message: 'Maximum 5 images allowed',
      },
      default: [],
    },
    condition: {
      type: String,
      enum: ['new', 'like-new', 'good', 'fair', 'poor'],
      required: [true, 'Product condition is required'],
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'reserved', 'draft', 'removed'],
      default: 'active',
    },
    deliveryOption: {
      type: String,
      enum: ['pickup', 'delivery', 'both'],
      default: 'pickup',
    },
    pickupLocation: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 10;
        },
        message: 'Maximum 10 tags allowed',
      },
    },
    stock: {
      type: Number,
      default: 1,
      min: [0, 'Stock cannot be negative'],
      max: [10000, 'Stock is too high'],
    },
    availableFrom: {
      type: Date,
    },
    availableUntil: {
      type: Date,
    },
    flashSalePrice: {
      type: Number,
      min: [0.5, 'Flash sale price must be at least GHS 0.50'],
    },
    flashSaleEndsAt: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: '',
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

// Indexes for search and filtering
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });

const Product = mongoose.model<IProductDocument>('Product', productSchema);

export default Product;
