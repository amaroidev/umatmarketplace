import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'order_placed'
  | 'order_paid'
  | 'order_confirmed'
  | 'order_ready'
  | 'order_completed'
  | 'order_cancelled'
  | 'new_message'
  | 'new_review'
  | 'review_reply'
  | 'product_sold'
  | 'system';

export interface INotificationDocument extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'order_placed',
        'order_paid',
        'order_confirmed',
        'order_ready',
        'order_completed',
        'order_cancelled',
        'new_message',
        'new_review',
        'review_reply',
        'product_sold',
        'system',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
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

// Index for fetching user's notifications
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification = mongoose.model<INotificationDocument>('Notification', notificationSchema);

export default Notification;
