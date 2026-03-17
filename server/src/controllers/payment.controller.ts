import { Request, Response, NextFunction } from 'express';
import paymentService from '../services/payment.service';
import { validateWebhookSignature } from '../utils/paystack';
import ApiError from '../utils/ApiError';

/**
 * @route   POST /api/payments/initiate
 * @desc    Initiate payment for an order via Paystack
 * @access  Private (buyer)
 */
export const initiatePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId, paymentMethod, callbackUrl } = req.body;

    if (!orderId || !paymentMethod || !callbackUrl) {
      throw ApiError.badRequest('orderId, paymentMethod, and callbackUrl are required');
    }

    const result = await paymentService.initiatePayment(
      orderId,
      req.user!._id.toString(),
      paymentMethod,
      callbackUrl
    );

    res.status(200).json({
      success: true,
      message: 'Payment initialized',
      data: {
        authorizationUrl: result.authorizationUrl,
        reference: result.reference,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/verify/:reference
 * @desc    Verify a payment after Paystack redirect
 * @access  Private
 */
export const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reference } = req.params;

    if (!reference) {
      throw ApiError.badRequest('Payment reference is required');
    }

    const result = await paymentService.verifyPayment(reference);

    res.status(200).json({
      success: true,
      message: result.verified ? 'Payment verified successfully' : 'Payment not verified',
      data: {
        verified: result.verified,
        order: result.order,
        transaction: result.transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Paystack webhook events
 * @access  Public (validated by signature)
 */
export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;

    if (!signature) {
      res.status(400).json({ success: false, message: 'No signature provided' });
      return;
    }

    // Validate webhook signature using raw body
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      res.status(400).json({ success: false, message: 'Raw body not available' });
      return;
    }

    const isValid = validateWebhookSignature(rawBody, signature);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid signature' });
      return;
    }

    const { event, data } = req.body;

    await paymentService.handleWebhook(event, data);

    // Paystack expects a 200 response
    res.status(200).json({ success: true });
  } catch (error) {
    // Always return 200 to Paystack to prevent retries
    console.error('Webhook processing error:', error);
    res.status(200).json({ success: true });
  }
};

/**
 * @route   GET /api/payments/transaction/:reference
 * @desc    Get transaction details by reference
 * @access  Private
 */
export const getTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const transaction = await paymentService.getTransactionByReference(
      req.params.reference
    );

    res.status(200).json({
      success: true,
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};
