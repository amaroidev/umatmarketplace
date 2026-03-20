import User, { IUserDocument } from '../models/User';
import { generateToken } from '../utils/jwt';
import ApiError from '../utils/ApiError';
import { verifySupabaseToken } from '../utils/supabaseJwt';

interface RegisterData {
  supabaseAccessToken: string;
  name: string;
  phone: string;
  role: 'buyer' | 'seller';
  studentId?: string;
  location?: string;
}

interface LoginData {
  supabaseAccessToken: string;
}

interface AuthResult {
  user: IUserDocument;
  token: string;
  isNewUser?: boolean;
  needsProfileCompletion?: boolean;
}

class AuthService {
  private async findOrLinkSupabaseUser(supabaseId: string, email: string): Promise<IUserDocument | null> {
    let user = await User.findOne({ supabaseId });
    if (user) return user;

    user = await User.findOne({ email: email.toLowerCase() });
    if (user && !user.supabaseId) {
      user.supabaseId = supabaseId;
      await user.save();
      return user;
    }

    return user;
  }

  private buildToken(user: IUserDocument): string {
    return generateToken({
      userId: user._id.toString(),
      role: user.role,
    });
  }

  private randomPassword(): string {
    return `${Math.random().toString(36).slice(-10)}${Math.random().toString(36).slice(-10)}`;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    const payload = await verifySupabaseToken(data.supabaseAccessToken);
    const supabaseId = payload.sub;
    const email = (payload.email || '').toLowerCase();
    if (!supabaseId || !email) {
      throw ApiError.badRequest('Invalid Supabase user token.');
    }

    const existingUser = await this.findOrLinkSupabaseUser(supabaseId, email);
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists. Please login instead.');
    }

    const metadataName = String(payload.user_metadata?.name || payload.user_metadata?.full_name || '').trim();
    const metadataAvatar = String(payload.user_metadata?.avatar_url || payload.user_metadata?.picture || '').trim();

    const user = await User.create({
      supabaseId,
      name: (data.name || metadataName || 'User').trim(),
      email,
      phone: data.phone || '',
      role: data.role || 'buyer',
      studentId: data.studentId || '',
      location: data.location || '',
      isVerified: true,
      avatar: metadataAvatar,
      password: this.randomPassword(),
    });

    const token = this.buildToken(user);

    return { user, token };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResult> {
    const payload = await verifySupabaseToken(data.supabaseAccessToken);
    const supabaseId = payload.sub;
    const email = (payload.email || '').toLowerCase();
    if (!supabaseId || !email) {
      throw ApiError.badRequest('Invalid Supabase user token.');
    }

    const user = await this.findOrLinkSupabaseUser(supabaseId, email);

    if (!user) {
      throw ApiError.unauthorized('No account found. Please sign up first.');
    }

    if (user.isBanned) {
      throw ApiError.forbidden(
        'Your account has been suspended. Contact admin for assistance.'
      );
    }

    const token = this.buildToken(user);

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
      storeName: string;
      brandName: string;
      sellerOnboarding: {
        completed?: boolean;
        payoutSetupComplete?: boolean;
        payoutMethod?: 'momo' | 'bank';
        payoutProvider?: string;
        payoutAccountName?: string;
        payoutAccountNumber?: string;
        identityStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
        identityDocumentUrl?: string;
        identitySubmittedAt?: Date;
        completedAt?: Date;
      };
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
  async googleLogin(credential: string, role?: 'buyer' | 'seller'): Promise<AuthResult> {
    const payload = await verifySupabaseToken(credential);
    const supabaseId = payload.sub;
    const email = (payload.email || '').toLowerCase();
    if (!supabaseId || !email) {
      throw ApiError.badRequest('Invalid Supabase user token.');
    }

    let user = await this.findOrLinkSupabaseUser(supabaseId, email);
    let isNewUser = false;

    const profileName = String(payload.user_metadata?.name || payload.user_metadata?.full_name || '').trim();
    const profileAvatar = String(payload.user_metadata?.avatar_url || payload.user_metadata?.picture || '').trim();
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName || 'Campus User')}&background=1f2937&color=ffffff&bold=true`;

    const normalizedRole = role && ['buyer', 'seller'].includes(role) ? role : undefined;

    if (!user) {
      if (!normalizedRole) {
        throw ApiError.badRequest('New Google accounts must sign up first and choose a role.');
      }

      user = await User.create({
        supabaseId,
        name: profileName || 'User',
        email,
        phone: '',
        role: normalizedRole,
        isVerified: true,
        avatar: profileAvatar || fallbackAvatar,
        password: this.randomPassword(),
      });
      isNewUser = true;
    } else {
      if (user.isBanned) {
        throw ApiError.forbidden('Your account has been suspended.');
      }

      let shouldSave = false;
      if (!user.avatar) {
        user.avatar = profileAvatar || fallbackAvatar;
        shouldSave = true;
      }
      if (!user.supabaseId) {
        user.supabaseId = supabaseId;
        shouldSave = true;
      }
      if (shouldSave) {
        await user.save();
      }

      if (normalizedRole && user.role !== normalizedRole) {
        user.role = normalizedRole;
        await user.save();
      }
    }

    const token = this.buildToken(user);
    const needsProfileCompletion = !user.phone || user.phone.trim().length < 10;

    return { user, token, isNewUser, needsProfileCompletion };
  }
}

export default new AuthService();
