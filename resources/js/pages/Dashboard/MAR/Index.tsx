import { Card, CardContent } from '@/Components/ui/card';
import { MiniLineChart } from '@/components/Charts/MiniLineChart';
import PieChartComponent from '@/components/Charts/PieChartComponent';
import { Head } from '@inertiajs/react';
import { BarChart3, ChevronDown, ChevronUp, DollarSign, Download, Filter, PieChart, ScatterChart, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import ScatterChartComponent from "@/components/Charts/ScatterChartComponent";
import BarChartComponent from "@/Components/Charts/BarChartComponent";

// Mock chart components
// const BarChart = ({ data }) => (
//     <div className="mt-4 h-64 rounded-lg bg-gray-50 p-4">
//         <div className="text-center text-gray-500">Bar Chart Component</div>
//         <div className="mt-2 text-xs text-gray-400">{JSON.stringify(data.slice(0, 2), null, 2)}</div>
//     </div>
// );

// const PieChartComponent = ({ data }) => (
//     <div className="mt-4 h-64 rounded-lg bg-gray-50 p-4">
//         <div className="text-center text-gray-500">Pie Chart Component</div>
//         <div className="mt-2 text-xs text-gray-400">{JSON.stringify(data.slice(0, 2), null, 2)}</div>
//     </div>
// );

// const ScatterChartComponent = ({ data }) => (
//     <div className="mt-4 h-64 rounded-lg bg-gray-50 p-4">
//         <div className="text-center text-gray-500">Scatter Chart Component</div>
//         <div className="mt-2 text-xs text-gray-400">{JSON.stringify(data.slice(0, 2), null, 2)}</div>
//     </div>
// );

export default function ProfitabilityDashboard() {
    const [showFilters, setShowFilters] = useState(false);
    const [selectedYear, setSelectedYear] = useState('2023');
    const [selectedMonth, setSelectedMonth] = useState('all');

    // 🟢 Mock data
    const summary = {
        totalSales: 1250000,
        totalCost: 830000,
        grossProfit: 420000,
        marginPercent: 33.6,
    };

    const salesByMonth = [
        { month: 'ม.ค.', total_sales: 95000, total_qty: 3200, total_cost: 65000 },
        { month: 'ก.พ.', total_sales: 120000, total_qty: 3500, total_cost: 78000 },
        { month: 'มี.ค.', total_sales: 180000, total_qty: 5000, total_cost: 120000 },
        { month: 'เม.ย.', total_sales: 150000, total_qty: 4200, total_cost: 105000 },
        { month: 'พ.ค.', total_sales: 200000, total_qty: 6000, total_cost: 140000 },
        { month: 'มิ.ย.', total_sales: 250000, total_qty: 7200, total_cost: 180000 },
    ];

    const costByProduct = [
        { goodName: 'สินค้า A', total_cost: 300000, percentage: 36.1 },
        { goodName: 'สินค้า B', total_cost: 200000, percentage: 24.1 },
        { goodName: 'สินค้า C', total_cost: 150000, percentage: 18.1 },
        { goodName: 'สินค้า D', total_cost: 180000, percentage: 21.7 },
    ];

    const productMargin = [
        {
            goodName: 'สินค้า A',
            totalQtySold: 5000,
            totalSales: 500000,
            totalCost: 300000,
            grossProfit: 200000,
            marginPercent: 40,
        },
        {
            goodName: 'สินค้า B',
            totalQtySold: 3000,
            totalSales: 350000,
            totalCost: 250000,
            grossProfit: 100000,
            marginPercent: 28.6,
        },
        {
            goodName: 'สินค้า C',
            totalQtySold: 1200,
            totalSales: 200000,
            totalCost: 170000,
            grossProfit: 30000,
            marginPercent: 15,
        },
        {
            goodName: 'สินค้า D',
            totalQtySold: 800,
            totalSales: 200000,
            totalCost: 180000,
            grossProfit: 20000,
            marginPercent: 10,
        },
    ];
    const data = {
        labels: ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'],
        datasets: [
            {
                data: [10, 12, 10, 15, 20, 18, 20], // 👈 คุณเปลี่ยน data ได้ตามต้องการ
                borderColor: 'rgba(59,130,246,1)', // สีเส้น (Tailwind: blue-500)
                backgroundColor: 'rgba(59,130,246,0.2)', // สี fill
                fill: false,
                tension: 0.4, // ทำให้เส้นโค้งนุ่ม
            },
        ],
    };

    return (
        <>
            <Head title="Dashboard ต้นทุน & กำไร" />

            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header Section */}
                <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
                    <div className="flex flex-col justify-between md:flex-row md:items-center">
                        <div>
                            <h1 className="text-2xl font-bold">แดชบอร์ดวิเคราะห์ต้นทุนและกำไร</h1>
                            <p className="mt-1 text-indigo-100">ข้อมูลการวิเคราะห์ประสิทธิภาพทางธุรกิจแบบเรียลไทม์</p>
                        </div>
                        <div className="mt-4 flex items-center space-x-2 md:mt-0">
                            <button
                                className="flex items-center rounded-md bg-white/20 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                กรองข้อมูล
                                {showFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                            </button>

                            <button className="flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-indigo-600 shadow-sm transition-all hover:bg-indigo-50">
                                <Download className="mr-2 h-4 w-4" />
                                ส่งออกรายงาน
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="mb-6 rounded-2xl bg-white p-5 shadow-lg">
                        <h3 className="mb-4 text-lg font-semibold text-gray-800">ตัวกรองข้อมูล</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">ปี</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                >
                                    <option value="2022">2022</option>
                                    <option value="2023">2023</option>
                                    <option value="2024">2024</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">เดือน</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 bg-gray-50 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                >
                                    <option value="all">ทั้งหมด</option>
                                    <option value="01">มกราคม</option>
                                    <option value="02">กุมภาพันธ์</option>
                                    <option value="03">มีนาคม</option>
                                    <option value="04">เมษายน</option>
                                    <option value="05">พฤษภาคม</option>
                                    <option value="06">มิถุนายน</option>
                                    <option value="07">กรกฎาคม</option>
                                    <option value="08">สิงหาคม</option>
                                    <option value="09">กันยายน</option>
                                    <option value="10">ตุลาคม</option>
                                    <option value="11">พฤศจิกายน</option>
                                    <option value="12">ธันวาคม</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700">
                                    นำไปใช้
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="overflow-hidden rounded-2xl border-0 shadow-lg">
                        <CardContent className="relative p-0">
                            <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-blue-50 to-transparent"></div>
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-blue-600">ยอดขายรวม</h3>
                                        <p className="mt-2 text-2xl font-bold text-gray-900">฿{summary.totalSales.toLocaleString()}</p>
                                        <div className="mt-3 h-10 w-32">
                                            <MiniLineChart data={data} />
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-blue-100 p-3">
                                        <DollarSign className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center">
                                    <TrendingUp className="mr-1.5 h-4 w-4 text-green-500" />
                                    <span className="text-xs font-medium text-green-600">+12.5% จากเดือนที่แล้ว</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden rounded-2xl border-0 shadow-lg">
                        <CardContent className="relative p-0">
                            <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-red-50 to-transparent"></div>
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-red-600">ต้นทุนรวม</h3>
                                        <p className="mt-2 text-2xl font-bold text-gray-900">฿{summary.totalCost.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-lg bg-red-100 p-3">
                                        <DollarSign className="h-6 w-6 text-red-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center">
                                    <TrendingUp className="mr-1.5 h-4 w-4 text-red-500" />
                                    <span className="text-xs font-medium text-red-600">+8.2% จากเดือนที่แล้ว</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden rounded-2xl border-0 shadow-lg">
                        <CardContent className="relative p-0">
                            <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-green-50 to-transparent"></div>
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-green-600">กำไรขั้นต้น</h3>
                                        <p className="mt-2 text-2xl font-bold text-gray-900">฿{summary.grossProfit.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-lg bg-green-100 p-3">
                                        <TrendingUp className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center">
                                    <TrendingUp className="mr-1.5 h-4 w-4 text-green-500" />
                                    <span className="text-xs font-medium text-green-600">+18.3% จากเดือนที่แล้ว</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden rounded-2xl border-0 shadow-lg">
                        <CardContent className="relative p-0">
                            <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-amber-50 to-transparent"></div>
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-amber-600">Margin (%)</h3>
                                        <p className="mt-2 text-2xl font-bold text-gray-900">{summary.marginPercent}%</p>
                                    </div>
                                    <div className="rounded-lg bg-amber-100 p-3">
                                        <PieChart className="h-6 w-6 text-amber-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center">
                                    <TrendingUp className="mr-1.5 h-4 w-4 text-green-500" />
                                    <span className="text-xs font-medium text-green-600">+2.4% จากเดือนที่แล้ว</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="rounded-2xl border-0 shadow-lg">
                        <CardContent className="p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center">
                                    <BarChart3 className="mr-2 h-5 w-5 text-indigo-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">ยอดขาย vs ต้นทุน รายเดือน</h3>
                                </div>
                                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-800">6 เดือน</span>
                            </div>
                            <BarChartComponent data={salesByMonth} />
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-0 shadow-lg">
                        <CardContent className="p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center">
                                    <PieChart className="mr-2 h-5 w-5 text-indigo-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">สัดส่วนต้นทุนตามสินค้า</h3>
                                </div>
                                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-800">4 สินค้า</span>
                            </div>
                            <PieChartComponent data={costByProduct} />
                        </CardContent>
                    </Card>
                </div>

                {/* Scatter Chart */}
                <Card className="mb-6 rounded-2xl border-0 shadow-lg">
                    <CardContent className="p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <ScatterChart className="mr-2 h-5 w-5 text-indigo-600" />
                                <h3 className="text-lg font-semibold text-gray-800">ความสัมพันธ์ระหว่างปริมาณขายและอัตรากำไร</h3>
                            </div>
                            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-800">วิเคราะห์</span>
                        </div>
                        <ScatterChartComponent data={productMargin} />
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card className="rounded-2xl border-0 shadow-lg">
                    <CardContent className="p-0">
                        <div className="border-b border-gray-200 p-5">
                            <h3 className="text-lg font-semibold text-gray-800">รายละเอียดกำไรตามสินค้า</h3>
                            <p className="mt-1 text-sm text-gray-500">ข้อมูลประสิทธิภาพของสินค้าแต่ละรายการ</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">
                                            สินค้า
                                        </th>
                                        <th className="p-4 text-right text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">
                                            จำนวนขาย
                                        </th>
                                        <th className="p-4 text-right text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">
                                            ยอดขาย
                                        </th>
                                        <th className="p-4 text-right text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">
                                            ต้นทุน
                                        </th>
                                        <th className="p-4 text-right text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">
                                            กำไร
                                        </th>
                                        <th className="p-4 text-right text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">
                                            Margin %
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {productMargin.map((p, i) => (
                                        <tr
                                            key={i}
                                            className={
                                                p.marginPercent < 15
                                                    ? 'bg-red-50 hover:bg-red-100'
                                                    : p.marginPercent < 25
                                                      ? 'bg-yellow-50 hover:bg-yellow-100'
                                                      : 'hover:bg-gray-50'
                                            }
                                        >
                                            <td className="p-4 font-medium whitespace-nowrap text-gray-900">{p.goodName}</td>
                                            <td className="p-4 text-right whitespace-nowrap">{p.totalQtySold.toLocaleString()}</td>
                                            <td className="p-4 text-right whitespace-nowrap">฿{p.totalSales.toLocaleString()}</td>
                                            <td className="p-4 text-right whitespace-nowrap">฿{p.totalCost.toLocaleString()}</td>
                                            <td className="p-4 text-right font-medium whitespace-nowrap">
                                                <span
                                                    className={
                                                        p.grossProfit > 100000
                                                            ? 'text-green-600'
                                                            : p.grossProfit > 50000
                                                              ? 'text-blue-600'
                                                              : 'text-gray-600'
                                                    }
                                                >
                                                    ฿{p.grossProfit.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-medium whitespace-nowrap">
                                                <span
                                                    className={
                                                        p.marginPercent >= 30
                                                            ? 'text-green-600'
                                                            : p.marginPercent >= 20
                                                              ? 'text-blue-600'
                                                              : p.marginPercent >= 10
                                                                ? 'text-yellow-600'
                                                                : 'text-red-600'
                                                    }
                                                >
                                                    {p.marginPercent}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr className="font-semibold text-gray-900">
                                        <td className="p-4">รวม</td>
                                        <td className="p-4 text-right">
                                            {productMargin.reduce((sum, p) => sum + p.totalQtySold, 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            ฿{productMargin.reduce((sum, p) => sum + p.totalSales, 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right">฿{productMargin.reduce((sum, p) => sum + p.totalCost, 0).toLocaleString()}</td>
                                        <td className="p-4 text-right text-green-600">
                                            ฿{productMargin.reduce((sum, p) => sum + p.grossProfit, 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            {(
                                                (productMargin.reduce((sum, p) => sum + p.grossProfit, 0) /
                                                    productMargin.reduce((sum, p) => sum + p.totalSales, 0)) *
                                                100
                                            ).toFixed(1)}
                                            %
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
