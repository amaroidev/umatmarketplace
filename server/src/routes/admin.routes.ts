import { Router } from 'express';
import {
  getDashboardStats,
  getUsers,
  setUserBanStatus,
  setSellerVerification,
  getProducts,
  updateProductModeration,
  getOrders,
  getModerationQueue,
  getOpsAuditLogs,
  getRetryJobs,
  enqueueRetryJob,
  runRetryJob,
} from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { isAdmin } from '../middleware/roleCheck';

const router = Router();

router.use(authenticate, isAdmin);

router.get('/dashboard/stats', getDashboardStats);

router.get('/users', getUsers);
router.patch('/users/:id/ban', setUserBanStatus);
router.patch('/users/:id/verify', setSellerVerification);

router.get('/products', getProducts);
router.patch('/products/:id/moderate', updateProductModeration);

router.get('/orders', getOrders);
router.get('/moderation-queue', getModerationQueue);
router.get('/ops/audit-logs', getOpsAuditLogs);
router.get('/ops/retry-jobs', getRetryJobs);
router.post('/ops/retry-jobs', enqueueRetryJob);
router.post('/ops/retry-jobs/:id/run', runRetryJob);

export default router;
