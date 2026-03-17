import Order from '../models/Order';
import Transaction from '../models/Transaction';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import {
  initializeTransaction,
  verifyTransaction,
  getPaystackChannels,
  generateReference,
} from '../utils/paystack';
import { emailService } from './email.service';

class PaymentService {
  /**
   * Initiate a payment for an order
   */
  async initiatePayment(
    orderId: string,
    userId: string,
    paymentMethod: string,
    callbackUrl: string
  ): Promise<{ authorizationUrl: string; reference: string }> {
    // Fetch order
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    if (order.buyer.toString() !== userId) {
      throw ApiError.forbidden('Only the buyer can pay for this order');
    }

    if (order.status !== 'pending') {
      throw ApiError.badRequest('This order has already been paid or is no longer payable');
    }

    // Get buyer email
    const buyer = await User.findById(userId).select('email');
    if (!buyer) throw ApiError.notFound('User not found');

    // Generate reference
    const reference = generateReference();

    // Get Paystack channels based on payment method
    const channels = getPaystackChannels(paymentMethod);

    // Create transaction record
    const transaction = await Transaction.create({
      order: order._id,
      reference,
      amount: order.totalAmount,
      currency: 'GHS',
      paymentMethod,
      status: 'pending',
    });

    // Link transaction to order
    order.payment = transaction._id;
    await order.save();

    // Initialize with Paystack
    try {
      const paystackRes = await initializeTransaction(
        buyer.email,
        order.totalAmount,
        reference,
        callbackUrl,
        {
          order_id: order._id.toString(),
          order_number: order.orderNumber,
          buyer_id: userId,
        },
        channels
      );

      return {
        authorizationUrl: paystackRes.data.authorization_url,
        reference: paystackRes.data.reference,
      };
    } catch (error: any) {
      // Mark transaction as failed
      transaction.status = 'failed';
      await transaction.save();

      throw ApiError.internal(
        `Payment initialization failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Verify a payment after Paystack callback
   */
  async verifyPayment(reference: string): Promise<{
    verified: boolean;
    order: any;
    transaction: any;
  }> {
    // Find transaction
    const transaction = await Transaction.findOne({ reference });
    if (!transaction) throw ApiError.notFound('Transaction not found');

    // Already verified
    if (transaction.status === 'success') {
      const order = await Order.findById(transaction.order)
        .populate('buyer', 'name avatar phone email')
        .populate('seller', 'name avatar phone isVerified')
        .populate('items.product', 'title price images status seller')
        .populate('payment');
      return { verified: true, order, transaction };
    }

    // Verify with Paystack
    try {
      const paystackRes = await verifyTransaction(reference);

      transaction.paystackResponse = paystackRes.data;

      if (paystackRes.data.status === 'success') {
        // Verify amount matches (pesewas -> GHS)
        const paidAmountGHS = paystackRes.data.amount / 100;
        if (paidAmountGHS < transaction.amount) {
          transaction.status = 'failed';
          await transaction.save();
          throw ApiError.badRequest('Payment amount mismatch');
        }

        transaction.status = 'success';
        transaction.paidAt = new Date(paystackRes.data.paid_at);
        await transaction.save();

        // Update order status to paid
        const order = await Order.findById(transaction.order);
        if (order && order.status === 'pending') {
          order.status = 'paid';
          await order.save();
        }

        const populatedOrder = await Order.findById(transaction.order)
          .populate('buyer', 'name avatar phone email')
          .populate('seller', 'name avatar phone isVerified')
          .populate('items.product', 'title price images status seller')
          .populate('payment');

        if (populatedOrder && populatedOrder.buyer && (populatedOrder.buyer as any).email) {
          emailService.sendPaymentReceiptEmail(
            (populatedOrder.buyer as any).email,
            populatedOrder.orderNumber,
            transaction.amount
          ).catch(console.error);
        }

        return { verified: true, order: populatedOrder, transaction };
      } else {
        transaction.status = 'failed';
        await transaction.save();
        return { verified: false, order: null, transaction };
      }
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Payment verification failed: ${error.message}`);
    }
  }

  /**
   * Handle Paystack webhook event
   */
  async handleWebhook(event: string, data: Record<string, any>): Promise<void> {
    if (event === 'charge.success') {
      const reference = data.reference;
      if (!reference) return;

      const transaction = await Transaction.findOne({ reference });
      if (!transaction) return;

      // Already processed
      if (transaction.status === 'success') return;

      transaction.status = 'success';
      transaction.paystackResponse = data;
      transaction.paidAt = new Date(data.paid_at);
      await transaction.save();

      // Update order
      const order = await Order.findById(transaction.order).populate('buyer', 'email');
      if (order && order.status === 'pending') {
        order.status = 'paid';
        await order.save();
        
        if (order.buyer && (order.buyer as any).email) {
          emailService.sendPaymentReceiptEmail(
            (order.buyer as any).email,
            order.orderNumber,
            transaction.amount
          ).catch(console.error);
        }
      }
    }

    if (event === 'charge.failed') {
      const reference = data.reference;
      if (!reference) return;

      const transaction = await Transaction.findOne({ reference });
      if (!transaction) return;

      transaction.status = 'failed';
      transaction.paystackResponse = data;
      await transaction.save();
    }
  }

  /**
   * Get transaction by reference
   */
  async getTransactionByReference(reference: string) {
    const transaction = await Transaction.findOne({ reference }).populate('order');
    if (!transaction) throw ApiError.notFound('Transaction not found');
    return transaction;
  }
}

export default new PaymentService();
