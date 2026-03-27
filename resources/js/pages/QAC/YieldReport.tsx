import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Activity,
    BarChart3,
    Beaker,
    Calendar,
    Droplets,
    FlaskConical,
    Gauge,
    Percent,
    TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Yield Report', href: '#' },
];

interface YieldData {
    latest_date: string | null;
    latest_product_cpo: number;
    latest_ffb: number;
    latest_yield: number;
    range_product_cpo: number;
    range_ffb: number;
    range_yield: number;
    range_cpo_oil_room: number;
    range_yield_with_oil_room: number;
    range_skim: number;
    range_mix: number;
}

const defaultData: YieldData = {
    latest_date: null,
    latest_product_cpo: 0,
    latest_ffb: 0,
    latest_yield: 0,
    range_product_cpo: 0,
    range_ffb: 0,
    range_yield: 0,
    range_cpo_oil_room: 0,
    range_yield_with_oil_room: 0,
    range_skim: 0,
    range_mix: 0,
};

export default function YieldReport() {
    const [data, setData] = useState<YieldData>(defaultData);
    const [loading, setLoading] = useState(false);

    // Default date range: last 7 days
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Chart state
    const [chartMonth, setChartMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartLoading, setChartLoading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(route('yield-report.api'), {
                params: { start_date: startDate, end_date: endDate },
            });
            if (res.data.success) {
                setData(res.data);
            }
        } catch (err) {
            console.error('fetchYieldData error', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const fetchChartData = async () => {
        try {
            setChartLoading(true);
            const res = await axios.get(route('yield-report.monthly'), {
                params: { month: chartMonth },
            });
            if (res.data.success) {
                setChartData(res.data.chart_data);
            }
        } catch (err) {
            console.error('fetchChartData error', err);
        } finally {
            setChartLoading(false);
        }
    };

    useEffect(() => {
        fetchChartData();
    }, [chartMonth]);

    const thaiDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const fmt = (v: number, decimals = 3) => {
        return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-blue-50/20 p-4 font-anuphan sm:p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* ======================== HEADER ======================== */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 p-6 shadow-2xl sm:p-8"
                    >
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/30 blur-2xl" />
                            <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
                        </div>

                        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="rounded-2xl bg-white/20 p-3.5 shadow-lg backdrop-blur-sm">
                                    <BarChart3 className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white drop-shadow-lg sm:text-3xl">
                                        รายงาน % Yield
                                    </h1>
                                    <p className="mt-1 text-sm text-purple-100/80">
                                        วิเคราะห์ประสิทธิภาพการสกัดน้ำมันปาล์ม
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-2.5 backdrop-blur-sm">
                                    <Calendar className="h-4 w-4 text-purple-200" />
                                    <span className="text-xs text-purple-200">เริ่ม</span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="border-none bg-transparent text-sm font-medium text-white focus:outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-2.5 backdrop-blur-sm">
                                    <Calendar className="h-4 w-4 text-purple-200" />
                                    <span className="text-xs text-purple-200">ถึง</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="border-none bg-transparent text-sm font-medium text-white focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                <Activity className="h-8 w-8 text-indigo-400" />
                            </motion.div>
                        </div>
                    )}

                    {!loading && (
                        <>
                            {/* ======================== ROW 1: LATEST + RANGE YIELD ======================== */}
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {/* Card 1: วันล่าสุด */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="group relative overflow-hidden rounded-2xl border border-amber-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
                                >
                                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 opacity-60 transition-transform group-hover:scale-150" />
                                    <div className="relative">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-2.5 shadow-md">
                                                    <TrendingUp className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">% Yield วันล่าสุด</p>
                                                    <p className="text-[11px] text-gray-500">
                                                        {thaiDate(data.latest_date)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Percent className="h-6 w-6 text-amber-300" />
                                        </div>
                                        <p className="text-4xl font-extrabold tracking-tight text-amber-600">
                                            {fmt(data.latest_yield, 2)}
                                            <span className="ml-1 text-lg font-semibold text-amber-400">%</span>
                                        </p>
                                        <div className="mt-3 flex gap-4 text-xs text-gray-500">
                                            <span>
                                                CPO:{' '}
                                                <span className="font-semibold text-gray-700">
                                                    {fmt(data.latest_product_cpo)}
                                                </span>
                                            </span>
                                            <span>
                                                FFB:{' '}
                                                <span className="font-semibold text-gray-700">
                                                    {fmt(data.latest_ffb)}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Card 2: %Yield ช่วงเวลา */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="group relative overflow-hidden rounded-2xl border border-blue-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
                                >
                                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 opacity-60 transition-transform group-hover:scale-150" />
                                    <div className="relative">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-md">
                                                    <Gauge className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">% Yield ช่วงเวลา</p>
                                                    <p className="text-[11px] text-gray-500">{thaiDate(startDate)} — {thaiDate(endDate)}</p>
                                                </div>
                                            </div>
                                            <Percent className="h-6 w-6 text-blue-300" />
                                        </div>
                                        <p className="text-4xl font-extrabold tracking-tight text-blue-600">
                                            {fmt(data.range_yield, 2)}
                                            <span className="ml-1 text-lg font-semibold text-blue-400">%</span>
                                        </p>
                                        <div className="mt-3 flex gap-4 text-xs text-gray-500">
                                            <span>
                                                CPO:{' '}
                                                <span className="font-semibold text-gray-700">
                                                    {fmt(data.range_product_cpo)}
                                                </span>
                                            </span>
                                            <span>
                                                FFB:{' '}
                                                <span className="font-semibold text-gray-700">
                                                    {fmt(data.range_ffb)}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Card 3: %Yield + Oil Room */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="group relative overflow-hidden rounded-2xl border border-purple-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
                                >
                                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-purple-100 to-violet-100 opacity-60 transition-transform group-hover:scale-150" />
                                    <div className="relative">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 p-2.5 shadow-md">
                                                    <Beaker className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">
                                                        % Yield + Oil Room
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">
                                                        {thaiDate(startDate)} — {thaiDate(endDate)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Percent className="h-6 w-6 text-purple-300" />
                                        </div>
                                        <p className="text-4xl font-extrabold tracking-tight text-purple-600">
                                            {fmt(data.range_yield_with_oil_room, 2)}
                                            <span className="ml-1 text-lg font-semibold text-purple-400">%</span>
                                        </p>
                                        <div className="mt-3 flex gap-4 text-xs text-gray-500">
                                            <span>
                                                CPO+OilRoom:{' '}
                                                <span className="font-semibold text-gray-700">
                                                    {fmt(data.range_product_cpo + data.range_cpo_oil_room)}
                                                </span>
                                            </span>
                                            <span>
                                                FFB:{' '}
                                                <span className="font-semibold text-gray-700">
                                                    {fmt(data.range_ffb)}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* ======================== ROW 2: SKIM + MIX ======================== */}
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                {/* Card 4: Skim */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="group relative overflow-hidden rounded-2xl border border-rose-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
                                >
                                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-rose-100 to-red-100 opacity-60 transition-transform group-hover:scale-150" />
                                    <div className="relative">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="rounded-xl bg-gradient-to-br from-rose-400 to-red-500 p-2.5 shadow-md">
                                                <Droplets className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">ผลรวม Skim</p>
                                                <p className="text-[11px] text-gray-500">
                                                    {thaiDate(startDate)} — {thaiDate(endDate)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-4xl font-extrabold tracking-tight text-rose-600">
                                            {fmt(data.range_skim)}
                                        </p>
                                        <div className="mt-2 flex items-center gap-3">
                                            <p className="text-xs font-medium text-gray-500">ตัน</p>
                                            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600">
                                                {data.range_ffb > 0
                                                    ? fmt((data.range_skim / data.range_ffb) * 100, 2)
                                                    : '0.00'}
                                                % ของ FFB
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Card 5: Mix */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="group relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
                                >
                                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 opacity-60 transition-transform group-hover:scale-150" />
                                    <div className="relative">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 p-2.5 shadow-md">
                                                <FlaskConical className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">ผลรวม Mix</p>
                                                <p className="text-[11px] text-gray-500">
                                                    {thaiDate(startDate)} — {thaiDate(endDate)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-4xl font-extrabold tracking-tight text-emerald-600">
                                            {fmt(data.range_mix)}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-gray-500">ตัน</p>
                                    </div>
                                </motion.div>
                            </div>

                            {/* ======================== SUMMARY BAR ======================== */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm"
                            >
                                <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-500 p-2">
                                            <BarChart3 className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-800">สรุปข้อมูลช่วงเวลา</h3>
                                            <p className="text-xs text-gray-500">
                                                {thaiDate(startDate)} — {thaiDate(endDate)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-3 lg:grid-cols-5">
                                    {[
                                        { label: 'FFB', value: fmt(data.range_ffb), unit: 'ตัน', color: 'text-gray-700' },
                                        { label: 'Product CPO', value: fmt(data.range_product_cpo), unit: 'ตัน', color: 'text-blue-700' },
                                        { label: '% Yield', value: `${fmt(data.range_yield, 2)}%`, unit: '', color: 'text-indigo-700' },
                                        { label: 'CPO Oil Room', value: fmt(data.range_cpo_oil_room), unit: 'ตัน', color: 'text-purple-700' },
                                        { label: '% Yield + Oil Room', value: `${fmt(data.range_yield_with_oil_room, 2)}%`, unit: '', color: 'text-violet-700' },
                                    ].map((item) => (
                                        <div key={item.label} className="bg-white p-4 text-center">
                                            <p className="text-[11px] font-medium tracking-wider text-gray-400 uppercase">
                                                {item.label}
                                            </p>
                                            <p className={`mt-1 text-lg font-bold ${item.color}`}>
                                                {item.value}
                                            </p>
                                            {item.unit && (
                                                <p className="text-[10px] text-gray-400">{item.unit}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* ======================== BAR CHART ======================== */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm"
                            >
                                <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2">
                                            <BarChart3 className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-800">กราฟ % Yield รายวัน</h3>
                                            <p className="text-xs text-gray-500">ข้อมูลรายวันตามเดือนที่เลือก</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                        <input
                                            type="month"
                                            value={chartMonth}
                                            onChange={(e) => setChartMonth(e.target.value)}
                                            className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-6">
                                    {chartLoading ? (
                                        <div className="flex items-center justify-center py-16">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            >
                                                <Activity className="h-8 w-8 text-blue-400" />
                                            </motion.div>
                                        </div>
                                    ) : chartData.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                            <BarChart3 className="mb-2 h-10 w-10 text-gray-300" />
                                            <span className="text-sm">ไม่มีข้อมูลในเดือนที่เลือก</span>
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis
                                                    dataKey="day"
                                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                                    tickLine={false}
                                                    axisLine={{ stroke: '#e5e7eb' }}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                                    tickLine={false}
                                                    axisLine={{ stroke: '#e5e7eb' }}
                                                    unit="%"
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: '1px solid #e5e7eb',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                        fontSize: '13px',
                                                    }}
                                                    formatter={(value: any) => [
                                                        `${Number(value).toFixed(2)}%`,
                                                        '% Yield',
                                                    ]}
                                                    labelFormatter={(label) => `วันที่ ${label}`}
                                                />
                                                <Bar
                                                    dataKey="yield"
                                                    fill="#3b82f6"
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={32}
                                                >
                                                    <LabelList
                                                        dataKey="yield"
                                                        position="top"
                                                        formatter={(v: any) => `${Number(v).toFixed(2)}`}
                                                        style={{ fontSize: '10px', fill: '#4b5563', fontWeight: 600 }}
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
