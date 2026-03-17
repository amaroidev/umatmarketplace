import { Router } from 'express';
import {
  initiatePayment,
  verifyPayment,
  handleWebhook,
  getTransaction,
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/payments/webhook — Paystack webhook (public, validated by signature)
router.post('/webhook', handleWebhook);

// All other payment routes require authentication
router.post('/initiate', authenticate, initiatePayment);
router.get('/verify/:reference', authenticate, verifyPayment);
router.get('/transaction/:reference', authenticate, getTransaction);

export default router;
