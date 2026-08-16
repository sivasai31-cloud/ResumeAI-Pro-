import { api } from './client';
import type { AdminStats, User } from '../types';

export const adminApi = {
  getStats: (): Promise<AdminStats> =>
    api.get<AdminStats>('/admin/stats'),

  getUsers: (role?: string): Promise<User[]> => {
    const query = role ? `?role=${role}` : '';
    return api.get<User[]>(`/admin/users${query}`);
  },

  updateUserRole: (userId: number, role: string): Promise<User> =>
    api.patch<User>(`/admin/users/${userId}/role?role=${role}`, {}),

  toggleUserStatus: (userId: number, isActive: boolean): Promise<User> =>
    api.patch<User>(`/admin/users/${userId}/status`, { is_active: isActive }),
};
