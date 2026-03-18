import api from './api';

export interface RegisterData {
  supabaseAccessToken: string;
  name: string;
  phone: string;
  role: 'buyer' | 'seller';
  studentId?: string;
  location?: string;
}

export interface LoginData {
  supabaseAccessToken: string;
}

export interface UpdateProfileData {
  name?: string;
  storeName?: string;
  brandName?: string;
  phone?: string;
  avatar?: string;
  studentId?: string;
  location?: string;
  bio?: string;
}

export interface SellerOnboardingData {
  storeName?: string;
  brandName?: string;
  responseTimeMinutes?: number;
  payoutMethod?: 'momo' | 'bank';
  payoutProvider?: string;
  payoutAccountName?: string;
  payoutAccountNumber?: string;
  identityDocumentUrl?: string;
  identityStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  completed?: boolean;
}

export interface ChangePasswordData {
  currentPassword?: string;
  newPassword?: string;
}

const authService = {
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  googleLogin: async (credential: string, role: 'buyer' | 'seller' = 'buyer') => {
    const response = await api.post('/auth/google', { credential, role });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/auth/profile/avatar', formData);
    return response.data;
  },

  updateSellerOnboarding: async (data: SellerOnboardingData) => {
    const response = await api.put('/auth/seller-onboarding', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData) => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export default authService;
