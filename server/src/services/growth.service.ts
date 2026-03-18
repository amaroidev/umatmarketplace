import { Product, Order, Review, PromotionCampaign, TrustSignal, AnalyticsEvent, OpsAuditLog, RetryJob } from '../models';
import ApiError from '../utils/ApiError';

class GrowthService {
  async getSmartPricing(productId: string): Promise<any> {
    const product = await Product.findById(productId).populate('category', 'name slug');
    if (!product) throw ApiError.notFound('Product not found');

    const peers = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      condition: product.condition,
      status: { $in: ['active', 'sold'] },
      isFlagged: false,
    }).select('price createdAt status');

    const prices = peers.map((p) => p.price).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    if (prices.length === 0) {
      return {
        recommendedMin: Math.max(0.5, Number((product.price * 0.9).toFixed(2))),
        recommendedMax: Number((product.price * 1.1).toFixed(2)),
        confidence: 'low',
        sellThroughProbability: 0.5,
      };
    }

    const mid = Math.floor(prices.length / 2);
    const median = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
    const avg = prices.reduce((s, v) => s + v, 0) / prices.length;
    const soldCount = peers.filter((p) => p.status === 'sold').length;
    const sellThroughProbability = Number((soldCount / prices.length).toFixed(2));

    return {
      median,
      average: Number(avg.toFixed(2)),
      recommendedMin: Number((median * 0.92).toFixed(2)),
      recommendedMax: Number((median * 1.08).toFixed(2)),
      confidence: prices.length >= 10 ? 'high' : prices.length >= 5 ? 'medium' : 'low',
      sellThroughProbability,
    };
  }

  async createCampaign(sellerId: string, payload: any): Promise<any> {
    if (!payload.name || !payload.startsAt || !payload.endsAt) {
      throw ApiError.badRequest('name, startsAt and endsAt are required');
    }
    const campaign = await PromotionCampaign.create({
      seller: sellerId,
      name: payload.name,
      targetType: payload.targetType || 'all',
      targetCategory: payload.targetCategory,
      targetProductIds: payload.targetProductIds || [],
      couponCode: payload.couponCode || '',
      featuredBoost: !!payload.featuredBoost,
      abSlot: payload.abSlot,
      startsAt: new Date(payload.startsAt),
      endsAt: new Date(payload.endsAt),
      isActive: payload.isActive !== false,
    });
    return campaign;
  }

  async listCampaigns(sellerId: string): Promise<any[]> {
    return PromotionCampaign.find({ seller: sellerId }).sort({ createdAt: -1 }).lean();
  }

  async addTrustSignal(adminId: string, payload: any): Promise<any> {
    if (!payload.userId || !payload.type || payload.scoreDelta === undefined) {
      throw ApiError.badRequest('userId, type and scoreDelta are required');
    }
    const signal = await TrustSignal.create({
      user: payload.userId,
      type: payload.type,
      scoreDelta: Number(payload.scoreDelta),
      note: payload.note,
      metadata: { ...payload.metadata, adminId },
    });
    return signal;
  }

  async getTrustSummary(userId: string): Promise<any> {
    const signals = await TrustSignal.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();
    const trustScore = signals.reduce((sum, s) => sum + (s.scoreDelta || 0), 0);
    const safeMeetups = signals.filter((s) => s.type === 'safe_meetup').length;
    const scamFlags = signals.filter((s) => s.type === 'scam_flag').length;
    return { trustScore, safeMeetups, scamFlags, signals };
  }

  async captureEvent(userId: string | undefined, event: string, context?: any): Promise<void> {
    await AnalyticsEvent.create({ user: userId, event, context, cohort: new Date().toISOString().slice(0, 7) });
  }

  async getAnalyticsOverview(): Promise<any> {
    const [views, chats, orders, signups, events] = await Promise.all([
      AnalyticsEvent.countDocuments({ event: 'view' }),
      AnalyticsEvent.countDocuments({ event: 'chat' }),
      AnalyticsEvent.countDocuments({ event: 'order' }),
      AnalyticsEvent.countDocuments({ event: 'signup' }),
      AnalyticsEvent.find().select('event cohort createdAt').lean(),
    ]);

    const funnel = {
      views,
      chats,
      orders,
      viewToChatRate: views ? Number((chats / views).toFixed(2)) : 0,
      chatToOrderRate: chats ? Number((orders / chats).toFixed(2)) : 0,
    };

    const byCohort: Record<string, { signup: number; order: number }> = {};
    for (const e of events) {
      const cohort = e.cohort || String(e.createdAt).slice(0, 7);
      if (!byCohort[cohort]) byCohort[cohort] = { signup: 0, order: 0 };
      if (e.event === 'signup') byCohort[cohort].signup += 1;
      if (e.event === 'order') byCohort[cohort].order += 1;
    }

    return { funnel, cohorts: byCohort };
  }

  async getOpsOverview(): Promise<any> {
    const [flaggedProducts, openOrders, failedPayments, disputes, pendingReviews] = await Promise.all([
      Product.countDocuments({ isFlagged: true }),
      Order.countDocuments({ status: { $in: ['pending', 'paid', 'confirmed', 'ready'] } }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.countDocuments({ status: 'disputed' }),
      Review.countDocuments({ reply: { $in: ['', null] } }),
    ]);

    const [retryJobs, auditLogs] = await Promise.all([
      RetryJob.find().sort({ createdAt: -1 }).limit(20).lean(),
      OpsAuditLog.find().sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    return {
      moderationQueue: flaggedProducts,
      openOrders,
      failedPayments,
      disputes,
      pendingReviewReplies: pendingReviews,
      retryJobs,
      importAuditLogs: auditLogs,
    };
  }
}

export default new GrowthService();
