import mongoose from 'mongoose';
import Product, { IProductDocument } from '../models/Product';
import Category from '../models/Category';
import User from '../models/User';
import Order from '../models/Order';
import ApiError from '../utils/ApiError';
import {
  uploadMultipleWithFallback,
  deleteMultipleFromCloudinary,
} from '../utils/imageUpload';
import notificationService from './notification.service';

interface ProductFilters {
  category?: string;
  condition?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  seller?: string;
  search?: string;
  deliveryOption?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResult {
  products: IProductDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ProductService {
  private async resolveCategoryId(categoryInput: string): Promise<string> {
    if (mongoose.Types.ObjectId.isValid(categoryInput)) {
      const existing = await Category.findById(categoryInput);
      if (existing) return existing._id.toString();
    }

    const category = await Category.findOne({
      $or: [
        { slug: categoryInput.toLowerCase().trim() },
        { name: { $regex: `^${categoryInput.trim()}$`, $options: 'i' } },
      ],
    });

    if (!category) {
      throw ApiError.badRequest('Invalid category');
    }

    return category._id.toString();
  }

  /**
   * Create a new product listing
   */
  async createProduct(
    sellerId: string,
    data: {
      title: string;
      description: string;
      price: number;
      category: string;
      condition: string;
      deliveryOption?: string;
      pickupLocation?: string;
      tags?: string[];
      status?: string;
      stock?: number;
      availableFrom?: string;
      availableUntil?: string;
      flashSalePrice?: number;
      flashSaleEndsAt?: string;
      images?: { url: string; publicId: string }[];
    },
    files?: Express.Multer.File[],
    reqMeta?: { protocol: string; host: string }
  ): Promise<IProductDocument> {
    const resolvedCategoryId = await this.resolveCategoryId(data.category);

    // Validate category exists
    const categoryExists = await Category.findById(resolvedCategoryId);
    if (!categoryExists) {
      throw ApiError.badRequest('Invalid category');
    }
    if (!categoryExists.isActive) {
      throw ApiError.badRequest('This category is currently disabled');
    }

    // Upload images if provided
    let images: { url: string; publicId: string }[] = [];
    if (data.images && data.images.length > 0) {
      images = data.images.slice(0, 5);
    }
    if (files && files.length > 0) {
      if (!reqMeta) {
        throw ApiError.badRequest('Request context missing for image upload.');
      }
      images = await uploadMultipleWithFallback(files, reqMeta);
    }

    // Sanitize tags
    const tags = data.tags
      ? data.tags
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0)
          .slice(0, 10)
      : [];

    const product = new Product({
      title: data.title,
      description: data.description,
      price: data.price,
      category: resolvedCategoryId,
      seller: sellerId,
      images,
      condition: data.condition,
      status: data.status || 'active',
      deliveryOption: data.deliveryOption || 'pickup',
      pickupLocation: data.pickupLocation || '',
      tags,
      stock: data.stock ?? 1,
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
      availableUntil: data.availableUntil ? new Date(data.availableUntil) : undefined,
      flashSalePrice: data.flashSalePrice,
      flashSaleEndsAt: data.flashSaleEndsAt ? new Date(data.flashSaleEndsAt) : undefined,
    });

    await product.save();

    // Populate and return
    return product.populate([
      { path: 'category', select: 'name slug icon' },
      { path: 'seller', select: 'name storeName brandName avatar isVerified location' },
    ]);
  }

  /**
   * Get products with filtering, sorting, and pagination
   */
  async getProducts(filters: ProductFilters): Promise<PaginatedResult> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, any> = {};

    // Only show active products by default (unless admin specifies otherwise)
    if (filters.status) {
      query.status = filters.status;
    } else {
      query.status = 'active';
    }

    // Category filter
    if (filters.category) {
      // Support both ID and slug
      if (mongoose.Types.ObjectId.isValid(filters.category)) {
        query.category = filters.category;
      } else {
        const cat = await Category.findOne({ slug: filters.category });
        if (cat) {
          query.category = cat._id;
        }
      }
    }

    // Condition filter
    if (filters.condition) {
      query.condition = filters.condition;
    }

    // Delivery option filter
    if (filters.deliveryOption) {
      query.deliveryOption = filters.deliveryOption;
    }

    // Price range
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) {
        query.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.price.$lte = filters.maxPrice;
      }
    }

    // Seller filter
    if (filters.seller) {
      query.seller = filters.seller;
    }

    // Text search
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Don't show flagged products in public queries
    if (!filters.status || filters.status === 'active') {
      query.isFlagged = false;
    }

    // Sort
    let sortOption: Record<string, any> = { createdAt: -1 }; // default: newest first
    if (filters.sort) {
      switch (filters.sort) {
        case 'price-asc':
          sortOption = { price: 1 };
          break;
        case 'price-desc':
          sortOption = { price: -1 };
          break;
        case 'oldest':
          sortOption = { createdAt: 1 };
          break;
        case 'popular':
          sortOption = { views: -1 };
          break;
        case 'featured':
          sortOption = { isFeatured: -1, createdAt: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }

    // If text search, add text score sorting
    if (filters.search) {
      sortOption = { score: { $meta: 'textScore' }, ...sortOption };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug icon')
        .populate('seller', 'name storeName brandName avatar isVerified location')
        .lean(),
      Product.countDocuments(query),
    ]);

    return {
      products: products as unknown as IProductDocument[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single product by ID (increments view count)
   */
  async getProductById(
    productId: string,
    incrementView: boolean = true
  ): Promise<IProductDocument> {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw ApiError.notFound('Product not found');
    }

    const product = await Product.findById(productId)
      .populate('category', 'name slug icon description')
      .populate('seller', 'name storeName brandName avatar isVerified location bio createdAt');

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Increment view count (non-blocking)
    if (incrementView && product.status === 'active') {
      Product.findByIdAndUpdate(productId, { $inc: { views: 1 } }).exec();
    }

    return product;
  }

  /**
   * Update a product (owner or admin only)
   */
  async updateProduct(
    productId: string,
    userId: string,
    userRole: string,
    data: {
      title?: string;
      description?: string;
      price?: number;
      category?: string;
      condition?: string;
      status?: string;
      deliveryOption?: string;
      pickupLocation?: string;
      tags?: string[];
      stock?: number;
      availableFrom?: string;
      availableUntil?: string;
      flashSalePrice?: number;
      flashSaleEndsAt?: string;
    },
    files?: Express.Multer.File[],
    reqMeta?: { protocol: string; host: string }
  ): Promise<IProductDocument> {
    const product = await Product.findById(productId);

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    const previousPrice = product.price;

    // Check ownership (sellers can edit own products, admins can edit any)
    if (product.seller.toString() !== userId && userRole !== 'admin') {
      throw ApiError.forbidden('You can only edit your own products');
    }

    // Validate category if changing
    if (data.category) {
      data.category = await this.resolveCategoryId(data.category);
      const categoryExists = await Category.findById(data.category);
      if (!categoryExists || !categoryExists.isActive) {
        throw ApiError.badRequest('Invalid or disabled category');
      }
    }

    // Upload new images if provided
    if (files && files.length > 0) {
      const totalImages = product.images.length + files.length;
      if (totalImages > 5) {
        throw ApiError.badRequest(
          `Cannot have more than 5 images. You have ${product.images.length}, trying to add ${files.length}.`
        );
      }
      if (!reqMeta) {
        throw ApiError.badRequest('Request context missing for image upload.');
      }
      const newImages = await uploadMultipleWithFallback(files, reqMeta);
      product.images.push(...newImages);
    }

    // Sanitize tags
    if (data.tags) {
      data.tags = data.tags
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0)
        .slice(0, 10);
    }

    // Apply updates
    const allowedFields = [
      'title',
      'description',
      'price',
      'category',
      'condition',
      'status',
      'deliveryOption',
      'pickupLocation',
      'tags',
      'stock',
      'availableFrom',
      'availableUntil',
      'flashSalePrice',
      'flashSaleEndsAt',
    ];

    for (const field of allowedFields) {
      if ((data as any)[field] !== undefined) {
        (product as any)[field] = (data as any)[field];
      }
    }

    await product.save();

    if (data.price !== undefined && data.price < previousPrice) {
      const savedByUsers = await User.find({ savedItems: product._id }).select('_id');
      await Promise.all(
        savedByUsers.map((savedUser) =>
          notificationService.create(
            savedUser._id.toString(),
            'system',
            'Price Drop Alert',
            `${product.title} just dropped from GHS ${previousPrice.toLocaleString('en-GH')} to GHS ${product.price.toLocaleString('en-GH')}`,
            `/products/${product._id}`,
            { productId: product._id.toString(), previousPrice, newPrice: product.price }
          )
        )
      );
    }

    return product.populate([
      { path: 'category', select: 'name slug icon' },
      { path: 'seller', select: 'name storeName brandName avatar isVerified location' },
    ]);
  }

  /**
   * Delete specific images from a product
   */
  async deleteProductImages(
    productId: string,
    userId: string,
    userRole: string,
    publicIds: string[]
  ): Promise<IProductDocument> {
    const product = await Product.findById(productId);

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    if (product.seller.toString() !== userId && userRole !== 'admin') {
      throw ApiError.forbidden('You can only edit your own products');
    }

    // Filter out images to delete
    const imagesToDelete = product.images.filter((img) =>
      publicIds.includes(img.publicId)
    );

    if (imagesToDelete.length === 0) {
      throw ApiError.badRequest('No matching images found to delete');
    }

    // Delete from Cloudinary
    await deleteMultipleFromCloudinary(imagesToDelete.map((img) => img.publicId));

    // Remove from product
    product.images = product.images.filter(
      (img) => !publicIds.includes(img.publicId)
    );

    await product.save();

    return product.populate([
      { path: 'category', select: 'name slug icon' },
      { path: 'seller', select: 'name storeName brandName avatar isVerified location' },
    ]);
  }

  /**
   * Delete a product (owner or admin)
   */
  async deleteProduct(
    productId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const product = await Product.findById(productId);

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    if (product.seller.toString() !== userId && userRole !== 'admin') {
      throw ApiError.forbidden('You can only delete your own products');
    }

    // Delete all images from Cloudinary
    if (product.images.length > 0) {
      await deleteMultipleFromCloudinary(
        product.images.map((img) => img.publicId)
      );
    }

    await Product.findByIdAndDelete(productId);
  }

  /**
   * Get products by seller (for "My Listings" page)
   */
  async getSellerProducts(
    sellerId: string,
    filters: ProductFilters
  ): Promise<PaginatedResult> {
    return this.getProducts({
      ...filters,
      seller: sellerId,
      status: filters.status || undefined, // Show all statuses for own products
    });
  }

  /**
   * Flag a product (report)
   */
  async flagProduct(
    productId: string,
    reason: string
  ): Promise<IProductDocument> {
    const product = await Product.findById(productId);

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    product.isFlagged = true;
    product.flagReason = reason;
    await product.save();

    return product;
  }

  /**
   * Toggle featured status (admin only)
   */
  async toggleFeatured(productId: string): Promise<IProductDocument> {
    const product = await Product.findById(productId);

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    return product.populate([
      { path: 'category', select: 'name slug icon' },
      { path: 'seller', select: 'name storeName brandName avatar isVerified location' },
    ]);
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 8): Promise<IProductDocument[]> {
    return Product.find({ status: 'active', isFeatured: true, isFlagged: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('category', 'name slug icon')
      .populate('seller', 'name storeName brandName avatar isVerified location');
  }

  /**
   * Get recent products
   */
  async getRecentProducts(limit: number = 12): Promise<IProductDocument[]> {
    return Product.find({ status: 'active', isFlagged: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('category', 'name slug icon')
      .populate('seller', 'name storeName brandName avatar isVerified location');
  }

  /**
   * Search suggestions (autocomplete) — returns matching product titles and tags
   */
  async getSearchSuggestions(
    query: string,
    limit: number = 8
  ): Promise<{ title: string; type: 'product' | 'tag' }[]> {
    if (!query || query.trim().length < 2) return [];

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    // Find matching product titles
    const products = await Product.find({
      status: 'active',
      isFlagged: false,
      title: regex,
    })
      .select('title')
      .limit(limit)
      .lean();

    const suggestions: { title: string; type: 'product' | 'tag' }[] = products.map(
      (p) => ({ title: p.title, type: 'product' as const })
    );

    // Find matching tags (distinct)
    const tagResults = await Product.aggregate([
      { $match: { status: 'active', isFlagged: false } },
      { $unwind: '$tags' },
      { $match: { tags: regex } },
      { $group: { _id: '$tags' } },
      { $limit: 5 },
    ]);

    tagResults.forEach((t) => {
      suggestions.push({ title: t._id, type: 'tag' });
    });

    // De-duplicate by lowercase title and limit
    const seen = new Set<string>();
    return suggestions.filter((s) => {
      const key = s.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit);
  }

  /**
   * Get trending/popular products (most viewed in recent time)
   */
  async getTrendingProducts(limit: number = 12): Promise<IProductDocument[]> {
    return Product.find({ status: 'active', isFlagged: false })
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .populate('category', 'name slug icon')
      .populate('seller', 'name storeName brandName avatar isVerified location');
  }

  /**
   * Get related products (same category, different product)
   */
  async getRelatedProducts(
    productId: string,
    limit: number = 6
  ): Promise<IProductDocument[]> {
    const product = await Product.findById(productId);
    if (!product) return [];

    return Product.find({
      _id: { $ne: productId },
      category: product.category,
      status: 'active',
      isFlagged: false,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('category', 'name slug icon')
      .populate('seller', 'name storeName brandName avatar isVerified location');
  }

  async getRecommendations(
    userId?: string,
    productId?: string,
    limit: number = 8
  ): Promise<IProductDocument[]> {
    const safeLimit = Math.min(20, Math.max(1, limit));
    const baseQuery: Record<string, any> = { status: 'active', isFlagged: false };

    // If product context exists, use category and tags similarity first
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      const context = await Product.findById(productId).select('category tags');
      if (context) {
        const tagQuery = context.tags.length > 0 ? { tags: { $in: context.tags.slice(0, 5) } } : {};
        const scoped = await Product.find({
          ...baseQuery,
          _id: { $ne: productId },
          $or: [{ category: context.category }, tagQuery],
        })
          .sort({ views: -1, createdAt: -1 })
          .limit(safeLimit)
          .populate('category', 'name slug icon')
          .populate('seller', 'name storeName brandName avatar isVerified location');
        if (scoped.length >= safeLimit) return scoped;
      }
    }

    // If user context exists, infer from saved items categories
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId).select('savedItems');
      if (user && user.savedItems.length > 0) {
        const savedProducts = await Product.find({ _id: { $in: user.savedItems } }).select('category');
        const categoryIds = [...new Set(savedProducts.map((p) => p.category.toString()))]
          .map((id) => new mongoose.Types.ObjectId(id));
        if (categoryIds.length > 0) {
          const personalized = await Product.find({
            ...baseQuery,
            ...(productId ? { _id: { $ne: productId } } : {}),
            category: { $in: categoryIds },
          })
            .sort({ views: -1, createdAt: -1 })
            .limit(safeLimit)
            .populate('category', 'name slug icon')
            .populate('seller', 'name storeName brandName avatar isVerified location');
          if (personalized.length > 0) return personalized;
        }
      }
    }

    // Fallback to trending
    return Product.find(baseQuery)
      .sort({ views: -1, createdAt: -1 })
      .limit(safeLimit)
      .populate('category', 'name slug icon')
      .populate('seller', 'name storeName brandName avatar isVerified location');
  }

  async getPriceInsights(productId: string): Promise<{
    productPrice: number;
    min: number;
    max: number;
    average: number;
    median: number;
    sampleSize: number;
    dealLabel: 'great_deal' | 'fair_price' | 'premium';
  }> {
    const product = await Product.findById(productId).select('price category');
    if (!product) throw ApiError.notFound('Product not found');

    const peers = await Product.find({
      category: product.category,
      status: { $in: ['active', 'sold'] },
      isFlagged: false,
    })
      .select('price')
      .sort({ price: 1 })
      .lean();

    const prices = peers.map((p) => p.price).filter((p) => typeof p === 'number');
    if (prices.length === 0) {
      return {
        productPrice: product.price,
        min: product.price,
        max: product.price,
        average: product.price,
        median: product.price,
        sampleSize: 1,
        dealLabel: 'fair_price',
      };
    }

    const min = prices[0];
    const max = prices[prices.length - 1];
    const average = prices.reduce((sum, n) => sum + n, 0) / prices.length;
    const middle = Math.floor(prices.length / 2);
    const median = prices.length % 2 === 0 ? (prices[middle - 1] + prices[middle]) / 2 : prices[middle];

    let dealLabel: 'great_deal' | 'fair_price' | 'premium' = 'fair_price';
    if (product.price <= average * 0.88) dealLabel = 'great_deal';
    if (product.price >= average * 1.15) dealLabel = 'premium';

    return {
      productPrice: product.price,
      min,
      max,
      average,
      median,
      sampleSize: prices.length,
      dealLabel,
    };
  }

  async getLiveSoldFeed(limit: number = 10): Promise<any[]> {
    const safeLimit = Math.min(30, Math.max(1, limit));
    const soldOrders = await Order.find({ status: 'completed' })
      .sort({ completedAt: -1, updatedAt: -1 })
      .limit(safeLimit)
      .populate('seller', 'name isVerified')
      .lean();

    return soldOrders.map((order: any) => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      completedAt: order.completedAt || order.updatedAt,
      seller: order.seller,
      itemTitle: order.items?.[0]?.title || 'Item',
      itemPrice: order.items?.[0]?.price || order.totalAmount,
      totalAmount: order.totalAmount,
    }));
  }

  async getTopSellers(limit: number = 10): Promise<any[]> {
    const safeLimit = Math.min(20, Math.max(1, limit));

    const leaderboard = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$seller',
          totalRevenue: { $sum: '$totalAmount' },
          totalSales: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
      { $sort: { totalRevenue: -1, totalSales: -1 } },
      { $limit: safeLimit },
    ]);

    const sellerIds = leaderboard.map((s) => s._id);
    const sellers = await User.find({ _id: { $in: sellerIds } }).select('name avatar isVerified responseTimeMinutes');
    const sellerMap = new Map(sellers.map((s) => [s._id.toString(), s]));

    return leaderboard.map((entry) => ({
      seller: sellerMap.get(entry._id.toString()) || null,
      totalRevenue: entry.totalRevenue,
      totalSales: entry.totalSales,
      avgOrderValue: entry.avgOrderValue,
    }));
  }

  async getCategorySpotlights(limit: number = 6): Promise<any[]> {
    const safeLimit = Math.min(12, Math.max(1, limit));
    const categories = await Category.find({ isActive: true }).select('name slug icon').lean();

    const counts = await Product.aggregate([
      { $match: { status: 'active', isFlagged: false } },
      { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
      { $sort: { count: -1 } },
      { $limit: safeLimit },
    ]);

    const categoryMap = new Map(categories.map((c: any) => [c._id.toString(), c]));
    return counts
      .map((item) => ({
        category: categoryMap.get(item._id.toString()),
        listingCount: item.count,
        avgPrice: item.avgPrice,
      }))
      .filter((item) => !!item.category);
  }

  async getCollections(limit: number = 6): Promise<any[]> {
    const safeLimit = Math.min(20, Math.max(1, limit));
    const categories = await Category.find({ isActive: true }).select('name slug icon').lean();
    const counts = await Product.aggregate([
      { $match: { status: 'active', isFlagged: false } },
      { $group: { _id: '$category', listingCount: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
      { $sort: { listingCount: -1 } },
      { $limit: safeLimit },
    ]);

    const categoryMap = new Map(categories.map((c: any) => [c._id.toString(), c]));
    const collections: any[] = [];

    for (const item of counts) {
      const category = categoryMap.get(item._id.toString());
      if (!category) continue;

      const hero = await Product.findOne({
        category: category._id,
        status: 'active',
        isFlagged: false,
      })
        .sort({ views: -1, createdAt: -1 })
        .select('title price images')
        .lean();

      collections.push({
        slug: `${category.slug}-essentials`,
        title: `${category.name} Essentials`,
        description: `Most active ${category.name.toLowerCase()} listings this week on campus.`,
        categorySlug: category.slug,
        listingCount: item.listingCount,
        avgPrice: item.avgPrice,
        hero: hero
          ? {
              productId: hero._id,
              title: hero.title,
              price: hero.price,
              image: hero.images?.[0]?.url || null,
            }
          : null,
      });
    }

    return collections;
  }

  async getCollectionBySlug(slug: string, productLimit: number = 24): Promise<any> {
    const collections = await this.getCollections(30);
    const collection = collections.find((item) => item.slug === slug);
    if (!collection) {
      throw ApiError.notFound('Collection not found');
    }

    const productsResult = await this.getProducts({
      category: collection.categorySlug,
      sort: 'popular',
      page: 1,
      limit: Math.min(50, Math.max(1, productLimit)),
    });

    return {
      ...collection,
      products: productsResult.products,
      pagination: productsResult.pagination,
    };
  }

  /**
   * Duplicate a product
   */
  async duplicateProduct(productId: string, userId: string): Promise<IProductDocument> {
    const original = await Product.findById(productId);
    if (!original) {
      throw ApiError.notFound('Original product not found');
    }

    if (original.seller.toString() !== userId) {
      throw ApiError.forbidden('You can only duplicate your own listings');
    }

    // Prepare duplicate data
    const duplicateData = {
      title: `${original.title} (Copy)`,
      description: original.description,
      price: original.price,
      category: original.category,
      condition: original.condition,
      images: original.images,
      tags: original.tags,
      deliveryOption: original.deliveryOption,
      pickupLocation: original.pickupLocation,
      seller: userId,
      status: 'draft',
    };

    const newProduct = await Product.create(duplicateData);
    return newProduct;
  }

  async bulkUpdateDetails(
    sellerId: string,
    payload: {
      productIds: string[];
      action: 'price_adjust' | 'set_tags' | 'set_category' | 'duplicate' | 'archive';
      percent?: number;
      tags?: string[];
      category?: string;
    }
  ): Promise<{ modifiedCount: number; duplicatedCount: number }> {
    const ids = payload.productIds.slice(0, 100);
    const baseQuery = { _id: { $in: ids }, seller: sellerId };

    if (payload.action === 'archive') {
      const result = await Product.updateMany(baseQuery, { $set: { status: 'removed' } });
      return { modifiedCount: result.modifiedCount, duplicatedCount: 0 };
    }

    if (payload.action === 'set_category') {
      if (!payload.category) throw ApiError.badRequest('category is required');
      const categoryId = await this.resolveCategoryId(payload.category);
      const result = await Product.updateMany(baseQuery, { $set: { category: categoryId } });
      return { modifiedCount: result.modifiedCount, duplicatedCount: 0 };
    }

    if (payload.action === 'set_tags') {
      const tags = (payload.tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 10);
      const result = await Product.updateMany(baseQuery, { $set: { tags } });
      return { modifiedCount: result.modifiedCount, duplicatedCount: 0 };
    }

    if (payload.action === 'price_adjust') {
      if (payload.percent === undefined || !Number.isFinite(payload.percent)) {
        throw ApiError.badRequest('percent is required for price_adjust');
      }
      const products = await Product.find(baseQuery).select('price');
      let modifiedCount = 0;
      for (const p of products) {
        const nextPrice = Math.max(0.5, Number((p.price * (1 + payload.percent / 100)).toFixed(2)));
        if (nextPrice !== p.price) {
          p.price = nextPrice;
          await p.save();
          modifiedCount++;
        }
      }
      return { modifiedCount, duplicatedCount: 0 };
    }

    if (payload.action === 'duplicate') {
      const products = await Product.find(baseQuery).select('_id');
      let duplicatedCount = 0;
      for (const p of products) {
        await this.duplicateProduct(p._id.toString(), sellerId);
        duplicatedCount++;
      }
      return { modifiedCount: 0, duplicatedCount };
    }

    throw ApiError.badRequest('Unsupported bulk action');
  }
}

export default new ProductService();
