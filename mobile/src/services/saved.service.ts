import api from './api';
import { PaginationInfo, Product } from '../types';

interface SavedItemsResponse {
  success: boolean;
  data: { products: Product[] };
  pagination: PaginationInfo;
}

interface ToggleSavedResponse {
  success: boolean;
  message: string;
  data: {
    saved: boolean;
    savedItems: string[];
  };
}

interface IsSavedResponse {
  success: boolean;
  data: { isSaved: boolean };
}

const savedService = {
  getSavedItems: async (page: number = 1, limit: number = 20): Promise<SavedItemsResponse> => {
    const response = await api.get('/saved', { params: { page, limit } });
    return response.data;
  },

  toggleSavedItem: async (productId: string): Promise<ToggleSavedResponse> => {
    const response = await api.post(`/saved/${productId}`);
    return response.data;
  },

  isSaved: async (productId: string): Promise<IsSavedResponse> => {
    const response = await api.get(`/saved/${productId}/is-saved`);
    return response.data;
  },
};

export default savedService;
