import mongoose from 'mongoose';
import { User, Product, Order, Category, Dispute, OpsAuditLog, RetryJob } from '../models';
import ApiError from '../utils/ApiError';

interface PaginationInput {
  page?: number;
  limit?: number;
}

class AdminService {
  async getDashboardStats(): Promise<Record<string, number>> {
    const [
      totalUsers,
      totalSellers,
      verifiedSellers,
      bannedUsers,
      totalProducts,
      activeProducts,
      flaggedProducts,
      featuredProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      openDisputes,
      categories,
      revenueAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'seller', isVerified: true }),
      User.countDocuments({ isBanned: true }),
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ isFlagged: true }),
      Product.countDocuments({ isFeatured: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['pending', 'paid', 'confirmed', 'ready'] } }),
      Order.countDocuments({ status: 'completed' }),
      Dispute.countDocuments({ status: { $in: ['open', 'under_review'] } }),
      Category.countDocuments({ isActive: true }),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
    ]);

    return {
      totalUsers,
      totalSellers,
      verifiedSellers,
      bannedUsers,
      totalProducts,
      activeProducts,
      flaggedProducts,
      featuredProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      openDisputes,
      activeCategories: categories,
      totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    };
  }

  async getUsers(filters: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    isBanned?: string;
  }): Promise<{ users: any[]; pagination: any }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (filters.role) query.role = filters.role;
    if (filters.isBanned !== undefined) query.isBanned = filters.isBanned === 'true';
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password -__v'),
      User.countDocuments(query),
    ]);

    return {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async setUserBanStatus(userId: string, isBanned: boolean, currentAdminId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw ApiError.badRequest('Invalid user ID');
    if (userId === currentAdminId) throw ApiError.badRequest('You cannot ban your own account');

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    user.isBanned = isBanned;
    await user.save();

    await OpsAuditLog.create({
      actor: currentAdminId,
      action: isBanned ? 'ban_user' : 'unban_user',
      scope: 'users',
      targetId: userId,
      status: 'success',
    });

    return user;
  }

  async setSellerVerification(userId: string, isVerified: boolean): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw ApiError.badRequest('Invalid user ID');

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    if (user.role !== 'seller') throw ApiError.badRequest('Only seller accounts can be verified');

    user.isVerified = isVerified;
    await user.save();

    await OpsAuditLog.create({
      action: isVerified ? 'verify_seller' : 'unverify_seller',
      scope: 'users',
      targetId: userId,
      status: 'success',
    });

    return user;
  }

  async getProducts(filters: {
    page?: number;
    limit?: number;
    status?: string;
    flagged?: string;
    search?: string;
  }): Promise<{ products: any[]; pagination: any }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (filters.status) query.status = filters.status;
    if (filters.flagged !== undefined) query.isFlagged = filters.flagged === 'true';
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .populate('seller', 'name email isVerified'),
      Product.countDocuments(query),
    ]);

    return {
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async updateProductModeration(
    productId: string,
    updates: { isFlagged?: boolean; flagReason?: string; status?: string; isFeatured?: boolean }
  ): Promise<any> {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    if (updates.isFlagged !== undefined) product.isFlagged = updates.isFlagged;
    if (updates.flagReason !== undefined) product.flagReason = updates.flagReason;
    if (updates.status !== undefined) product.status = updates.status as any;
    if (updates.isFeatured !== undefined) product.isFeatured = updates.isFeatured;

    await product.save();

    await OpsAuditLog.create({
      action: 'moderate_product',
      scope: 'products',
      targetId: productId,
      status: 'success',
      details: updates,
    });

    return product.populate([
      { path: 'category', select: 'name slug' },
      { path: 'seller', select: 'name email isVerified' },
    ]);
  }

  async getOrders(filters: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ orders: any[]; pagination: any }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (filters.status) query.status = filters.status;
    if (filters.search) query.orderNumber = { $regex: filters.search, $options: 'i' };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('buyer', 'name email phone')
        .populate('seller', 'name email phone')
        .populate('items.product', 'title price status')
        .populate('payment'),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getModerationQueue(filters: {
    page?: number;
    limit?: number;
  }): Promise<{ products: any[]; disputes: any[] }> {
    const limit = Math.min(50, Math.max(1, filters.limit || 20));

    const [products, disputes] = await Promise.all([
      Product.find({ isFlagged: true })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate('category', 'name slug')
        .populate('seller', 'name email isVerified'),
      Dispute.find({ status: { $in: ['open', 'under_review'] } })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate('order', 'orderNumber totalAmount')
        .populate('raisedBy', 'name email')
        .populate('against', 'name email'),
    ]);

    return { products, disputes };
  }

  async getOpsAuditLogs(limit: number = 100): Promise<any[]> {
    return OpsAuditLog.find().sort({ createdAt: -1 }).limit(Math.min(200, Math.max(1, limit))).lean();
  }

  async listRetryJobs(limit: number = 100): Promise<any[]> {
    return RetryJob.find().sort({ createdAt: -1 }).limit(Math.min(200, Math.max(1, limit))).lean();
  }

  async enqueueRetryJob(payload: { type: 'import' | 'notification' | 'payment' | 'moderation'; payload: any; runAt?: string }): Promise<any> {
    return RetryJob.create({
      type: payload.type,
      payload: payload.payload || {},
      runAt: payload.runAt ? new Date(payload.runAt) : new Date(),
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
    });
  }

  async runRetryJob(jobId: string): Promise<any> {
    const job = await RetryJob.findById(jobId);
    if (!job) throw ApiError.notFound('Retry job not found');
    if (job.status === 'completed') return job;

    job.status = 'processing';
    await job.save();

    try {
      // Placeholder execution scaffold for future workers
      job.attempts += 1;
      job.status = 'completed';
      job.lastError = '';
      await job.save();

      await OpsAuditLog.create({
        action: 'run_retry_job',
        scope: 'retry_jobs',
        targetId: jobId,
        status: 'success',
      });
    } catch (error: any) {
      job.attempts += 1;
      job.status = job.attempts >= job.maxAttempts ? 'failed' : 'pending';
      job.lastError = error?.message || 'Retry execution failed';
      await job.save();

      await OpsAuditLog.create({
        action: 'run_retry_job',
        scope: 'retry_jobs',
        targetId: jobId,
        status: 'failed',
        details: { error: job.lastError },
      });
    }

    return job;
  }
}

export default new AdminService();
