import api from '@/lib/api';

export interface PurchaseFilters {
    year?: string | number;
    month?: string | number;
    date?: string;
    dept_id?: number | string;
    brchid?: number | string;
}

export const purchaseApi = {
    /**
     * Get PO Invoice Dashboard Data (FFB)
     */
    getPOInvDashboard: async (filters?: { date?: string }) => {
        const response = await api.get('/api/purchase/poinv-dashboard', { params: filters });
        return response.data;
    },

    /**
     * Get Purchase Summary by Department
     */
    getPurchaseSummary: async (filters?: PurchaseFilters) => {
        const response = await api.get('/api/purchase/summary', { params: filters });
        return response.data;
    },

    /**
     * Get Detailed PO Invoice Report
     */
    getDetailedReport: async (filters?: PurchaseFilters) => {
        const response = await api.get('/api/purchase/detailed-report', { params: filters });
        return response.data;
    },

    /**
     * Get PO Invoice Summary (by GoodID)
     */
    getPOInvSummary: async (filters?: { start_date?: string, end_date?: string, good_id?: number }) => {
        const response = await api.get('/api/purchase/poinv-summary', { params: filters });
        return response.data;
    },

    /**
     * Get PO Invoice Monthly Trend (by GoodID)
     */
    getPOInvMonthly: async (filters?: { start_date?: string, end_date?: string, good_id?: number }) => {
        const response = await api.get('/api/purchase/poinv-monthly', { params: filters });
        return response.data;
    }
};
