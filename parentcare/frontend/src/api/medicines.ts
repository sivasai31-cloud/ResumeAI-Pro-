import { api } from './client';
import type { Medicine } from '../types';

export const medicinesApi = {
  getAll: (parentId?: number, status?: string): Promise<Medicine[]> => {
    const params = new URLSearchParams();
    if (parentId) params.append('parent_id', parentId.toString());
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<Medicine[]>(`/medicines${query}`);
  },

  getById: (id: number): Promise<Medicine> =>
    api.get<Medicine>(`/medicines/${id}`),

  create: (data: Partial<Medicine>): Promise<Medicine> =>
    api.post<Medicine>('/medicines', data),

  update: (id: number, data: Partial<Medicine>): Promise<Medicine> =>
    api.put<Medicine>(`/medicines/${id}`, data),

  delete: (id: number): Promise<void> =>
    api.delete<void>(`/medicines/${id}`),
};
