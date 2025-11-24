import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import { Plus, Calendar } from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { OrderFilters } from "./Component/filters/OrderFilters";
import { OrderStats } from "./Component/stats/OrderStats";
import { OrderTable } from "./Component/display/OrderTable";
import { OrderCardList } from "./Component/display/OrderCard";
import { OrderDetailModal } from "./Component/modal/OrderDetailModal";
import { OrderPagination } from "./Component/pagination/OrderPagination";
import { LoadingSpinner } from "./Component/ui/LoadingSpinner";
import { useOrderFilters } from "./hook/useOrderFilters";
import { transformOrderData } from "./utils/orderUtils";
import { OrderPageProps, ITOrder } from "./types/order";

const OrderIndex: React.FC = () => {
    const { orders = [], pagination, filters = {} } = usePage<OrderPageProps>().props;
    const [selectedOrder, setSelectedOrder] = useState<ITOrder | null>(null);
    const [perPage, setPerPage] = useState(pagination?.per_page || 10);

    const {
        filters: currentFilters,
        isLoading,
        updateFilters,
        applyFilters,
        resetFilters,
        hasActiveFilters
    } = useOrderFilters({
        initialFilters: filters,
        perPage
    });
    console.log(orders);
    const orderData = transformOrderData(orders);

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        applyFilters(1, newPerPage);
    };

    const handlePageChange = (page: number) => {
        applyFilters(page);
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 font-anuphan">
                <div className="p-4 md:p-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 bg-white rounded-2xl shadow-lg border border-blue-100 flex-shrink-0">
                                    <Calendar className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 font-anuphan">
                                        ระบบจัดการอุปกรณ์ IT
                                    </h1>
                                    <p className="text-gray-600 mt-2 text-lg font-anuphan">
                                        ติดตามสถานะและจัดการอุปกรณ์เทคโนโลยีทั้งหมด
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1 font-anuphan">
                                        แสดงข้อมูล {orderData.length} รายการ
                                        {pagination?.total && ` (ทั้งหมด ${pagination.total} รายการ)`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-anuphan font-semibold">
                            <Plus className="w-5 h-5" />
                            <span>เพิ่มอุปกรณ์</span>
                        </button>
                    </div>

                    {/* Statistics */}
                    <OrderStats
                        orders={orderData}
                        totalCount={pagination?.total}
                    />

                    {/* Filters */}
                    <OrderFilters
                        filters={currentFilters}
                        isLoading={isLoading}
                        onFilterChange={updateFilters}
                        onSearch={() => applyFilters(1)}
                        onReset={resetFilters}
                        hasActiveFilters={hasActiveFilters}
                    />

                    {/* Loading */}
                    {isLoading && <LoadingSpinner />}

                    {/* Desktop Table */}
                    <div className="hidden lg:block">
                        <OrderTable
                            orders={orderData}
                            onOrderClick={setSelectedOrder}
                        />
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden">
                        <OrderCardList
                            orders={orderData}
                            onOrderClick={setSelectedOrder}
                        />
                    </div>

                    {/* Pagination */}
                    {pagination && (
                        <OrderPagination
                            pagination={pagination}
                            perPage={perPage}
                            isLoading={isLoading}
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerPageChange}
                        />
                    )}

                    {/* Order Detail Modal */}
                    {selectedOrder && (
                        <OrderDetailModal
                            order={selectedOrder}
                            onClose={() => setSelectedOrder(null)}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default OrderIndex;
