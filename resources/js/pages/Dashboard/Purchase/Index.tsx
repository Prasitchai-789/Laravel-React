import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface PurchaseData {
    DeptID: number;
    DeptName: string;
    SumTotalAmount: number;
}

interface DashboardData {
    DeptID: number;
    DeptName: string;
    TotalNet: number;
    previousMonthTotal?: number;
    changePercentage?: number;
    trend?: 'up' | 'down' | 'stable';
}

export default function Index() {
    const { dashboard: initialDashboard } = usePage().props as { dashboard: PurchaseData[] };
    const [dashboard, setDashboard] = useState<DashboardData[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [loading, setLoading] = useState(false);
    const [previousData, setPreviousData] = useState<DashboardData[]>([]);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/purchase/dashboard/api', { params: { year, month } });
            const apiData: PurchaseData[] = res.data.data || [];

            // สร้างข้อมูลเปรียบเทียบกับเดือนก่อนหน้า
            const processedData = await processWithComparison(apiData);
            setDashboard(processedData);

        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const processWithComparison = async (currentData: PurchaseData[]): Promise<DashboardData[]> => {
        // คำนวณเดือนก่อนหน้า
        let prevYear = year;
        let prevMonth = month - 1;

        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear = year - 1;
        }

        try {
            // ดึงข้อมูลเดือนก่อนหน้า
            const prevRes = await axios.get('/purchase/dashboard/api', {
                params: { year: prevYear, month: prevMonth }
            });
            const prevApiData: PurchaseData[] = prevRes.data.data || [];

            // ประมวลผลข้อมูลเปรียบเทียบ
            return currentData.map(item => {
                const prevItem = prevApiData.find(prev => prev.DeptID === item.DeptID);
                const currentTotal = Number(item.TotalNet) || 0;
                const previousTotal = prevItem ? Number(prevItem.TotalNet) || 0 : 0;

                let changePercentage = 0;
                let trend: 'up' | 'down' | 'stable' = 'stable';

                if (previousTotal > 0) {
                    changePercentage = ((currentTotal - previousTotal) / previousTotal) * 100;

                    if (changePercentage > 5) {
                        trend = 'up';
                    } else if (changePercentage < -5) {
                        trend = 'down';
                    } else {
                        trend = 'stable';
                    }
                } else if (currentTotal > 0) {
                    trend = 'up';
                    changePercentage = 100;
                }

                return {
                    ...item,
                    TotalNet: currentTotal,
                    previousMonthTotal: previousTotal,
                    changePercentage,
                    trend
                };
            });

        } catch (error) {
            console.error('Error fetching previous month data:', error);
            // หากดึงข้อมูลเดือนก่อนหน้าไม่สำเร็จ ให้ส่งคืนข้อมูลปัจจุบันโดยไม่มี comparison
            return currentData.map(item => ({
                ...item,
                TotalNet: Number(item.TotalNet) || 0,
                previousMonthTotal: 0,
                changePercentage: 0,
                trend: 'stable' as const
            }));
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, [year, month]);

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = [
        { value: 0, label: 'ทั้งหมด' },
        ...Array.from({ length: 12 }, (_, i) => ({
            value: i + 1,
            label: `${i + 1}`.padStart(2, '0'),
        })),
    ];

    const getThaiMonthName = (month: number): string => {
        const thaiMonths = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        return `${thaiMonths[month - 1] || ''}`;
    };

    const getPreviousMonthName = () => {
        let prevYear = year;
        let prevMonth = month - 1;

        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear = year - 1;
        }

        return `${getThaiMonthName(prevMonth)} ${prevYear}`;
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'สรุปค่าใช้จ่ายตามหน่วยงาน', href: '#' },
    ];

    // เรียงข้อมูลจากมากไปน้อยก่อนคำนวณ total
    const sortedDashboard = [...dashboard].sort((a, b) => b.TotalNet - a.TotalNet);
    const totalNet = sortedDashboard.reduce((sum, item) => sum + Number(item.TotalNet), 0);

    // คำนวณเปอร์เซ็นต์สำหรับแต่ละหน่วยงาน
    const dashboardWithPercentage = sortedDashboard.map(item => ({
        ...item,
        percentage: totalNet > 0 ? (Number(item.TotalNet) / totalNet) * 100 : 0
    }));

    // คอมโพเนนต์ลูกศรแสดงสถานะ
    const TrendArrow = ({ trend, percentage }: { trend: 'up' | 'down' | 'stable', percentage: number }) => {
        if (trend === 'stable') {
            return (
                <div className="flex items-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                    </svg>
                    <span className="text-xs ml-1">คงที่</span>
                </div>
            );
        }

        if (trend === 'up') {
            return (
                <div className="flex items-center text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="text-xs ml-1">+{percentage.toFixed(1)}%</span>
                </div>
            );
        }

        return (
            <div className="flex items-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="text-xs ml-1">{percentage.toFixed(1)}%</span>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 font-anuphan">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="mb-2 text-3xl font-bold text-gray-900">สรุปค่าใช้จ่ายตามหน่วยงาน</h1>
                                <p className="text-gray-600">ข้อมูลสรุปยอดค่าใช้จ่ายแยกตามหน่วยงาน พร้อมการเปรียบเทียบกับเดือนก่อนหน้า</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/80 rounded-lg px-4 py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span>อัพเดตล่าสุด: {new Date().toLocaleString('th-TH')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 rounded-2xl border border-white bg-white/80 backdrop-blur-sm p-6 shadow-md">
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-medium text-gray-700">ปี</label>
                                <div className="relative">
                                    <select
                                        value={year}
                                        onChange={(e) => setYear(parseInt(e.target.value))}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none"
                                    >
                                        {years.map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-medium text-gray-700">เดือน</label>
                                <div className="relative">
                                    <select
                                        value={month}
                                        onChange={(e) => setMonth(parseInt(e.target.value))}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none"
                                    >
                                        {months.map((m) => (
                                            <option key={m.value} value={m.value}>
                                                {m.value === 0 ? m.label : getThaiMonthName(m.value)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={fetchDashboard}
                                disabled={loading}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-white transition-all duration-200 hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-md hover:shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        กำลังโหลด...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                        </svg>
                                        รีเฟรช
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
                        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-lg lg:col-span-4">
                            <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
                                <div>
                                    <p className="text-sm font-medium text-blue-100">
                                        ยอดรวมทั้งหมด {month === 0 ? `ปี ${year}` : `ประจำเดือน${getThaiMonthName(month)} ${year}`}
                                    </p>
                                    <p className="mt-1 text-4xl font-bold">
                                        {totalNet
                                            ? `${parseFloat(totalNet.toString())
                                                  .toFixed(2)
                                                  .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                                            : '-'}{' '}
                                        บาท
                                    </p>
                                    <div className="mt-2 flex items-center text-blue-100 text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        เปรียบเทียบกับเดือน {getPreviousMonthName()}
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-4 sm:mt-0">
                                    <div className="rounded-full bg-white/20 p-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Stats Cards */}
                        <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-100">
                            <div className="flex items-center">
                                <div className="rounded-lg bg-green-100 p-3 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">จำนวนหน่วยงาน</p>
                                    <p className="text-2xl font-bold text-gray-900">{sortedDashboard.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-100">
                            <div className="flex items-center">
                                <div className="rounded-lg bg-purple-100 p-3 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">หน่วยงานสูงสุด</p>
                                    <p className="text-lg font-bold text-gray-900 truncate">
                                        {sortedDashboard.length > 0 ? sortedDashboard[0].DeptName : '-'}
                                    </p>
                                    {sortedDashboard.length > 0 && sortedDashboard[0].trend && (
                                        <div className="mt-1">
                                            <TrendArrow trend={sortedDashboard[0].trend} percentage={sortedDashboard[0].changePercentage || 0} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-100">
                            <div className="flex items-center">
                                <div className="rounded-lg bg-amber-100 p-3 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">ค่าใช้จ่ายสูงสุด</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {sortedDashboard.length > 0
                                            ? `${Number(sortedDashboard[0].TotalNet).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                                            : '-'}
                                    </p>
                                    {sortedDashboard.length > 0 && sortedDashboard[0].trend && (
                                        <div className="mt-1">
                                            <TrendArrow trend={sortedDashboard[0].trend} percentage={sortedDashboard[0].changePercentage || 0} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table and Chart Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Table */}
                        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
                            <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                    รายการค่าใช้จ่ายตามหน่วยงาน
                                    <span className="ml-2 text-sm font-normal text-gray-500 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        เปรียบเทียบกับเดือน {getPreviousMonthName()}
                                    </span>
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase">ลำดับ</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">หน่วยงาน</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-gray-600 uppercase">ยอดสุทธิ</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-gray-600 uppercase">สัดส่วน</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase">สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {dashboardWithPercentage.length > 0 ? (
                                            dashboardWithPercentage.map((d, index) => (
                                                <tr key={d.DeptID} className="transition-colors duration-150 hover:bg-gray-50/70">
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${index < 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className={`mr-3 h-3 w-3 rounded-full ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-blue-500' : index === 2 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                            <span className="text-sm font-medium text-gray-900">{d.DeptName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right whitespace-nowrap font-medium">
                                                        {Number(d.TotalNet).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-4 text-right whitespace-nowrap text-gray-500">
                                                        {d.percentage.toFixed(1)}%
                                                    </td>
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        {d.trend && <TrendArrow trend={d.trend} percentage={d.changePercentage || 0} />}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                    {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลสำหรับช่วงเวลาที่เลือก'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>

                                    {dashboardWithPercentage.length > 0 && (
                                        <tfoot className="border-t border-gray-200 bg-gray-50">
                                            <tr>
                                                <td className="px-6 py-4 font-semibold text-gray-900" colSpan={2}>
                                                    รวมทั้งหมด
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                    {totalNet.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                    100%
                                                </td>
                                                <td className="px-6 py-4 text-center font-semibold text-gray-900">
                                                    -
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        {/* Chart/Summary Panel */}
                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
                            <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                                <h2 className="text-lg font-semibold text-gray-800">สรุปภาพรวมและแนวโน้ม</h2>
                            </div>
                            <div className="p-6">
                                {dashboardWithPercentage.length > 0 ? (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700 mb-3">สัดส่วนค่าใช้จ่ายตามหน่วยงาน</h3>
                                            <div className="space-y-3">
                                                {dashboardWithPercentage.slice(0, 5).map((d, index) => (
                                                    <div key={d.DeptID} className="space-y-1">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="font-medium text-gray-700 truncate max-w-[70%]">{d.DeptName}</span>
                                                            <span className="text-gray-500">{d.percentage.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-blue-500' : index === 2 ? 'bg-green-500' : index === 3 ? 'bg-purple-500' : 'bg-gray-400'}`}
                                                                style={{ width: `${d.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {dashboardWithPercentage.length > 5 && (
                                                    <div className="pt-2 text-center">
                                                        <span className="text-xs text-gray-500">
                                                            + {dashboardWithPercentage.length - 5} หน่วยงานอื่นๆ
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-200">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">สถิติแนวโน้ม</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">หน่วยงานที่เพิ่มขึ้น</span>
                                                    <span className="text-sm font-medium text-red-600">
                                                        {dashboardWithPercentage.filter(d => d.trend === 'up').length} หน่วยงาน
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">หน่วยงานที่ลดลง</span>
                                                    <span className="text-sm font-medium text-green-600">
                                                        {dashboardWithPercentage.filter(d => d.trend === 'down').length} หน่วยงาน
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">หน่วยงานคงที่</span>
                                                    <span className="text-sm font-medium text-gray-600">
                                                        {dashboardWithPercentage.filter(d => d.trend === 'stable').length} หน่วยงาน
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-200">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">ข้อมูลเพิ่มเติม</h3>
                                            <div className="space-y-2 text-sm text-gray-600">
                                                {/* <div className="flex justify-between">
                                                    <span>ค่าใช้จ่ายเฉลี่ยต่อหน่วยงาน:</span>
                                                    <span className="font-medium text-gray-800">
                                                        {(totalNet / dashboardWithPercentage.length).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div> */}
                                                <div className="flex justify-between">
                                                    <span>หน่วยงานที่มีค่าใช้จ่ายสูงสุด:</span>
                                                    <span className="font-medium text-gray-800 truncate max-w-[50%]">
                                                        {dashboardWithPercentage[0].DeptName}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>สัดส่วน 3 อันดับแรก:</span>
                                                    <span className="font-medium text-gray-800">
                                                        {dashboardWithPercentage.slice(0, 3).reduce((sum, item) => sum + item.percentage, 0).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่มีข้อมูลที่จะแสดง'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
