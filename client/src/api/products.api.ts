import { api } from './axiosInstance';
import { ApiResponse } from '../types';
import { Product, ProductFilterParams } from '../types/product.types';

export const productsApi = {
  getAll: async (params?: ProductFilterParams): Promise<{ products: Product[]; pagination: any }> => {
    const res = await api.get<ApiResponse<{ products: Product[]; pagination: any }>>('/products', { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<Product> => {
    const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<Product>): Promise<Product> => {
    const res = await api.post<ApiResponse<Product>>('/products', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    const res = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return res.data.data;
  },
};
