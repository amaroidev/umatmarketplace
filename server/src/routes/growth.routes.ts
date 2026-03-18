import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { isSeller, isAdmin } from '../middleware/roleCheck';
import {
  getSmartPricing,
  createCampaign,
  listCampaigns,
  addTrustSignal,
  getTrustSummary,
  getAnalyticsOverview,
  getOpsOverview,
} from '../controllers/growth.controller';

const router = Router();

router.get('/pricing/:productId', authenticate, isSeller, getSmartPricing);
router.post('/campaigns', authenticate, isSeller, createCampaign);
router.get('/campaigns', authenticate, isSeller, listCampaigns);

router.post('/trust/signals', authenticate, isAdmin, addTrustSignal);
router.get('/trust/:userId', authenticate, getTrustSummary);

router.get('/analytics/overview', authenticate, isAdmin, getAnalyticsOverview);
router.get('/ops/overview', authenticate, isAdmin, getOpsOverview);

export default router;
