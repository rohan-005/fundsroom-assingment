import { api } from './axiosInstance';
import { ApiResponse } from '../types';
import { Customer, CustomerFilterParams, FollowUp } from '../types/customer.types';

export const customersApi = {
  getAll: async (params?: CustomerFilterParams): Promise<{ customers: Customer[]; pagination: any }> => {
    const res = await api.get<ApiResponse<{ customers: Customer[]; pagination: any }>>('/customers', { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<Customer> => {
    const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<Customer>): Promise<Customer> => {
    const res = await api.post<ApiResponse<Customer>>('/customers', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  addFollowUp: async (customerId: string, data: { note: string; date?: string }): Promise<FollowUp> => {
    const res = await api.post<ApiResponse<FollowUp>>(`/customers/${customerId}/follow-ups`, data);
    return res.data.data;
  },
};
