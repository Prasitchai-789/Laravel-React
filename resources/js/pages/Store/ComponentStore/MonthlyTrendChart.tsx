import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import dayjs from "dayjs";
import 'dayjs/locale/th';

dayjs.locale('th');

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
    Title
);

interface ChartDataItem {
    id: number;
    document_number: string;
    department: string;
    status: string;
    requester: string;
    note: string;
    order_date: string;
    order_date_only: string;
    month: string;
    total_quantity: number;
    total_price: number;
    items: Array<{
        product_id: string;
        quantity: number;
        GoodUnitID: string;
        price: number;
        total_price: number;
    }>;
}

interface DepartmentSummary {
    department: string;
    departmentCode: string;
    totalQuantity: number;
    totalPrice: number;
    trend: 'up' | 'down' | 'stable';
    transactionCount: number;
}

interface MonthlyTrendChartProps {
    timeRange?: string;
    selectedDate?: Date | null;
    dateRange?: [Date | null, Date | null];
    dateMode?: 'single' | 'range';
    onDataUpdate?: () => void;
}

const MONTH_NAMES = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
    selectedDate,
    timeRange,
    dateRange,
    dateMode,
    onDataUpdate
}) => {
    const [data, setData] = useState<ChartDataItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // สร้าง filters จาก props
    const filters = useMemo(() => {
        let startDate: string | undefined;
        let endDate: string | undefined;
        let finalDateMode = 'monthly';
        let finalTimeRange = timeRange || 'month';

        // ✅ ตรวจสอบ timeRange ก่อน dateMode
        if (timeRange === 'year') {
            // กรณีเลือกทั้งปี
            finalDateMode = 'yearly';
            const now = dayjs();
            startDate = now.startOf('year').format('YYYY-MM-DD');
            endDate = now.endOf('year').format('YYYY-MM-DD');
        }
        // กรณีเลือกช่วงวันที่
        else if (dateMode === 'range' && dateRange && dateRange[0] && dateRange[1]) {
            finalDateMode = 'daily';
            startDate = dayjs(dateRange[0]).format('YYYY-MM-DD');
            endDate = dayjs(dateRange[1]).format('YYYY-MM-DD');
        }
        // กรณีเลือกวันเดียว
        else if (dateMode === 'single' && selectedDate) {
            finalDateMode = 'daily';
            startDate = dayjs(selectedDate).format('YYYY-MM-DD');
            endDate = dayjs(selectedDate).format('YYYY-MM-DD');
        }
        // กรณีใช้ timeRange อื่นๆ (month, quarter, all)
        else if (timeRange) {
            finalDateMode = 'monthly';
            const now = dayjs();

            switch (timeRange) {
                case 'month':
                    startDate = now.startOf('month').format('YYYY-MM-DD');
                    endDate = now.endOf('month').format('YYYY-MM-DD');
                    break;
                case 'quarter':
                    startDate = now.startOf('quarter').format('YYYY-MM-DD');
                    endDate = now.endOf('quarter').format('YYYY-MM-DD');
                    break;
                case 'all':
                    startDate = undefined;
                    endDate = undefined;
                    break;
                default:
                    startDate = now.startOf('month').format('YYYY-MM-DD');
                    endDate = now.endOf('month').format('YYYY-MM-DD');
            }
        }
        // กรณี default
        else {
            finalDateMode = 'monthly';
            const now = dayjs();
            startDate = now.startOf('month').format('YYYY-MM-DD');
            endDate = now.endOf('month').format('YYYY-MM-DD');
        }

        return {
            dateMode: finalDateMode,
            selectedYear: dayjs(startDate || new Date()).year(),
            selectedMonth: dayjs(startDate || new Date()).month() + 1,
            startDate,
            endDate,
            timeRange: finalTimeRange
        };
    }, [selectedDate, timeRange, dateRange, dateMode]);

    // 📊 ดึงข้อมูลจาก API
    const fetchChartData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get("/StoreOrder/Chart", {
                params: {
                    dateMode: filters.dateMode,
                    selectedYear: filters.selectedYear,
                    selectedMonth: filters.selectedMonth,
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    timeRange: filters.timeRange,
                    _t: Date.now()
                },
            });

            if (response.data?.success) {
                const newData = response.data.data || [];
                setData(newData);

                // Call onDataUpdate after state is updated
                setTimeout(() => {
                    if (onDataUpdate) {
                        onDataUpdate();
                    }
                }, 0);
            } else {
                const errorMsg = response.data?.message || "ไม่สามารถดึงข้อมูลได้";
                setError(errorMsg);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ใช้ useEffect เพื่อดึงข้อมูลเมื่อ filters เปลี่ยน
    useEffect(() => {
        fetchChartData();
    }, [filters]);

    // Map department names to codes
    const generateDepartmentCode = (department: string): string => {
        const codes: { [key: string]: string } = {
            'เทคโนโลยีสารสนเทศ': 'ITE',
            'บัญชีและการเงิน': 'ACC',
            'จัดซื้อปาล์ม': 'RPO',
            'ขายและการตลาด': 'MAR',
            'ควบคุมคุณภาพ': 'QAC',
            'จัดซื้อและพัสดุคงคลัง': 'PUR',
            'ทรัพยากรบุคคล': 'HRE',
            'ผลิตและวิศวกรรม': 'PRO',
            'รักษาความปลอดภัย': 'SEC',
            'ความปลอดภัยและสิ่งแวดล้อม': 'SHE',
            'แผนพัฒนาคุณภาพ': 'QMR',
            'บริหาร': 'MD',
            'มั่นสกลการเกษตร': 'MUN',
            'สวนและต้นกล้า': 'AGR',
            'สื่อประชาสัมพันธ์': 'PR'
        };
        return codes[department] || department.substring(0, 3).toUpperCase();
    };

    // Format month for display - แก้ไขให้แสดงช่วงวันที่ถูกต้อง
    const formatMonthDisplay = () => {
        if (dateMode === 'range' && dateRange && dateRange[0] && dateRange[1]) {
            return `ช่วง ${dayjs(dateRange[0]).format('DD/MM/YYYY')} - ${dayjs(dateRange[1]).format('DD/MM/YYYY')}`;
        } else if (dateMode === 'single' && selectedDate) {
            return `วันที่ ${dayjs(selectedDate).format('DD/MM/YYYY')}`;
        } else if (timeRange === 'year') {
            return `ปี ${dayjs().year() + 543}`;
        } else if (timeRange === 'quarter') {
            const quarter = Math.floor((dayjs().month() + 3) / 3);
            return `ไตรมาสที่ ${quarter} ปี ${dayjs().year() + 543}`;
        } else if (timeRange === 'all') {
            return `ทั้งหมด`;
        } else {
            return `เดือน ${MONTH_NAMES[dayjs().month()]} ${dayjs().year() + 543}`;
        }
    };

    // Aggregate data by department - แก้ไขให้คำนวณถูกต้อง
    const departmentSummary = useMemo((): DepartmentSummary[] => {
        const departmentMap = new Map<string, DepartmentSummary>();

        data.forEach(item => {
            const existing = departmentMap.get(item.department);
            if (existing) {
                existing.totalQuantity += item.total_quantity;
                existing.totalPrice += item.total_price;
                existing.transactionCount += 1;
            } else {
                departmentMap.set(item.department, {
                    department: item.department,
                    departmentCode: generateDepartmentCode(item.department),
                    totalQuantity: item.total_quantity,
                    totalPrice: item.total_price,
                    trend: 'stable',
                    transactionCount: 1
                });
            }
        });

        return Array.from(departmentMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
    }, [data]);

    // Statistics - รวมข้อมูลทั้งหมด
    const statistics = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                totalQuantity: 0,
                totalPrice: 0,
                avgQuantity: 0,
                avgPrice: 0,
                totalTransactions: 0,
                avgPerTransaction: 0,
                departmentCount: 0,
                avgPricePerItem: 0
            };
        }

        const totalQuantity = data.reduce((sum, d) => sum + d.total_quantity, 0);
        const totalPrice = data.reduce((sum, d) => sum + d.total_price, 0);
        const totalTransactions = data.length;
        const departmentCount = new Set(data.map(d => d.department)).size;
        const avgQuantity = totalTransactions > 0 ? Math.round(totalQuantity / totalTransactions) : 0;
        const avgPrice = totalTransactions > 0 ? Math.round(totalPrice / totalTransactions) : 0;
        const avgPricePerItem = totalQuantity > 0 ? Math.round(totalPrice / totalQuantity) : 0;

        return {
            totalQuantity,
            totalPrice,
            avgQuantity,
            avgPrice,
            totalTransactions,
            avgPerTransaction: avgPricePerItem,
            departmentCount,
            avgPricePerItem
        };
    }, [data]);

    // Top departments - แก้ไขให้แสดงข้อมูลถูกต้อง
    const topSpender = useMemo(() => {
        if (departmentSummary.length === 0) {
            return {
                department: 'ไม่มีข้อมูล',
                departmentCode: 'N/A',
                totalPrice: 0,
                totalQuantity: 0,
                transactionCount: 0
            };
        }
        return departmentSummary.reduce((max, d) => d.totalPrice > max.totalPrice ? d : max);
    }, [departmentSummary]);

    const mostFrequent = useMemo(() => {
        if (departmentSummary.length === 0) {
            return {
                department: 'ไม่มีข้อมูล',
                departmentCode: 'N/A',
                totalQuantity: 0,
                totalPrice: 0,
                transactionCount: 0
            };
        }
        return departmentSummary.reduce((max, d) => d.totalQuantity > max.totalQuantity ? d : max);
    }, [departmentSummary]);

    const mostTransactions = useMemo(() => {
        if (departmentSummary.length === 0) {
            return {
                department: 'ไม่มีข้อมูล',
                departmentCode: 'N/A',
                totalQuantity: 0,
                totalPrice: 0,
                transactionCount: 0
            };
        }
        return departmentSummary.reduce((max, d) => d.transactionCount > max.transactionCount ? d : max);
    }, [departmentSummary]);

    // Gradient for bars
    const createGradient = (ctx: CanvasRenderingContext2D) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#3B82F6');
        gradient.addColorStop(0.7, '#1D4ED8');
        gradient.addColorStop(1, '#1E40AF');
        return gradient;
    };

    // Chart data - แสดงจำนวนทั้งหมดที่ฝ่ายเป็นคนเบิก
    const chartData = useMemo(() => {
        return {
            labels: departmentSummary.map(d => d.departmentCode),
            datasets: [
                {
                    label: 'จำนวนสินค้าที่เบิก',
                    data: departmentSummary.map(d => d.totalQuantity),
                    backgroundColor: (context: any) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return '#3B82F6';
                        return createGradient(ctx);
                    },
                    borderRadius: 12,
                    borderWidth: 0,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }
            ]
        };
    }, [departmentSummary]);

    // Chart options - ปรับแต่ง Tooltip ให้แสดงทั้งจำนวนและราคา
    const chartOptions = useMemo(() => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context: any) {
                            const index = context.dataIndex;
                            const department = departmentSummary[index];
                            const quantity = department.totalQuantity;
                            const price = department.totalPrice;
                            const avgPricePerItem = quantity > 0 ? Math.round(price / quantity) : 0;

                            return [
                                `📦 จำนวนที่เบิก: ${quantity.toLocaleString('th-TH')} ชิ้น`,
                                `💰 ราคารวม: ${price.toLocaleString('th-TH')} บาท`,
                                `📊 ราคาเฉลี่ยต่อชิ้น: ${avgPricePerItem.toLocaleString('th-TH')} บาท`,
                                `📋 จำนวนรายการ: ${department.transactionCount} รายการ`
                            ];
                        },
                        afterLabel: function (context: any) {
                            const index = context.dataIndex;
                            const department = departmentSummary[index];
                            return `🏢 ฝ่าย: ${department.department}`;
                        },
                        title: function (tooltipItems: any[]) {
                            const index = tooltipItems[0].dataIndex;
                            return `รหัสฝ่าย: ${departmentSummary[index].departmentCode}`;
                        }
                    },
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#60A5FA',
                    bodyColor: '#F8FAFC',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 16,
                    displayColors: false,
                    bodyFont: {
                        size: 13,
                        family: "'Noto Sans Thai', sans-serif"
                    },
                    titleFont: {
                        size: 14,
                        weight: 'bold',
                        family: "'Noto Sans Thai', sans-serif"
                    },
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'จำนวนสินค้า (ชิ้น)',
                        font: {
                            size: 12,
                            weight: '600',
                            family: "'Noto Sans Thai', sans-serif"
                        },
                        color: '#64748B'
                    },
                    grid: {
                        color: 'rgba(100, 116, 139, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748B',
                        font: {
                            family: "'Noto Sans Thai', sans-serif"
                        },
                        callback: function (value: any) {
                            return Number(value).toLocaleString('th-TH');
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'รหัสฝ่าย',
                        font: {
                            size: 12,
                            weight: '600',
                            family: "'Noto Sans Thai', sans-serif"
                        },
                        color: '#64748B'
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#64748B',
                        font: {
                            family: "'Noto Sans Thai', sans-serif",
                            weight: '500'
                        }
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeOutQuart' as const
            },
            hover: {
                animationDuration: 0
            }
        };
    }, [departmentSummary]);

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">กำลังโหลดข้อมูล...</p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">{formatMonthDisplay()}</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="text-center py-16 bg-red-50 dark:bg-red-900/20 rounded-2xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">{error}</p>
            <button
                onClick={fetchChartData}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors duration-200"
            >
                🔄 ลองอีกครั้ง
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        📊 รายงานการเบิกงบประมาณ
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                        ข้อมูลการเบิกสินค้าและงบประมาณแยกตามฝ่าย - {formatMonthDisplay()}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                            💰 ราคารวม: ฿{statistics.totalPrice.toLocaleString('th-TH')}
                        </span>
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm">
                            📦 จำนวน: {statistics.totalQuantity.toLocaleString('th-TH')} ชิ้น
                        </span>
                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm">
                            📋 รายการ: {statistics.totalTransactions} รายการ
                        </span>
                        <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm">
                            🏢 ฝ่าย: {statistics.departmentCount} ฝ่าย
                        </span>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            {departmentSummary.length > 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                            กราฟแสดงจำนวนสินค้าที่เบิกแยกตามฝ่าย
                        </h3>
                        <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full">
                            {departmentSummary.length} ฝ่าย
                        </div>
                    </div>
                    <div style={{ height: '400px' }}>
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 text-center">
                        💡 เลื่อนเมาส์เหนือแท่งกราฟเพื่อดูรายละเอียดจำนวนและราคา
                    </p>
                </div>
            ) : (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                    <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📊</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">ไม่มีข้อมูลสำหรับเดือนที่เลือก</p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">{formatMonthDisplay()}</p>
                    <div className="mt-4 space-y-2">
                        <p className="text-xs text-slate-500">ข้อมูลทั้งหมด: {data.length} รายการ</p>
                    </div>
                    <button
                        onClick={fetchChartData}
                        className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        โหลดข้อมูลใหม่
                    </button>
                </div>
            )}

            {/* Statistics Cards */}
            {departmentSummary.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Top Spender */}
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/30 rounded-2xl p-6 border border-amber-200/50 dark:border-amber-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-amber-500/10">
                                    <span className="text-2xl text-amber-600">💰</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">ฝ่ายใช้จ่ายมากที่สุด</p>
                                </div>
                            </div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                    ฿{topSpender.totalPrice.toLocaleString('th-TH')}
                                </p>
                                <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                                    {topSpender.totalQuantity.toLocaleString('th-TH')} ชิ้น
                                </p>
                            </div>
                            <div className="pt-3 border-t border-amber-200/50 dark:border-amber-600/50">
                                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                    {topSpender.department}
                                </p>
                                <p className="text-xs text-amber-500 dark:text-amber-400">
                                    รหัส: {topSpender.departmentCode} • {topSpender.transactionCount} รายการ
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Most Frequent */}
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/30 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-emerald-500/10">
                                    <span className="text-2xl text-emerald-600">📦</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">ฝ่ายเบิกสินค้ามากที่สุด</p>
                                </div>
                            </div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {mostFrequent.totalQuantity.toLocaleString('th-TH')} ชิ้น
                                </p>
                                <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                                    ฿{mostFrequent.totalPrice.toLocaleString('th-TH')}
                                </p>
                            </div>
                            <div className="pt-3 border-t border-emerald-200/50 dark:border-emerald-600/50">
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    {mostFrequent.department}
                                </p>
                                <p className="text-xs text-emerald-500 dark:text-emerald-400">
                                    รหัส: {mostFrequent.departmentCode} • {mostFrequent.transactionCount} รายการ
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Most Transactions */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-blue-500/10">
                                    <span className="text-2xl text-blue-600">📋</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">ฝ่ายมีรายการเบิกมากที่สุด</p>
                                </div>
                            </div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {mostTransactions.transactionCount} รายการ
                                </p>
                                <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                                    {mostTransactions.totalQuantity.toLocaleString('th-TH')} ชิ้น
                                </p>
                            </div>
                            <div className="pt-3 border-t border-blue-200/50 dark:border-blue-600/50">
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    {mostTransactions.department}
                                </p>
                                <p className="text-xs text-blue-500 dark:text-blue-400">
                                    รหัส: {mostTransactions.departmentCode} • ฿{mostTransactions.totalPrice.toLocaleString('th-TH')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyTrendChart;
