import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Calendar,
    Activity,
    Package,
    Droplets,
    Factory,
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Zap,
    Gauge,
    Target,
    Wallet,
    Info,
    Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import axios from 'axios';
import { format, subDays } from 'date-fns';
import { th } from 'date-fns/locale';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale('th');

interface OrderItem {
    id: number;
    customer_name: string;
    quantity: number;
    price_sell: number;
    delivered_qty: number;
    remaining_qty: number;
    remaining_revenue: number;
}

interface SupplyData {
    success: boolean;
    date: string;
    order: {
        remaining_qty: number;
        remaining_revenue: number;
        remaining_revenue_mb: number;
        avg_price: number;
        orders: OrderItem[];
    };
    cpo: {
        stock_qty: number;
        estimated_qty: number;
        total_available: number;
        balance: number;
        balance_mb: number;
    };
    palm: {
        volume: number;
        amount_mb: number;
        yield_percent: number;
        ffb_required: number;
        avg_ffb_price: number;
        ffb_cost_mb: number;
    };
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

// Progress Bar Component
const ProgressBar = ({ value, max, color = 'indigo' }: { value: number; max: number; color?: string }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const colorClasses = {
        indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
        emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
        amber: 'bg-gradient-to-r from-amber-500 to-amber-600',
        rose: 'bg-gradient-to-r from-rose-500 to-rose-600',
        blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    };
    return (
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.indigo}`}
            />
        </div>
    );
};

// Stat Card Component
const StatCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    color, 
    subtitle, 
    trend,
    footer 
}: { 
    title: string; 
    value: number; 
    unit?: string; 
    icon: any; 
    color: string; 
    subtitle?: string;
    trend?: { value: number; label: string };
    footer?: React.ReactNode;
}) => {
    const colorMap = {
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
        amber: 'from-amber-500 to-amber-600 shadow-amber-500/20',
        emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
        indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20',
    };

    return (
        <motion.div
            variants={itemVariants}
            className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/0 group-hover:to-slate-50/50 transition-all duration-500" />
            
            <div className="relative p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorMap[color as keyof typeof colorMap]} text-white shadow-lg`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-700">{title}</h3>
                            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
                        </div>
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                            trend.value >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                            {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(trend.value)}%
                        </div>
                    )}
                </div>
                
                <div className="mb-2">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tight">
                            <CountUp end={value} decimals={2} separator="," duration={1.5} />
                        </span>
                        {unit && <span className="text-sm font-semibold text-slate-400">{unit}</span>}
                    </div>
                </div>
                
                {footer && <div className="pt-1 border-t border-slate-100">{footer}</div>}
            </div>
        </motion.div>
    );
};

