import { Request, Response, NextFunction } from 'express';
import savedItemService from '../services/savedItem.service';

/**
 * @route   POST /api/saved/:productId
 * @desc    Toggle save/unsave a product
 * @access  Private
 */
export const toggleSavedItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await savedItemService.toggleSavedItem(
      req.user!._id.toString(),
      req.params.productId
    );

    res.status(200).json({
      success: true,
      message: result.saved ? 'Product saved' : 'Product removed from saved items',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/saved
 * @desc    Get user's saved items (paginated)
 * @access  Private
 */
export const getSavedItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = req.query;
    const result = await savedItemService.getSavedItems(
      req.user!._id.toString(),
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );

    res.status(200).json({
      success: true,
      data: { products: result.products },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/saved/:productId/is-saved
 * @desc    Check if a product is saved by the user
 * @access  Private
 */
export const isSaved = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isSaved = await savedItemService.isSaved(
      req.user!._id.toString(),
      req.params.productId
    );

    res.status(200).json({
      success: true,
      data: { isSaved },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/saved/ids
 * @desc    Get saved item IDs for quick client-side checks
 * @access  Private
 */
export const getSavedItemIds = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const savedItemIds = await savedItemService.getSavedItemIds(req.user!._id.toString());

    res.status(200).json({
      success: true,
      data: { savedItemIds },
    });
  } catch (error) {
    next(error);
  }
};