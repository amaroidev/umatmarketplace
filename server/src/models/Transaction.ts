import mongoose, { Document, Schema } from 'mongoose';

export interface ITransactionDocument extends Document {
  order: mongoose.Types.ObjectId;
  reference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  paystackResponse?: Record<string, any>;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransactionDocument>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'GHS',
    },
    paymentMethod: {
      type: String,
      enum: ['momo_mtn', 'momo_vodafone', 'momo_airteltigo', 'card', 'bank_transfer'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    paystackResponse: {
      type: Schema.Types.Mixed,
    },
    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ order: 1 });
transactionSchema.index({ status: 1 });

export default mongoose.model<ITransactionDocument>('Transaction', transactionSchema);
