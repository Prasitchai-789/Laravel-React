import { useCallback, useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';

type DashboardError = AxiosError<{ message?: string }>;

export function useDashboardData<T = unknown>(endpoint: string) {
    const [data, setData] = useState<T | undefined>();
    const [error, setError] = useState<DashboardError | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get<T>(endpoint);
            setData(response.data);
            return response.data;
        } catch (err) {
            const nextError = err as DashboardError;
            setError(nextError);
            throw nextError;
        } finally {
            setIsLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    return {
        data,
        error,
        isLoading,
        isError: Boolean(error),
        refetch,
    };
}
