export interface User {
  _id: string;
  name: string;
  storeName?: string;
  brandName?: string;
  email: string;
  phone: string;
  role: 'buyer' | 'seller' | 'admin';
  avatar?: string;
  studentId?: string;
  isVerified: boolean;
  isBanned: boolean;
  location?: string;
  bio?: string;
  responseTimeMinutes?: number;
  sellerOnboarding?: {
    completed: boolean;
    payoutSetupComplete: boolean;
    payoutMethod?: 'momo' | 'bank';
    payoutProvider?: string;
    payoutAccountName?: string;
    payoutAccountNumber?: string;
    identityStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
    identityDocumentUrl?: string;
    identitySubmittedAt?: string;
    completedAt?: string;
  };
  savedItems: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isActive: boolean;
}

// Product types
export interface ProductImage {
  url: string;
  publicId: string;
}

export type ProductCondition = 'new' | 'like-new' | 'good' | 'fair' | 'poor';
export type ProductStatus = 'active' | 'sold' | 'reserved' | 'draft' | 'removed';
export type DeliveryOption = 'pickup' | 'delivery' | 'both';

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: Category | string;
  seller: Pick<User, '_id' | 'name' | 'storeName' | 'brandName' | 'avatar' | 'isVerified' | 'location'> | string;
  images: ProductImage[];
  condition: ProductCondition;
  status: ProductStatus;
  deliveryOption: DeliveryOption;
  pickupLocation: string;
  tags: string[];
  stock: number;
  availableFrom?: string;
  availableUntil?: string;
  flashSalePrice?: number;
  flashSaleEndsAt?: string;
  views: number;
  isFeatured: boolean;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Product with populated references
export interface ProductPopulated extends Omit<Product, 'category' | 'seller'> {
  category: Category;
  seller: Pick<User, '_id' | 'name' | 'storeName' | 'brandName' | 'avatar' | 'isVerified' | 'location'>;
}

export interface ProductFilters {
  category?: string;
  condition?: ProductCondition;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  seller?: string;
  search?: string;
  deliveryOption?: DeliveryOption;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationInfo;
}

// Order & Payment types
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'confirmed'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type PaymentMethod = 'momo_mtn' | 'momo_vodafone' | 'momo_airteltigo' | 'card' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type DeliveryMethod = 'pickup' | 'delivery';

export interface OrderItem {
  product: string | {
    _id: string;
    title: string;
    price: number;
    images: ProductImage[];
    status: string;
    seller: string;
  };
  title: string;
  price: number;
  image?: string;
  quantity: number;
}

export interface Transaction {
  _id: string;
  order: string;
  reference: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paystackResponse?: Record<string, any>;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  buyer: string | Pick<User, '_id' | 'name' | 'avatar' | 'phone' | 'email'>;
  seller: string | Pick<User, '_id' | 'name' | 'avatar' | 'phone' | 'isVerified'>;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  pickupLocation?: string;
  deliveryAddress?: string;
  deliveryFee: number;
  note?: string;
  payment?: Transaction;
  cancelReason?: string;
  cancelledBy?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPopulated extends Omit<Order, 'buyer' | 'seller'> {
  buyer: {
    _id: string;
    name: string;
    avatar?: string;
    phone: string;
    email: string;
  };
  seller: {
    _id: string;
    name: string;
    storeName?: string;
    brandName?: string;
    avatar?: string;
    phone: string;
    isVerified: boolean;
  };
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending Payment',
  paid: 'Paid',
  confirmed: 'Confirmed',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-moss-100 text-moss-700',
  confirmed: 'bg-earth-200 text-earth-700',
  ready: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  disputed: 'bg-orange-100 text-orange-700',
};

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'momo_mtn', label: 'MTN Mobile Money', icon: '📱' },
  { value: 'momo_vodafone', label: 'Vodafone Cash', icon: '📱' },
  { value: 'momo_airteltigo', label: 'AirtelTigo Money', icon: '📱' },
  { value: 'card', label: 'Debit/Credit Card', icon: '💳' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
];

// Message / Chat types
export type MessageType = 'text' | 'image' | 'system';

export interface Message {
  _id: string;
  conversation: string;
  sender: string | { _id: string; name: string; avatar?: string };
  content: string;
  type: MessageType;
  offer?: {
    amount: number;
    status: 'pending' | 'accepted' | 'rejected' | 'countered';
  };
  quickReplyLabel?: string;
  attachments?: { url: string; mimeType?: string; name?: string }[];
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MessagePopulated extends Omit<Message, 'sender'> {
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

export interface Conversation {
  _id: string;
  participants: {
    _id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
  }[];
  product?: {
    _id: string;
    title: string;
    price: number;
    images: ProductImage[];
    status: string;
  };
  lastMessage?: {
    _id: string;
    content: string;
    sender: string;
    type: MessageType;
    createdAt: string;
  };
  unreadCount?: number;
  updatedAt: string;
  createdAt: string;
}

// Review types
export interface Review {
  _id: string;
  order: string;
  product: string;
  reviewer: string;
  seller: string;
  rating: number;
  comment: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPopulated extends Omit<Review, 'reviewer' | 'seller' | 'product'> {
  reviewer: {
    _id: string;
    name: string;
    avatar?: string;
  };
  seller: {
    _id: string;
    name: string;
    avatar?: string;
  };
  product: {
    _id: string;
    title: string;
    images: ProductImage[];
  };
}

export interface SellerRating {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

// Notification types
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

export interface NotificationItem {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  order_placed: 'New Order',
  order_paid: 'Payment Received',
  order_confirmed: 'Order Confirmed',
  order_ready: 'Order Ready',
  order_completed: 'Order Completed',
  order_cancelled: 'Order Cancelled',
  new_message: 'New Message',
  new_review: 'New Review',
  review_reply: 'Review Reply',
  product_sold: 'Product Sold',
  system: 'System',
};
