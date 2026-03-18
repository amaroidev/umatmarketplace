import { Request, Response, NextFunction } from 'express';
import growthService from '../services/growth.service';

export const getSmartPricing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await growthService.getSmartPricing(req.params.productId);
    res.status(200).json({ success: true, message: 'Smart pricing generated', data });
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await growthService.createCampaign(req.user!._id.toString(), req.body);
    res.status(201).json({ success: true, message: 'Campaign created', data });
  } catch (error) {
    next(error);
  }
};

export const listCampaigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await growthService.listCampaigns(req.user!._id.toString());
    res.status(200).json({ success: true, message: 'Campaigns retrieved', data });
  } catch (error) {
    next(error);
  }
};

export const addTrustSignal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await growthService.addTrustSignal(req.user!._id.toString(), req.body);
    res.status(201).json({ success: true, message: 'Trust signal logged', data });
  } catch (error) {
    next(error);
  }
};

export const getTrustSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await growthService.getTrustSummary(req.params.userId);
    res.status(200).json({ success: true, message: 'Trust summary retrieved', data });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await growthService.getAnalyticsOverview();
    res.status(200).json({ success: true, message: 'Analytics overview retrieved', data });
  } catch (error) {
    next(error);
  }
};

export const getOpsOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await growthService.getOpsOverview();
    res.status(200).json({ success: true, message: 'Ops overview retrieved', data });
  } catch (error) {
    next(error);
  }
};
