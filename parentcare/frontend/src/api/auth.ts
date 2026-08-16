import { api } from './client';
import type { AuthResponse, User } from '../types';

export const authApi = {
  login: (email: string, password: string): Promise<AuthResponse> =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (data: { email: string; password: string; full_name: string; phone?: string; role?: string }): Promise<AuthResponse> =>
    api.post<AuthResponse>('/auth/register', data),

  getMe: (): Promise<User> =>
    api.get<User>('/auth/me'),

  updateMe: (data: { full_name?: string; phone?: string; password?: string }): Promise<User> =>
    api.put<User>('/auth/me', data),

  forgotPassword: (email: string): Promise<{ message: string; reset_token: string }> =>
    api.post<{ message: string; reset_token: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, new_password: string): Promise<{ message: string }> =>
    api.post<{ message: string }>('/auth/reset-password', { token, new_password }),
};
