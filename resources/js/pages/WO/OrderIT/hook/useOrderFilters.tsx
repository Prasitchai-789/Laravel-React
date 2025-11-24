import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { FilterState } from '../types/order';
import { getStatusFromNumber, getStatusToNumber } from '../utils/orderUtils';

interface UseOrderFiltersProps {
    initialFilters: Partial<FilterState>;
    perPage: number;
}

export const useOrderFilters = ({ initialFilters, perPage }: UseOrderFiltersProps) => {
    const [filters, setFilters] = useState<FilterState>({
        search: initialFilters.search || '',
        status: getStatusFromNumber(initialFilters.status),
        category: initialFilters.category || 'ทั้งหมด'
    });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setFilters({
            search: initialFilters.search || '',
            status: getStatusFromNumber(initialFilters.status),
            category: initialFilters.category || 'ทั้งหมด'
        });
    }, [initialFilters]);

    const updateFilters = (newFilters: Partial<FilterState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const applyFilters = (page = 1, newPerPage = perPage) => {
        setIsLoading(true);

        const filterParams = {
            page,
            per_page: newPerPage,
            status: filters.status !== "ทั้งหมด" ? getStatusToNumber(filters.status) : undefined,
            category: filters.category !== "ทั้งหมด" ? filters.category : undefined,
            search: filters.search || undefined
        };

        router.get('/OrderIndex', filterParams, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const resetFilters = () => {
        // ✅ อัพเดท state ทันทีเพื่อให้ UI เปลี่ยน
        setFilters({
            search: '',
            status: 'ทั้งหมด',
            category: 'ทั้งหมด'
        });

        setIsLoading(true);

        // ✅ ส่งคำขอไปยังเซิร์ฟเวอร์เพื่อรีเซ็ต
        router.get('/OrderIndex', {
            page: 1,
            per_page: perPage
            // ❌ ไม่ส่ง filter parameters เพื่อรีเซ็ต
        }, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const hasActiveFilters = filters.search !== '' || filters.status !== "ทั้งหมด" || filters.category !== "ทั้งหมด";

    return {
        filters,
        isLoading,
        updateFilters,
        applyFilters,
        resetFilters,
        hasActiveFilters
    };
};
