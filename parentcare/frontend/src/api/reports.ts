import { api } from './client';
import type { MedicalReport } from '../types';

export const reportsApi = {
  getAll: (parentId?: number, reportType?: string): Promise<MedicalReport[]> => {
    const params = new URLSearchParams();
    if (parentId) params.append('parent_id', parentId.toString());
    if (reportType) params.append('report_type', reportType);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<MedicalReport[]>(`/reports${query}`);
  },

  getById: (id: number): Promise<MedicalReport> =>
    api.get<MedicalReport>(`/reports/${id}`),

  upload: (formData: FormData): Promise<MedicalReport> =>
    api.upload<MedicalReport>('/reports', formData),

  delete: (id: number): Promise<void> =>
    api.delete<void>(`/reports/${id}`),

  getDownloadUrl: (id: number): string =>
    api.getDownloadUrl(id),
};
