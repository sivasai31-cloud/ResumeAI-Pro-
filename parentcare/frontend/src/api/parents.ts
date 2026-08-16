import { api } from './client';
import type { Parent } from '../types';

export const parentsApi = {
  getAll: (search?: string): Promise<Parent[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get<Parent[]>(`/parents${query}`);
  },

  getById: (id: number): Promise<Parent> =>
    api.get<Parent>(`/parents/${id}`),

  create: (data: Partial<Parent>): Promise<Parent> =>
    api.post<Parent>('/parents', data),

  update: (id: number, data: Partial<Parent>): Promise<Parent> =>
    api.put<Parent>(`/parents/${id}`, data),

  delete: (id: number): Promise<void> =>
    api.delete<void>(`/parents/${id}`),
};
