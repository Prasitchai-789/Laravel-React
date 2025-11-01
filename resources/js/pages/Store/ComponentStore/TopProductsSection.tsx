import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ProductData {
    product_code?: string;
    good_code?: string;
    product_name?: string;
    good_name?: string;
    order_count?: number;
    total_quantity?: number;
    trend?: 'up' | 'down' | 'stable';
}

interface ApiResponse {
    success: boolean;
    data: ProductData[];
    message?: string;
    total_products?: number;
    column_used?: string;
}

const TopProductsSection: React.FC = () => {
    const [topProducts, setTopProducts] = useState<ProductData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await axios.get<ApiResponse>("/StoreOrder/nameOrder");

                if (response.data.success) {
                    setTopProducts(response.data.data || []);
                } else {
                    throw new Error(response.data.message || 'API request failed');
                }

            } catch (err: any) {
                // console.error("Error fetching top products:", err);
                const errorMessage = err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล';
                setError(errorMessage);
                setTopProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTopProducts();
    }, []);

    const getProductDisplayName = (product: ProductData) => {
        return product.product_name || product.good_name ||
               `สินค้า ${product.product_code || product.good_code || 'ไม่ระบุ'}`;
    };

    const getProductCode = (product: ProductData) => {
        return product.product_code || product.good_code || '';
    };

    const getRankStyle = (index: number) => {
        const styles = {
            0: {
                gradient: "from-amber-500 to-amber-600",
                border: "border-amber-200 dark:border-amber-800",
                bg: "bg-amber-50 dark:bg-amber-900/20"
            },
            1: {
                gradient: "from-slate-500 to-slate-600",
                border: "border-slate-200 dark:border-slate-700",
                bg: "bg-slate-50 dark:bg-slate-900/20"
            },
            2: {
                gradient: "from-orange-700 to-orange-800",
                border: "border-orange-200 dark:border-orange-800",
                bg: "bg-orange-50 dark:bg-orange-900/20"
            }
        };

        return styles[index as keyof typeof styles] || {
            gradient: "from-blue-500 to-blue-600",
            border: "border-blue-200 dark:border-blue-800",
            bg: "bg-blue-50 dark:bg-blue-900/20"
        };
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                สินค้าขายดี
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                กำลังโหลดข้อมูล...
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="animate-pulse flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-3 flex-1">
                                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                                    <div className="flex space-x-3">
                                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-16 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            สินค้าที่เบิกมากที่สุด
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {error ? 'เกิดข้อผิดพลาด' : 'เรียงตามจำนวนการเบิกมากที่สุด'}
                        </p>
                    </div>
                </div>

                {topProducts.length > 0 && (
                    <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800">
                        <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                            {topProducts.reduce((sum, p) => sum + (p.order_count || 0), 0).toLocaleString()} รายการ
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            {error ? (
                <div className="text-center py-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="text-red-600 dark:text-red-400 font-medium mb-2">
                        เกิดข้อผิดพลาด
                    </div>
                    <div className="text-red-500 dark:text-red-500 text-sm">
                        {error}
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {topProducts.length > 0 ? (
                        topProducts.map((product, index) => {
                            const productName = getProductDisplayName(product);
                            const orderCount = product.order_count || 0;
                            const quantity = product.total_quantity || 0;
                            const rankStyle = getRankStyle(index);

                            return (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-4 rounded-lg border ${rankStyle.border} ${rankStyle.bg} transition-colors duration-200 hover:border-gray-300 dark:hover:border-gray-600`}
                                >
                                    <div className="flex items-center space-x-3 flex-1">
                                        {/* Rank Indicator */}
                                        <div className={`w-10 h-10 bg-gradient-to-br ${rankStyle.gradient} rounded-lg flex items-center justify-center text-white font-semibold text-sm`}>
                                            {index + 1}
                                        </div>

                                        {/* Product Information */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                {productName}
                                            </p>
                                            <div className="flex items-center space-x-4 mt-1">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                                    {orderCount.toLocaleString()} การสั่งซื้อ
                                                </span>
                                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                                    {quantity.toLocaleString()} ชิ้น
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rank Label */}
                                    <div className="text-right">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            {index === 0 ? 'อันดับ 1' :
                                             index === 1 ? 'อันดับ 2' :
                                             index === 2 ? 'อันดับ 3' :
                                             `อันดับ ${index + 1}`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-600 dark:text-gray-400 font-medium">
                                ไม่พบข้อมูลสินค้า
                            </p>
                            <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                                ยังไม่มีข้อมูลการสั่งซื้อในระบบ
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TopProductsSection;
