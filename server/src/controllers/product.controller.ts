import { Request, Response, NextFunction } from 'express';
import { parse } from 'csv-parse/sync';
import axios from 'axios';
import productService from '../services/product.service';
import ApiError from '../utils/ApiError';
import { uploadToCloudinary } from '../utils/imageUpload';
import growthService from '../services/growth.service';

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
        stock: req.body.stock ? parseInt(req.body.stock, 10) : undefined,
        availableFrom: req.body.availableFrom,
        availableUntil: req.body.availableUntil,
        flashSalePrice: req.body.flashSalePrice ? parseFloat(req.body.flashSalePrice) : undefined,
        flashSaleEndsAt: req.body.flashSaleEndsAt,
      },
      files,
      { protocol: req.protocol, host: req.get('host') || 'localhost' }
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

    await growthService.captureEvent(req.user?._id?.toString(), 'view', {
      route: 'products_list',
      page: result.pagination.page,
      total: result.pagination.total,
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

    await growthService.captureEvent(req.user?._id?.toString(), 'view', {
      route: 'product_detail',
      productId: req.params.id,
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
        stock: req.body.stock ? parseInt(req.body.stock, 10) : undefined,
        availableFrom: req.body.availableFrom,
        availableUntil: req.body.availableUntil,
        flashSalePrice: req.body.flashSalePrice ? parseFloat(req.body.flashSalePrice) : undefined,
        flashSaleEndsAt: req.body.flashSaleEndsAt,
      },
      files,
      { protocol: req.protocol, host: req.get('host') || 'localhost' }
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
    
    const normalized = fileContent.replace(/^\uFEFF/, '');

    // Parse CSV
    // Expected columns: title, description, price, category, condition, tags, deliveryOption, pickupLocation, status
    const records = parse(normalized, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });

    if (!records || records.length === 0) {
      throw ApiError.badRequest('CSV file is empty or invalid format');
    }

    if (records.length > 500) {
      throw ApiError.badRequest('Maximum 500 CSV rows can be imported at once');
    }

    const withImages = String(req.body?.withImages || req.query?.withImages || '').toLowerCase() === 'true';
    let successCount = 0;
    const errors: any[] = [];
    let imageImportedCount = 0;

    const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
    const getField = (row: Record<string, any>, candidates: string[]): string => {
      const normalizedMap = new Map<string, any>();
      Object.keys(row).forEach((k) => normalizedMap.set(normalizeKey(k), row[k]));
      for (const candidate of candidates) {
        const val = normalizedMap.get(normalizeKey(candidate));
        if (val !== undefined && val !== null && String(val).trim().length > 0) {
          return String(val).trim();
        }
      }
      return '';
    };

    const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const normalizeCondition = (raw: string): 'new' | 'like-new' | 'good' | 'fair' | 'poor' => {
      const v = raw.toLowerCase();
      if (v.includes('like')) return 'like-new';
      if (v.includes('good')) return 'good';
      if (v.includes('fair')) return 'fair';
      if (v.includes('poor') || v.includes('bad')) return 'poor';
      return 'new';
    };
    const mapTypeToCategory = (typeRaw: string | undefined): string => {
      const t = (typeRaw || '').toLowerCase().trim();
      if (['bracelet', 'necklace', 'earrings', 'jewelry', 'jewellery', 'fashion', 'clothing'].includes(t)) return 'clothing-fashion';
      if (['electronics', 'phone', 'laptop', 'gadget'].includes(t)) return 'electronics';
      if (['book', 'textbook', 'books'].includes(t)) return 'textbooks';
      if (['food', 'drink', 'snack'].includes(t)) return 'food-drinks';
      if (['service', 'services'].includes(t)) return 'services';
      return 'others';
    };

    const tryUploadRemoteImage = async (url: string): Promise<{ url: string; publicId: string } | null> => {
      try {
        if (!/^https?:\/\//i.test(url)) return null;
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 12000,
          maxContentLength: 5 * 1024 * 1024,
          validateStatus: (status) => status >= 200 && status < 300,
        });
        const contentType = String(response.headers['content-type'] || '').toLowerCase();
        if (!contentType.startsWith('image/')) return null;
        const buffer = Buffer.from(response.data);
        if (buffer.length > 5 * 1024 * 1024) return null;
        return await uploadToCloudinary(buffer);
      } catch {
        return null;
      }
    };

    const fallbackExternalImage = (url: string): { url: string; publicId: string } => ({
      url,
      publicId: `external:${Buffer.from(url).toString('base64').slice(0, 48)}`,
    });

    const handleToTitle = (handle: string): string =>
      handle
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (m) => m.toUpperCase());

    const normalizedRows = records.map((record: unknown) => {
      const rawRecord = record as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(rawRecord).map(([key, value]) => [
          String(key).replace(/^\uFEFF/, '').trim(),
          typeof value === 'string' ? value.trim() : value,
        ])
      ) as Record<string, any>;
    });

    const isShopifyCsv = normalizedRows.length > 0 && ('Handle' in normalizedRows[0] || 'Variant Price' in normalizedRows[0]);

    if (isShopifyCsv) {
      const grouped = new Map<string, { rowIndex: number; rows: Record<string, any>[] }>();

      normalizedRows.forEach((row, idx) => {
        const handle = String(row.Handle || '').trim();
        if (!handle) return;
        const existing = grouped.get(handle);
        if (existing) {
          existing.rows.push(row);
        } else {
          grouped.set(handle, { rowIndex: idx + 2, rows: [row] });
        }
      });

      if (grouped.size > 100) {
        throw ApiError.badRequest('Maximum 100 products can be imported at once');
      }

      for (const [, group] of grouped) {
        try {
          const rows = group.rows;
          const firstTitledRow = rows.find((r) => !!String(r.Title || '').trim());
          const title = String(firstTitledRow?.Title || '').trim() || handleToTitle(String(rows[0]?.Handle || 'Untitled Item'));
          const descriptionHtml = String(firstTitledRow?.['Body (HTML)'] || '').trim();
          const description = descriptionHtml ? stripHtml(descriptionHtml) : '';
          const type = String(firstTitledRow?.Type || '').trim();
          const published = String(firstTitledRow?.Published || '').toLowerCase() === 'true';

          const variantRow = rows.find((r) => {
            const raw = String(r['Variant Price'] || '').replace(/[^\d.]/g, '');
            const num = Number(raw);
            return Number.isFinite(num) && num > 0;
          });

          const priceRaw = String(variantRow?.['Variant Price'] || '').replace(/[^\d.]/g, '');
          const price = Number(priceRaw);

          if (!title || !Number.isFinite(price) || price <= 0) {
            errors.push({ row: group.rowIndex, message: 'Missing Shopify fields (Title / Variant Price)' });
            continue;
          }

          const tagsRaw = String(firstTitledRow?.Tags || '');
          const tags = tagsRaw
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

          const imageCandidates = rows
            .map((r) => String(r['Image Src'] || r['Variant Image'] || '').trim())
            .filter(Boolean)
            .slice(0, 5);
          const images: { url: string; publicId: string }[] = [];
          if (withImages) {
            for (const imageUrl of imageCandidates) {
              const uploaded = await tryUploadRemoteImage(imageUrl);
              if (uploaded) {
                images.push(uploaded);
                imageImportedCount++;
              } else if (/^https?:\/\//i.test(imageUrl)) {
                images.push(fallbackExternalImage(imageUrl));
              }
            }
          }

          await productService.createProduct(req.user!._id.toString(), {
            title,
            description,
            price,
            category: mapTypeToCategory(type),
            condition: 'new',
            tags,
            deliveryOption: 'pickup',
            pickupLocation: '',
            status: published ? 'active' : 'draft',
            images,
          });

          successCount++;
        } catch (err: any) {
          errors.push({ row: group.rowIndex, message: err.message || 'Validation failed' });
        }
      }
    } else {
      if (normalizedRows.length > 100) {
        throw ApiError.badRequest('Maximum 100 products can be imported at once');
      }

      for (const [index, row] of normalizedRows.entries()) {
        try {
          const title = getField(row, ['title', 'name', 'product_name', 'product title', 'item name', 'headline', 'handle']);
          const descriptionRaw = getField(row, ['description', 'body', 'body_html', 'details', 'summary', 'body (html)', 'long_description']);
          const description = descriptionRaw ? stripHtml(descriptionRaw) : '';
          const priceRaw = getField(row, ['price', 'sale_price', 'regular_price', 'amount', 'variant price']);
          const categoryRaw = getField(row, ['category', 'type', 'product_type', 'department', 'collection']);
          const conditionRaw = getField(row, ['condition', 'item_condition', 'state']);

          // Basic validation
          if (!title || !priceRaw) {
            errors.push({ row: index + 2, message: 'Missing required fields (title and price)' });
            continue;
          }

          const priceValue = Number(String(priceRaw).replace(/[^\d.]/g, ''));
          if (!Number.isFinite(priceValue) || priceValue <= 0) {
            errors.push({ row: index + 2, message: 'Invalid price value' });
            continue;
          }

          const tagsRaw = getField(row, ['tags', 'keywords', 'labels']);
          const tags = tagsRaw ? String(tagsRaw).split(',').map((t: string) => t.trim()).filter(Boolean) : [];

          const imageCandidates = [
            getField(row, ['image', 'image_url', 'image src', 'main_image', 'variant image']),
            getField(row, ['image_2', 'image2', 'additional_image_1']),
            getField(row, ['image_3', 'image3', 'additional_image_2']),
          ].filter(Boolean).slice(0, 5);
          const images: { url: string; publicId: string }[] = [];
          if (withImages) {
            for (const imageUrl of imageCandidates) {
              const uploaded = await tryUploadRemoteImage(imageUrl);
              if (uploaded) {
                images.push(uploaded);
                imageImportedCount++;
              } else if (/^https?:\/\//i.test(imageUrl)) {
                images.push(fallbackExternalImage(imageUrl));
              }
            }
          }

          await productService.createProduct(req.user!._id.toString(), {
            title,
            description,
            price: priceValue,
            category: mapTypeToCategory(categoryRaw),
            condition: normalizeCondition(conditionRaw || 'new'),
            tags,
            deliveryOption: getField(row, ['delivery_option', 'delivery option', 'delivery']) || 'pickup',
            pickupLocation: getField(row, ['pickup_location', 'pickup location', 'location']) || '',
            status: (getField(row, ['status', 'published']) || 'active').toLowerCase() === 'draft' ? 'draft' : 'active',
            images,
          });

          successCount++;
        } catch (err: any) {
          errors.push({ row: index + 2, message: err.message || 'Validation failed' });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `Imported ${successCount} products`,
      data: {
        successCount,
        errors,
        importMode: isShopifyCsv ? 'shopify' : 'generic',
        withImages,
        imagesImported: imageImportedCount,
      },
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

/**
 * @route   PATCH /api/products/bulk/status
 * @desc    Bulk update listing status for current seller
 * @access  Private (Seller/Admin)
 */
export const bulkUpdateProductStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productIds, status } = req.body as { productIds?: string[]; status?: string };

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw ApiError.badRequest('productIds array is required');
    }
    if (!['active', 'draft', 'sold'].includes(String(status))) {
      throw ApiError.badRequest('Status must be one of: active, draft, sold');
    }

    const safeIds = productIds.slice(0, 100);
    const result = await (await import('../models/Product')).default.updateMany(
      {
        _id: { $in: safeIds },
        seller: req.user!._id,
      },
      {
        $set: { status },
      }
    );

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} listings`,
      data: { modifiedCount: result.modifiedCount, matchedCount: result.matchedCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products/bulk/csv/preview
 * @desc    Preview CSV import quality before writing
 * @access  Private (Seller/Admin)
 */
export const previewProductsCSV = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No CSV file uploaded');
    }

    const fileContent = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, '');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    }) as Record<string, any>[];

    const headers = records.length > 0 ? Object.keys(records[0]) : [];

    const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
    const getField = (row: Record<string, any>, candidates: string[]): string => {
      const normalizedMap = new Map<string, any>();
      Object.keys(row).forEach((k) => normalizedMap.set(normalizeKey(k), row[k]));
      for (const candidate of candidates) {
        const val = normalizedMap.get(normalizeKey(candidate));
        if (val !== undefined && val !== null && String(val).trim().length > 0) return String(val).trim();
      }
      return '';
    };

    const isShopify = headers.some((h) => ['handle', 'variantprice', 'bodyhtml'].includes(normalizeKey(h)));

    let estimatedValid = 0;
    let estimatedInvalid = 0;

    if (isShopify) {
      const grouped = new Map<string, Record<string, any>[]>();
      records.forEach((row) => {
        const handle = String(row.Handle || row.handle || '').trim();
        if (!handle) return;
        if (!grouped.has(handle)) grouped.set(handle, []);
        grouped.get(handle)!.push(row);
      });

      grouped.forEach((rows) => {
        const first = rows.find((r) => !!String(r.Title || '').trim());
        const title = String(first?.Title || rows[0]?.Handle || '').trim();
        const priceRaw = String((rows.find((r) => Number(String(r['Variant Price'] || '').replace(/[^\d.]/g, '')) > 0)?.['Variant Price']) || '').replace(/[^\d.]/g, '');
        if (title && Number(priceRaw) > 0) estimatedValid++; else estimatedInvalid++;
      });
    } else {
      records.forEach((row) => {
        const title = getField(row, ['title', 'name', 'product_name', 'product title', 'item name', 'headline', 'handle']);
        const priceRaw = getField(row, ['price', 'sale_price', 'regular_price', 'amount', 'variant price']);
        if (title && Number(String(priceRaw).replace(/[^\d.]/g, '')) > 0) estimatedValid++; else estimatedInvalid++;
      });
    }

    const mappingHints = {
      title: ['title', 'name', 'product_name', 'product title', 'item name', 'headline', 'handle'],
      description: ['description', 'body', 'body_html', 'body (html)', 'details', 'summary', 'long_description'],
      price: ['price', 'sale_price', 'regular_price', 'amount', 'variant price'],
      category: ['category', 'type', 'product_type', 'department', 'collection'],
      condition: ['condition', 'item_condition', 'state'],
      tags: ['tags', 'keywords', 'labels'],
      image: ['image', 'image_url', 'image src', 'main_image', 'variant image', 'image src'],
    };

    res.status(200).json({
      success: true,
      message: 'CSV preview ready',
      data: {
        importMode: isShopify ? 'shopify' : 'generic',
        headers,
        totalRows: records.length,
        estimatedValid,
        estimatedInvalid,
        mappingHints,
        dryRunDiff: {
          toCreate: estimatedValid,
          skipped: estimatedInvalid,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/bulk/csv/errors-sample
 * @desc    Download CSV template for import error report format
 * @access  Private
 */
export const downloadImportErrorTemplate = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const csv = 'row,message\n2,Missing title\n9,Invalid price value\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="import-errors-template.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/products/bulk/details
 * @desc    Bulk operations: price, tags, category, duplicate, archive
 * @access  Private (Seller/Admin)
 */
export const bulkUpdateProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productIds, action, percent, tags, category } = req.body as {
      productIds?: string[];
      action?: 'price_adjust' | 'set_tags' | 'set_category' | 'duplicate' | 'archive';
      percent?: number;
      tags?: string[];
      category?: string;
    };

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw ApiError.badRequest('productIds is required');
    }
    if (!action) {
      throw ApiError.badRequest('action is required');
    }

    const result = await productService.bulkUpdateDetails(req.user!._id.toString(), {
      productIds,
      action,
      percent,
      tags,
      category,
    });

    res.status(200).json({
      success: true,
      message: 'Bulk operation completed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/recommendations
 * @desc    Get product recommendations (collaborative + category similarity)
 * @access  Public (optionally personalized when logged in)
 */
export const getRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
    const productId = req.query.productId as string | undefined;
    const userId = req.user?._id?.toString();
    const data = await productService.getRecommendations(userId, productId, limit);
    res.status(200).json({ success: true, message: 'Recommendations retrieved', data });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/:id/price-insights
 * @desc    Get market price range and deal label for a product
 * @access  Public
 */
export const getPriceInsights = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await productService.getPriceInsights(req.params.id);
    res.status(200).json({ success: true, message: 'Price insights retrieved', data });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/social/sold-feed
 * @desc    Get recent completed sales feed
 * @access  Public
 */
export const getSoldFeed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const data = await productService.getLiveSoldFeed(limit);
    res.status(200).json({ success: true, message: 'Sold feed retrieved', data });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/social/top-sellers
 * @desc    Get top sellers leaderboard
 * @access  Public
 */
export const getTopSellers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const data = await productService.getTopSellers(limit);
    res.status(200).json({ success: true, message: 'Top sellers retrieved', data });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/content/category-spotlights
 * @desc    Get auto-generated category spotlights
 * @access  Public
 */
export const getCategorySpotlights = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const data = await productService.getCategorySpotlights(limit);
    res.status(200).json({ success: true, message: 'Category spotlights retrieved', data });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/content/collections
 * @desc    Get generated storefront collections
 * @access  Public
 */
export const getCollections = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const data = await productService.getCollections(limit);
    res.status(200).json({ success: true, message: 'Collections retrieved', data });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/content/collections/:slug
 * @desc    Get one collection and its products
 * @access  Public
 */
export const getCollectionBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 24;
    const data = await productService.getCollectionBySlug(req.params.slug, limit);
    res.status(200).json({ success: true, message: 'Collection retrieved', data });
  } catch (error) {
    next(error);
  }
};
