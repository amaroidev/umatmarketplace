import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
  uploadAvatar,
  changePassword,
  logout,
  updateNotificationSettings,
  updatePrivacySettings,
  deleteAccount,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../utils/imageUpload';

const router = Router();

// @route   POST /api/auth/register
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['buyer', 'seller'])
      .withMessage('Role must be buyer or seller'),
    validate,
  ],
  register
);

// @route   POST /api/auth/login
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

// @route   POST /api/auth/google
router.post('/google', googleLogin);

// @route   GET /api/auth/me
router.get('/me', authenticate, getMe);

// @route   PUT /api/auth/profile
router.put(
  '/profile',
  authenticate,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('phone').optional().trim(),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    body('storeName')
      .optional()
      .trim()
      .isLength({ max: 80 })
      .withMessage('Store name cannot exceed 80 characters'),
    body('brandName')
      .optional()
      .trim()
      .isLength({ max: 80 })
      .withMessage('Brand name cannot exceed 80 characters'),
    validate,
  ],
  updateProfile
);

// @route   POST /api/auth/profile/avatar
router.post('/profile/avatar', authenticate, upload.single('avatar'), uploadAvatar);

// @route   PUT /api/auth/change-password
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
    validate,
  ],
  changePassword
);

// @route   POST /api/auth/logout
router.post('/logout', authenticate, logout);

// @route   PUT /api/auth/settings/notifications
router.put('/settings/notifications', authenticate, updateNotificationSettings);

// @route   PUT /api/auth/settings/privacy
router.put('/settings/privacy', authenticate, updatePrivacySettings);

// @route   DELETE /api/auth/account
router.delete('/account', authenticate, deleteAccount);

export default router;
