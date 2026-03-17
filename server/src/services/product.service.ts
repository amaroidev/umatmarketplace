import mongoose from 'mongoose';
import Product, { IProductDocument } from '../models/Product';
import Category from '../models/Category';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import {
  uploadMultipleToCloudinary,
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
    },
    files?: Express.Multer.File[]
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
    if (files && files.length > 0) {
      images = await uploadMultipleToCloudinary(files);
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
    });

    await product.save();

    // Populate and return
    return product.populate([
      { path: 'category', select: 'name slug icon' },
      { path: 'seller', select: 'name avatar isVerified location' },
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
        .populate('seller', 'name avatar isVerified location')
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
      .populate('seller', 'name avatar isVerified location bio createdAt');

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
    },
    files?: Express.Multer.File[]
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
      const newImages = await uploadMultipleToCloudinary(files);
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
      { path: 'seller', select: 'name avatar isVerified location' },
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
      { path: 'seller', select: 'name avatar isVerified location' },
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
      { path: 'seller', select: 'name avatar isVerified location' },
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
      .populate('seller', 'name avatar isVerified location');
  }

  /**
   * Get recent products
   */
  async getRecentProducts(limit: number = 12): Promise<IProductDocument[]> {
    return Product.find({ status: 'active', isFlagged: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('category', 'name slug icon')
      .populate('seller', 'name avatar isVerified location');
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
      .populate('seller', 'name avatar isVerified location');
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
      .populate('seller', 'name avatar isVerified location');
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
}

export default new ProductService();
