import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderDocument extends Document {
  orderNumber: string;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  items: {
    product: mongoose.Types.ObjectId;
    title: string;
    price: number;
    image?: string;
    quantity: number;
  }[];
  totalAmount: number;
  status: string;
  deliveryMethod: string;
  pickupLocation?: string;
  deliveryAddress?: string;
  deliveryFee: number;
  discountAmount: number;
  couponCode?: string;
  note?: string;
  payment?: mongoose.Types.ObjectId;
  cancelReason?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: String,
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(val: any[]) => val.length > 0, 'Order must have at least one item'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'confirmed', 'ready', 'completed', 'cancelled', 'disputed'],
      default: 'pending',
    },
    deliveryMethod: {
      type: String,
      enum: ['pickup', 'delivery'],
      required: true,
    },
    pickupLocation: String,
    deliveryAddress: String,
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    note: String,
    payment: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    cancelReason: String,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// Generate order number before saving
orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `CM-${timestamp}-${random}`;
  }
  next();
});

export default mongoose.model<IOrderDocument>('Order', orderSchema);
