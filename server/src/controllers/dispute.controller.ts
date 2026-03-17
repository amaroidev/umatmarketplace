import { Request, Response, NextFunction } from 'express';
import Dispute from '../models/Dispute';
import Order from '../models/Order';

/**
 * @route   POST /api/disputes
 * @desc    Raise a dispute on an order
 * @access  Private
 */
export const createDispute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId, reason, description, evidence } = req.body;
    const userId = req.user!._id;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Only buyer or seller of the order can raise a dispute
    const isBuyer = order.buyer.toString() === userId.toString();
    const isSeller = order.seller.toString() === userId.toString();
    if (!isBuyer && !isSeller) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    // Only paid+ orders can be disputed
    const validStatuses = ['paid', 'confirmed', 'ready', 'completed'];
    if (!validStatuses.includes(order.status)) {
      res.status(400).json({ success: false, message: 'Order cannot be disputed in its current status.' });
      return;
    }

    // Check for existing open dispute
    const existing = await Dispute.findOne({ order: orderId, status: { $in: ['open', 'under_review'] } });
    if (existing) {
      res.status(409).json({ success: false, message: 'An open dispute already exists for this order.' });
      return;
    }

    const against = isBuyer ? order.seller : order.buyer;
    const dispute = await Dispute.create({
      order: orderId,
      raisedBy: userId,
      against,
      reason,
      description,
      evidence: Array.isArray(evidence) ? evidence.filter(Boolean) : [],
    });

    // Mark order as disputed
    await Order.findByIdAndUpdate(orderId, { status: 'disputed' });

    res.status(201).json({ success: true, message: 'Dispute raised successfully.', data: { dispute } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/disputes/my
 * @desc    Get disputes raised by or against the current user
 * @access  Private
 */
export const getMyDisputes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const disputes = await Dispute.find({
      $or: [{ raisedBy: userId }, { against: userId }],
    })
      .populate('order', 'orderNumber totalAmount status')
      .populate('raisedBy', 'name email')
      .populate('against', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { disputes } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/disputes/:id
 * @desc    Get a single dispute
 * @access  Private (party member or admin)
 */
export const getDispute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';

    const dispute = await Dispute.findById(req.params.id)
      .populate('order', 'orderNumber totalAmount status items')
      .populate('raisedBy', 'name email avatar')
      .populate('against', 'name email avatar');

    if (!dispute) {
      res.status(404).json({ success: false, message: 'Dispute not found.' });
      return;
    }

    const isParty =
      dispute.raisedBy._id.toString() === userId ||
      dispute.against._id.toString() === userId;

    if (!isParty && !isAdmin) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    res.status(200).json({ success: true, data: { dispute } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/disputes/:id/status
 * @desc    Update dispute status (admin only)
 * @access  Private (admin)
 */
export const updateDisputeStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, adminNote } = req.body;

    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNote,
        ...(status === 'resolved' ? { resolvedAt: new Date() } : {}),
      },
      { new: true, runValidators: true }
    );

    if (!dispute) {
      res.status(404).json({ success: false, message: 'Dispute not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Dispute updated.', data: { dispute } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/disputes (admin)
 * @desc    List all disputes
 * @access  Private (admin)
 */
export const getAllDisputes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const [disputes, total] = await Promise.all([
      Dispute.find(filter)
        .populate('order', 'orderNumber totalAmount')
        .populate('raisedBy', 'name email')
        .populate('against', 'name email')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Dispute.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: { disputes },
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};
