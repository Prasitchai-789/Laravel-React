import React, { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Activity,
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    CalendarDays,
    Factory,
    Gauge,
    Info,
    RefreshCw,
    Search,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { TooltipContentProps, TooltipValueType } from 'recharts';

dayjs.extend(buddhistEra);
dayjs.locale('th');

interface PalmPriceData {
    day: number;
    month: number;
    year: number;
    month_name: string;
    palm_min: number;
    palm_max: number;
    palm_avg: number;
    oil_min: number;
    oil_max: number;
    oil_avg: number;
    formatted_date?: string;
    full_date?: string;
}

interface StatCardProps {
    title: string;
    value: React.ReactNode;
    unit?: string;
    icon: React.ElementType;
    accent: 'sky' | 'emerald' | 'amber' | 'rose';
    description: string;
    meta?: React.ReactNode;
}

const accentClasses = {
    sky: {
        icon: 'bg-sky-50 text-sky-700 ring-sky-100',
        line: 'from-sky-500 to-blue-600',
    },
    emerald: {
        icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        line: 'from-emerald-500 to-teal-600',
    },
    amber: {
        icon: 'bg-amber-50 text-amber-700 ring-amber-100',
        line: 'from-amber-500 to-orange-500',
    },
    rose: {
        icon: 'bg-rose-50 text-rose-700 ring-rose-100',
        line: 'from-rose-500 to-red-600',
    },
};

const formatPrice = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-';
    }

    return value.toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatRange = (min?: number | null, max?: number | null) => {
    if (!min || !max) {
        return '-';
    }

    return `${formatPrice(min)} - ${formatPrice(max)}`;
};

const StatCard = ({ title, value, unit, icon: Icon, accent, description, meta }: StatCardProps) => {
    const colors = accentClasses[accent];

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
            }}
            className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colors.line}`} />
            <div className="p-5">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
                    </div>
                    <div className={`rounded-md p-2.5 ring-1 ${colors.icon}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <div className="min-w-0 text-3xl font-black tracking-tight text-slate-950 tabular-nums">
                        {value}
                    </div>
                    {unit && <span className="pb-1 text-sm font-semibold text-slate-400">{unit}</span>}
                </div>

                {meta && <div className="mt-4 border-t border-slate-100 pt-3">{meta}</div>}
            </div>
        </motion.div>
    );
};

const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <BarChart3 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">ยังไม่มีข้อมูลราคาปาล์ม</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            ลองรีเฟรชข้อมูลอีกครั้ง หรือเช็คการเชื่อมต่อ API ตลาดราคาปาล์ม
        </p>
        <button
            type="button"
            onClick={onRefresh}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
            <RefreshCw className="h-4 w-4" />
            รีเฟรชข้อมูล
        </button>
    </div>
);

