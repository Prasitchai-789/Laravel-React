import React from 'react';
import { SearchBox } from './SearchBox';
import { FilterState } from '../../types/order';

interface OrderFiltersProps {
    filters: FilterState;
    isLoading: boolean;
    onFilterChange: (filters: Partial<FilterState>) => void;
    onSearch: () => void;
    onReset: () => void;
    hasActiveFilters: boolean;
}

const allCategories = [
    "Computer", "Monitor", "UPS", "CCTV", "Server", "Firewall",
    "Network", "Switch", "Printer", "Scanner", "Projector", "Laptop"
];

const allStatuses = ["ใช้งานอยู่", "พร้อมใช้งาน", "ไม่พร้อมใช้งาน"];

export const OrderFilters: React.FC<OrderFiltersProps> = ({
    filters,
    isLoading,
    onFilterChange,
    onSearch,
    onReset,
    hasActiveFilters
}) => {
    const handleSearch = () => {
        onSearch();
    };

    const handleSearchChange = (search: string) => {
        onFilterChange({ search });
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ category: e.target.value });
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ status: e.target.value });
    };

    // ✅ เพิ่มฟังก์ชันล้างแต่ละ filter
    const removeSearchFilter = () => {
        onFilterChange({ search: '' });
        onSearch(); // ค้นหาใหม่ทันที
    };

    const removeStatusFilter = () => {
        onFilterChange({ status: 'ทั้งหมด' });
        onSearch(); // ค้นหาใหม่ทันที
    };

    const removeCategoryFilter = () => {
        onFilterChange({ category: 'ทั้งหมด' });
        onSearch(); // ค้นหาใหม่ทันที
    };

    return (
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                <SearchBox
                    value={filters.search}
                    onChange={handleSearchChange}
                    onSearch={handleSearch}
                    disabled={isLoading}
                />

                <div className="flex gap-3 w-full lg:w-auto">
                    <select
                        className="border border-gray-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 w-full lg:w-48 text-base disabled:opacity-50"
                        value={filters.category}
                        onChange={handleCategoryChange}
                        disabled={isLoading}
                    >
                        <option value="ทั้งหมด">หมวดหมู่ทั้งหมด</option>
                        {allCategories.map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border border-gray-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 w-full lg:w-48 text-base disabled:opacity-50"
                        value={filters.status}
                        onChange={handleStatusChange}
                        disabled={isLoading}
                    >
                        <option value="ทั้งหมด">สถานะทั้งหมด</option>
                        {allStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                        <button
                            onClick={handleSearch}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'กำลังค้นหา...' : 'ค้นหา'}
                        </button>

                        {hasActiveFilters && (
                            <button
                                onClick={onReset}
                                disabled={isLoading}
                                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ล้างทั้งหมด
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-sm text-gray-600">การกรองปัจจุบัน:</span>

                    {filters.search && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            ค้นหา: "{filters.search}"
                            <button
                                onClick={removeSearchFilter}
                                className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                                disabled={isLoading}
                            >
                                ×
                            </button>
                        </span>
                    )}

                    {filters.status !== "ทั้งหมด" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                            สถานะ: {filters.status}
                            <button
                                onClick={removeStatusFilter}
                                className="ml-2 text-green-600 hover:text-green-800 font-bold"
                                disabled={isLoading}
                            >
                                ×
                            </button>
                        </span>
                    )}

                    {filters.category !== "ทั้งหมด" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                            หมวดหมู่: {filters.category}
                            <button
                                onClick={removeCategoryFilter}
                                className="ml-2 text-purple-600 hover:text-purple-800 font-bold"
                                disabled={isLoading}
                            >
                                ×
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
