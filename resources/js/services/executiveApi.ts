import api from '@/lib/api';

export interface ExecutiveFilters {
    start_date?: string;
    end_date?: string;
}

export const executiveApi = {
    /**
     * Get Executive Production Report Data
     */
    getProductionReport: async (filters?: ExecutiveFilters) => {
        const response = await api.get('/api/executive/production-report', { params: filters });
        return response.data;
    },

    /**
     * Get Executive SO Plan Data
     */
    getSOPlan: async (filters?: ExecutiveFilters) => {
        const response = await api.get('/api/executive/soplan-report', { params: filters });
        return response.data;
    },

    /**
     * Get Production Summary Card Data
     */
    getProductionSummary: async (filters?: ExecutiveFilters) => {
        const response = await api.get('/api/executive/production-summary', { params: filters });
        return response.data;
    },

    /**
     * Get CPO Summary Data
     */
    getCPOSummary: async (filters?: ExecutiveFilters) => {
        const response = await api.get('/api/executive/cpo-summary', { params: filters });
        return response.data;
    },

    /**
     * Get Purchase Summary Data
     */
    getPurchaseSummary: async (filters?: ExecutiveFilters & { good_id?: number }) => {
        const response = await api.get('/api/executive/purchase-summary', { params: filters });
        return response.data;
    }
};