export default function PalmPriceReport() {
    const [prices, setPrices] = useState<PalmPriceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsRefreshing(true);
        setError(null);

        try {
            const response = await axios.get('/api/market-price/palm');
            const data = (response.data.data ?? []).map((item: PalmPriceData) => ({
                ...item,
                formatted_date: `${item.day} ${item.month_name}`,
                full_date: `${item.day}/${item.month}/${item.year}`,
            }));

            setPrices(data);
        } catch (fetchError) {
            console.error('Error fetching palm prices:', fetchError);
            setError('ไม่สามารถโหลดข้อมูลราคาปาล์มได้ในขณะนี้');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const marketSummary = useMemo(() => {
        const validPalmPrices = prices.filter((price) => price.palm_avg > 0);
        const latest = validPalmPrices.at(-1) ?? null;
        const previous = validPalmPrices.length > 1 ? validPalmPrices.at(-2) ?? null : null;
        const ditLatest = [...prices].reverse().find((price) => price.oil_avg > 0) ?? null;
        const palmMinValues = validPalmPrices.map((price) => price.palm_min).filter((price) => price > 0);
        const palmMaxValues = validPalmPrices.map((price) => price.palm_max).filter((price) => price > 0);
        const avgPrice =
            validPalmPrices.reduce((acc, curr) => acc + curr.palm_avg, 0) / (validPalmPrices.length || 1);
        const priceChange = latest && previous ? latest.palm_avg - previous.palm_avg : 0;

        return {
            latest,
            previous,
            ditLatest,
            avgPrice,
            priceChange,
            isUp: priceChange > 0,
            minPrice: palmMinValues.length ? Math.min(...palmMinValues) : 0,
            maxPrice: palmMaxValues.length ? Math.max(...palmMaxValues) : 0,
            chartData: validPalmPrices,
        };
    }, [prices]);

    const tableRows = useMemo(() => [...prices].reverse(), [prices]);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Dashboard Report', href: '#' },
        { title: 'Palm Price Report', href: '/market/palm-price-report' },
    ];

    const CustomTooltip = ({ active, payload, label }: TooltipContentProps<TooltipValueType, string>) => {
        if (!active || !payload?.length) {
            return null;
        }

        return (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
                <p className="mb-3 text-sm font-bold text-slate-800">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry) => (
                        <div key={entry.dataKey} className="flex min-w-52 items-center justify-between gap-6">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs font-semibold text-slate-500">{entry.name}</span>
                            </div>
                            <span className="text-sm font-black text-slate-900">
                                ฿{formatPrice(typeof entry.value === 'number' ? entry.value : Number(entry.value))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Palm Price Market Report | รายงานราคาปาล์ม" />

            <div className="min-h-screen bg-slate-50 font-anuphan text-slate-900">
                <div className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                    <Factory className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-2xl font-black tracking-tight text-slate-950">
                                            รายงานราคาปาล์ม
                                        </h1>
                                        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            Market live
                                        </span>
                                    </div>
                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                                        ติดตามราคาหน้าโรงงานและราคาอ้างอิง DIT พร้อมแนวโน้มย้อนหลังสำหรับใช้ประเมินภาวะตลาด
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                                    <CalendarDays className="h-4 w-4 text-slate-400" />
                                    ล่าสุด:{' '}
                                    <span className="text-slate-900">
                                        {marketSummary.latest
                                            ? `${marketSummary.latest.day} ${marketSummary.latest.month_name} ${marketSummary.latest.year}`
                                            : '-'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={fetchData}
                                    disabled={loading || isRefreshing}
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    {isRefreshing ? 'กำลังโหลด...' : 'รีเฟรช'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white"
                            >
                                <RefreshCw className="h-10 w-10 animate-spin text-emerald-600" />
                                <p className="mt-4 text-sm font-semibold text-slate-500">กำลังโหลดข้อมูลตลาด...</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-6"
                            >
                                {error && (
                                    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
                                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                        <div>
                                            <p className="font-bold">{error}</p>
                                            <p className="mt-1 text-sm text-rose-600">
                                                ข้อมูลเดิมจะยังคงแสดงอยู่หากมีการโหลดสำเร็จก่อนหน้า
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!prices.length ? (
                                    <EmptyState onRefresh={fetchData} />
                                ) : (
                                    <>
                                        <motion.div
                                            initial="hidden"
                                            animate="visible"
                                            transition={{ staggerChildren: 0.05 }}
                                            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                                        >
                                            <StatCard
                                                title="ราคาหน้าโรงงานล่าสุด"
                                                value={formatPrice(marketSummary.latest?.palm_avg)}
                                                unit="บาท/กก."
                                                icon={Factory}
                                                accent="emerald"
                                                description="ราคาเฉลี่ยจากข้อมูลโรงงาน"
                                                meta={
                                                    <div
                                                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${
                                                            marketSummary.priceChange >= 0
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : 'bg-rose-50 text-rose-700'
                                                        }`}
                                                    >
                                                        {marketSummary.priceChange >= 0 ? (
                                                            <TrendingUp className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <TrendingDown className="h-3.5 w-3.5" />
                                                        )}
                                                        {marketSummary.priceChange >= 0 ? '+' : ''}
                                                        {formatPrice(marketSummary.priceChange)} จากวันก่อนหน้า
                                                    </div>
                                                }
                                            />

                                            <StatCard
                                                title="ราคาอ้างอิง DIT"
                                                value={formatPrice(marketSummary.ditLatest?.oil_avg)}
                                                unit="บาท/กก."
                                                icon={Info}
                                                accent="sky"
                                                description={
                                                    marketSummary.ditLatest
                                                        ? `${marketSummary.ditLatest.day} ${marketSummary.ditLatest.month_name} ${marketSummary.ditLatest.year}`
                                                        : 'ยังไม่มีข้อมูลล่าสุด'
                                                }
                                                meta={
                                                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                                                        <span>ต่ำสุด {formatPrice(marketSummary.ditLatest?.oil_min)}</span>
                                                        <span>สูงสุด {formatPrice(marketSummary.ditLatest?.oil_max)}</span>
                                                    </div>
                                                }
                                            />

                                            <StatCard
                                                title="ช่วงราคาหน้าโรงงาน"
                                                value={formatRange(marketSummary.latest?.palm_min, marketSummary.latest?.palm_max)}
                                                unit="บาท/กก."
                                                icon={Gauge}
                                                accent="amber"
                                                description="ต่ำสุดและสูงสุดของวันล่าสุด"
                                                meta={
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                        <Activity className="h-3.5 w-3.5 text-amber-600" />
                                                        ค่าเฉลี่ยย้อนหลัง {formatPrice(marketSummary.avgPrice)} บาท/กก.
                                                    </div>
                                                }
                                            />

                                            <StatCard
                                                title="กรอบราคาย้อนหลัง"
                                                value={formatRange(marketSummary.minPrice, marketSummary.maxPrice)}
                                                unit="บาท/กก."
                                                icon={BarChart3}
                                                accent="rose"
                                                description={`${prices.length.toLocaleString('th-TH')} วันข้อมูลตลาด`}
                                                meta={
                                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                                        <span className="inline-flex items-center gap-1 text-emerald-700">
                                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                                            สูงสุด
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 text-rose-700">
                                                            <ArrowDownRight className="h-3.5 w-3.5" />
                                                            ต่ำสุด
                                                        </span>
                                                    </div>
                                                }
                                            />
                                        </motion.div>

                                        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                                            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                                                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-start md:justify-between">
                                                    <div>
                                                        <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
                                                            <BarChart3 className="h-5 w-5 text-emerald-600" />
                                                            แนวโน้มราคาท้องตลาด
                                                        </h2>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            เปรียบเทียบราคาเฉลี่ยหน้าโรงงานกับราคาอ้างอิง DIT
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                                                        <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-emerald-700">
                                                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                                            หน้าโรงงาน
                                                        </span>
                                                        <span className="inline-flex items-center gap-2 rounded-md bg-sky-50 px-2.5 py-1.5 text-sky-700">
                                                            <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
                                                            DIT
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="h-[390px] p-4 sm:p-6">
                                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                                        <AreaChart data={marketSummary.chartData} margin={{ top: 10, right: 18, left: 0, bottom: 8 }}>
                                                            <defs>
                                                                <linearGradient id="palmPriceGradient" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                            <XAxis
                                                                dataKey="formatted_date"
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                                                minTickGap={28}
                                                                dy={10}
                                                            />
                                                            <YAxis
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                                                domain={['auto', 'auto']}
                                                                width={46}
                                                            />
                                                            <Tooltip content={<CustomTooltip />} />
                                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 16, fontSize: 12, fontWeight: 700 }} />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="palm_avg"
                                                                name="ราคาเฉลี่ยหน้าโรงงาน"
                                                                stroke="#059669"
                                                                strokeWidth={3}
                                                                fill="url(#palmPriceGradient)"
                                                                dot={false}
                                                                activeDot={{ r: 5, strokeWidth: 0 }}
                                                            />
                                                            <Line
                                                                type="monotone"
                                                                dataKey="oil_avg"
                                                                name="ราคาอ้างอิง DIT"
                                                                stroke="#0284c7"
                                                                strokeWidth={2.5}
                                                                strokeDasharray="6 5"
                                                                dot={false}
                                                                connectNulls
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                                <h2 className="text-lg font-black text-slate-950">ภาพรวมตลาด</h2>
                                                <div className="mt-5 space-y-4">
                                                    <div className="rounded-lg bg-slate-50 p-4">
                                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                            Market spread
                                                        </p>
                                                        <p className="mt-2 text-2xl font-black text-slate-950 tabular-nums">
                                                            {formatPrice((marketSummary.latest?.palm_max ?? 0) - (marketSummary.latest?.palm_min ?? 0))}
                                                            <span className="ml-1 text-sm font-semibold text-slate-400">บาท/กก.</span>
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">ส่วนต่างต่ำสุด-สูงสุดของวันล่าสุด</p>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {[
                                                            ['ข้อมูลราคาโรงงาน', `${marketSummary.chartData.length.toLocaleString('th-TH')} จุด`],
                                                            ['วันล่าสุด', marketSummary.latest ? `${marketSummary.latest.day} ${marketSummary.latest.month_name}` : '-'],
                                                            ['DIT ล่าสุด', marketSummary.ditLatest ? `${marketSummary.ditLatest.day} ${marketSummary.ditLatest.month_name}` : '-'],
                                                            ['ทิศทางวันล่าสุด', marketSummary.isUp ? 'ปรับขึ้น' : marketSummary.priceChange < 0 ? 'ปรับลง' : 'ทรงตัว'],
                                                        ].map(([label, value]) => (
                                                            <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm">
                                                                <span className="font-semibold text-slate-500">{label}</span>
                                                                <span className="font-black text-slate-900">{value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </aside>
                                        </section>

                                        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                                                        <Search className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <h2 className="font-black text-slate-950">ตารางวิเคราะห์เปรียบเทียบรายวัน</h2>
                                                        <p className="mt-1 text-sm text-slate-500">เรียงจากข้อมูลล่าสุดไปเก่าสุด</p>
                                                    </div>
                                                </div>
                                                <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                                                    {tableRows.length.toLocaleString('th-TH')} รายการ
                                                </span>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[900px] border-collapse text-left">
                                                    <thead>
                                                        <tr className="bg-slate-50">
                                                            <th className="px-5 py-3 text-xs font-black text-slate-500">วันที่</th>
                                                            <th className="px-5 py-3 text-center text-xs font-black text-emerald-700">
                                                                ราคาเฉลี่ยโรงงาน
                                                            </th>
                                                            <th className="px-5 py-3 text-center text-xs font-black text-slate-500">
                                                                โรงงาน ต่ำ-สูง
                                                            </th>
                                                            <th className="px-5 py-3 text-center text-xs font-black text-sky-700">
                                                                ราคาอ้างอิง DIT
                                                            </th>
                                                            <th className="px-5 py-3 text-center text-xs font-black text-slate-500">
                                                                DIT ต่ำ-สูง
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {tableRows.map((row) => (
                                                            <tr key={row.full_date ?? `${row.day}-${row.month}-${row.year}`} className="transition hover:bg-slate-50">
                                                                <td className="px-5 py-4">
                                                                    <span className="font-bold text-slate-800">
                                                                        {row.day} {row.month_name} {row.year}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4 text-center">
                                                                    <span className="inline-flex min-w-20 justify-center rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700 tabular-nums">
                                                                        ฿{formatPrice(row.palm_avg)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4 text-center text-sm font-bold text-slate-600 tabular-nums">
                                                                    {formatRange(row.palm_min, row.palm_max)}
                                                                </td>
                                                                <td className="px-5 py-4 text-center">
                                                                    {row.oil_avg > 0 ? (
                                                                        <span className="inline-flex min-w-20 justify-center rounded-md bg-sky-50 px-3 py-1.5 text-sm font-black text-sky-700 tabular-nums">
                                                                            ฿{formatPrice(row.oil_avg)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs font-bold text-slate-300">ไม่มีข้อมูล</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-5 py-4 text-center text-sm font-bold text-slate-600 tabular-nums">
                                                                    {row.oil_min > 0 ? formatRange(row.oil_min, row.oil_max) : '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </AppLayout>
    );
}
