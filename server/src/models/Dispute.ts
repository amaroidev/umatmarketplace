import mongoose, { Document, Schema } from 'mongoose';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed';
export type DisputeReason =
  | 'item_not_received'
  | 'item_not_as_described'
  | 'wrong_item'
  | 'damaged_item'
  | 'seller_unresponsive'
  | 'fraud'
  | 'other';

export interface IDisputeDocument extends Document {
  order: mongoose.Types.ObjectId;
  raisedBy: mongoose.Types.ObjectId;
  against: mongoose.Types.ObjectId;
  reason: DisputeReason;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  adminNote?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const disputeSchema = new Schema<IDisputeDocument>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    raisedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    against: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'item_not_received',
        'item_not_as_described',
        'wrong_item',
        'damaged_item',
        'seller_unresponsive',
        'fraud',
        'other',
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    evidence: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'closed'],
      default: 'open',
    },
    adminNote: String,
    resolvedAt: Date,
  },
  { timestamps: true }
);

disputeSchema.index({ order: 1 });
disputeSchema.index({ raisedBy: 1, createdAt: -1 });
disputeSchema.index({ status: 1 });

export default mongoose.model<IDisputeDocument>('Dispute', disputeSchema);
