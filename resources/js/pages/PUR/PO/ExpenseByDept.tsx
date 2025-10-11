import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';

// Register chart.js modules
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ExpenseByDept() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState('');
    const [data, setData] = useState([]);
    const [summaryData, setSummaryData] = useState({
        highestDept: { name: '', amount: 0 },
        yearlyTotal: 0,
        monthlyTotal: 0,
    });
    const [loading, setLoading] = useState(true);

    // สร้างรายการปี (5 ปีย้อนหลัง)
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    // รายการเดือน
    const months = [
        { value: '', label: 'ทั้งหมด' },
        { value: '01', label: 'มกราคม' },
        { value: '02', label: 'กุมภาพันธ์' },
        { value: '03', label: 'มีนาคม' },
        { value: '04', label: 'เมษายน' },
        { value: '05', label: 'พฤษภาคม' },
        { value: '06', label: 'มิถุนายน' },
        { value: '07', label: 'กรกฎาคม' },
        { value: '08', label: 'สิงหาคม' },
        { value: '09', label: 'กันยายน' },
        { value: '10', label: 'ตุลาคม' },
        { value: '11', label: 'พฤศจิกายน' },
        { value: '12', label: 'ธันวาคม' },
    ];

    useEffect(() => {
        setLoading(true);
        axios
            .get('/purchase/po/chart', {
                params: { year: selectedYear, month: selectedMonth },
            })
            .then((res) => {
                const byDept = res.data.byDept || [];

                // เรียงข้อมูลจากมากไปน้อย
                const sortedData = [...byDept].sort((a, b) => Number(b.total) - Number(a.total));
                setData(sortedData);

                // คำนวณข้อมูลสรุป
                const highest =
                    sortedData.length > 0 ? { name: sortedData[0].DeptName, amount: Number(sortedData[0].total) } : { name: '', amount: 0 };

                const monthlyTotal = sortedData.reduce((sum, dept) => sum + Number(dept.total), 0);

                setSummaryData({
                    highestDept: highest,
                    yearlyTotal: Number(res.data.yearlyTotal) || 0,
                    monthlyTotal: monthlyTotal,
                });
            })
            .finally(() => setLoading(false));
    }, [selectedYear, selectedMonth]);

    // เรียงข้อมูลจากมากไปน้อยก่อนสร้าง chart data
    const sortedData = [...data].sort((a, b) => Number(b.total) - Number(a.total));

    const chartData = {
        labels: sortedData.map((d) => d.DeptName),
        datasets: [
            {
                label: 'ค่าใช้จ่าย',
                data: sortedData.map((d) => Number(d.total)),
                backgroundColor: sortedData.map((d, i) => `hsl(${i * 30}, 70%, 60%)`),
                borderColor: sortedData.map((d, i) => `hsl(${i * 30}, 70%, 45%)`),
                borderWidth: 2,
                borderRadius: 12,
                borderSkipped: false,
                barPercentage: 0.7,
                categoryPercentage: 0.8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1F2937',
                bodyColor: '#4B5563',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                padding: 16,
                boxPadding: 8,
                usePointStyle: true,
                titleFont: {
                    family: "'Anuphan', sans-serif",
                    size: 12,
                    weight: '600',
                },
                bodyFont: {
                    family: "'Anuphan', sans-serif",
                    size: 11,
                },
                callbacks: {
                    label: function (context) {
                        return `ค่าใช้จ่าย: ฿${Number(context.raw).toLocaleString()}`;
                    },
                    title: function (context) {
                        return context[0].label;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        family: "'Anuphan', sans-serif",
                        size: 11,
                        weight: '500',
                    },
                    maxRotation: 45,
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(229, 231, 235, 0.6)',
                    drawBorder: false,
                    borderDash: [4, 4],
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        family: "'Anuphan', sans-serif",
                        size: 11,
                    },
                    callback: function (value) {
                        const numValue = Number(value);
                        if (numValue >= 1000000) {
                            return '฿' + (numValue / 1000000).toFixed(1) + 'M';
                        } else if (numValue >= 1000) {
                            return '฿' + (numValue / 1000).toFixed(0) + 'K';
                        }
                        return '฿' + numValue.toLocaleString();
                    },
                },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
        animation: {
            duration: 800,
            easing: 'easeOutCubic',
        },
    };

    // ฟังก์ชันจัดรูปแบบตัวเลข
    const formatCurrency = (amount) => {
        const numAmount = Number(amount);
        if (numAmount >= 1000000) {
            return '฿' + (numAmount / 1000000).toFixed(1) + 'M';
        } else if (numAmount >= 1000) {
            return '฿' + (numAmount / 1000).toFixed(0) + 'K';
        }
        return '฿' + numAmount.toLocaleString();
    };

    const getAvailableMonths = () => {
        const now = new Date();
        const months: string[] = [];
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            months.push(`${y}-${m}`);
        }
        return months;
    };

    // ฟังก์ชันดึงชื่อเดือนจากค่า
    const getMonthName = (monthValue) => {
        if (!monthValue) return 'ทั้งหมด';

        // ถ้าเป็นรูปแบบ YYYY-MM
        if (monthValue.includes('-')) {
            const [year, monthNum] = monthValue.split('-');
            const monthNames = [
                'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
            ];
            const monthName = monthNames[parseInt(monthNum) - 1] || monthNum;
            return `${monthName} ${parseInt(year) + 543}`;
        }

        // ถ้าเป็นรูปแบบเดิม (01, 02, ...)
        const month = months.find((m) => m.value === monthValue);
        return month ? month.label : 'ทั้งหมด';
    };

    if (loading) {
        return (
            <div className="min-h-96 w-full rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/80 p-6">
                <div className="flex h-72 items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Purchase Order Chart', href: '/purchase/po/chart' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="รายงานค่าใช้จ่ายแยกตามหน่วยงาน" />
            <div className="space-y-6 p-6 font-anuphan">
                {/* Header with Dropdowns */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">รายงานค่าใช้จ่ายแยกตามหน่วยงาน</h1>
                            <p className="mt-1 text-gray-600">ติดตามและวิเคราะห์ค่าใช้จ่ายของแต่ละหน่วยงาน</p>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            {/* Year Dropdown */}
                            <div className="min-w-[140px]">
                                <label className="mb-2 block text-sm font-medium text-gray-700">ปี</label>
                                <div className="relative">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="block w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 pr-10 font-anuphan text-gray-900 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {years.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Month Dropdown */}
                            <div className="min-w-[180px]">
                                <label className="mb-2 block text-sm font-medium text-gray-700">เดือน</label>
                                <div className="relative">
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="block w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 pr-10 font-anuphan text-gray-900 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="" className="text-gray-500">
                                            ทุกเดือน
                                        </option>
                                        {getAvailableMonths().map((month) => {
                                            const [year, monthNum] = month.split('-').map(Number);
                                            const monthNames = [
                                                'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                                                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
                                            ];
                                            const monthName = monthNames[monthNum - 1] || monthNum;

                                            return (
                                                <option key={month} value={month} className="text-gray-900">
                                                    {monthName} {year + 543}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Highest Expense Card */}
                    <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="mb-1 text-sm font-medium text-orange-800">หน่วยงานใช้งบสูงสุด</p>
                                <h3 className="truncate text-lg font-bold text-orange-900">{summaryData.highestDept.name || '-'}</h3>
                                <p className="mt-2 text-2xl font-bold text-orange-600">{formatCurrency(summaryData.highestDept.amount)}</p>
                            </div>
                            <div className="ml-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Total Card */}
                    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="mb-1 text-sm font-medium text-blue-800">ค่าใช้จ่ายรวมเดือนนี้</p>
                                <h3 className="text-lg font-bold text-blue-900">{getMonthName(selectedMonth)}</h3>
                                <p className="mt-2 text-2xl font-bold text-blue-600">{formatCurrency(summaryData.monthlyTotal)}</p>
                            </div>
                            <div className="ml-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Yearly Total Card */}
                    <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="mb-1 text-sm font-medium text-green-800">ค่าใช้จ่ายรวมทั้งปี</p>
                                <h3 className="text-lg font-bold text-green-900">{selectedYear}</h3>
                                <p className="mt-2 text-2xl font-bold text-green-600">{formatCurrency(summaryData.yearlyTotal)}</p>
                            </div>
                            <div className="ml-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-500">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/80 p-6 shadow-sm">
                    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">กราฟแสดงค่าใช้จ่ายแยกตามหน่วยงาน</h2>
                            <p className="mt-1 text-sm text-gray-600">
                                {selectedYear} {selectedMonth ? `- ${getMonthName(selectedMonth)}` : '(ทั้งปี)'} • เรียงจากมากไปน้อย
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
                            <span className="text-sm font-medium text-gray-700">ค่าใช้จ่าย (เรียงจากมากไปน้อย)</span>
                        </div>
                    </div>

                    <div className="h-80">
                        {sortedData.length > 0 ? (
                            <Bar data={chartData} options={options} />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center">
                                    <svg className="mx-auto mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <p className="text-lg text-gray-500">ไม่มีข้อมูลสำหรับช่วงเวลาที่เลือก</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
