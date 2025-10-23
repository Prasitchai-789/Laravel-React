import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    TimeScale,
    Tooltip,
} from 'chart.js';
import React, { Component, ErrorInfo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler, TimeScale);

import WaveCard from '@/components/Card/WaveCard';
import YearlySummary from '@/components/Charts/YearlySummary';

// ===== Types =====
interface Summary {
    total_sales: number;
    total_returns: number;
    total_weight: number;
    average_price: number; // Baht/kg
}

interface ProductRow {
    good_id: number;
    good_name: string;
    sales_amount: number;
    returns_amount: number;
    net_sales: number;
    total_weight: number; // tons
    average_price: number; // Baht/kg
    production_ratio: number; // 0..1
}

interface MonthlyTrendRow {
    month: string; // YYYY-MM
    sales: number;
    returns: number;
    net_sales: number;
    average_price: number;
    weight: number;
}

interface Trend3YLine {
    year: number;
    points: { month: number; net_sales: number }[];
}

// ===== Utilities =====
const toTHB = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 0 });
const toTons = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 0 });
const toPct = (n: number) => (n * 100).toFixed(1) + '%';
const toPrice = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Month labels mapping
const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const monthNamesEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ===== Main Component =====
export default function SalesDashboard() {
    const today = new Date();
    const [year, setYear] = useState<number>(today.getFullYear());
    const [month, setMonth] = useState<string>(''); // optional filter
    const [goodId, setGoodId] = useState<number | ''>('');

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    const [summary, setSummary] = useState<Summary | null>(null);
    const [products, setProducts] = useState<ProductRow[]>([]);
    const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendRow[]>([]);

    const [trend3y, setTrend3y] = useState<Trend3YLine[]>([]);

    // Animation state for KPIs
    const [animatedValues, setAnimatedValues] = useState({
        total_sales: 0,
        total_returns: 0,
        total_weight: 0,
        average_price: 0,
    });

    const startDate = useMemo(() => `${year}-01-01`, [year]);
    const endDate = useMemo(() => `${year}-12-31`, [year]);

    // ✅ ป้องกัน loop render จากการ animate ค่า
    const prevSummaryRef = useRef<Summary | null>(null);

    useEffect(() => {
        if (!summary) return;

        const prev = prevSummaryRef.current;
        // ตรวจว่าค่า summary เปลี่ยนจริงหรือไม่ (เฉพาะ field หลัก)
        if (
            prev &&
            prev.total_sales === summary.total_sales &&
            prev.total_returns === summary.total_returns &&
            prev.total_weight === summary.total_weight &&
            prev.average_price === summary.average_price
        ) {
            return;
        }

        prevSummaryRef.current = summary;

        const start = { ...animatedValues };
        const target = { ...summary };
        const duration = 800;
        const t0 = performance.now();
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
        let raf: number;

        const tick = (now: number) => {
            const p = Math.min(1, (now - t0) / duration);
            const e = easeOut(p);
            setAnimatedValues((prev) => ({
                total_sales: Math.round(start.total_sales + (target.total_sales - start.total_sales) * e),
                total_returns: Math.round(start.total_returns + (target.total_returns - start.total_returns) * e),
                total_weight: Math.round(start.total_weight + (target.total_weight - start.total_weight) * e),
                average_price: start.average_price + (target.average_price - start.average_price) * e,
            }));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
        // ❌ ไม่มี animatedValues ใน dependency → จะไม่ loop
    }, [summary]);

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const params: any = { start_date: startDate, end_date: endDate };
            if (goodId) params.good_id = goodId;
            if (month) {
                // narrow to month boundaries
                const d = new Date(`${year}-${month}-01T00:00:00`);
                const start = new Date(d.getFullYear(), d.getMonth(), 1);
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                params.start_date = start.toISOString().slice(0, 10);
                params.end_date = end.toISOString().slice(0, 10);
            }

            const [r1, r2, r3, r4, r5, r6] = await Promise.all([
                axios.get('/sales-summary/api', { params }),
                axios.get('/market-price/api', {
                    params: { start_date: params.start_date, end_date: params.end_date, good_id: goodId || 2147 },
                }),
                axios.get('/trends-3y/api', { params: { end_year: year, good_id: goodId || 2147 } }),
                axios.get('/conversion/api', { params }),
                axios.get('/loss-analysis/api', { params }),
                axios.get('/top-customers/api', { params: { ...params, limit: 5 } }),
            ]);

            const sj = r1.data;
            setSummary(sj.summary);
            setProducts((sj.products || []).sort((a: any, b: any) => b.net_sales - a.net_sales));
            setMonthlyTrends(sj.monthly_trends || []);
            setTrend3y(r3.data.lines || []);
        } catch (e: any) {
            console.error(e);
            setError(e?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
            // Fallback demo data (optional)
            setSummary({ total_sales: 45600000, total_returns: 1200000, total_weight: 2300, average_price: 19.8 });
            setProducts([
                {
                    good_id: 2147,
                    good_name: 'น้ำมันปาล์มดิบ',
                    sales_amount: 30000000,
                    returns_amount: 800000,
                    net_sales: 29200000,
                    total_weight: 1200,
                    average_price: 24.33,
                    production_ratio: 0.6,
                },
                {
                    good_id: 2150,
                    good_name: 'เมล็ดในปาล์ม',
                    sales_amount: 10500000,
                    returns_amount: 250000,
                    net_sales: 10250000,
                    total_weight: 400,
                    average_price: 25.63,
                    production_ratio: 0.2,
                },
                {
                    good_id: 2151,
                    good_name: 'กะลา',
                    sales_amount: 3200000,
                    returns_amount: 50000,
                    net_sales: 3150000,
                    total_weight: 200,
                    average_price: 16.0,
                    production_ratio: 0.1,
                },
                {
                    good_id: 2152,
                    good_name: 'ทะลายสับ',
                    sales_amount: 1200000,
                    returns_amount: 20000,
                    net_sales: 1180000,
                    total_weight: 150,
                    average_price: 8.0,
                    production_ratio: 0.05,
                },
                {
                    good_id: 2153,
                    good_name: 'ทะลายปาล์มเปล่า',
                    sales_amount: 700000,
                    returns_amount: 10000,
                    net_sales: 690000,
                    total_weight: 100,
                    average_price: 7.0,
                    production_ratio: 0.03,
                },
                {
                    good_id: 2154,
                    good_name: 'ใยปาล์ม',
                    sales_amount: 650000,
                    returns_amount: 5000,
                    net_sales: 645000,
                    total_weight: 80,
                    average_price: 8.06,
                    production_ratio: 0.02,
                },
            ]);
            setTrend3y([
                { year: year - 2, points: monthLabels.map((_, i) => ({ month: i + 1, net_sales: 2500000 + i * 80000 })) },
                { year: year - 1, points: monthLabels.map((_, i) => ({ month: i + 1, net_sales: 2800000 + i * 90000 })) },
                { year, points: monthLabels.map((_, i) => ({ month: i + 1, net_sales: 3000000 + i * 100000 })) },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [year, month, goodId]);

    class ChartBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
        constructor(props: any) {
            super(props);
            this.state = { hasError: false };
        }

        static getDerivedStateFromError() {
            return { hasError: true };
        }

        componentDidCatch(error: Error, info: ErrorInfo) {
            console.error('Chart error:', error, info);
        }

        render() {
            if (this.state.hasError) {
                return <div className="text-sm text-red-600">⚠️ เกิดข้อผิดพลาดในการแสดงกราฟ</div>;
            }
            return this.props.children;
        }
    }

    const trend3yData = useMemo(() => {
        if (!trend3y.length) return { labels: monthNamesEN, datasets: [] };
        const labels = [...monthNamesEN];
        const colors = ['#6b7280', '#3b82f6', '#10b981'];

        return {
            labels,
            datasets: trend3y.map((line, idx) => ({
                label: `${line.year}`,
                data: labels.map((_, i) => {
                    const point = line.points.find((p) => p.month === i + 1);
                    return point ? point.net_sales : 0;
                }),
                borderColor: colors[idx % colors.length],
                backgroundColor: colors[idx % colors.length],
                borderWidth: 3,
                tension: 0.3,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
            })),
        };
    }, [JSON.stringify(trend3y)]);

    // ===== Chart Options (improved) =====
    const lineOpts: any = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1f2937',
                bodyColor: '#374151',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
            },
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: {
                grid: {
                    display: false,
                },
            },
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    callback: (v: number) => v.toLocaleString('th-TH'),
                    font: {
                        size: 11,
                    },
                },
            },
        },
    };

    const extractRecentMonths = useCallback(
        (key: keyof MonthlyTrendRow, divideBy = 1000) => {
            if (!monthlyTrends.length) return [];
            const currentMonth = new Date().getMonth() + 1; // 1–12
            const startMonth = currentMonth - 6 <= 0 ? 1 : currentMonth - 6;

            return monthlyTrends
                .filter((_, idx) => idx + 1 >= startMonth && idx + 1 <= currentMonth)
                .map((m, i) => ({
                    name: monthNamesEN[startMonth - 1 + i],
                    value: Math.round((m[key] as number) / divideBy),
                }));
        },
        [monthlyTrends],
    );

    // ===== Derived Chart Data =====
    const chartNetSales = extractRecentMonths('net_sales');
    const chartWeightSales = extractRecentMonths('weight');
    const chartAveragePrice = extractRecentMonths('average_price', 1);
    const chartReturns = extractRecentMonths('returns');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'รายงานสรุปการขาย', href: '/memo/documents' },
    ];

    const yearlyData = useMemo(() => {
        if (!monthlyTrends?.length) return [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthlyTrends.map((m, i) => ({
            name: monthNames[i],
            revenue: Math.round(m.net_sales / 1000000),
            avgPrice: Math.round(m.average_price),
        }));
    }, [monthlyTrends]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {/* <LoadingScreen />  */}
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 font-anuphan md:p-6">
                {/* Header + Filters */}
                <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-2xl font-bold text-gray-900 text-transparent md:text-3xl">
                                รายงานสรุปการขาย
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                สรุปรายการสินค้า และรายการยอดขาย
                                {month ? ` (ช่วงข้อมูล: ${monthLabels[parseInt(month) - 1]} ${year})` : ` (ช่วงข้อมูล: มกราคม – ธันวาคม ${year})`}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-[120px] flex-1">
                                <label className="mb-1 block text-xs font-medium text-gray-700">ปี</label>
                                <select
                                    className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                >
                                    {[0, 1, 2].map((o) => {
                                        const y = today.getFullYear() - o;
                                        return (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="min-w-[120px] flex-1">
                                <label className="mb-1 block text-xs font-medium text-gray-700">เดือน</label>
                                <select
                                    className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                >
                                    <option value="">ทั้งหมด</option>
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                            {monthLabels[i]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="min-w-[160px] flex-1">
                                <label className="mb-1 block text-xs font-medium text-gray-700">สินค้า</label>
                                <select
                                    className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    value={goodId as any}
                                    onChange={(e) => setGoodId(e.target.value ? parseInt(e.target.value) : '')}
                                >
                                    <option value="">ทั้งหมด</option>
                                    <option value={2147}>น้ำมันปาล์มดิบ</option>
                                    <option value={2152}>เมล็ดในปาล์ม</option>
                                    <option value={2151}>กะลา</option>
                                    <option value={9012}>ทะลายสับ</option>
                                    <option value={2149}>ทะลายปาล์มเปล่า</option>
                                    <option value={2150}>ใยปาล์ม</option>
                                </select>
                            </div>
                            <button
                                onClick={fetchAll}
                                className="transform rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                            >
                                <span className="flex items-center">
                                    <svg
                                        className="mr-1.5 h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                    รีเฟรช
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 flex items-start rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
                        <svg className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* KPI Cards */}
                <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <ChartBoundary>
                        <WaveCard
                            value={summary ? `${toTHB(animatedValues.total_weight)} ตัน` : '0'}
                            label="ปริมาณการขายรวม"
                            // direction="up"
                            color="from-blue-400 to-blue-600"
                            data={chartWeightSales}
                        />
                        <WaveCard
                            value={summary ? `${toTHB(animatedValues.total_sales)} ฿` : '0'}
                            label="ยอดขายรวม"
                            // direction="down"
                            color="from-emerald-500 to-emerald-600"
                            data={chartNetSales}
                        />
                        <WaveCard
                            value={summary ? `${toTHB(animatedValues.total_returns)} ฿` : '0'}
                            label="ลดหนี้"
                            // direction="down"
                            color="from-rose-500 to-rose-600"
                            data={chartReturns}
                        />

                        <WaveCard
                            value={goodId ? (summary ? `${toPrice(animatedValues.average_price)} ฿` : '0.00') : '—'}
                            label="ราคาเฉลี่ย"
                            // direction="down"
                            color="from-violet-500 to-violet-600"
                            data={chartAveragePrice}
                        />
                    </ChartBoundary>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-3">
                        <YearlySummary
                            invoiced={summary?.total_sales || 0}
                            profit={summary ? summary.total_sales - summary.total_returns : 0}
                            expenses={summary?.total_returns || 0}
                            growth={15.3}
                            data={yearlyData}
                            timeframe={year.toString()}
                            variant="modern"
                            title="สรุปยอดขายรายเดือน"
                            goodName={
                                goodId
                                    ? {
                                          2147: 'น้ำมันปาล์มดิบ',
                                          2152: 'เมล็ดในปาล์ม',
                                          2151: 'กะลา',
                                          9012: 'ทะลายสับ',
                                          2149: 'ทะลายปาล์มเปล่า',
                                          2150: 'ใยปาล์ม',
                                      }[goodId] || 'ทั้งหมด'
                                    : 'ทั้งหมด'
                            }
                            monthLabel={month ? `${monthLabels[parseInt(month) - 1]} ${year}` : `มกราคม – ธันวาคม ${year}`}
                        />
                    </div>

                    {/* Product Table - Full Width */}
                    <div className="xl:col-span-3">
                        <ModernCard
                            title="สรุปรายการสินค้า"
                            // action={
                            //     <button className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5 text-sm text-blue-600 transition-colors hover:bg-blue-100">
                            //         <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            //         </svg>
                            //         ส่งออกรายงาน
                            //     </button>
                            // }
                        >
                            <EnhancedProductTable
                                rows={products}
                                goodName={
                                    goodId
                                        ? {
                                              2147: 'น้ำมันปาล์มดิบ',
                                              2152: 'เมล็ดในปาล์ม',
                                              2151: 'กะลา',
                                              9012: 'ทะลายสับ',
                                              2149: 'ทะลายปาล์มเปล่า',
                                              2150: 'ใยปาล์ม',
                                          }[goodId] || 'ทั้งหมด'
                                        : 'ทั้งหมด'
                                }
                                monthLabel={month ? `${monthLabels[parseInt(month) - 1]} ${year}` : `มกราคม – ธันวาคม ${year}`}
                            />
                        </ModernCard>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <Card title="แนวโน้มยอดขายย้อนหลัง 3 ปี" className="xl:col-span-3">
                        <div className="h-80">
                            <Line key={year} data={trend3yData} options={lineOpts} />
                        </div>
                    </Card>
                </div>

                {loading && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
                        <div className="flex flex-col items-center rounded-3xl bg-white/95 p-8 shadow-2xl">
                            <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
                            <p className="text-lg font-semibold text-gray-700">กำลังโหลดข้อมูล...</p>
                            <p className="mt-1 text-sm text-gray-500">กรุณารอสักครู่</p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

// ===== Reusable UI =====

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-lg transition-all duration-300 hover:shadow-xl ${className}`}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            </div>
            <div>{children}</div>
        </div>
    );
}

function ModernCard({ title, subtitle, action, children }: any) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>
            <div>{children}</div>
        </div>
    );
}

function EnhancedProductTable({ rows, goodName = 'ทั้งหมด', monthLabel = '' }: { rows: ProductRow[]; goodName?: string; monthLabel?: string }) {
    return (
        <div className="overflow-hidden rounded-xl">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-700">
                <span>
                    <strong>ช่วงข้อมูล:</strong> {monthLabel}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50/80">
                        <tr className="text-left">
                            <th className="px-6 py-4 font-semibold text-gray-700">สินค้า</th>
                            <th className="px-6 py-4 text-right font-semibold text-gray-700">ปริมาณ (ตัน)</th>
                            <th className="px-6 py-4 text-right font-semibold text-gray-700">ยอดขาย</th>
                            <th className="px-6 py-4 text-right font-semibold text-gray-700">ลดหนี้</th>
                            <th className="px-6 py-4 text-right font-semibold text-gray-700">สุทธิ</th>
                            <th className="px-6 py-4 text-right font-semibold text-gray-700">ราคาเฉลี่ย</th>
                            <th className="px-6 py-4 text-right font-semibold text-gray-700">%</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {rows.map((r, index) => (
                            <tr key={r.good_id} className="transition-colors hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                                index === 0
                                                    ? 'bg-amber-100 text-amber-600'
                                                    : index === 1
                                                      ? 'bg-blue-100 text-blue-600'
                                                      : index === 2
                                                        ? 'bg-emerald-100 text-emerald-600'
                                                        : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-gray-900">{r.good_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">{toTons(r.total_weight)}</td>
                                <td className="px-6 py-4 text-right text-gray-900">{toTHB(r.sales_amount)}</td>
                                <td className="px-6 py-4 text-right font-medium text-red-600">{toTHB(r.returns_amount)}</td>
                                <td className="px-6 py-4 text-right font-semibold text-gray-900">{toTHB(r.net_sales)}</td>
                                <td className="px-6 py-4 text-right text-gray-700">{toPrice(r.average_price)}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                        {toPct(r.production_ratio)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
