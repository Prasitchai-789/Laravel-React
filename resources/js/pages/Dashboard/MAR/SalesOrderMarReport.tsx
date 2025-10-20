import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface SaleMarWin {
    GoodID: number;
}

interface MonthlyData {
    month: number;
    year: number;
    total_amount: number;
}

interface WeightData {
    month: number;
    year: number;
    total_weight: number;
}

interface Good {
    id: number;
    name: string;
}
interface POInvWin {
    total_qty: number;
    total_amount: number;
}

export default function SalesOrderMarReport() {
    const getCurrentDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getFirstDayOfCurrentYear = () => {
        const now = new Date();
        const year = now.getFullYear();
        return `${year}-01-01`;
    };

    const [startDate, setStartDate] = useState(getFirstDayOfCurrentYear());
    const [endDate, setEndDate] = useState(getCurrentDate());
    const [loading, setLoading] = useState(false);
    const [salesData, setSalesData] = useState<any>(null);
    const [goods, setGoods] = useState<Good[]>([]);
    const [selectedGoodId, setSelectedGoodId] = useState<number>(2147);
    const [goodLoading, setGoodLoading] = useState(false);
    const [currentYear] = useState(new Date().getFullYear());
    const [POInvData, setPOInvData] = useState<POInvWin[]>([]);
    const [totalQty, setTotalQty] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [avgPrice, setAvgPrice] = useState(0);

    // Fetch goods list on component mount
    useEffect(() => {
        fetchGoods();
        fetchDataPOInvWin();
    }, []);

    const fetchGoods = async () => {
        setGoodLoading(true);
        try {
            const mockGoods: Good[] = [
                { id: 2147, name: 'น้ำมันปาล์มดิบ' },
                { id: 2152, name: 'เมล็ดใน' },
                { id: 2151, name: 'กะลาปาล์ม (เพียว)' },
                { id: 9012, name: 'ทะลายสับ (EFB Fiber)' },
                { id: 2149, name: 'ทะลายปาล์ม' },
                { id: 2150, name: 'ใยปาล์ม' },
            ];
            setGoods(mockGoods);
        } catch (error) {
            console.error('Error fetching goods:', error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า');
        } finally {
            setGoodLoading(false);
        }
    };

    useEffect(() => {
        if (startDate && endDate && selectedGoodId) {
            fetchData();
        }
    }, [startDate, endDate, selectedGoodId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/sales-order-summary/api', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    good_id: selectedGoodId,
                },
            });
            const salesData = response.data.data || {};
            setSalesData(salesData);
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const fetchDataPOInvWin = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/poinv-win-monthly/api', {
                params: { start_date: startDate, end_date: endDate },
            });
            const POInvWin: POInvWin[] = response.data.data || [];
            // ใช้ POInvWin ที่เพิ่งดึงมา
            const totalQty = POInvWin.reduce((sum, item) => sum + (item.total_qty || 0), 0);
            const totalAmount = POInvWin.reduce((sum, item) => sum + (item.total_amount || 0), 0);
            const avgPrice = totalQty > 0 ? totalAmount / totalQty : 0;

            setPOInvData(POInvWin);
            setTotalQty(totalQty);
            setTotalAmount(totalAmount);
            setAvgPrice(avgPrice);
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setLoading(false);
        }
    };
    // ฟังก์ชันช่วยในการแปลงค่าให้เป็นตัวเลข
    const parseNumber = (value: any): number => {
        if (value === null || value === undefined || value === '') return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    };

    // ฟังก์ชันจัดรูปแบบตัวเลข
    const formatNumber = (num: number): string => {
        return num.toLocaleString('th-TH');
    };

    const formatMB = (amount: number) => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '0.00';
        }
        return (amount / 1000000).toLocaleString('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
        }).format(amount);
    };
    // Summary Cards Component
    const SummaryCards = () => {
        if (!salesData) return null;

        const sales = salesData.sales?.[selectedGoodId] || [];
        const returns = salesData.returns?.[selectedGoodId] || [];
        const weights = salesData.weights?.[selectedGoodId] || [];

        // ใช้ parseNumber เพื่อแปลงค่าให้เป็นตัวเลขที่ถูกต้อง
        const totalSales = sales.reduce((sum: number, item: MonthlyData) => sum + parseNumber(item?.total_amount), 0);
        const totalReturns = returns.reduce((sum: number, item: MonthlyData) => sum + parseNumber(item?.total_amount), 0);
        const totalWeight = weights.reduce((sum: number, item: WeightData) => sum + parseNumber(item?.total_weight), 0);

        const netSales = totalSales - totalReturns;
        const avgPrice = totalWeight > 0 ? netSales / totalWeight : 0;

        // ฟังก์ชันสำหรับคำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
        const calculateTrend = (current, previous) => {
            if (!previous || previous === 0) return { value: 0, isPositive: true };
            const change = ((current - previous) / previous) * 100;
            return {
                value: Math.abs(change),
                isPositive: change >= 0,
            };
        };

        const cards = [
            {
                title: 'ปริมาณรวม',
                value: `${formatNumber(totalWeight)} กก.`,
                icon: '⚖️',
                color: 'from-blue-500 to-blue-600',
                textColor: 'text-blue-100',
            },
            {
                title: 'ยอดขายรวม',
                value: `${formatMB(totalSales)} MB.`,
                icon: '💰',
                color: 'from-green-500 to-green-600',
                textColor: 'text-green-100',
            },
            {
                title: 'ลดหนี้รวม',
                value: `${formatNumber(totalReturns)} บาท`,
                icon: '📉',
                color: 'from-red-500 to-red-600',
                textColor: 'text-red-100',
            },
            {
                title: 'ราคาเฉลี่ย',
                value: avgPrice > 0 ? `${avgPrice.toFixed(2)} บาท/กก.` : '0.00 บาท/กก.',
                icon: '📊',
                color: 'from-purple-500 to-purple-600',
                textColor: 'text-purple-100',
            },
        ];

        return (
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className={`bg-gradient-to-br ${card.color} transform rounded-2xl p-4 py-6 text-white shadow-lg transition-transform hover:scale-105`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">{card.title}</p>
                                <p className="mt-1 text-lg font-bold">{card.value}</p>
                            </div>
                            <div className="text-2xl">{card.icon}</div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderTable = () => {
        if (!salesData)
            return (
                <div className="py-12 text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <p className="text-lg text-gray-500">กำลังโหลดข้อมูล...</p>
                </div>
            );

        const sales = salesData.sales?.[selectedGoodId] || [];
        const returns = salesData.returns?.[selectedGoodId] || [];
        const weights = salesData.weights?.[selectedGoodId] || [];

        const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

        const fullMonthNames = [
            'มกราคม',
            'กุมภาพันธ์',
            'มีนาคม',
            'เมษายน',
            'พฤษภาคม',
            'มิถุนายน',
            'กรกฎาคม',
            'สิงหาคม',
            'กันยายน',
            'ตุลาคม',
            'พฤศจิกายน',
            'ธันวาคม',
        ];

        const months = Array.from({ length: 12 }, (_, i) => i + 1);

        // คำนวณผลรวมด้วย parseNumber
        const totalSales = sales.reduce((sum: number, item: MonthlyData) => sum + parseNumber(item?.total_amount), 0);
        const totalReturns = returns.reduce((sum: number, item: MonthlyData) => sum + parseNumber(item?.total_amount), 0);
        const totalWeight = weights.reduce((sum: number, item: WeightData) => sum + parseNumber(item?.total_weight), 0);
        const netSales = totalSales - totalReturns;
        const avgPrice = totalWeight > 0 ? netSales / totalWeight : 0;

        // นับเดือนที่มีการขาย
        const monthsWithSales = sales.filter((s: MonthlyData) => parseNumber(s?.total_amount) > 0).length;

        return (
            <div className="">
                {/* Summary Cards - Mobile */}
                <div className="mb-6 lg:hidden">
                    <SummaryCards />
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-lg lg:p-6">
                        {/* Header */}
                        <div className="mb-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 lg:text-2xl">
                                        ปริมาณการรับซื้อผลปาล์ม
                                        <span className="ml-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                            ปี {currentYear + 543}
                                        </span>
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600 lg:text-base">
                                        {new Date(startDate).toLocaleDateString('th-TH')} - {new Date(endDate).toLocaleDateString('th-TH')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Table */}
                        <div className="overflow-x-auto shadow">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                                        <th className="rounded-tl-2xl p-3 text-left font-semibold">เดือน</th>
                                        <th className="p-3 text-right font-semibold">ปริมาณ (กก.)</th>
                                        <th className="p-3 text-right font-semibold">ยอดเงิน (บาท)</th>
                                        <th className="rounded-tr-2xl p-3 text-right font-semibold">เฉลี่ย/กก.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {months.map((month) => {
                                        const po = POInvData.find((p) => Number(p.month) === Number(month));
                                        const totalQty = po?.total_qty || 0;
                                        const totalAmount = po?.total_amount || 0;
                                        const avgPrice = po?.avg_price || 0;
                                        const hasData = totalQty > 0 || totalAmount > 0;

                                        return (
                                            <tr
                                                key={month}
                                                className={`border-b border-gray-200 transition-colors ${
                                                    hasData ? 'hover:bg-green-50' : 'opacity-50 hover:bg-gray-50'
                                                }`}
                                            >
                                                <td className="p-3 font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 text-sm text-gray-500">{month.toString().padStart(2, '0')}</span>
                                                        <span>{fullMonthNames[month - 1]}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right font-anuphan text-sm">
                                                    {hasData ? <span className="font-semibold text-green-700">{formatNumber(totalQty)}</span> : '-'}
                                                </td>
                                                <td className="p-3 text-right font-anuphan text-sm">
                                                    {hasData ? (
                                                        <span className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="p-3 text-right font-anuphan text-sm">
                                                    {hasData ? <span className="font-semibold text-green-600">{avgPrice.toFixed(2)}</span> : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50 font-semibold">
                                        <td className="rounded-bl-2xl p-3 text-gray-900">รวมทั้งหมด</td>
                                        <td className="p-3 text-right font-anuphan text-green-700">{formatNumber(totalQty)}</td>
                                        <td className="p-3 text-right font-anuphan">{formatCurrency(totalAmount)}</td>
                                        <td className="rounded-br-2xl p-3 text-right font-anuphan text-green-600">
                                            {avgPrice > 0 ? avgPrice.toFixed(2) : '0.00'}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Quick Stats */}
                        {/* <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-lg bg-blue-50 p-3 text-center">
                            <div className="font-semibold text-blue-600">เดือนที่มีการขาย</div>
                            <div className="text-sm font-bold text-gray-900">{monthsWithSales} / 12 เดือน</div>
                        </div>
                        <div className="rounded-lg bg-green-50 p-3 text-center">
                            <div className="font-semibold text-green-600">อัตราการขาย</div>
                            <div className="text-sm font-bold text-gray-900">{((monthsWithSales / 12) * 100).toFixed(0)}%</div>
                        </div>
                    </div> */}
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-lg lg:p-6">
                        {/* Header */}
                        <div className="mb-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 lg:text-2xl">
                                        {goods.find((g) => g.id === selectedGoodId)?.name || 'สินค้า'}
                                        <span className="ml-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                            ปี {currentYear + 543}
                                        </span>
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600 lg:text-base">
                                        {new Date(startDate).toLocaleDateString('th-TH')} - {new Date(endDate).toLocaleDateString('th-TH')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Table */}
                        <div className="overflow-x-auto shadow">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                                        <th className="rounded-tl-2xl p-3 text-left font-semibold">เดือน</th>
                                        <th className="p-3 text-right font-semibold">ปริมาณ (กก.)</th>
                                        <th className="p-3 text-right font-semibold">ยอดเงิน (บาท)</th>
                                        <th className="p-3 text-right font-semibold">ลดหนี้ (บาท)</th>
                                        <th className="rounded-tr-2xl p-3 text-right font-semibold">เฉลี่ย/กก.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {months.map((month) => {
                                        const sale = sales.find((s: MonthlyData) => Number(s.month) === Number(month));
                                        const ret = returns.find((r: MonthlyData) => Number(r.month) === Number(month));
                                        const wei = weights.find((w: WeightData) => Number(w.month) === Number(month));

                                        // ใช้ parseNumber เพื่อความปลอดภัย
                                        const totalAmount = parseNumber(sale?.total_amount);
                                        const totalReturn = parseNumber(ret?.total_amount);
                                        const totalWeight = parseNumber(wei?.total_weight);
                                        const netAmount = totalAmount - totalReturn;
                                        const avgPrice = totalWeight > 0 ? netAmount / totalWeight : 0;

                                        // เปลี่ยนเงื่อนไขเป็นตรวจสอบว่ามีข้อมูลหรือไม่ (ไม่ใช่แค่ > 0)
                                        const hasAmountData = sale !== undefined;
                                        const hasReturnData = ret !== undefined;
                                        const hasWeightData = wei !== undefined;
                                        const hasData = hasAmountData || hasReturnData || hasWeightData;

                                        return (
                                            <tr
                                                key={month}
                                                className={`border-b border-gray-200 transition-colors ${
                                                    hasData ? 'hover:bg-blue-50' : 'hover:bg-gray-50'
                                                } ${!hasData ? 'opacity-60' : ''}`}
                                            >
                                                <td className="p-3 font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 text-sm text-gray-500">{month.toString().padStart(2, '0')}</span>
                                                        <span>{fullMonthNames[month - 1]}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right font-anuphan text-sm">
                                                    {hasWeightData ? (
                                                        <span className="font-semibold text-blue-700">{formatNumber(totalWeight)}</span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="p-3 text-right font-anuphan text-sm">
                                                    {hasAmountData ? (
                                                        <span className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="p-3 text-right font-anuphan text-sm">
                                                    {hasReturnData ? (
                                                        <span className="font-semibold text-red-600">-{formatCurrency(totalReturn)}</span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="p-3 text-right font-anuphan text-sm">
                                                    {hasWeightData && totalWeight > 0 ? (
                                                        <span className="font-semibold text-green-600">{avgPrice.toFixed(2)}</span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50 font-semibold">
                                        <td className="rounded-bl-2xl p-3 text-gray-900">รวมทั้งหมด</td>
                                        <td className="p-3 text-right font-anuphan text-blue-700">{formatNumber(totalWeight)}</td>
                                        <td className="p-3 text-right font-anuphan">{formatCurrency(totalSales)}</td>
                                        <td className="p-3 text-right font-anuphan text-red-600">-{formatCurrency(totalReturns)}</td>
                                        <td className="rounded-br-2xl p-3 text-right font-anuphan text-green-600">
                                            {avgPrice > 0 ? avgPrice.toFixed(2) : '0.00'}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Quick Stats */}
                        {/* <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-lg bg-blue-50 p-3 text-center">
                            <div className="font-semibold text-blue-600">เดือนที่มีการขาย</div>
                            <div className="text-sm font-bold text-gray-900">{monthsWithSales} / 12 เดือน</div>
                        </div>
                        <div className="rounded-lg bg-green-50 p-3 text-center">
                            <div className="font-semibold text-green-600">อัตราการขาย</div>
                            <div className="text-sm font-bold text-gray-900">{((monthsWithSales / 12) * 100).toFixed(0)}%</div>
                        </div>
                    </div> */}
                    </div>
                </div>
            </div>
        );
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'รายงานการขายสินค้า', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3 font-anuphan lg:p-6">
                {/* Header */}
                <div className="mb-4 text-center lg:text-left">
                    <h1 className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-2xl font-bold text-gray-900 text-transparent lg:text-3xl">
                        📊 รายงานการขายสินค้า
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 lg:text-base">วิเคราะห์ข้อมูลการขายและปริมาณสินค้าในแต่ละเดือน</p>
                </div>

                {/* Control Panel */}
                <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg lg:p-4">
                    <div className="mb-4 grid grid-cols-1 gap-4 lg:mb-6 lg:grid-cols-2 lg:gap-6">
                        {/* Product Selection */}
                        <div className="">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-600">📦</span>
                                    <span>เลือกสินค้า</span>
                                </div>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedGoodId}
                                    onChange={(e) => setSelectedGoodId(Number(e.target.value))}
                                    disabled={goodLoading}
                                    className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                                >
                                    {goodLoading ? (
                                        <option value="">กำลังโหลดสินค้า...</option>
                                    ) : (
                                        <>
                                            {goods.map((good) => (
                                                <option key={good.id} value={good.id}>
                                                    {good.name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <svg
                                        className="h-5 w-5 text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-600">📅</span>
                                    <span>เลือกช่วงวันที่</span>
                                </div>
                            </label>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="flex-1">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards - Desktop */}
                <div className="hidden lg:block">
                    <SummaryCards />
                </div>

                {/* Table Section */}
                {renderTable()}

                {/* Footer Info */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>
                        อัปเดตล่าสุด:{' '}
                        {new Date().toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
