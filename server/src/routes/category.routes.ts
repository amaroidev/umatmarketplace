import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  getCategoriesWithCounts,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authenticate } from '../middleware/auth';
import { isAdmin } from '../middleware/roleCheck';
import { validate } from '../middleware/validate';

const router = Router();

// @route   GET /api/categories
router.get('/', getCategories);

// @route   GET /api/categories/with-counts
router.get('/with-counts', getCategoriesWithCounts);

// @route   GET /api/categories/:slug
router.get('/:slug', getCategoryBySlug);

// @route   POST /api/categories (Admin only)
router.post(
  '/',
  authenticate,
  isAdmin,
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('description').optional().trim(),
    validate,
  ],
  createCategory
);

// @route   PUT /api/categories/:id (Admin only)
router.put('/:id', authenticate, isAdmin, updateCategory);

// @route   DELETE /api/categories/:id (Admin only)
router.delete('/:id', authenticate, isAdmin, deleteCategory);

export default router;