export default function CpoSupplyDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<SupplyData | null>(null);
    const [marketPrice, setMarketPrice] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async () => {
        setIsRefreshing(true);
        setLoading(true);
        try {
            const [res, marketRes] = await Promise.all([
                axios.get<SupplyData>(route('api.stock.cpo.supply'), { params: { date: selectedDate } }),
                axios.get('/api/market-price/palm').catch(() => ({ data: null }))
            ]);
            setData(res.data);
            setMarketPrice(marketRes.data);

        } catch (e) {
            console.error('Error fetching CPO supply data:', e);
        } finally {
            setLoading(false);
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    useEffect(() => { fetchData(); }, [selectedDate]);

    const [ffbPerDay, setFfbPerDay] = useState<number>(500);

    const isShortfall = (data?.cpo.balance ?? 0) < 0;
    const balanceAbs = Math.abs(data?.cpo.balance ?? 0);
    const supplyRatio = data ? (data.cpo.total_available / data.order.remaining_qty) * 100 : 0;
    const coveragePercentage = Math.min(supplyRatio, 100);

    // Production Forecast
    const yieldPct = data?.palm.yield_percent ?? 0;
    const cpoPerdDay = ffbPerDay * (yieldPct / 100);
    const cpoNeeded = Math.max(0, (data?.order.remaining_qty ?? 0) - (data?.cpo.stock_qty ?? 0));
    const daysToComplete = cpoPerdDay > 0 ? Math.ceil(cpoNeeded / cpoPerdDay) : null;
    const completionDate = daysToComplete !== null ? dayjs().add(daysToComplete, 'day') : null;
    const totalCpoFromPlan = cpoPerdDay * (daysToComplete ?? 0);
    const ffbTotalNeeded = ffbPerDay * (daysToComplete ?? 0);
    const ffbNetNeeded = Math.max(0, ffbTotalNeeded - (data?.palm.volume ?? 0)); // หักปาล์มคงเหลือ

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Dashboard Report', href: '#' },
        { title: 'CPO Supply Dashboard', href: '/stock/cpo-supply-dashboard' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CPO Supply Dashboard | วิเคราะห์ Supply CPO" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 font-anuphan text-slate-800 overflow-x-hidden relative">

                {/* Modern background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-bl from-indigo-500/5 via-purple-500/5 to-transparent rounded-full blur-[150px]" />
                    <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-gradient-to-tr from-emerald-500/5 via-teal-500/5 to-transparent rounded-full blur-[150px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a06_1px,transparent_1px),linear-gradient(to_bottom,#0f172a06_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,white_70%,transparent_100%)]" />
                </div>

                {/* Modern Glass Header */}
                <div className="relative bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
                    <div className="relative max-w-[1600px] mx-auto px-6 py-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="p-3.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl shadow-blue-500/20 text-white"
                                >
                                    <Factory className="w-6 h-6" />
                                </motion.div>
                                <div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                            CPO Supply Dashboard
                                        </h1>
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                LIVE
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                                        <Activity className="w-3.5 h-3.5" />
                                        วิเคราะห์ Order คงเหลือ vs ปริมาณ CPO <span className="text-blue-500 font-bold">• อัพเดท {dayjs().format('DD MMM BBBB')}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="pl-9 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer hover:border-slate-300 shadow-sm"
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={fetchData}
                                    className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
                                    disabled={loading || isRefreshing}
                                >
                                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="relative z-10 max-w-[1600px] mx-auto px-6 pb-16">
                    <AnimatePresence mode="wait">
                        {loading && !data ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-[70vh]"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-20 animate-pulse" />
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                        className="relative w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full"
                                    />
                                </div>
                                <p className="text-slate-500 font-medium mt-6 animate-pulse">กำลังโหลดข้อมูล...</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-6"
                            >
                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-4">

                                    <StatCard
                                        title="Order คงเหลือ"
                                        value={data?.order.remaining_qty ?? 0}
                                        unit="Tons"
                                        icon={Package}
                                        color="blue"
                                        subtitle={`${data?.order.orders?.length || 0} รายการ`}
                                        footer={
                                            <div className="">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-700 text-md">มูลค่ารวม</span>
                                                    <span className="font-bold text-blue-700 tabular-nums text-md">
                                                        {(data?.order.remaining_revenue_mb ?? 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} MB
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-700 text-md">ราคาเฉลี่ย</span>
                                                    <span className="font-bold text-slate-700 tabular-nums text-md">
                                                        ฿{(data?.order.avg_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}/kg
                                                    </span>
                                                </div>
                                            </div>
                                        }
                                    />

                                    <StatCard
                                        title="CPO Stock"
                                        value={data?.cpo.stock_qty ?? 0}
                                        unit="Tons"
                                        icon={Factory}
                                        color="amber"
                                        subtitle="Tank"
                                        footer={
                                            <p className="text-md text-slate-700">
                                                ข้อมูล ณ วันที่ {data?.date && format(new Date(data.date), 'dd MMM yyyy', { locale: th })}
                                            </p>
                                        }
                                    />

                                    <StatCard
                                        title="CPO โดยประมาณ"
                                        value={data?.cpo.estimated_qty ?? 0}
                                        unit="Tons"
                                        icon={Droplets}
                                        color="emerald"
                                        subtitle="จากปาล์มคงค้าง"
                                        footer={
                                            <div className="">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-700 text-md">ปาล์มคงค้าง</span>
                                                    <span className="font-bold text-emerald-700 tabular-nums text-md">
                                                        {(data?.palm.volume ?? 0).toLocaleString()} t
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-700 text-md">% Yield</span>
                                                    <span className="font-bold text-emerald-700">{data?.palm.yield_percent ?? 0}%</span>
                                                </div>
                                            </div>
                                        }
                                    />

                                    <StatCard
                                        title="CPO รวม"
                                        value={data?.cpo.total_available ?? 0}
                                        unit="Tons"
                                        icon={BarChart3}
                                        color="purple"
                                        subtitle="Stock + ประมาณ"
                                        footer={
                                            <div className="">
                                                <ProgressBar 
                                                    value={data?.cpo.total_available ?? 0} 
                                                    max={data?.order.remaining_qty ?? 1} 
                                                    color="purple" 
                                                />
                                                <p className="text-[14px] text-slate-700 text-right mt-1">
                                                    {coveragePercentage.toFixed(1)}% ของ Order
                                                </p>
                                            </div>
                                        }
                                    />

                                   
                                </div>

                                {/* Row 2: Balance + Forecast side-by-side */}
                                <div className="grid grid-cols-12 gap-6">

                                {/* Main Balance Card — col 6 */}
                                <motion.div variants={itemVariants} className="col-span-12 xl:col-span-6 relative group">
                                    <div className={`absolute inset-0 rounded-2xl blur-2xl opacity-25 ${
                                        isShortfall ? 'bg-rose-500' : 'bg-emerald-500'
                                    }`} />

                                    <div className={`relative rounded-2xl overflow-hidden h-full ${
                                        isShortfall
                                            ? 'bg-gradient-to-br from-rose-600 to-red-800'
                                            : 'bg-gradient-to-br from-emerald-600 to-teal-800'
                                    }`}>
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />

                                        <div className="relative p-4 flex flex-col gap-4">

                                            {/* Header */}
                                            <div className="flex items-center gap-3">
                                                <motion.div
                                                    animate={isShortfall ? { scale: [1, 1.12, 1] } : {}}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className={`p-2.5 rounded-xl ${isShortfall ? 'bg-rose-500/30' : 'bg-emerald-500/30'}`}
                                                >
                                                    {isShortfall
                                                        ? <AlertTriangle className="w-5 h-5 text-white" />
                                                        : <CheckCircle2 className="w-5 h-5 text-white" />
                                                    }
                                                </motion.div>
                                                <div>
                                                    <p className="text-white text-[12px] font-bold uppercase">สถานะ Order CPO</p>
                                                    <p className="text-white font-bold text-base leading-tight">
                                                        {isShortfall ? '⚠️ CPO ไม่เพียงพอ — ต้องรับปาล์มเพิ่ม' : '✅ CPO เพียงพอต่อ Order ทั้งหมด'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Coverage Bar */}
                                            <div className="bg-white/10 rounded-xl p-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Gauge className="w-4 h-4 text-white/60" />
                                                        <span className="text-white/80 text-sm font-semibold">Coverage</span>
                                                    </div>
                                                    <span className={`text-base font-black ${
                                                        isShortfall ? 'text-rose-200' : 'text-emerald-200'
                                                    }`}>{coveragePercentage.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${coveragePercentage}%` }}
                                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                                        className={`h-full rounded-full ${
                                                            isShortfall ? 'bg-rose-400' : 'bg-emerald-400'
                                                        }`}
                                                    />
                                                </div>
                                            </div>

                                            {/* CPO รวม vs Order */}
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-white/10 rounded-xl py-3 px-2">
                                                    <p className="text-white text-[12px] uppercase tracking-wider">CPO รวม</p>
                                                    <p className="text-xl font-black text-white tabular-nums mt-0.5">
                                                        {(data?.cpo.total_available ?? 0).toLocaleString(undefined,{minimumFractionDigits:2})}
                                                    </p>
                                                    <p className="text-white/60 text-[10px]">Tons</p>
                                                </div>
                                                <div className="flex items-center justify-center">
                                                    <Minus className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="bg-white/10 rounded-xl py-3 px-2">
                                                    <p className="text-white text-[12px] uppercase tracking-wider">Order คงเหลือ</p>
                                                    <p className="text-xl font-black text-white tabular-nums mt-0.5">
                                                        {(data?.order.remaining_qty ?? 0).toLocaleString(undefined,{minimumFractionDigits:2})}
                                                    </p>
                                                    <p className="text-white/60 text-[10px]">Tons</p>
                                                </div>
                                            </div>

                                            {/* Balance result */}
                                            <div className={`flex items-center justify-between px-5 py-4 rounded-2xl ${
                                                isShortfall ? 'bg-rose-500/30' : 'bg-emerald-500/30'
                                            } border border-white/10 shadow-lg`}>
                                                <span className="text-white/90 text-sm font-bold font-anuphan">ส่วนต่าง (ขาด/เกิน)</span>
                                                <div className="flex items-center gap-2">
                                                    {isShortfall
                                                        ? <ArrowDownRight className="w-5 h-5 text-rose-200" />
                                                        : <ArrowUpRight className="w-5 h-5 text-emerald-200" />
                                                    }
                                                    <span className={`text-3xl font-black tabular-nums ${
                                                        isShortfall ? 'text-white' : 'text-white'
                                                    }`}>
                                                        {isShortfall ? '− ' : '+ '}{balanceAbs.toLocaleString(undefined,{minimumFractionDigits:2})}
                                                    </span>
                                                    <span className="text-white/90 text-sm font-bold mt-4">Tons</span>
                                                </div>
                                            </div>

                                            {/* FFB Required section */}
                                            {isShortfall ? (
                                                    <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3 shadow-inner">
                                                        <div className="flex items-baseline justify-between mb-5">
                                                            <div>
                                                                <p className="text-amber-300 text-[12px] font-black uppercase font-anuphan mb-1">FFB ที่ต้องจัดหาเพิ่ม</p>
                                                                <p className="text-5xl font-black text-white tabular-nums">
                                                                    <CountUp end={data?.palm.ffb_required ?? 0} decimals={0} separator="," duration={2} />
                                                                    <span className="text-lg font-bold text-white/60 ml-2 font-anuphan">Tons</span>
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-amber-300 text-[12px] font-bold uppercase mb-0.5">มูลค่า (โดยประมาณ)</p>
                                                                <p className="text-2xl font-black text-amber-300 tabular-nums">
                                                                    <CountUp end={data?.palm.ffb_cost_mb ?? 0} decimals={3} separator="," duration={2} />
                                                                </p>
                                                                <p className="text-white/90 text-xs font-bold font-anuphan">ล้านบาท (MB)</p>
                                                            </div>
                                                        </div>

                                                        {/* Integrated Formula */}
                                                        <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-4">
                                                            <div>
                                                                <p className="text-white text-[10px] uppercase font-bold font-anuphan">CPO ส่วนที่ขาด</p>
                                                                <p className="text-white font-black text-base tabular-nums">
                                                                    {balanceAbs.toLocaleString(undefined,{minimumFractionDigits:2})}
                                                                    <span className="text-[10px] font-normal opacity-50 ml-1">t</span>
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-white text-[10px] uppercase font-bold font-anuphan">÷ Yield 7 วัน</p>
                                                                <p className="text-white font-black text-base tabular-nums">
                                                                    {data?.palm.yield_percent ?? 0}%
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-amber-300 text-[10px] uppercase font-bold font-anuphan">ราคา FFB เฉลี่ย</p>
                                                                <p className="text-amber-300 font-black text-base tabular-nums">
                                                                    ฿{(data?.palm.avg_ffb_price ?? 0).toLocaleString(undefined,{minimumFractionDigits:2})}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-4 text-center">
                                                    <CheckCircle2 className="w-10 h-10 text-emerald-300 mb-2" />
                                                    <p className="text-white font-bold">CPO เพียงพอแล้ว</p>
                                                    <p className="text-white/50 text-xs mt-0.5">ไม่จำเป็นต้องรับปาล์มเพิ่ม</p>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </motion.div>

                                {/* Production Forecast Card — col 6 */}
                                <motion.div variants={itemVariants} className="col-span-12 xl:col-span-6 relative">
                                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden h-full">

                                        {/* Header */}
                                        <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl shadow-lg shadow-violet-500/20">
                                                    <Activity className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-sm">คาดการณ์การผลิต</h3>
                                                    <p className="text-[12px] text-slate-700">Production Forecast to Clear Order</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] text-slate-700 uppercase tracking-wider">% Yield</p>
                                                <p className="text-sm font-black text-violet-700">{yieldPct}%</p>
                                            </div>
                                        </div>

                                        <div className="p-5">
                                            <div className="grid grid-cols-12 gap-4">

                                                {/* Input — col 5 */}
                                                <div className="col-span-12 sm:col-span-5 space-y-4">
                                                    <div>
                                                        <label className="block text-[12px] font-black text-slate-700 uppercase mb-2 font-anuphan">
                                                            กำลังการผลิต FFB (Tons/วัน)
                                                        </label>
                                                        <div className="relative group">
                                                            <input
                                                                type="number"
                                                                value={ffbPerDay}
                                                                onChange={(e) => setFfbPerDay(Math.max(0, parseFloat(e.target.value) || 0))}
                                                                className="w-full pl-5 pr-14 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-2xl font-black text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm group-hover:border-slate-300"
                                                                step={10} min={0}
                                                            />
                                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">Tons</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] text-slate-700 font-bold uppercase mb-2 font-anuphan">ตั้งค่าด่วน (Preset)</p>
                                                        <div className="flex gap-2 flex-wrap justify-between">
                                                            {[300, 500, 700, 900].map(v => (
                                                                <button key={v} onClick={() => setFfbPerDay(v)}
                                                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                                                        ffbPerDay === v 
                                                                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' 
                                                                            : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-violet-300 hover:text-violet-600'
                                                                    }`}
                                                                >{v.toLocaleString()}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {/* Summary mini */}
                                                    <div className="pt-3 space-y-2.5">
                                                        <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl border border-slate-100">
                                                            <span className="text-xs text-slate-700 font-bold font-anuphan">Order คงเหลือ</span>
                                                            <span className="text-base font-black text-slate-900 tabular-nums">{(data?.order.remaining_qty ?? 0).toLocaleString(undefined,{minimumFractionDigits:2})} <span className="text-[10px] text-slate-600 ml-0.5">Tons</span></span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl border border-slate-100">
                                                            <span className="text-xs text-slate-700 font-bold font-anuphan">CPO ในคลัง</span>
                                                            <span className="text-base font-black text-emerald-600 tabular-nums">{(data?.cpo.stock_qty ?? 0).toLocaleString(undefined,{minimumFractionDigits:2})} <span className="text-[10px] text-slate-600 ml-0.5">Tons</span></span>
                                                        </div>
                                                        <div className={`flex justify-between items-center py-2 px-3 rounded-xl border ${
                                                            cpoNeeded > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'
                                                        }`}>
                                                            <span className="text-xs text-slate-700 font-bold font-anuphan">ขาดอีก</span>
                                                            <span className={`text-base font-black tabular-nums ${
                                                                cpoNeeded > 0 ? 'text-rose-600' : 'text-emerald-600'
                                                            }`}>{cpoNeeded.toLocaleString(undefined,{minimumFractionDigits:2})} <span className="text-[10px] opacity-70 ml-0.5">Tons</span></span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Result — col 7 */}
                                                <div className="col-span-12 sm:col-span-7">
                                                    {cpoNeeded <= 0 ? (
                                                        <div className="h-full min-h-[160px] flex flex-col items-center justify-center bg-emerald-50 rounded-3xl p-6 text-center border border-emerald-100 shadow-sm shadow-emerald-200/20">
                                                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                                                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                                            </div>
                                                            <p className="text-emerald-900 font-black text-xl font-anuphan">CPO เพียงพอแล้ว</p>
                                                            <p className="text-emerald-600 text-sm mt-1 font-medium font-anuphan">ไม่ต้องผลิตเพิ่มเติมในแผนนี้</p>
                                                        </div>
                                                    ) : cpoPerdDay <= 0 ? (
                                                        <div className="h-full min-h-[160px] flex flex-col items-center justify-center bg-slate-50 rounded-3xl p-8 text-center border border-slate-100 border-dashed">
                                                            <div className="p-3 bg-white rounded-2xl shadow-sm mb-4">
                                                                <Activity className="w-8 h-8 text-slate-300" />
                                                            </div>
                                                            <p className="text-slate-500 text-sm font-bold font-anuphan">กรุณาระบุปริมาณ FFB ที่ป้อนต่อวัน<br/>เพื่อเริ่มการคาดการณ์</p>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-indigo-200/50">
                                                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                                                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full -ml-8 -mb-8 blur-3xl" />
                                                            
                                                            <div className="relative flex flex-col h-full">
                                                                <div className="mb-6">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Calendar className="w-4 h-4 text-violet-300" />
                                                                        <p className="text-violet-200 text-md font-black uppercase font-anuphan">คาดการณ์ระยะเวลา</p>
                                                                    </div>
                                                                    <div className="flex items-baseline gap-3">
                                                                        <p className="text-8xl font-black tabular-nums leading-none tracking-tight">
                                                                            {daysToComplete}
                                                                        </p>
                                                                        <span className="text-violet-200 font-black text-3xl font-anuphan">วัน</span>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-auto space-y-3.5 pt-6 border-t border-white/10">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-white text-md font-medium font-anuphan">CPO ผลิตได้จริง/วัน</span>
                                                                        <span className="font-black tabular-nums text-lg">{cpoPerdDay.toFixed(2)} <span className="text-xs font-normal opacity-50 ml-0.5">Tons</span></span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-white text-md font-medium font-anuphan">FFB ที่ต้องใช้ในการผลิต</span>
                                                                        <div className="text-right">
                                                                            <span className="font-black tabular-nums text-lg text-amber-300">{ffbTotalNeeded.toLocaleString(undefined,{minimumFractionDigits:2})} <span className="text-xs font-normal opacity-70 ml-0.5">Tons</span></span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {completionDate && (
                                                                        <div className="mt-4 pt-4 border-t border-white/20 flex flex-col gap-1">
                                                                            <span className="text-amber-300 text-[12px] font-black uppercase font-anuphan">วันที่คาดการณ์ผลิตครบ Order</span>
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="font-black text-xl text-white underline decoration-violet-500/50 decoration-4 underline-offset-4">{completionDate.format('DD MMMM BBBB')}</span>
                                                                                <motion.div 
                                                                                    animate={{ x: [0, 5, 0] }}
                                                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                                                >
                                                                                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                                                                </motion.div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>{/* /grid col-12 row2 */}

                                {/* Bottom Section - Palm Info & Order Table */}
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                    {/* Palm Info Card */}
                                    <motion.div variants={itemVariants} className="lg:col-span-2">
                                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden h-full">
                                            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-teal-50/80">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                                                        <Droplets className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800">ปาล์มคงค้าง</h3>
                                                        <p className="text-xs text-slate-500">FFB Remaining Stock</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-5 space-y-5">
                                                {/* Main Volume */}
                                                <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-6 text-center shadow-lg shadow-emerald-200/50 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
                                                    <p className="text-emerald-100 text-[11px] font-black uppercase tracking-[0.15em] mb-2 font-anuphan">
                                                        ปริมาณผลปาล์มดิบ (FFB) ทั้งหมด
                                                    </p>
                                                    <p className="text-6xl font-black text-white tabular-nums drop-shadow-sm">
                                                        <CountUp end={data?.palm.volume ?? 0} decimals={2} separator="," duration={2} />
                                                    </p>
                                                    <p className="text-sm font-black text-emerald-200 mt-2 font-anuphan">Tons FFB (คงคลังรายวัน)</p>
                                                </div>

                                                {/* Metrics Grid */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Wallet className="w-4 h-4 text-slate-400" />
                                                            <span className="text-xs font-bold text-slate-500 uppercase">มูลค่า</span>
                                                        </div>
                                                        <p className="text-xl font-black text-slate-700 tabular-nums">
                                                            <CountUp end={data?.palm.amount_mb ?? 0} decimals={3} duration={2} />
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">MB</p>
                                                    </div>
                                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Factory className="w-4 h-4 text-amber-500" />
                                                            <span className="text-xs font-bold text-slate-500 uppercase">CPO ได้</span>
                                                        </div>
                                                        <p className="text-xl font-black text-amber-600 tabular-nums">
                                                            <CountUp end={data?.cpo.estimated_qty ?? 0} decimals={2} duration={2} />
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Tons CPO</p>
                                                    </div>
                                                </div>

                                                {/* Formula */}
                                                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Zap className="w-4 h-4 text-indigo-500" />
                                                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">สูตรคำนวณ</span>
                                                    </div>
                                                    <p className="text-sm text-indigo-800 font-medium">
                                                        {(data?.palm.volume ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})} Tons 
                                                        <span className="text-indigo-400 mx-1">×</span> 
                                                        {data?.palm.yield_percent ?? 0}% 
                                                        <span className="text-indigo-400 mx-1">=</span> 
                                                        <span className="font-black text-indigo-700">
                                                            {(data?.cpo.estimated_qty ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})} Tons CPO
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Order Table */}
                                    <motion.div variants={itemVariants} className="lg:col-span-3">
                                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden h-full">
                                            <div className="px-6 py-5 border-b border-slate-100 bg-white">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                                            <Package className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-black text-slate-900 text-lg font-anuphan">รายการ Order CPO คงค้าง</h3>
                                                            <p className="text-sm text-slate-500 font-medium">Delivery Plan - ยอดค้างจัดส่งและมูลค่าคงเหลือ</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-blue-50 px-5 py-2.5 rounded-2xl border border-blue-100">
                                                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-0.5">รวมปริมาณทั้งหมด</p>
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-2xl font-black text-blue-700 tabular-nums">
                                                                {(data?.order.remaining_qty ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                            </span>
                                                            <span className="text-sm font-bold text-blue-400">Tons</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto">
                                                {(data?.order.orders?.length ?? 0) > 0 ? (
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ลูกค้า</th>
                                                                <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">คงเหลือ</th>
                                                                <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">ราคา/kg</th>
                                                                <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">ยอดเงิน (MB)</th>
                                                                <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">%</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {data?.order.orders.map((order, index) => {
                                                                const percentage = (order.remaining_qty / (data?.order.remaining_qty || 1)) * 100;
                                                                return (
                                                                    <motion.tr 
                                                                        key={order.id}
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: index * 0.05 }}
                                                                        className="group hover:bg-blue-50/30 transition-all duration-200"
                                                                    >
                                                                        <td className="px-5 py-3.5">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 group-hover:scale-125 transition-transform" />
                                                                                <span className="text-sm font-semibold text-slate-700">
                                                                                    {order.customer_name || `Order #${order.id}`}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-5 py-3.5 text-right">
                                                                            <span className="text-sm font-black text-slate-800 tabular-nums">
                                                                                {order.remaining_qty.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-400 ml-1">Tons</span>
                                                                        </td>
                                                                        <td className="px-5 py-3.5 text-right">
                                                                            <span className="text-xs font-semibold text-slate-600 tabular-nums">
                                                                                ฿{(order.price_sell ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-5 py-3.5 text-right">
                                                                            <span className="text-sm font-bold text-indigo-600 tabular-nums">
                                                                                {(order.remaining_revenue / 1000000).toLocaleString(undefined, {minimumFractionDigits: 3})}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-5 py-3.5 text-right">
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                    <motion.div 
                                                                                        initial={{ width: 0 }}
                                                                                        animate={{ width: `${percentage}%` }}
                                                                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                                                                    />
                                                                                </div>
                                                                                <span className="text-[10px] font-bold text-slate-400 w-8">
                                                                                    {percentage.toFixed(0)}%
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                    </motion.tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="bg-gradient-to-r from-slate-50 to-white border-t-2 border-slate-200">
                                                                <td className="px-5 py-4 text-xs font-bold text-slate-500 uppercase">รวมทั้งหมด</td>
                                                                <td className="px-5 py-4 text-right">
                                                                    <span className="text-base font-black text-blue-600 tabular-nums">
                                                                        {(data?.order.remaining_qty ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 ml-1">Tons</span>
                                                                </td>
                                                                <td className="px-5 py-4" />
                                                                <td className="px-5 py-4 text-right">
                                                                    <span className="text-base font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tabular-nums">
                                                                        {(data?.order.remaining_revenue_mb ?? 0).toLocaleString(undefined, {minimumFractionDigits: 3})}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 ml-1">MB</span>
                                                                </td>
                                                                <td className="px-5 py-4 text-right">
                                                                    <span className="text-xs font-bold text-slate-500">100%</span>
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                                        <div className="p-4 bg-slate-100 rounded-full mb-4">
                                                            <Package className="w-8 h-8 opacity-50" />
                                                        </div>
                                                        <p className="font-medium text-slate-500">ไม่มี Order คงเหลือ</p>
                                                        <p className="text-sm mt-1">Order ทั้งหมดถูกจัดส่งแล้ว</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                    @import url('https://fonts.googleapis.com/css2?family=Anuphan:wght@100..700&display=swap');
                    .font-anuphan { font-family: 'Anuphan', sans-serif; }
                    .tabular-nums { font-family: 'Inter', sans-serif !important; font-feature-settings: "tnum"; }
                    body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
                    ::-webkit-scrollbar { width: 6px; height: 6px; }
                    ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                    ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #0004ffff, #4a00f8ff); border-radius: 10px; }
                    ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #0d00feff, #5906e8ff); }
                    input[type="date"]::-webkit-calendar-picker-indicator {
                        opacity: 0.5;
                        cursor: pointer;
                        filter: invert(0.3);
                    }
                    input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 0.8; }
                `}} />
            </div>
        </AppLayout>
    );
}