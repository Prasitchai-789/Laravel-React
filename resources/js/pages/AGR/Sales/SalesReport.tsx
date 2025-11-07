import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { useEffect, useState } from 'react';
import PaymentStats from './Components/PaymentStats';
import SalesTable from './Components/SalesTable';
import TopAreaCard from './Components/TopAreaCard';

// Extend dayjs with Buddhist era plugin
dayjs.extend(buddhistEra);
dayjs.locale('th');

// Interface definitions
interface SalesData {
    index: number;
    subdistrict: string;
    total: number;
    [key: string]: number | string;
}

interface PaymentStatsData {
    cash?: number;
    transfer?: number;
    credit?: number;
    other?: number;
}

interface AreaData {
    subdistrict_id: string | number;
    subdistrict: string;
    total_orders?: number;
    total_quantity?: number;
    total_amount?: number;
}

interface ProductSummary {
    summary: {
        [productName: string]: {
            quantity: number;
            amount: number;
        };
    };
}

interface DateRange {
    start: string;
    end: string;
}

const SalesReport = () => {
    // Function to get today's date in YYYY-MM-DD format
    const getFirstDayOfMonth = (): string => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const year = firstDay.getFullYear();
        const month = String(firstDay.getMonth() + 1).padStart(2, '0');
        const day = String(firstDay.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };
    const getTodayDate = (): string => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [salesData, setSalesData] = useState<SalesData[]>([]);
    const [paymentStats, setPaymentStats] = useState<PaymentStatsData>({});
    const [products, setProducts] = useState<string[]>([]);
    const [topAreas, setTopAreas] = useState<AreaData[]>([]);
    const [summaryByProduct, setSummaryByProduct] = useState<ProductSummary>({ summary: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dateRange, setDateRange] = useState<DateRange>({
        start: getFirstDayOfMonth(),
        end: getTodayDate(),
    });

    // Function to format date for API (ensure YYYY-MM-DD format)
    const formatDateForAPI = (dateString: string): string => {
        if (!dateString) return '';

        // If date is already in YYYY-MM-DD format from input type="date"
        if (dateString.includes('-')) {
            return dateString;
        }

        // Convert from MM/DD/YYYY to YYYY-MM-DD
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const [month, day, year] = parts;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        return dateString;
    };

    // Function to format date for Thai display
    const formatDateThai = (date: string) => {
        if (!date) return '-';
        return dayjs(date).format('D MMM BBBB'); // Display in Buddhist era (พ.ศ.)
    };

    // Function to format numbers with commas
    const formatNumber = (value: number | undefined): string => {
        if (!value && value !== 0) return '0';
        return value.toLocaleString('th-TH');
    };

    // Function to format quantity (no decimals)
    const formatQuantity = (value: number | undefined): string => {
        if (!value && value !== 0) return '0';
        return Math.floor(value).toLocaleString('th-TH');
    };

    // Function to format currency (2 decimal places)
    const formatCurrency = (value: number | undefined): string => {
        if (!value && value !== 0) return '0.00';
        return value.toLocaleString('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Function to format order count (no decimals)
    const formatOrders = (value: number | undefined): string => {
        if (!value && value !== 0) return '0';
        return Math.floor(value).toLocaleString('th-TH');
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Format dates for API
            const apiDateRange = {
                start: formatDateForAPI(dateRange.start),
                end: formatDateForAPI(dateRange.end),
            };

            const [sales, areas, payments, summary] = await Promise.all([
                axios.get('/report-by-subdistrict', { params: apiDateRange }),
                axios.get('/top-areas', { params: apiDateRange }),
                axios.get('/payment-stats/methods', { params: apiDateRange }),
                axios.get('/summary-by-product', { params: apiDateRange }),
            ]);

            const backendData = payments.data.by_method;
            const transformedData: PaymentStatsData = {
                cash: backendData['1']?.total_paid || 0,
                transfer: backendData['2']?.total_paid || 0,
                credit: backendData['3']?.total_paid || 0,
                other: backendData['4']?.total_paid || 0,
            };

            setSalesData(sales.data.data || []);
            setProducts(sales.data.products || []);
            setTopAreas(areas.data || []);
            setPaymentStats(transformedData);
            setSummaryByProduct(summary.data || { summary: {} });
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    // Handle date change
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDateRange((prev) => ({
            ...prev,
            [name]: value, // input type="date" provides YYYY-MM-DD format
        }));
    };

    const totalSales = salesData.reduce((sum, row) => sum + (row.total || 0), 0);
    const totalRevenue = Object.values(summaryByProduct.summary).reduce((sum, item) => sum + (item.amount || 0), 0);

    // Show error state
    if (error) {
        return (
            <AppLayout breadcrumbs={[]}>
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 font-anuphan">
                    <div className="mx-auto max-w-7xl">
                        <div className="rounded-2xl bg-red-50 p-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h3 className="mt-4 text-lg font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                            <p className="mt-2 text-red-600">{error}</p>
                            <button onClick={fetchAllData} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                                โหลดข้อมูลอีกครั้ง
                            </button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-anuphan backdrop-blur-md">
                <div className="flex flex-col items-center rounded-3xl bg-white/95 p-8 shadow-2xl">
                    <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
                    <p className="text-lg font-semibold text-gray-700">กำลังโหลดข้อมูล...</p>
                    <p className="mt-1 text-sm text-gray-500">กรุณารอสักครู่</p>
                </div>
            </div>
        );
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'รายงานการขายสินค้าต้นกล้า', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 font-anuphan lg:p-4">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
                        {/* Header Section */}
                        <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            {/* Title with Icon */}
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                    <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800 lg:text-3xl">รายงานการขายสินค้าต้นกล้า</h1>
                                    <p className="mt-1 text-gray-600">สถิติการขายและข้อมูลพื้นที่ลูกค้า</p>
                                </div>
                            </div>

                            {/* Current Date Display */}
                            <div className="min-w-[200px] rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                                <div className="text-center">
                                    <p className="mb-1 text-sm font-medium text-blue-700">ช่วงวันที่ที่แสดง</p>
                                    <p className="font-semibold text-blue-800">
                                        {formatDateThai(dateRange.start)} - {formatDateThai(dateRange.end)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Date Filter Section */}
                        <div className="pt-2">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            วันที่เริ่มต้น
                                        </div>
                                    </label>
                                    <input
                                        type="date"
                                        name="start"
                                        value={dateRange.start}
                                        onChange={handleDateChange}
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            วันที่สิ้นสุด
                                        </div>
                                    </label>
                                    <input
                                        type="date"
                                        name="end"
                                        value={dateRange.end}
                                        onChange={handleDateChange}
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-700 opacity-0">Actions</label>
                                    <div className="flex h-full gap-3">
                                        <button
                                            onClick={fetchAllData}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 font-medium text-white shadow-lg transition-all hover:scale-[1.02] hover:from-blue-600 hover:to-blue-700 hover:shadow-xl active:scale-[0.98]"
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                />
                                            </svg>
                                            ค้นหาข้อมูล
                                        </button>
                                        <button
                                            onClick={() => {
                                                const today = getTodayDate();
                                                setDateRange({ start: today, end: today });
                                                fetchAllData();
                                            }}
                                            className="rounded-xl border border-gray-300 bg-white px-4 font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Date Presets */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    onClick={() => {
                                        const end = new Date();
                                        const start = new Date();
                                        start.setDate(start.getDate() - 7);
                                        setDateRange({
                                            start: start.toISOString().split('T')[0],
                                            end: end.toISOString().split('T')[0],
                                        });
                                    }}
                                    className="rounded-lg bg-gray-100 px-3 py-1 text-xs text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-800"
                                >
                                    7 วันย้อนหลัง
                                </button>
                                <button
                                    onClick={() => {
                                        const end = new Date();
                                        const start = new Date();
                                        start.setDate(start.getDate() - 30);
                                        setDateRange({
                                            start: start.toISOString().split('T')[0],
                                            end: end.toISOString().split('T')[0],
                                        });
                                    }}
                                    className="rounded-lg bg-gray-100 px-3 py-1 text-xs text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-800"
                                >
                                    30 วันย้อนหลัง
                                </button>
                                <button
                                    onClick={() => {
                                        const today = new Date();
                                        const start = new Date(today.getFullYear(), today.getMonth(), 1);
                                        setDateRange({
                                            start: start.toISOString().split('T')[0],
                                            end: today.toISOString().split('T')[0],
                                        });
                                    }}
                                    className="rounded-lg bg-gray-100 px-3 py-1 text-xs text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-800"
                                >
                                    เดือนนี้
                                </button>
                                <button
                                    onClick={() => {
                                        const today = new Date();
                                        const start = new Date(today.getFullYear(), 0, 1);
                                        setDateRange({
                                            start: start.toISOString().split('T')[0],
                                            end: today.toISOString().split('T')[0],
                                        });
                                    }}
                                    className="rounded-lg bg-gray-100 px-3 py-1 text-xs text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-800"
                                >
                                    ปีนี้
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Stats Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Total Sales Card */}
                        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100">ยอดขายรวมทั้งหมด</p>
                                    <p className="mt-2 text-3xl font-bold">{formatQuantity(totalSales)} ต้น</p>
                                    <p className="mt-1 text-blue-100">จำนวนต้นกล้าที่ขายได้</p>
                                </div>
                                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Total Revenue Card */}
                        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100">รายได้รวมทั้งหมด</p>
                                    <p className="mt-2 text-3xl font-bold">{formatCurrency(totalRevenue)} บาท</p>
                                    <p className="mt-1 text-green-100">มูลค่าการขายรวม</p>
                                </div>
                                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Top Area Preview */}
                        <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100">พื้นที่ขายดีอันดับ 1 </p>
                                    <p className="mt-2 text-2xl font-bold">{topAreas[0]?.subdistrict || 'ไม่มีข้อมูล'}</p>
                                    <p className="mt-1 text-purple-100">{formatQuantity(topAreas[0]?.total_quantity)} ต้น</p>
                                </div>
                                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product Summary Section */}
                    {summaryByProduct?.summary && Object.keys(summaryByProduct.summary).length > 0 && (
                        <div className="mb-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    สรุปยอดขายแยกตามสินค้า{' '}
                                    <span className="text-sm text-gray-500">
                                        (ช่วงวันที่ {formatDateThai(dateRange.start)} ถึง {formatDateThai(dateRange.end)})
                                    </span>
                                </h2>
                                <div className="text-sm text-gray-500">{Object.keys(summaryByProduct.summary).length} ประเภทสินค้า</div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(summaryByProduct.summary).map(([productName, data], index) => (
                                    <div
                                        key={productName}
                                        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="mb-3 text-lg font-semibold text-gray-800">{productName}</h3>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">จำนวนขาย:</span>
                                                        <span className="font-bold text-blue-600">{formatQuantity(data.quantity)} ต้น</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">มูลค่า:</span>
                                                        <span className="font-bold text-green-600">{formatCurrency(data.amount)} บาท</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                className={`ml-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                                                    index % 3 === 0
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : index % 3 === 1
                                                          ? 'bg-green-100 text-green-600'
                                                          : 'bg-purple-100 text-purple-600'
                                                }`}
                                            >
                                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <PaymentStats stats={paymentStats} formatCurrency={formatCurrency} />
                        <TopAreaCard areas={topAreas} formatQuantity={formatQuantity} formatCurrency={formatCurrency} formatOrders={formatOrders} />
                    </div>

                    {/* Sales Table */}
                    <div className="">
                        <SalesTable
                            data={salesData}
                            productsAPI={products}
                            formatQuantity={formatQuantity}
                            formatDateThai={formatDateThai}
                            dateRange={dateRange}
                        />
                    </div>

                    {/* Footer Info */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">ข้อมูลอัพเดทล่าสุด: {new Date().toLocaleDateString('th-TH')}</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default SalesReport;
