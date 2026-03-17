import api from './api';
import { OrderPopulated, Transaction, PaymentMethod } from '../types';

interface ApiInitiatePaymentResponse {
  success: boolean;
  message: string;
  data: {
    authorizationUrl: string;
    reference: string;
  };
}

interface ApiVerifyPaymentResponse {
  success: boolean;
  message: string;
  data: {
    verified: boolean;
    order: OrderPopulated | null;
    transaction: Transaction;
  };
}

interface ApiTransactionResponse {
  success: boolean;
  data: { transaction: Transaction };
}

const paymentService = {
  /**
   * Initiate a payment via Paystack
   */
  initiatePayment: async (
    orderId: string,
    paymentMethod: PaymentMethod,
    callbackUrl: string
  ): Promise<ApiInitiatePaymentResponse> => {
    const response = await api.post('/payments/initiate', {
      orderId,
      paymentMethod,
      callbackUrl,
    });
    return response.data;
  },

  /**
   * Verify a payment after Paystack redirect
   */
  verifyPayment: async (reference: string): Promise<ApiVerifyPaymentResponse> => {
    const response = await api.get(`/payments/verify/${reference}`);
    return response.data;
  },

  /**
   * Get a transaction by reference
   */
  getTransaction: async (reference: string): Promise<ApiTransactionResponse> => {
    const response = await api.get(`/payments/transaction/${reference}`);
    return response.data;
  },
};

export default paymentService;
