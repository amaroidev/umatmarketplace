import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  getMyPurchases,
  getMySales,
  updateOrderStatus,
  cancelOrder,
  getSellerStats,
  getAbandonedCheckouts,
  createCoupon,
  getSellerCoupons,
  createBundle,
  getSellerBundles,
  runAutomationSweep,
} from '../controllers/order.controller';
import { authenticate, ensureProfileComplete } from '../middleware/auth';
import { isSeller, isAdmin } from '../middleware/roleCheck';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// GET /api/orders/my/purchases — buyer's order history
router.get('/my/purchases', getMyPurchases);

// GET /api/orders/my/sales — seller's incoming orders
router.get('/my/sales', getMySales);

// GET /api/orders/seller/stats — seller order stats
router.get('/seller/stats', isSeller, getSellerStats);

// GET /api/orders/automation/abandoned — abandoned checkouts feed (admin)
router.get('/automation/abandoned', isAdmin, getAbandonedCheckouts);
router.post('/automation/run-sweep', isAdmin, runAutomationSweep);

// Seller growth toolkit: coupons
router.post('/seller/coupons', isSeller, createCoupon);
router.get('/seller/coupons', isSeller, getSellerCoupons);

// Seller growth toolkit: bundles
router.post('/seller/bundles', isSeller, createBundle);
router.get('/seller/bundles', isSeller, getSellerBundles);

// POST /api/orders — create a new order
router.post('/', ensureProfileComplete(), createOrder);

// GET /api/orders/:id — get order by ID
router.get('/:id', getOrderById);

// PATCH /api/orders/:id/status — update order status (seller)
router.patch('/:id/status', updateOrderStatus);

// POST /api/orders/:id/cancel — cancel an order
router.post('/:id/cancel', cancelOrder);

export default router;
