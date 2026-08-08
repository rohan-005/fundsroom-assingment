import { api } from './axiosInstance';
import { ApiResponse } from '../types';
import { SalesChallan, ChallanFilterParams } from '../types/challan.types';

export const challansApi = {
  getAll: async (params?: ChallanFilterParams): Promise<{ challans: SalesChallan[]; pagination: any }> => {
    const res = await api.get<ApiResponse<{ challans: SalesChallan[]; pagination: any }>>('/challans', { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<SalesChallan> => {
    const res = await api.get<ApiResponse<SalesChallan>>(`/challans/${id}`);
    return res.data.data;
  },

  create: async (data: {
    customerId: string;
    items: { productId: string; quantity: number; unitPrice?: number }[];
    status?: 'DRAFT' | 'CONFIRMED';
  }): Promise<SalesChallan> => {
    const res = await api.post<ApiResponse<SalesChallan>>('/challans', data);
    return res.data.data;
  },

  update: async (id: string, data: { status?: string; customerId?: string; items?: any[] }): Promise<SalesChallan> => {
    const res = await api.put<ApiResponse<SalesChallan>>(`/challans/${id}`, data);
    return res.data.data;
  },

  confirm: async (id: string): Promise<SalesChallan> => {
    const res = await api.post<ApiResponse<SalesChallan>>(`/challans/${id}/confirm`);
    return res.data.data;
  },
};
