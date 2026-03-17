import api from './api';
import { Category } from '../types';

interface ApiCategoryResponse {
  success: boolean;
  message: string;
  data: { categories: Category[] };
}

export interface CategoryWithCount extends Category {
  productCount: number;
}

interface ApiCategoryWithCountsResponse {
  success: boolean;
  message: string;
  data: { categories: CategoryWithCount[] };
}

const categoryService = {
  getCategories: async (): Promise<ApiCategoryResponse> => {
    const response = await api.get('/categories');
    return response.data;
  },

  getCategoriesWithCounts: async (): Promise<ApiCategoryWithCountsResponse> => {
    const response = await api.get('/categories/with-counts');
    return response.data;
  },
};

export default categoryService;
