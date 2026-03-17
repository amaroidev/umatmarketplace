import { Request, Response, NextFunction } from 'express';
import productService from '../services/product.service';
import ApiError from '../utils/ApiError';

/**
 * @route   POST /api/products
 * @desc    Create a new product listing
 * @access  Private (seller, admin)
 */
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;

    // Parse tags from string if sent as comma-separated
    let tags = req.body.tags;
    if (typeof tags === 'string') {
      tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    const product = await productService.createProduct(
      req.user!._id.toString(),
      {
        title: req.body.title,
        description: req.body.description,
        price: parseFloat(req.body.price),
        category: req.body.category,
        condition: req.body.condition,
        deliveryOption: req.body.deliveryOption,
        pickupLocation: req.body.pickupLocation,
        tags,
        status: req.body.status,
      },
      files
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products
 * @desc    Get all products (with filters)
 * @access  Public
 */
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await productService.getProducts({
      category: req.query.category as string,
      condition: req.query.condition as string,
      status: req.query.status as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      seller: req.query.seller as string,
      search: req.query.search as string,
      deliveryOption: req.query.deliveryOption as string,
      sort: req.query.sort as string,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 */
export const getFeaturedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
    const products = await productService.getFeaturedProducts(limit);

    res.status(200).json({
      success: true,
      message: 'Featured products retrieved',
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/recent
 * @desc    Get recent products
 * @access  Public
 */
export const getRecentProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
    const products = await productService.getRecentProducts(limit);

    res.status(200).json({
      success: true,
      message: 'Recent products retrieved',
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/my-listings
 * @desc    Get current user's products
 * @access  Private (seller, admin)
 */
export const getMyListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await productService.getSellerProducts(
      req.user!._id.toString(),
      {
        status: req.query.status as string,
        sort: req.query.sort as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Your listings retrieved',
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Get a single product by ID
 * @access  Public
 */
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await productService.getProductById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product retrieved',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/:id/related
 * @desc    Get related products
 * @access  Public
 */
export const getRelatedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const products = await productService.getRelatedProducts(req.params.id, limit);

    res.status(200).json({
      success: true,
      message: 'Related products retrieved',
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private (owner or admin)
 */
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;

    // Parse tags from string if sent as comma-separated
    let tags = req.body.tags;
    if (typeof tags === 'string') {
      tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    const product = await productService.updateProduct(
      req.params.id,
      req.user!._id.toString(),
      req.user!.role,
      {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        category: req.body.category,
        condition: req.body.condition,
        status: req.body.status,
        deliveryOption: req.body.deliveryOption,
        pickupLocation: req.body.pickupLocation,
        tags,
      },
      files
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/products/:id/images
 * @desc    Delete specific images from a product
 * @access  Private (owner or admin)
 */
export const deleteProductImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { publicIds } = req.body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      throw ApiError.badRequest('publicIds array is required');
    }

    const product = await productService.deleteProductImages(
      req.params.id,
      req.user!._id.toString(),
      req.user!.role,
      publicIds
    );

    res.status(200).json({
      success: true,
      message: 'Images deleted successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private (owner or admin)
 */
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await productService.deleteProduct(
      req.params.id,
      req.user!._id.toString(),
      req.user!.role
    );

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products/:id/flag
 * @desc    Flag/report a product
 * @access  Private
 */
export const flagProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      throw ApiError.badRequest('A reason for flagging is required');
    }

    await productService.flagProduct(req.params.id, reason);

    res.status(200).json({
      success: true,
      message: 'Product has been reported. Our team will review it.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/search/suggestions
 * @desc    Get search autocomplete suggestions
 * @access  Public
 */
export const getSearchSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = (req.query.q as string) || '';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
    const suggestions = await productService.getSearchSuggestions(q, limit);

    res.status(200).json({
      success: true,
      message: 'Search suggestions retrieved',
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/trending
 * @desc    Get trending/popular products
 * @access  Public
 */
export const getTrendingProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
    const products = await productService.getTrendingProducts(limit);

    res.status(200).json({
      success: true,
      message: 'Trending products retrieved',
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/products/:id/featured
 * @desc    Toggle featured status
 * @access  Private (admin)
 */
export const toggleFeatured = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await productService.toggleFeatured(req.params.id);

    res.status(200).json({
      success: true,
      message: `Product ${product.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products/bulk/csv
 * @desc    Import products from a CSV file
 * @access  Private (Seller/Admin)
 */
export const importProductsCSV = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No CSV file uploaded');
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const { parse } = require('csv-parse/sync');
    
    // Parse CSV
    // Expected columns: title, description, price, category, condition, tags, deliveryOption, pickupLocation, status
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!records || records.length === 0) {
      throw ApiError.badRequest('CSV file is empty or invalid format');
    }

    if (records.length > 100) {
      throw ApiError.badRequest('Maximum 100 products can be imported at once');
    }

    let successCount = 0;
    const errors: any[] = [];

    for (const [index, record] of records.entries()) {
      try {
        // Basic validation
        if (!record.title || !record.price || !record.category || !record.condition) {
          errors.push({ row: index + 2, message: 'Missing required fields (title, price, category, condition)' });
          continue;
        }

        const tags = record.tags ? record.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

        await productService.createProduct(req.user!._id.toString(), {
          title: record.title,
          description: record.description || '',
          price: parseFloat(record.price),
          category: record.category,
          condition: record.condition,
          tags,
          deliveryOption: record.deliveryOption || 'pickup',
          pickupLocation: record.pickupLocation || '',
          status: record.status || 'active',
        });

        successCount++;
      } catch (err: any) {
        errors.push({ row: index + 2, message: err.message || 'Validation failed' });
      }
    }

    res.status(201).json({
      success: true,
      message: `Imported ${successCount} products`,
      data: { successCount, errors },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products/:id/duplicate
 * @desc    Duplicate an existing listing
 * @access  Private (Seller)
 */
export const duplicateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const originalId = req.params.id;
    const userId = req.user!._id.toString();

    // The service handles checking ownership and making the copy
    const newProduct = await productService.duplicateProduct(originalId, userId);

    res.status(201).json({
      success: true,
      message: 'Product duplicated successfully',
      data: { product: newProduct },
    });
  } catch (error) {
    next(error);
  }
};
