import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginationData } from '../../types/order';

interface OrderPaginationProps {
    pagination: PaginationData;
    perPage: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
}

export const OrderPagination: React.FC<OrderPaginationProps> = ({
    pagination,
    perPage,
    isLoading,
    onPageChange,
    onPerPageChange
}) => {
    const { current_page, last_page, total, from, to } = pagination;

    if (total === 0) return null;

    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="text-sm text-gray-600">
                แสดง {from} ถึง {to} จากทั้งหมด {total} รายการ
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={current_page === 1 || isLoading}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                    onClick={() => onPageChange(current_page - 1)}
                    disabled={current_page === 1 || isLoading}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-2 text-sm text-gray-700">
                    หน้า {current_page} จาก {last_page}
                </span>

                <button
                    onClick={() => onPageChange(current_page + 1)}
                    disabled={current_page === last_page || isLoading}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                <button
                    onClick={() => onPageChange(last_page)}
                    disabled={current_page === last_page || isLoading}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">แสดง</span>
                <select
                    value={perPage}
                    onChange={(e) => onPerPageChange(Number(e.target.value))}
                    disabled={isLoading}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                </select>
                <span className="text-sm text-gray-600">รายการต่อหน้า</span>
            </div>
        </div>
    );
};
