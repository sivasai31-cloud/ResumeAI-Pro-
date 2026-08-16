import { api } from './client';
import type { Notification } from '../types';

export const notificationsApi = {
  getAll: (unreadOnly = false): Promise<Notification[]> =>
    api.get<Notification[]>(`/notifications${unreadOnly ? '?unread_only=true' : ''}`),

  markAsRead: (id: number): Promise<Notification> =>
    api.patch<Notification>(`/notifications/${id}/read`, {}),

  markAllAsRead: (): Promise<void> =>
    api.post<void>('/notifications/read-all'),
};
