import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalyticsEventDocument extends Document {
  _id: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  event: 'view' | 'chat' | 'order' | 'signup' | 'login';
  context?: Record<string, any>;
  cohort?: string;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEventDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    event: { type: String, enum: ['view', 'chat', 'order', 'signup', 'login'], required: true },
    context: { type: Schema.Types.Mixed, default: {} },
    cohort: { type: String, default: '' },
  },
  { timestamps: true }
);

analyticsEventSchema.index({ event: 1, createdAt: -1 });
analyticsEventSchema.index({ user: 1, createdAt: -1 });

const AnalyticsEvent = mongoose.model<IAnalyticsEventDocument>('AnalyticsEvent', analyticsEventSchema);
export default AnalyticsEvent;
