import mongoose from 'mongoose';
import Order, { IOrderDocument } from '../models/Order';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import Bundle from '../models/Bundle';
import ApiError from '../utils/ApiError';
import notificationService from './notification.service';

interface CreateOrderInput {
  productId: string;
  quantity?: number;
  deliveryMethod: 'pickup' | 'delivery';
  couponCode?: string;
  pickupLocation?: string;
  deliveryAddress?: string;
  note?: string;
}

interface PaginatedOrders {
  orders: IOrderDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class OrderService {
  /**
   * Create a new order
   */
  async createOrder(buyerId: string, input: CreateOrderInput): Promise<IOrderDocument> {
    const { productId, quantity = 1, deliveryMethod, couponCode, pickupLocation, deliveryAddress, note } = input;

    // Fetch product
    const product = await Product.findById(productId).populate('seller', '_id');
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    if (product.status !== 'active') {
      throw ApiError.badRequest('Product is no longer available');
    }

    const sellerId = product.seller._id?.toString() || (product.seller as any).toString();

    if (sellerId === buyerId) {
      throw ApiError.badRequest('You cannot buy your own product');
    }

    // Validate delivery method
    if (deliveryMethod === 'pickup' && !pickupLocation) {
      throw ApiError.badRequest('Pickup location is required for pickup orders');
    }
    if (deliveryMethod === 'delivery' && !deliveryAddress) {
      throw ApiError.badRequest('Delivery address is required for delivery orders');
    }

    // Check product supports this delivery method
    if (product.deliveryOption === 'pickup' && deliveryMethod === 'delivery') {
      throw ApiError.badRequest('This product is pickup only');
    }
    if (product.deliveryOption === 'delivery' && deliveryMethod === 'pickup') {
      throw ApiError.badRequest('This product is delivery only');
    }

    if (product.availableFrom && new Date(product.availableFrom) > new Date()) {
      throw ApiError.badRequest('This listing is scheduled and not yet available');
    }

    if (product.availableUntil && new Date(product.availableUntil) < new Date()) {
      throw ApiError.badRequest('This listing campaign has ended');
    }

    // Calculate totals
    const effectivePrice = product.flashSalePrice && product.flashSaleEndsAt && new Date(product.flashSaleEndsAt) > new Date()
      ? product.flashSalePrice
      : product.price;
    const itemTotal = effectivePrice * quantity;
    const deliveryFee = deliveryMethod === 'delivery' ? 5.00 : 0; // Flat GHS 5 delivery fee
    let discountAmount = 0;

    if (couponCode) {
      const now = new Date();
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        seller: sellerId,
        isActive: true,
        $and: [
          { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
          { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }] },
        ],
      });

      if (coupon && itemTotal >= coupon.minOrderAmount && coupon.usedCount < coupon.usageLimit) {
        discountAmount = coupon.type === 'percentage'
          ? (itemTotal * coupon.value) / 100
          : coupon.value;
        discountAmount = Math.min(discountAmount, itemTotal);
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const totalAmount = Math.max(0, itemTotal + deliveryFee - discountAmount);

    // Create the order
    const order = await Order.create({
      buyer: buyerId,
      seller: sellerId,
      items: [
        {
          product: product._id,
          title: product.title,
          price: effectivePrice,
          image: product.images?.[0]?.url || undefined,
          quantity,
        },
      ],
      totalAmount,
      discountAmount,
      couponCode: couponCode ? couponCode.toUpperCase() : undefined,
      deliveryMethod,
      pickupLocation: deliveryMethod === 'pickup' ? pickupLocation : undefined,
      deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : undefined,
      deliveryFee,
      note,
      status: 'pending',
    });

    // Mark product as reserved
    product.status = 'reserved';
    await product.save();

    if (product.stock > 0) {
      product.stock = Math.max(0, product.stock - quantity);
      await product.save();
      if (product.stock <= 2) {
        await notificationService.create(
          sellerId,
          'system',
          'Inventory Low',
          `${product.title} is low on stock (${product.stock} left).`,
          '/my-listings',
          { productId: product._id.toString(), stock: product.stock }
        );
      }
    }

    // Populate and return
    return order.populate([
      { path: 'buyer', select: 'name avatar phone email' },
      { path: 'seller', select: 'name avatar phone isVerified' },
      { path: 'items.product', select: 'title price images status seller' },
    ]);
  }

