import { api } from './axiosInstance';
import { ApiResponse } from '../types';
import { StockMovement, StockFilterParams } from '../types/stock.types';

export const stockApi = {
  getAll: async (params?: StockFilterParams): Promise<{ movements: StockMovement[]; pagination: any }> => {
    const res = await api.get<ApiResponse<{ movements: StockMovement[]; pagination: any }>>('/stock-movements', { params });
    return res.data.data;
  },

  create: async (data: {
    productId: string;
    quantity: number;
    movementType: 'IN' | 'OUT';
    reason: string;
  }): Promise<StockMovement> => {
    const res = await api.post<ApiResponse<StockMovement>>('/stock-movements', data);
    return res.data.data;
  },
};
