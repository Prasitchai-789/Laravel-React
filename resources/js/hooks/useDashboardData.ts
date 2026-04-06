import { useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

export function useDashboardData<T = any>(endpoint: string) {
    return useQuery<T, AxiosError<{ message?: string }>>({
        queryKey: ['dashboardData', endpoint],
        queryFn: async () => {
            const { data } = await axios.get<T>(endpoint);
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
        retry: 2,
    });
}
