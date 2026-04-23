import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Database,
    TrendingUp,
    Package,
    RefreshCw,
    Calendar,
    Box,
    Layers,
    Wallet,
    Award,
    Droplets,
    Flame,
    Zap,
    BarChart3,
    Activity,
    AlertCircle
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

interface ProductItem {
    name: string;
    good_id: number;
    qty: number;
    unit: string;
    avg_price: number;
    total_value: number;
    total_value_mb: number;
    trend: number[];
}

interface StockValuationData {
    success: boolean;
    date: string;
    period_start: string;
    total_inventory_value_mb: number;
    items: {
        [key: string]: ProductItem;
    };
    remaining_stock?: {
        volume: number;
        amount_mb: number;
        cpo_volume: number;
        yield_7d: number;
    };
}

export default function ProductStockReport() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<StockValuationData | null>(null);
    const [selectedDate, setSelectedDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get<StockValuationData>(route('api.stock.valuation.summary'), {
                params: { date: selectedDate }
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching stock valuation:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 120, damping: 20 }
        }
    } as const;

    const coreProductKeys = ['cpo', 'pkn', 'shell', 'efb_fiber'];

    const Sparkline = ({ data, colorClass }: { data: number[], colorClass: string }) => {
        if (!data || data.length < 2) {
            return (
                <div className="h-6 w-32 flex items-center justify-center">
                    <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">No Trend</span>
                </div>
            );
        }

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const width = 100;
        const height = 24;

        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="relative h-6 w-24 group/spark">
                <svg width={width} height={height} className="overflow-visible">
                    <motion.polyline
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                        className={colorClass}
                    />
                </svg>
                {/* Visual Glow */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/spark:translate-x-[100%] transition-transform duration-1000`} />
            </div>
        );
    };

    const sortedItems = data ? Object.entries(data.items)
        .filter(([key]) => coreProductKeys.includes(key))
        .sort(([, a], [, b]) => b.total_value - a.total_value) : [];

    const displayTotalValueMb = sortedItems.reduce((acc, [, item]) => acc + (item.total_value_mb || 0), 0);
    const nutQty = data?.items.nut?.qty ?? 0;
    const siloQty = data?.items.silo?.qty ?? 0;
    const silo1Qty = data?.items.silo1?.qty ?? 0;
    const silo2Qty = data?.items.silo2?.qty ?? 0;

    const getProductIcon = (key: string, className: string = "w-5 h-5") => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('cpo')) return <Droplets className={className} />;
        if (lowerKey.includes('pkn') || lowerKey.includes('kernel')) return <Package className={className} />;
        if (lowerKey.includes('shell')) return <Flame className={className} />;
        if (lowerKey.includes('fiber')) return <Zap className={className} />;
        if (lowerKey.includes('nut')) return <Box className={className} />;
        if (lowerKey.includes('silo')) return <Database className={className} />;
        if (lowerKey.includes('effluent') || lowerKey.includes('sludge')) return <Droplets className={className} />;
        if (lowerKey.includes('ash')) return <Flame className={`${className} opacity-50`} />;
        return <Package className={className} />;
    };

    const getGradientClass = (key: string) => {
        if (key === 'cpo') return 'from-amber-500 to-orange-600';
        if (key.includes('pkn')) return 'from-indigo-500 to-purple-600';
        if (key.includes('shell')) return 'from-rose-500 to-pink-600';
        if (key.includes('nut')) return 'from-emerald-500 to-teal-600';
        if (key.includes('silo')) return 'from-blue-500 to-cyan-600';
        return 'from-slate-500 to-slate-600';
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Dashboard Report', href: '#' },
        { title: 'Stock Valuation', href: '/stock/valuation-report' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Product Stock Valuation | Premium Analytics" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 font-anuphan text-slate-800 overflow-x-hidden relative">

                {/* Modern background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-bl from-indigo-500/5 via-purple-500/5 to-transparent rounded-full blur-[150px]" />
                    <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-gradient-to-tr from-emerald-500/5 via-teal-500/5 to-transparent rounded-full blur-[150px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a06_1px,transparent_1px),linear-gradient(to_bottom,#0f172a06_1px,transparent_1px)] bg-[size:3rem_3rem]" />
                </div>

                {/* Modern Glass Header */}
                <div className="relative bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
                    <div className="relative max-w-[1400px] mx-auto px-6 py-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white"
                                >
                                    <Database className="w-5 h-5" />
                                </motion.div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                            Stock Products
                                        </h1>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                                        <Activity className="w-3 h-3" />
                                        Stock Products Dashboard
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer hover:border-slate-300 shadow-sm"
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={fetchData}
                                    className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
                                    disabled={loading}
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                </motion.button>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="max-w-[1400px] mx-auto px-6">
                    {/* Data Alert Section */}
                    {(!loading && (!data || !data.items || Object.keys(data.items).length === 0)) && (
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="overflow-hidden mb-6"
                            >
                                <div className="bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-4 shadow-sm backdrop-blur-sm">
                                    <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                                        <AlertCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-rose-700 font-bold text-lg font-anuphan">ไม่พบข้อมูลการผลิต</h3>
                                        <p className="text-rose-600 font-medium font-anuphan opacity-90">
                                            วันที่ {dayjs().subtract(1, 'day').format('D MMMM BBBB')} ยังไม่มีการบันทึกข้อมูล
                                        </p>
                                    </div>
                                    <div className="hidden md:block px-4 py-1.5 bg-rose-500/10 rounded-full border border-rose-500/20">
                                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Status: Missing (Yesterday)</span>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {loading && !data ? (
                        <div className="flex flex-col items-center justify-center h-[60vh]">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="relative w-20 h-20 mb-6"
                            >
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 blur-xl"></div>
                                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                            </motion.div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-slate-900">กำลังโหลดข้อมูล</h3>
                                <p className="text-sm text-slate-500 mt-1">กรุณารอสักครู่...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Premium Hero Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                {/* Main Valuation Card */}
                                <motion.div
                                    variants={itemVariants}
                                    className="lg:col-span-8 relative group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-3xl overflow-hidden shadow-2xl">
                                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full blur-[100px] -mr-48 -mt-48" />
                                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-full blur-[80px] -ml-32 -mb-32" />

                                        <div className="relative p-4 lg:p-5 h-full flex flex-col">
                                            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-6">
                                                <div className="space-y-6 flex-shrink-0">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                                                        <Wallet className="w-4 h-4 text-indigo-300" />
                                                        <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">มูลค่าสินค้า</span>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-baseline gap-6">
                                                            <h2 className="text-6xl lg:text-7xl font-bold text-white tracking-tight tabular-nums">
                                                                <CountUp end={displayTotalValueMb} decimals={2} duration={2.5} separator="," />
                                                            </h2>
                                                            <span className="text-3xl font-semibold text-indigo-300">MB</span>
                                                        </div>
                                                        <p className="text-indigo-100 text-md flex items-center">
                                                            ข้อมูลวันที่ : {data?.date && format(new Date(data.date), 'dd MMMM yyyy', { locale: th })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4 flex-grow">
                                                    {/* Product Specific Cards */}
                                                    {coreProductKeys.map((key) => {
                                                        const item = data?.items[key];
                                                        if (!item) return null;

                                                        return (
                                                            <motion.div
                                                                key={key}
                                                                whileHover={{ y: -5 }}
                                                                className="p-4 bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/10 transition-colors group/card"
                                                            >
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${getGradientClass(key)} bg-opacity-20`}>
                                                                        <span className="text-white">
                                                                            {getProductIcon(key, 'w-3.5 h-3.5')}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[12px] text-indigo-200 font-bold uppercase tracking-wider truncate">
                                                                        {item.name}
                                                                    </p>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <div className="flex items-baseline gap-2 mb-2">
                                                                            <h4 className="text-5xl font-bold text-slate-200 tabular-nums tracking-tight">
                                                                                {item.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </h4>
                                                                            <span className="text-[10px] font-semibold text-slate-400">Tons</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-full h-px bg-white/10" />
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-4xl font-semibold text-emerald-400 tabular-nums">
                                                                            <CountUp end={item.total_value_mb} decimals={2} duration={1.5} separator="," />
                                                                            <span className="text-[10px] font-semibold text-slate-400 ml-1">MB</span>
                                                                        </p>
                                                                        <div className="px-2 py-1 bg-white/10 rounded-lg group-hover/card:bg-white/20 transition-colors mt-2">
                                                                            <p className="text-md text-yellow-400 font-bold tabular-nums">
                                                                                ฿ {item.avg_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Asset Distribution */}
                                            <div className="mt-auto space-y-5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-4">
                                                        <BarChart3 className="w-4 h-4" />
                                                        สัดส่วนสินค้า
                                                    </span>
                                                    <span className="text-xs text-indigo-300">100%</span>
                                                </div>
                                                <div className="h-3 w-full bg-slate-700/50 rounded-full overflow-hidden flex gap-0.5 p-0.5 backdrop-blur-sm">
                                                    {sortedItems.map(([key, item]) => {
                                                        const percentage = (item.total_value_mb / (displayTotalValueMb || 1)) * 100;
                                                        if (percentage < 0.1) return null;
                                                        return (
                                                            <motion.div
                                                                key={key}
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${percentage}%` }}
                                                                transition={{ duration: 1.5, ease: 'easeOut' }}
                                                                className={`h-full bg-gradient-to-r ${getGradientClass(key)} rounded-full shadow-lg`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                                {/* Legend */}
                                                <div className="flex flex-wrap items-center gap-5 mb-4">
                                                    {sortedItems.map(([key, item]) => (
                                                        <div key={key} className="flex items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getGradientClass(key)} shadow-lg`} />
                                                            <span className="text-xs text-indigo-100 font-medium">{item.name}</span>
                                                            <span className="text-xs text-indigo-300 font-semibold">
                                                                {((item.total_value_mb / (displayTotalValueMb || 1)) * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="grid grid-cols-1 lg:grid-cols-1 gap-2 items-start lg:col-span-4">
                                    {/* Stock Silo Card */}
                                    <motion.div variants={itemVariants} className="space-y-2">
                                        <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-2 border border-slate-200/60 shadow-xl overflow-hidden group/silo">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/silo:bg-indigo-500/10 transition-colors" />
                                            <div className="relative">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-indigo-50 rounded-lg">
                                                            <Database className="w-4 h-4 text-indigo-600" />
                                                        </div>
                                                        <h4 className="text-sm font-bold text-slate-900">Stock Silo Kernel</h4>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100 uppercase">

                                                    </span>
                                                </div>

                                                <div className="mb-2">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-3xl font-black text-indigo-700 tabular-nums leading-none pl-6">
                                                            {siloQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-sm font-bold text-indigo-500 uppercase">Tons</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-indigo-100 transition-all group/item shadow-sm">
                                                        <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-700" />
                                                            Silo 1 Kernel
                                                        </p>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-2xl font-bold text-indigo-700 tabular-nums">
                                                                {silo1Qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400">Tons</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-indigo-100 transition-all group/item shadow-sm">
                                                        <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                                            Silo 2 Kernel
                                                        </p>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-2xl font-bold text-indigo-700 tabular-nums">
                                                                {silo2Qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400">Tons</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Sidebar Forecasts */}
                                    <motion.div variants={itemVariants} className="space-y-2">
                                        {/* Stock NUT Card */}
                                        <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-2 border border-slate-200/60 shadow-xl overflow-hidden group/nut">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/nut:bg-amber-500/10 transition-colors" />
                                            <div className="relative">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-amber-50 rounded-lg">
                                                            <Box className="w-4 h-4 text-amber-600" />
                                                        </div>
                                                        <h4 className="text-sm font-bold text-slate-900">Stock NUT</h4>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-100 uppercase">

                                                    </span>
                                                </div>

                                                <div className="mb-2">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-3xl font-black text-slate-900 tabular-nums leading-none pl-6">
                                                            {nutQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-sm font-bold text-amber-500 uppercase">Tons</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-indigo-100 transition-all group/item shadow-sm">
                                                        <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                            คาดการณ์ Kernel
                                                        </p>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-2xl font-bold text-indigo-700 tabular-nums">
                                                                {(nutQty / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400">Tons</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-indigo-100 transition-all group/item shadow-sm">
                                                        <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                                            คาดการณ์ Shell
                                                        </p>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-2xl font-bold text-slate-800 tabular-nums">
                                                                {(nutQty / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400">Tons</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Stock FFB Card */}
                                    <motion.div
                                        variants={itemVariants}
                                        className="group relative flex flex-col justify-between bg-white rounded-3xl p-2 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-400/10 to-orange-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/5 rounded-full blur-2xl translate-y-12 -translate-x-8 group-hover:scale-110 transition-transform duration-700" />

                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 bg-amber-50 rounded-lg">
                                                        <Box className="w-4 h-4 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-slate-800 font-extrabold text-sm tracking-tight">ปริมาณปาล์มคงเหลือ</h3>
                                                        <div className="flex items-center justify-center gap-1 px-3 py-1 text-[10px] font-medium">
                                                            <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                                                                Formula
                                                            </span>
                                                            <div className="h-3 w-[1px] bg-slate-200 mx-1" />
                                                            <span className="text-slate-500 tabular-nums">
                                                                ({(data?.remaining_stock?.volume ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t × {data?.remaining_stock?.yield_7d ?? 0} %) = {(data?.remaining_stock?.cpo_volume ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t CPO
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-center mb-2 relative">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-black text-red-700 tabular-nums leading-none pl-6">
                                                        <CountUp end={data?.remaining_stock?.volume ?? 0} decimals={2} duration={2} separator="," />
                                                    </span>
                                                    <span className="text-sm font-bold text-red-500 uppercase">Tons</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="relative group/item p-3 rounded-2xl bg-slate-50/50 border border-amber-100 hover:bg-amber-50/50 hover:border-amber-100 transition-colors">
                                                    <div className="absolute top-2 right-2 opacity-20 group-hover/item:opacity-40 transition-opacity">
                                                        <TrendingUp className="w-3 h-3 text-amber-600" />
                                                    </div>
                                                    <p className="text-[10px] text-slate-700 font-bold uppercase tracking-wider mb-1">มูลค่าคงเหลือ</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-black text-slate-600 tabular-nums pl-4">
                                                            <CountUp end={data?.remaining_stock?.amount_mb ?? 0} decimals={2} duration={2} />
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-500">MB</span>
                                                    </div>
                                                </div>

                                                <div className="relative group/item p-3 rounded-2xl bg-slate-50/50 border border-indigo-100 hover:bg-indigo-50/50 hover:border-indigo-100 transition-colors">
                                                    <div className="absolute top-2 right-2 opacity-20 group-hover/item:opacity-40 transition-opacity">
                                                        <TrendingUp className="w-3 h-3 text-indigo-600" />
                                                    </div>
                                                    <p className="text-[10px] text-slate-700 font-bold uppercase tracking-wider mb-1">CPO โดยประมาณ</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-black text-amber-600 tabular-nums pl-4">
                                                            <CountUp end={data?.remaining_stock?.cpo_volume ?? 0} decimals={2} duration={2} />
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-500">Tons</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                </div>
                            </div>

                            {/* Main Inventory Table (Full Width) */}
                            <div className='grid grid-cols-3'>
                                <motion.div
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden col-span-2"
                                >
                                    {/* Table Header Section */}
                                    <div className="px-8 py-4 border-b border-slate-100/80 bg-white/50 backdrop-blur-md">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                                                    <Layers className="w-6 h-6 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight font-anuphan">รายละเอียดสินค้าคงคลัง</h3>
                                                    <p className="text-blue-700 text-sm flex items-center gap-2 mt-1">
                                                        <TrendingUp className="w-4 h-4" />
                                                        ข้อมูลวันที่ : {data?.date && format(new Date(data.date), 'dd MMMM yyyy', { locale: th })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modern Table */}
                                    <div className="overflow-x-auto overflow-y-hidden">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-blue-700 border-b border-slate-100/80 backdrop-blur-sm">
                                                    <th className="px-12 py-4 text-left">
                                                        <span className="text-md font-bold text-white uppercase">สินค้า / Product</span>
                                                    </th>
                                                    <th className="px-8 py-4 text-right">
                                                        <span className="text-md font-bold text-white uppercase">ปริมาณ / Qty (T)</span>
                                                    </th>
                                                    <th className="px-8 py-4 text-right">
                                                        <span className="text-md font-bold text-white uppercase">ราคาเฉลี่ย / Price</span>
                                                    </th>
                                                    <th className="px-8 py-4 text-right">
                                                        <span className="text-md font-bold text-white uppercase">มูลค่ารวม / Value</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {sortedItems.map(([key, item], idx) => {
                                                    const percentage = ((item.total_value_mb / (displayTotalValueMb || 1)) * 100);
                                                    return (
                                                        <motion.tr
                                                            key={key}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.1 + idx * 0.05 }}
                                                            onMouseEnter={() => setHoveredRow(key)}
                                                            onMouseLeave={() => setHoveredRow(null)}
                                                            className="group hover:bg-slate-50/50 transition-colors duration-300 cursor-default"
                                                        >
                                                            {/* Product Info */}
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getGradientClass(key)} p-[1px] shadow-sm group-hover:shadow-md transition-all`}>
                                                                        <div className="w-full h-full bg-white rounded-[15px] flex items-center justify-center overflow-hidden relative">
                                                                            <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass(key)} opacity-5 group-hover:opacity-10 transition-opacity`} />
                                                                            <div className={`bg-gradient-to-br ${getGradientClass(key)} bg-clip-text text-transparent transform group-hover:scale-110 transition-transform`}>
                                                                                {getProductIcon(key, "w-5 h-5")}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-lg font-bold text-slate-800 font-anuphan truncate tracking-tight">{item.name}</p>
                                                                        <div className="mt-1 flex items-center justify-between gap-3">
                                                                            <div className="flex flex-col">
                                                                                <Sparkline
                                                                                    data={item.trend}
                                                                                    colorClass={`bg-gradient-to-r ${getGradientClass(key)} bg-clip-text text-transparent`.replace('bg-clip-text text-transparent', '') + ' text-indigo-500'}
                                                                                />
                                                                            </div>

                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Quantity */}
                                                            <td className="px-8 py-5 text-right">
                                                                <div className="flex flex-col items-end gap-1.5">
                                                                    <span className="text-3xl font-bold text-slate-800 tabular-nums">
                                                                        {item.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* Average Price */}
                                                            <td className="px-8 py-5 text-right">
                                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl  text-slate-700 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                                    <span className="text-3xl font-bold tabular-nums">{item.avg_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                                    {/* <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> */}
                                                                </div>
                                                            </td>

                                                            {/* Total Value */}
                                                            <td className="px-8 py-5 text-right">
                                                                <div className="flex flex-col items-end gap-0.5">
                                                                    <span className="text-3xl lg:text-4xl tabular-nums leading-none font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent pb-1">
                                                                        {item.total_value_mb.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">MB</span>
                                                                    </span>

                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Footer Summary - Softer Design */}
                                    <div className="bg-slate-50/50 border-t border-slate-100/80 px-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">

                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] text-slate-700 font-bold uppercase tracking-widest mb-1 pr-1">Total Valuation</p>
                                                <div className="flex items-baseline justify-end gap-2">
                                                    <span className="text-4xl lg:text-5xl tabular-nums leading-none font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent pb-1">
                                                        <CountUp end={displayTotalValueMb} decimals={2} duration={2} separator="," />
                                                    </span>
                                                    <span className="text-lg font-bold text-indigo-300 uppercase tracking-wider">MB</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                        </div>


                    )}
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                @keyframes float-slow {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(100px, 40px) scale(1.1); }
                }
                @keyframes float-reverse {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-80px, -30px) scale(1.05); }
                }
                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(40px, -60px); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.18; transform: scale(1.25); }
                }
                .animate-float-slow { animation: float-slow 25s infinite ease-in-out; }
                .animate-float-reverse { animation: float-reverse 18s infinite ease-in-out; }
                .animate-float { animation: float 14s infinite ease-in-out; }
                .animate-pulse-slow { animation: pulse-slow 12s infinite ease-in-out; }

                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Anuphan:wght@100..700&display=swap');
                
                .font-anuphan { font-family: 'Anuphan', sans-serif; }

                .tabular-nums {
                    font-family: 'Inter', sans-serif !important;
                }
                
                body {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }

                input[type="date"]::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                    opacity: 0;
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                }

                /* Smooth Scroll */
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                ::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }

                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #6366f1, #8b5cf6);
                    border-radius: 10px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #4f46e5, #7c3aed);
                }
            `}} />
            </div>
        </AppLayout>
    );
}