import api from '@/lib/api';

export interface ProductionFilters {
    start_date?: string;
    end_date?: string;
    keyword?: string;
    status?: string;
}

export const productionApi = {
    /**
     * Get chart data for production metrics
     */
    getChartData: async (filters?: ProductionFilters) => {
        const response = await api.get('/api/production/chart', { params: filters });
        return response.data;
    }
};
