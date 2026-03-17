import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'buyer' | 'seller' | 'admin';
  avatar: string;
  studentId: string;
  isVerified: boolean;
  isBanned: boolean;
  location: string;
  bio: string;
  savedItems: mongoose.Types.ObjectId[];
  notificationPrefs: {
    orderUpdates: boolean;
    messages: boolean;
    reviews: boolean;
    promotions: boolean;
    systemAlerts: boolean;
  };
  privacyPrefs: {
    showPhone: boolean;
    showLocation: boolean;
    allowMessages: boolean;
    showOnlineStatus: boolean;
  };
  pushSubscriptions?: {
    kind?: 'web' | 'expo';
    endpoint?: string;
    keys?: {
      p256dh: string;
      auth: string;
    };
    expoPushToken?: string;
    platform?: string;
    deviceId?: string;
  }[];
  responseTimeMinutes: number;
  storeName?: string;
  brandName?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer',
    },
    avatar: {
      type: String,
      default: '',
    },
    studentId: {
      type: String,
      default: '',
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    savedItems: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    notificationPrefs: {
      orderUpdates: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
      systemAlerts: { type: Boolean, default: true },
    },
    privacyPrefs: {
      showPhone: { type: Boolean, default: false },
      showLocation: { type: Boolean, default: true },
      allowMessages: { type: Boolean, default: true },
      showOnlineStatus: { type: Boolean, default: true },
    },
    pushSubscriptions: [
      {
        kind: {
          type: String,
          enum: ['web', 'expo'],
          default: 'web',
        },
        endpoint: String,
        keys: {
          p256dh: String,
          auth: String,
        },
        expoPushToken: String,
        platform: String,
        deviceId: String,
      }
    ],
    responseTimeMinutes: {
      type: Number,
      default: 15,
      min: 1,
    },
    storeName: {
      type: String,
      default: '',
      trim: true,
      maxlength: [80, 'Store name cannot exceed 80 characters'],
    },
    brandName: {
      type: String,
      default: '',
      trim: true,
      maxlength: [80, 'Brand name cannot exceed 80 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index for search
userSchema.index({ name: 'text', email: 'text' });

const User = mongoose.model<IUserDocument>('User', userSchema);

export default User;
