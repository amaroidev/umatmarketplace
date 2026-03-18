import mongoose, { Document, Schema } from 'mongoose';

export interface IPromotionCampaignDocument extends Document {
  _id: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  name: string;
  targetType: 'all' | 'category' | 'product';
  targetCategory?: mongoose.Types.ObjectId;
  targetProductIds?: mongoose.Types.ObjectId[];
  couponCode?: string;
  featuredBoost?: boolean;
  abSlot?: 'A' | 'B';
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const promotionCampaignSchema = new Schema<IPromotionCampaignDocument>(
  {
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    targetType: { type: String, enum: ['all', 'category', 'product'], default: 'all' },
    targetCategory: { type: Schema.Types.ObjectId, ref: 'Category' },
    targetProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    couponCode: { type: String, trim: true, uppercase: true, default: '' },
    featuredBoost: { type: Boolean, default: false },
    abSlot: { type: String, enum: ['A', 'B'] },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

promotionCampaignSchema.index({ seller: 1, startsAt: -1 });

const PromotionCampaign = mongoose.model<IPromotionCampaignDocument>('PromotionCampaign', promotionCampaignSchema);
export default PromotionCampaign;