  /**
   * Get a single order by ID (verifies access)
   */
  async getOrderById(orderId: string, userId: string, isAdmin: boolean = false): Promise<IOrderDocument> {
    const order = await Order.findById(orderId)
      .populate('buyer', 'name avatar phone email')
      .populate('seller', 'name storeName brandName avatar phone isVerified')
      .populate('items.product', 'title price images status seller')
      .populate('payment');

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Verify access
    if (
      !isAdmin &&
      order.buyer._id?.toString() !== userId &&
      order.seller._id?.toString() !== userId
    ) {
      throw ApiError.forbidden('You do not have access to this order');
    }

    return order;
  }

  /**
   * Get orders for a buyer (paginated)
   */
  async getBuyerOrders(
    buyerId: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedOrders> {
    const query: Record<string, any> = { buyer: buyerId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('buyer', 'name avatar phone email')
      .populate('seller', 'name storeName brandName avatar phone isVerified')
      .populate('items.product', 'title price images status seller')
      .populate('payment');

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get orders for a seller (paginated)
   */
  async getSellerOrders(
    sellerId: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedOrders> {
    const query: Record<string, any> = { seller: sellerId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('buyer', 'name avatar phone email')
      .populate('seller', 'name storeName brandName avatar phone isVerified')
      .populate('items.product', 'title price images status seller')
      .populate('payment');

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update order status (seller actions: confirm, ready, complete)
   */
  async updateOrderStatus(
    orderId: string,
    userId: string,
    newStatus: string,
    isAdmin: boolean = false
  ): Promise<IOrderDocument> {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    // Only seller or admin can update status
    if (!isAdmin && order.seller.toString() !== userId) {
      throw ApiError.forbidden('Only the seller can update order status');
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      paid: ['confirmed', 'cancelled'],
      confirmed: ['ready', 'cancelled'],
      ready: ['completed'],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw ApiError.badRequest(
        `Cannot transition from "${order.status}" to "${newStatus}"`
      );
    }

    order.status = newStatus;

    if (newStatus === 'completed') {
      order.completedAt = new Date();
      // Mark product as sold
      await Product.findByIdAndUpdate(order.items[0].product, { status: 'sold' });
    }

    if (newStatus === 'cancelled') {
      order.cancelledBy = new mongoose.Types.ObjectId(userId);
      // Restore product to active
      await Product.findByIdAndUpdate(order.items[0].product, { status: 'active' });
    }

    await order.save();

    return order.populate([
      { path: 'buyer', select: 'name avatar phone email' },
      { path: 'seller', select: 'name avatar phone isVerified' },
      { path: 'items.product', select: 'title price images status seller' },
      { path: 'payment' },
    ]);
  }

  /**
   * Cancel an order (buyer can cancel if still pending/paid)
   */
  async cancelOrder(
    orderId: string,
    userId: string,
    reason?: string
  ): Promise<IOrderDocument> {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const isBuyer = order.buyer.toString() === userId;
    const isSeller = order.seller.toString() === userId;

    if (!isBuyer && !isSeller) {
      throw ApiError.forbidden('You do not have access to this order');
    }

    // Buyer can cancel pending or paid orders
    // Seller can cancel paid or confirmed orders
    const buyerCancellable = ['pending', 'paid'];
    const sellerCancellable = ['paid', 'confirmed'];

    if (isBuyer && !buyerCancellable.includes(order.status)) {
      throw ApiError.badRequest('This order can no longer be cancelled');
    }
    if (isSeller && !sellerCancellable.includes(order.status)) {
      throw ApiError.badRequest('This order can no longer be cancelled');
    }

    order.status = 'cancelled';
    order.cancelReason = reason || 'No reason provided';
    order.cancelledBy = new mongoose.Types.ObjectId(userId);

    // Restore product to active
    await Product.findByIdAndUpdate(order.items[0].product, { status: 'active' });

    await order.save();

    return order.populate([
      { path: 'buyer', select: 'name avatar phone email' },
      { path: 'seller', select: 'name avatar phone isVerified' },
      { path: 'items.product', select: 'title price images status seller' },
      { path: 'payment' },
    ]);
  }

  /**
   * Get order stats for a seller
   */
  async getSellerStats(sellerId: string): Promise<Record<string, number>> {
    const stats = await Order.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
    ]);

    const result: Record<string, number> = {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
    };

    stats.forEach((s) => {
      result.totalOrders += s.count;
      if (s._id === 'completed') {
        result.completedOrders = s.count;
        result.totalRevenue = s.total;
      }
      if (['pending', 'paid', 'confirmed', 'ready'].includes(s._id)) {
        result.pendingOrders += s.count;
      }
    });

    return result;
  }

  async getAbandonedCheckouts(limit: number = 20): Promise<IOrderDocument[]> {
    const threshold = new Date(Date.now() - 60 * 60 * 1000);
    return Order.find({
      status: 'pending',
      createdAt: { $lte: threshold },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate('buyer', 'name email')
      .populate('seller', 'name')
      .populate('items.product', 'title');
  }

  async runAutomationSweep(): Promise<{
    abandonedCheckoutCount: number;
    inventoryLowAlertCount: number;
  }> {
    const abandoned = await this.getAbandonedCheckouts(50);

    for (const order of abandoned) {
      const buyer = order.buyer as any;
      if (buyer?._id) {
        await notificationService.create(
          buyer._id.toString(),
          'system',
          'Checkout Reminder',
          `You still have a pending checkout (#${order.orderNumber}). Complete payment before it expires.`,
          `/orders/${order._id}`,
          { orderId: order._id.toString(), automation: 'abandoned_checkout' }
        );
      }
    }

    const lowStockProducts = await Product.find({
      status: { $in: ['active', 'reserved'] },
      stock: { $lte: 2 },
    }).select('title stock seller');

    for (const item of lowStockProducts) {
      await notificationService.create(
        item.seller.toString(),
        'system',
        'Inventory Low',
        `${item.title} is running low (${item.stock} left). Restock or update listing status.`,
        '/my-listings',
        { productId: item._id.toString(), stock: item.stock, automation: 'inventory_low' }
      );
    }

    return {
      abandonedCheckoutCount: abandoned.length,
      inventoryLowAlertCount: lowStockProducts.length,
    };
  }

  async createCoupon(
    sellerId: string,
    input: {
      code: string;
      type: 'percentage' | 'fixed';
      value: number;
      minOrderAmount?: number;
      usageLimit?: number;
      startsAt?: string;
      expiresAt?: string;
    }
  ) {
    return Coupon.create({
      seller: sellerId,
      code: input.code.toUpperCase(),
      type: input.type,
      value: input.value,
      minOrderAmount: input.minOrderAmount || 0,
      usageLimit: input.usageLimit || 100,
      startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      isActive: true,
    });
  }

  async getSellerCoupons(sellerId: string) {
    return Coupon.find({ seller: sellerId }).sort({ createdAt: -1 });
  }

  async createBundle(
    sellerId: string,
    input: {
      name: string;
      productIds: string[];
      discountPercent: number;
    }
  ) {
    const products = await Product.find({ _id: { $in: input.productIds }, seller: sellerId }).select('_id');
    if (products.length < 2) {
      throw ApiError.badRequest('Bundle requires at least 2 of your own products');
    }
    return Bundle.create({
      seller: sellerId,
      name: input.name,
      productIds: products.map((p) => p._id),
      discountPercent: input.discountPercent,
      isActive: true,
    });
  }

  async getSellerBundles(sellerId: string) {
    return Bundle.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .populate('productIds', 'title price images status');
  }
}

export default new OrderService();
