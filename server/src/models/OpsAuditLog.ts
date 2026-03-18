import mongoose, { Document, Schema } from 'mongoose';

export interface IOpsAuditLogDocument extends Document {
  _id: mongoose.Types.ObjectId;
  actor?: mongoose.Types.ObjectId;
  action: string;
  scope: string;
  targetId?: string;
  status: 'success' | 'failed';
  details?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const opsAuditLogSchema = new Schema<IOpsAuditLogDocument>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, trim: true },
    scope: { type: String, required: true, trim: true },
    targetId: { type: String, default: '' },
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

opsAuditLogSchema.index({ scope: 1, createdAt: -1 });

const OpsAuditLog = mongoose.model<IOpsAuditLogDocument>('OpsAuditLog', opsAuditLogSchema);
export default OpsAuditLog;
