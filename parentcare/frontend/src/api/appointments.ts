import { api } from './client';
import type { Appointment } from '../types';

export const appointmentsApi = {
  getAll: (parentId?: number, status?: string): Promise<Appointment[]> => {
    const params = new URLSearchParams();
    if (parentId) params.append('parent_id', parentId.toString());
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<Appointment[]>(`/appointments${query}`);
  },

  getById: (id: number): Promise<Appointment> =>
    api.get<Appointment>(`/appointments/${id}`),

  create: (data: Partial<Appointment>): Promise<Appointment> =>
    api.post<Appointment>('/appointments', data),

  update: (id: number, data: Partial<Appointment>): Promise<Appointment> =>
    api.put<Appointment>(`/appointments/${id}`, data),

  delete: (id: number): Promise<void> =>
    api.delete<void>(`/appointments/${id}`),
};
