import { Request, Response, NextFunction } from 'express';
import adminService from '../services/admin.service';

export const getDashboardStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await adminService.getUsers({
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      role: req.query.role as string,
      search: req.query.search as string,
      isBanned: req.query.isBanned as string,
    });

    res.status(200).json({
      success: true,
      data: { users: result.users },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const setUserBanStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await adminService.setUserBanStatus(
      req.params.id,
      Boolean(req.body.isBanned),
      req.user!._id.toString()
    );

    res.status(200).json({
      success: true,
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const setSellerVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await adminService.setSellerVerification(
      req.params.id,
      Boolean(req.body.isVerified)
    );

    res.status(200).json({
      success: true,
      message: `Seller ${user.isVerified ? 'verified' : 'unverified'} successfully`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await adminService.getProducts({
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      status: req.query.status as string,
      flagged: req.query.flagged as string,
      search: req.query.search as string,
    });

    res.status(200).json({
      success: true,
      data: { products: result.products },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductModeration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await adminService.updateProductModeration(req.params.id, {
      isFlagged: req.body.isFlagged,
      flagReason: req.body.flagReason,
      status: req.body.status,
      isFeatured: req.body.isFeatured,
    });

    res.status(200).json({
      success: true,
      message: 'Product moderation updated',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await adminService.getOrders({
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      status: req.query.status as string,
      search: req.query.search as string,
    });

    res.status(200).json({
      success: true,
      data: { orders: result.orders },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getModerationQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await adminService.getModerationQueue({
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getOpsAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const logs = await adminService.getOpsAuditLogs(limit);
    res.status(200).json({ success: true, data: { logs } });
  } catch (error) {
    next(error);
  }
};

export const getRetryJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const jobs = await adminService.listRetryJobs(limit);
    res.status(200).json({ success: true, data: { jobs } });
  } catch (error) {
    next(error);
  }
};

export const enqueueRetryJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const job = await adminService.enqueueRetryJob(req.body);
    res.status(201).json({ success: true, message: 'Retry job queued', data: { job } });
  } catch (error) {
    next(error);
  }
};

export const runRetryJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const job = await adminService.runRetryJob(req.params.id);
    res.status(200).json({ success: true, message: 'Retry job executed', data: { job } });
  } catch (error) {
    next(error);
  }
};
