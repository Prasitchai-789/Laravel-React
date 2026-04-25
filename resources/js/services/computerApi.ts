import api from '@/lib/api';

export interface ComputerFilters {
    start_date?: string;
    end_date?: string;
    keyword?: string;
    status?: string;
}

export const computerApi = {
    /**
     * Get inspection plan data for computers
     */
    getCheckPlan: async (filters?: ComputerFilters) => {
        const response = await api.get('/api/computers/check-plan', { params: filters });
        return response.data;
    }
};
