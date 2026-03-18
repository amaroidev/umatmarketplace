import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL && !process.env.EXPO_PUBLIC_API_URL.includes('localhost')
    ? process.env.EXPO_PUBLIC_API_URL
    : 'http://143.105.209.181:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore might not be available
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      error.userMessage =
        error.code === 'ECONNABORTED'
          ? 'Request timed out. Check your connection and try again.'
          : 'Cannot reach server. Check internet or API URL.';
    }

    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
      } catch {
        // Ignore
      }
    }
    return Promise.reject(error);
  }
);

export default api;
