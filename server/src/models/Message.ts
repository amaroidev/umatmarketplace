import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageDocument extends Document {
  _id: mongoose.Types.ObjectId;
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'system';
  offer?: {
    amount: number;
    status: 'pending' | 'accepted' | 'rejected' | 'countered';
  };
  quickReplyLabel?: string;
  attachments?: { url: string; mimeType?: string; name?: string }[];
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessageDocument>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation is required'],
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'image', 'system'],
      default: 'text',
    },
    offer: {
      amount: { type: Number },
      status: { type: String, enum: ['pending', 'accepted', 'rejected', 'countered'] },
    },
    quickReplyLabel: { type: String, default: '' },
    attachments: [
      {
        url: { type: String, required: true },
        mimeType: { type: String, default: '' },
        name: { type: String, default: '' },
      },
    ],
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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

// Indexes for efficient queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model<IMessageDocument>('Message', messageSchema);

export default Message;
