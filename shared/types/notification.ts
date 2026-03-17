// Notification types

export type NotificationType =
  | 'order_placed'       // Seller: someone bought your product
  | 'order_paid'         // Seller: payment confirmed
  | 'order_confirmed'    // Buyer: seller confirmed your order
  | 'order_ready'        // Buyer: order ready for pickup/delivery
  | 'order_completed'    // Both: order completed
  | 'order_cancelled'    // Both: order cancelled
  | 'new_message'        // Both: new chat message
  | 'new_review'         // Seller: received a review
  | 'review_reply'       // Buyer: seller replied to your review
  | 'product_sold'       // Seller: product marked as sold
  | 'system';            // System announcements

export interface INotification {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;          // Route to navigate to
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
