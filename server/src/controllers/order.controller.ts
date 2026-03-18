import { Request, Response, NextFunction } from 'express';
import orderService from '../services/order.service';
import growthService from '../services/growth.service';

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await orderService.createOrder(
      req.user!._id.toString(),
      {
        productId: req.body.productId,
        quantity: req.body.quantity,
        deliveryMethod: req.body.deliveryMethod,
        couponCode: req.body.couponCode,
        pickupLocation: req.body.pickupLocation,
        deliveryAddress: req.body.deliveryAddress,
        note: req.body.note,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order },
    });

    await growthService.captureEvent(req.user?._id?.toString(), 'order', {
      orderId: order._id,
      totalAmount: order.totalAmount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private (buyer, seller, or admin)
 */
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'admin';
    const order = await orderService.getOrderById(
      req.params.id,
      req.user!._id.toString(),
      isAdmin
    );

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders/my/purchases
 * @desc    Get buyer's orders
 * @access  Private
 */
export const getMyPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page, limit } = req.query;
    const result = await orderService.getBuyerOrders(
      req.user!._id.toString(),
      status as string | undefined,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );

    res.status(200).json({
      success: true,
      data: { orders: result.orders },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders/my/sales
 * @desc    Get seller's incoming orders
 * @access  Private (seller/admin)
 */
export const getMySales = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page, limit } = req.query;
    const result = await orderService.getSellerOrders(
      req.user!._id.toString(),
      status as string | undefined,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );

    res.status(200).json({
      success: true,
      data: { orders: result.orders },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status (seller: confirm, ready, complete)
 * @access  Private (seller/admin)
 */
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'admin';
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.user!._id.toString(),
      req.body.status,
      isAdmin
    );

    res.status(200).json({
      success: true,
      message: `Order status updated to ${req.body.status}`,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private (buyer or seller)
 */
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await orderService.cancelOrder(
      req.params.id,
      req.user!._id.toString(),
      req.body.reason
    );

    res.status(200).json({
      success: true,
      message: 'Order cancelled',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders/seller/stats
 * @desc    Get seller order stats
 * @access  Private (seller/admin)
 */
export const getSellerStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await orderService.getSellerStats(req.user!._id.toString());

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

export const getAbandonedCheckouts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await orderService.getAbandonedCheckouts(
      req.query.limit ? parseInt(req.query.limit as string, 10) : 20
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const coupon = await orderService.createCoupon(req.user!._id.toString(), req.body);
    res.status(201).json({ success: true, message: 'Coupon created', data: { coupon } });
  } catch (error) {
    next(error);
  }
};

export const getSellerCoupons = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const coupons = await orderService.getSellerCoupons(req.user!._id.toString());
    res.status(200).json({ success: true, data: { coupons } });
  } catch (error) {
    next(error);
  }
};

export const createBundle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bundle = await orderService.createBundle(req.user!._id.toString(), req.body);
    res.status(201).json({ success: true, message: 'Bundle created', data: { bundle } });
  } catch (error) {
    next(error);
  }
};

export const getSellerBundles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bundles = await orderService.getSellerBundles(req.user!._id.toString());
    res.status(200).json({ success: true, data: { bundles } });
  } catch (error) {
    next(error);
  }
};

export const runAutomationSweep = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await orderService.runAutomationSweep();
    res.status(200).json({ success: true, message: 'Automation sweep completed', data: result });
  } catch (error) {
    next(error);
  }
};
