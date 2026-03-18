import mongoose, { Document, Schema } from 'mongoose';

export interface ITrustSignalDocument extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: 'identity_verified' | 'safe_meetup' | 'scam_flag';
  scoreDelta: number;
  note?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const trustSignalSchema = new Schema<ITrustSignalDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['identity_verified', 'safe_meetup', 'scam_flag'], required: true },
    scoreDelta: { type: Number, required: true },
    note: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

trustSignalSchema.index({ user: 1, createdAt: -1 });

const TrustSignal = mongoose.model<ITrustSignalDocument>('TrustSignal', trustSignalSchema);
export default TrustSignal;
