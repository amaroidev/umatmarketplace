import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  getMyPurchases,
  getMySales,
  updateOrderStatus,
  cancelOrder,
  getSellerStats,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// GET /api/orders/my/purchases — buyer's order history
router.get('/my/purchases', getMyPurchases);

// GET /api/orders/my/sales — seller's incoming orders
router.get('/my/sales', getMySales);

// GET /api/orders/seller/stats — seller order stats
router.get('/seller/stats', getSellerStats);

// POST /api/orders — create a new order
router.post('/', createOrder);

// GET /api/orders/:id — get order by ID
router.get('/:id', getOrderById);

// PATCH /api/orders/:id/status — update order status (seller)
router.patch('/:id/status', updateOrderStatus);

// POST /api/orders/:id/cancel — cancel an order
router.post('/:id/cancel', cancelOrder);

export default router;
