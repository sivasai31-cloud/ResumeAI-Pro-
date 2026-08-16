import { api } from './client';
import type { EmergencyContact } from '../types';

export const emergencyApi = {
  getAll: (parentId?: number): Promise<EmergencyContact[]> => {
    const query = parentId ? `?parent_id=${parentId}` : '';
    return api.get<EmergencyContact[]>(`/emergency-contacts${query}`);
  },

  getById: (id: number): Promise<EmergencyContact> =>
    api.get<EmergencyContact>(`/emergency-contacts/${id}`),

  create: (data: Partial<EmergencyContact>): Promise<EmergencyContact> =>
    api.post<EmergencyContact>('/emergency-contacts', data),

  update: (id: number, data: Partial<EmergencyContact>): Promise<EmergencyContact> =>
    api.put<EmergencyContact>(`/emergency-contacts/${id}`, data),

  delete: (id: number): Promise<void> =>
    api.delete<void>(`/emergency-contacts/${id}`),
};
