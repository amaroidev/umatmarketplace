import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import env from '../config/env';
import { emailService } from '../services/email.service';
import User from '../models/User';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, phone, password, role, studentId, location } = req.body;

    const { user, token } = await authService.register({
      name,
      email,
      phone,
      password,
      role: role || 'buyer',
      studentId,
      location,
    });

    // Send Welcome Email asynchronously
    emailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const { user, token } = await authService.login({ email, password });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.getProfile(req.user!._id.toString());

    res.status(200).json({
      success: true,
      message: 'Profile fetched successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, avatar, studentId, location, bio } = req.body;

    const user = await authService.updateProfile(req.user!._id.toString(), {
      name,
      phone,
      avatar,
      studentId,
      location,
      bio,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(
      req.user!._id.toString(),
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear cookie)
 * @access  Private
 */
export const logout = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * @route   PUT /api/auth/settings/notifications
 * @desc    Update notification preferences
 * @access  Private
 */
export const updateNotificationSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderUpdates, messages, reviews, promotions, systemAlerts } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      {
        $set: {
          'notificationPrefs.orderUpdates': orderUpdates,
          'notificationPrefs.messages': messages,
          'notificationPrefs.reviews': reviews,
          'notificationPrefs.promotions': promotions,
          'notificationPrefs.systemAlerts': systemAlerts,
        },
      },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Notification preferences updated.', data: { user } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/settings/privacy
 * @desc    Update privacy preferences
 * @access  Private
 */
export const updatePrivacySettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { showPhone, showLocation, allowMessages, showOnlineStatus, responseTimeMinutes } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      {
        $set: {
          'privacyPrefs.showPhone': showPhone,
          'privacyPrefs.showLocation': showLocation,
          'privacyPrefs.allowMessages': allowMessages,
          'privacyPrefs.showOnlineStatus': showOnlineStatus,
          ...(responseTimeMinutes !== undefined ? { responseTimeMinutes } : {}),
        },
      },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Privacy settings updated.', data: { user } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account (requires password confirmation)
 * @access  Private
 */
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { password } = req.body;
    if (!password) {
      res.status(400).json({ success: false, message: 'Password is required to delete your account.' });
      return;
    }

    // Load user with password field
    const user = await User.findById(req.user!._id).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Incorrect password.' });
      return;
    }

    await User.findByIdAndDelete(req.user!._id);

    res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
    res.status(200).json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/google
 * @desc    Login/Register via Google
 * @access  Public
 */
export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { credential, role } = req.body;
    if (!credential) {
      res.status(400).json({ success: false, message: 'Google credential missing' });
      return;
    }

    const { user, token } = await authService.googleLogin(credential, role);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Google login successful.',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};
