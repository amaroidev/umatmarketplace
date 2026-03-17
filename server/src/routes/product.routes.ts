import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getFeaturedProducts,
  getRecentProducts,
  getTrendingProducts,
  getSearchSuggestions,
  getMyListings,
  getProductById,
  getRelatedProducts,
  updateProduct,
  deleteProductImages,
  deleteProduct,
  flagProduct,
  toggleFeatured,
  importProductsCSV,
  duplicateProduct,
} from '../controllers/product.controller';
import { authenticate } from '../middleware/auth';
import { isSeller, isAdmin } from '../middleware/roleCheck';
import { upload } from '../utils/imageUpload';
import { csvUpload } from '../utils/csvUpload';

const router = Router();

// ========================
// Public routes
// ========================

// GET /api/products — list with filters
router.get('/', getProducts);

// GET /api/products/featured — featured products
router.get('/featured', getFeaturedProducts);

// GET /api/products/recent — recent products
router.get('/recent', getRecentProducts);

// GET /api/products/trending — trending/popular products
router.get('/trending', getTrendingProducts);

// GET /api/products/search/suggestions — autocomplete
router.get('/search/suggestions', getSearchSuggestions);

// GET /api/products/:id — single product detail
router.get('/:id', getProductById);

// GET /api/products/:id/related — related products
router.get('/:id/related', getRelatedProducts);

// ========================
// Authenticated routes
// ========================

// POST /api/products/bulk/csv — bulk import products via CSV
router.post(
  '/bulk/csv',
  authenticate,
  isSeller,
  csvUpload.single('csvFile'),
  importProductsCSV
);

// POST /api/products/:id/duplicate — duplicate a product
router.post('/:id/duplicate', authenticate, isSeller, duplicateProduct);

// POST /api/products — create product (seller/admin)
router.post(
  '/',
  authenticate,
  isSeller,
  upload.array('images', 5),
  createProduct
);

// GET /api/products/my/listings — get current user's listings
router.get('/my/listings', authenticate, isSeller, getMyListings);

// PUT /api/products/:id — update product (owner/admin)
router.put(
  '/:id',
  authenticate,
  upload.array('images', 5),
  updateProduct
);

// DELETE /api/products/:id/images — remove specific images
router.delete('/:id/images', authenticate, deleteProductImages);

// DELETE /api/products/:id — delete product (owner/admin)
router.delete('/:id', authenticate, deleteProduct);

// POST /api/products/:id/flag — report a product
router.post('/:id/flag', authenticate, flagProduct);

// PATCH /api/products/:id/featured — toggle featured (admin)
router.patch('/:id/featured', authenticate, isAdmin, toggleFeatured);

export default router;
