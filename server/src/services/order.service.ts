import mongoose from 'mongoose';
import Order, { IOrderDocument } from '../models/Order';
import Product from '../models/Product';
import ApiError from '../utils/ApiError';

interface CreateOrderInput {
  productId: string;
  quantity?: number;
  deliveryMethod: 'pickup' | 'delivery';
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
    const { productId, quantity = 1, deliveryMethod, pickupLocation, deliveryAddress, note } = input;

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

    // Calculate totals
    const itemTotal = product.price * quantity;
    const deliveryFee = deliveryMethod === 'delivery' ? 5.00 : 0; // Flat GHS 5 delivery fee
    const totalAmount = itemTotal + deliveryFee;

    // Create the order
    const order = await Order.create({
      buyer: buyerId,
      seller: sellerId,
      items: [
        {
          product: product._id,
          title: product.title,
          price: product.price,
          image: product.images?.[0]?.url || undefined,
          quantity,
        },
      ],
      totalAmount,
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
      .populate('seller', 'name avatar phone isVerified')
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
      .populate('seller', 'name avatar phone isVerified')
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
      .populate('seller', 'name avatar phone isVerified')
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
}

export default new OrderService();
