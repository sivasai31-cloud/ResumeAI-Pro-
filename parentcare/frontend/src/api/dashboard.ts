import { api } from './client';
import type { DashboardOverview } from '../types';

export const dashboardApi = {
  getOverview: (): Promise<DashboardOverview> =>
    api.get<DashboardOverview>('/dashboard/overview'),
};
