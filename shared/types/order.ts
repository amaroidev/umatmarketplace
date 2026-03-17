// Order & Payment types for the marketplace

export type OrderStatus =
  | 'pending'      // Order created, awaiting payment
  | 'paid'         // Payment confirmed
  | 'confirmed'    // Seller confirmed the order
  | 'ready'        // Ready for pickup / out for delivery
  | 'completed'    // Buyer received the item
  | 'cancelled'    // Cancelled by buyer or seller
  | 'disputed';    // Dispute raised

export type PaymentMethod = 'momo_mtn' | 'momo_vodafone' | 'momo_airteltigo' | 'card' | 'bank_transfer';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export type DeliveryMethod = 'pickup' | 'delivery';

export interface IOrderItem {
  product: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
}

export interface IOrderItemPopulated extends Omit<IOrderItem, 'product'> {
  product: {
    _id: string;
    title: string;
    price: number;
    images: { url: string; publicId: string }[];
    status: string;
    seller: string;
  };
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  buyer: string;
  seller: string;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  pickupLocation?: string;
  deliveryAddress?: string;
  deliveryFee: number;
  note?: string;
  payment?: string; // Transaction ref
  cancelReason?: string;
  cancelledBy?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IOrderPopulated extends Omit<IOrder, 'buyer' | 'seller' | 'payment'> {
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
    avatar?: string;
    phone: string;
    isVerified: boolean;
  };
  payment?: ITransaction;
}

export interface ITransaction {
  _id: string;
  order: string;
  reference: string;         // Paystack reference
  amount: number;            // Amount in GHS
  currency: string;          // GHS
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paystackResponse?: Record<string, any>;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Payloads

export interface ICreateOrderPayload {
  productId: string;
  quantity?: number;
  deliveryMethod: DeliveryMethod;
  pickupLocation?: string;
  deliveryAddress?: string;
  note?: string;
}

export interface IInitiatePaymentPayload {
  orderId: string;
  paymentMethod: PaymentMethod;
  callbackUrl: string;
}

// Constants
export const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'paid', 'confirmed', 'ready', 'completed', 'cancelled', 'disputed',
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'momo_mtn', label: 'MTN Mobile Money' },
  { value: 'momo_vodafone', label: 'Vodafone Cash' },
  { value: 'momo_airteltigo', label: 'AirtelTigo Money' },
  { value: 'card', label: 'Debit/Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

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
  paid: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  ready: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  disputed: 'bg-orange-100 text-orange-700',
};
