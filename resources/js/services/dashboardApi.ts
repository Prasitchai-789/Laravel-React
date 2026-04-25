import api from '@/lib/api';

export interface DashboardFilters {
    start_date?: string;
    end_date?: string;
    keyword?: string;
    status?: string;
}

export const dashboardApi = {
    /**
     * Get summary metrics for the dashboard
     */
    getSummary: async (filters?: DashboardFilters) => {
        const response = await api.get('/api/dashboard/summary', { params: filters });
        return response.data;
    }
};
