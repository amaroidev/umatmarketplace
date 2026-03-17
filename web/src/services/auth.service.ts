import api from './api';

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'buyer' | 'seller';
  studentId?: string;
  location?: string;
}

export interface LoginData {
  email: string;
  password: string;
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
