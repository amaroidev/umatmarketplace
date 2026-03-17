import axios from 'axios';
import crypto from 'crypto';
import env from '../config/env';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const paystackApi = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string; // 'success' | 'failed' | 'abandoned'
    reference: string;
    amount: number; // in kobo (pesewas for GHS)
    currency: string;
    channel: string;
    paid_at: string;
    customer: {
      id: number;
      email: string;
      phone: string;
    };
    authorization: {
      channel: string;
      bank: string;
      brand: string;
    };
    metadata: Record<string, any>;
    [key: string]: any;
  };
}

/**
 * Initialize a Paystack transaction
 * @param email - Customer email
 * @param amount - Amount in GHS (will be converted to pesewas)
 * @param reference - Unique transaction reference
 * @param callbackUrl - URL to redirect after payment
 * @param metadata - Extra metadata to attach
 * @param channels - Payment channels to enable
 */
export const initializeTransaction = async (
  email: string,
  amount: number,
  reference: string,
  callbackUrl: string,
  metadata: Record<string, any> = {},
  channels?: string[]
): Promise<PaystackInitializeResponse> => {
  const payload: Record<string, any> = {
    email,
    amount: Math.round(amount * 100), // Convert GHS to pesewas
    currency: 'GHS',
    reference,
    callback_url: callbackUrl,
    metadata: {
      ...metadata,
      custom_fields: [
        {
          display_name: 'Platform',
          variable_name: 'platform',
          value: 'CampusMarketplace',
        },
      ],
    },
  };

  if (channels && channels.length > 0) {
    payload.channels = channels;
  }

  const response = await paystackApi.post('/transaction/initialize', payload);
  return response.data;
};

/**
 * Verify a Paystack transaction
 * @param reference - Transaction reference to verify
 */
export const verifyTransaction = async (
  reference: string
): Promise<PaystackVerifyResponse> => {
  const response = await paystackApi.get(`/transaction/verify/${reference}`);
  return response.data;
};

/**
 * Validate a Paystack webhook signature
 * @param body - Raw request body as string
 * @param signature - x-paystack-signature header value
 */
export const validateWebhookSignature = (
  body: string,
  signature: string
): boolean => {
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex');
  return hash === signature;
};

/**
 * Map payment method to Paystack channel(s)
 */
export const getPaystackChannels = (
  paymentMethod: string
): string[] | undefined => {
  switch (paymentMethod) {
    case 'momo_mtn':
    case 'momo_vodafone':
    case 'momo_airteltigo':
      return ['mobile_money'];
    case 'card':
      return ['card'];
    case 'bank_transfer':
      return ['bank_transfer'];
    default:
      return undefined; // All channels
  }
};

/**
 * Generate a unique payment reference
 */
export const generateReference = (): string => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `CM_PAY_${timestamp}_${random}`.toUpperCase();
};
