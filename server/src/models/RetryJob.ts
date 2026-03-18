import mongoose, { Document, Schema } from 'mongoose';

export interface IRetryJobDocument extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'import' | 'notification' | 'payment' | 'moderation';
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  runAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const retryJobSchema = new Schema<IRetryJobDocument>(
  {
    type: { type: String, enum: ['import', 'notification', 'payment', 'moderation'], required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastError: { type: String, default: '' },
    runAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

retryJobSchema.index({ status: 1, runAt: 1 });

const RetryJob = mongoose.model<IRetryJobDocument>('RetryJob', retryJobSchema);
export default RetryJob;
