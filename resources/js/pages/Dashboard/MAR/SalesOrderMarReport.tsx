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

    // Fetch goods list on component mount
    useEffect(() => {
        fetchGoods();
    }, []);

    const fetchGoods = async () => {
        setGoodLoading(true);
        try {
            const mockGoods: Good[] = [
                { id: 2147, name: 'น้ำมันปาล์มดิบ' },
                { id: 2152, name: 'เมล็ดใน' },
                { id: 2151, name: 'กะลาปาล์ม (เพียว)' },
                { id: 2149, name: 'ทะลายปาล์ม' },
                { id: 2150, name: 'ใยปาล์ม' }
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
                    good_id: selectedGoodId
                },
            });
            const salesData = response.data.data || [];
            setSalesData(salesData);
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    // Summary Cards Component
    const SummaryCards = () => {
        if (!salesData) return null;

        const sales = salesData.sales?.[selectedGoodId] || [];
        const returns = salesData.returns?.[selectedGoodId] || [];
        const weights = salesData.weights?.[selectedGoodId] || [];

        const totalSales = sales.reduce((sum: number, item: MonthlyData) => sum + (item.total_amount || 0), 0);
        const totalReturns = returns.reduce((sum: number, item: MonthlyData) => sum + (item.total_amount || 0), 0);
        const totalWeight = weights.reduce((sum: number, item: WeightData) => sum + (item.total_weight || 0), 0);
        const netSales = totalSales - totalReturns;
        const avgPrice = totalWeight > 0 ? netSales / totalWeight : 0;

        const cards = [
            {
                title: 'ปริมาณรวม',
                value: `${totalWeight.toLocaleString('th-TH')} กก.`,
                icon: '⚖️',
                color: 'from-blue-500 to-blue-600',
                textColor: 'text-blue-100'
            },
            {
                title: 'ยอดขายรวม',
                value: `${totalSales.toLocaleString('th-TH')} บาท`,
                icon: '💰',
                color: 'from-green-500 to-green-600',
                textColor: 'text-green-100'
            },
            {
                title: 'ลดหนี้รวม',
                value: `${totalReturns.toLocaleString('th-TH')} บาท`,
                icon: '📉',
                color: 'from-red-500 to-red-600',
                textColor: 'text-red-100'
            },
            {
                title: 'ราคาเฉลี่ย',
                value: `${avgPrice.toFixed(2)} บาท/กก.`,
                icon: '📊',
                color: 'from-purple-500 to-purple-600',
                textColor: 'text-purple-100'
            }
        ];

        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 text-white shadow-lg transform transition-transform hover:scale-105`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">{card.title}</p>
                                <p className="text-lg font-bold mt-1">{card.value}</p>
                            </div>
                            <div className="text-2xl">{card.icon}</div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderTable = () => {
        if (!salesData) return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 text-lg">กำลังโหลดข้อมูล...</p>
            </div>
        );

        const sales = salesData.sales?.[selectedGoodId] || [];
        const returns = salesData.returns?.[selectedGoodId] || [];
        const weights = salesData.weights?.[selectedGoodId] || [];

        const monthNames = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];

        const fullMonthNames = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];

        const months = Array.from({ length: 12 }, (_, i) => i + 1);

        // คำนวณผลรวม
        const totalSales = sales.reduce((sum: number, item: MonthlyData) => sum + (item.total_amount || 0), 0);
        const totalReturns = returns.reduce((sum: number, item: MonthlyData) => sum + (item.total_amount || 0), 0);
        const totalWeight = weights.reduce((sum: number, item: WeightData) => sum + (item.total_weight || 0), 0);
        const netSales = totalSales - totalReturns;
        const avgPrice = totalWeight > 0 ? netSales / totalWeight : 0;

        return (
            <div className="rounded-2xl bg-white p-4 lg:p-6 shadow-lg border border-gray-100">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                                {goods.find(g => g.id === selectedGoodId)?.name || 'สินค้า'} <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
                                ปี {currentYear + 543}
                            </span>
                            </h2>
                            <p className="text-gray-600 mt-1 text-sm lg:text-base">
                                 {new Date(startDate).toLocaleDateString('th-TH')} - {new Date(endDate).toLocaleDateString('th-TH')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards - Mobile */}
                <div className="lg:hidden mb-6">
                    <SummaryCards />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                                <th className="p-3 font-semibold text-left rounded-tl-2xl">เดือน</th>
                                <th className="p-3 font-semibold text-right">ปริมาณ</th>
                                <th className="p-3 font-semibold text-right">ยอดเงิน</th>
                                <th className="p-3 font-semibold text-right">ลดหนี้</th>
                                <th className="p-3 font-semibold text-right rounded-tr-2xl">เฉลี่ย/กก.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {months.map((month) => {
                                const sale = sales.find((s: MonthlyData) => s.month === month);
                                const ret = returns.find((r: MonthlyData) => r.month === month);
                                const wei = weights.find((w: WeightData) => w.month === month);

                                const totalAmount = sale?.total_amount || 0;
                                const totalReturn = ret?.total_amount || 0;
                                const totalWeight = wei?.total_weight || 0;
                                const netAmount = totalAmount - totalReturn;
                                const avgPrice = totalWeight > 0 ? netAmount / totalWeight : 0;

                                const hasData = totalAmount > 0 || totalReturn > 0 || totalWeight > 0;

                                return (
                                    <tr
                                        key={month}
                                        className={`border-b border-gray-200 transition-colors ${
                                            hasData ? 'hover:bg-blue-50' : 'hover:bg-gray-50'
                                        } ${!hasData ? 'opacity-60' : ''}`}
                                    >
                                        <td className="p-3 font-medium text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500 w-6">{(month).toString().padStart(2, '0')}</span>
                                                <span>{fullMonthNames[month - 1]}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-mono text-sm">
                                            {totalWeight ? (
                                                <span className="font-semibold text-blue-700">{totalWeight.toLocaleString('th-TH')}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-3 text-right font-mono text-sm">
                                            {totalAmount ? (
                                                <span className="font-semibold text-gray-900">{totalAmount.toLocaleString('th-TH')}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-3 text-right font-mono text-sm">
                                            {totalReturn ? (
                                                <span className="font-semibold text-red-600">-{totalReturn.toLocaleString('th-TH')}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-3 text-right font-mono text-sm">
                                            {avgPrice ? (
                                                <span className="font-semibold text-green-600">{avgPrice.toFixed(2)}</span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50 font-semibold">
                                <td className="p-3 text-gray-900 rounded-bl-2xl">รวมทั้งหมด</td>
                                <td className="p-3 text-right font-mono text-blue-700">{totalWeight.toLocaleString('th-TH')}</td>
                                <td className="p-3 text-right font-mono">{totalSales.toLocaleString('th-TH')}</td>
                                <td className="p-3 text-right font-mono text-red-600">-{totalReturns.toLocaleString('th-TH')}</td>
                                <td className="p-3 text-right font-mono text-green-600 rounded-br-2xl">{avgPrice.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-blue-600 font-semibold">เดือนที่มีการขาย</div>
                        <div className="text-gray-900 font-bold text-sm">
                            {sales.filter((s: MonthlyData) => s.total_amount > 0).length} / 12 เดือน
                        </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-green-600 font-semibold">อัตราการขาย</div>
                        <div className="text-gray-900 font-bold text-sm">
                            {((sales.filter((s: MonthlyData) => s.total_amount > 0).length / 12) * 100).toFixed(0)}%
                        </div>
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3 lg:p-6 font-anuphan">
                {/* Header */}
                <div className="mb-4 text-center lg:text-left">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                        📊 รายงานการขายสินค้า
                    </h1>
                    <p className="text-gray-600 mt-2 text-sm lg:text-base">
                        วิเคราะห์ข้อมูลการขายและปริมาณสินค้าในแต่ละเดือน
                    </p>
                </div>

                {/* Control Panel */}
                <div className="mb-4 rounded-2xl bg-white p-4 lg:p-4 shadow-lg border border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
                        {/* Product Selection */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-600">📦</span>
                                    <span>เลือกสินค้า</span>
                                </div>
                            </label>
                            <select
                                value={selectedGoodId}
                                onChange={(e) => setSelectedGoodId(Number(e.target.value))}
                                disabled={goodLoading}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 bg-white"
                            >
                                {goodLoading ? (
                                    <option value="">กำลังโหลดสินค้า...</option>
                                ) : (
                                    <>
                                        <option value="">-- เลือกสินค้า --</option>
                                        {goods.map((good) => (
                                            <option key={good.id} value={good.id}>
                                                {good.name}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-600">📅</span>
                                    <span>เลือกช่วงวันที่</span>
                                </div>
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                                    />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Button */}
                    {/* <button
                        onClick={fetchData}
                        disabled={loading || !selectedGoodId}
                        className="w-full lg:w-auto flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 lg:px-8 py-3 font-medium text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                <span>กำลังโหลด...</span>
                            </>
                        ) : (
                            <>
                                <span className="text-lg">🔍</span>
                                <span>ค้นหาข้อมูล</span>
                            </>
                        )}
                    </button> */}
                </div>

                {/* Summary Cards - Desktop */}
                <div className="hidden lg:block">
                    <SummaryCards />
                </div>

                {/* Table Section */}
                {renderTable()}

                {/* Footer Info */}
                <div className="mt-6 text-center text-gray-500 text-sm">
                    <p>อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                </div>
            </div>
        </AppLayout>
    );
}
