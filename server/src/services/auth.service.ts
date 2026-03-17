import User, { IUserDocument } from '../models/User';
import { generateToken } from '../utils/jwt';
import ApiError from '../utils/ApiError';
import { OAuth2Client } from 'google-auth-library';
import env from '../config/env';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'buyer' | 'seller';
  studentId?: string;
  location?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResult {
  user: IUserDocument;
  token: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    const { email } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists.');
    }

    // Create user
    const user = await User.create({
      ...data,
      email: email.toLowerCase(),
    });

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    });

    return { user, token };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResult> {
    const { email, password } = data;

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    if (user.isBanned) {
      throw ApiError.forbidden(
        'Your account has been suspended. Contact admin for assistance.'
      );
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    });

    return { user, token };
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: Partial<{
      name: string;
      phone: string;
      avatar: string;
      studentId: string;
      location: string;
      bio: string;
    }>
  ): Promise<IUserDocument> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    return user;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect.');
    }

    // Update password
    user.password = newPassword;
    await user.save();
  }
  /**
   * Google Login
   */
  async googleLogin(credential: string, role: 'buyer' | 'seller' = 'buyer'): Promise<AuthResult> {
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      if (!payload || !payload.email) {
        throw ApiError.badRequest('Invalid Google token');
      }

      const email = payload.email.toLowerCase();
      let user = await User.findOne({ email });

      if (!user) {
        // Create a new user since they don't exist
        // Google doesn't provide phone/studentId so we'll use defaults or leave them blank
        user = await User.create({
          name: payload.name || 'User',
          email,
          role,
          isVerified: payload.email_verified || false,
          avatar: payload.picture,
          // random strong password since they use Google
          password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
        });
      } else {
        // If user is banned
        if (user.isBanned) {
          throw ApiError.forbidden('Your account has been suspended.');
        }
        
        // Ensure avatar is updated if they didn't have one
        if (!user.avatar && payload.picture) {
          user.avatar = payload.picture;
          await user.save();
        }
      }

      const token = generateToken({
        userId: user._id.toString(),
        role: user.role,
      });

      return { user, token };
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw ApiError.unauthorized('Google authentication failed');
    }
  }
}

export default new AuthService();
