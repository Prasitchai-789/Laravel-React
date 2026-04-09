import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale('th');

import {
    TrendingUp, Package, Factory, Droplets,
    CalendarDays, ArrowUpRight, Leaf,
    Wallet, Gauge, Target, BarChart3,
    Ship, PiggyBank, Database, Crown,
    Sparkles, RefreshCw, Activity, Layers,
    CheckCircle2, AlertCircle, Zap, Flame,
    TrendingDown, CircleDollarSign, Scale,
    ClipboardList, Award, Medal, Rocket,
    Globe, Radar, Compass, GripVertical,
    Eye, LineChart, Hexagon, Shield
} from 'lucide-react';

export default function ExecutiveProductionReport() {
    const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);
    const [purchaseSummary, setPurchaseSummary] = useState<any>(null);
    const [productionSummary, setProductionSummary] = useState<any>(null);
    const [cpoSummary, setCPOSummary] = useState<any>(null);
    const [loadingCPOSummary, setLoadingCPOSummary] = useState<boolean>(true);
    const [loadingPurchase, setLoadingPurchase] = useState<boolean>(true);
    const [loadingProductionSummary, setLoadingProductionSummary] = useState<boolean>(true);
    const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
    const [selectedTank, setSelectedTank] = useState<string | null>(null);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const response = await axios.get('/api/purchase/executive-production-report', {
                    params: { start_date: startDate, end_date: endDate }
                });
                if (response.data.status === 'success') setReportData(response.data.data);
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };

        const fetchCPOSummary = async () => {
            setLoadingCPOSummary(true);
            try {
                const response = await axios.get('/palm/cpo/summary-card/api', {
                    params: { start_date: startDate, end_date: endDate }
                });
                if (response.data.status === 'success') setCPOSummary(response.data.data);
            } catch (error) { console.error(error); }
            finally { setLoadingCPOSummary(false); }
        };

        const fetchPurchaseSummary = async () => {
            setLoadingPurchase(true);
            try {
                const response = await axios.get('/purchase/summary-card/api', {
                    params: { start_date: startDate, end_date: endDate, good_id: 2156 }
                });
                if (response.data.status === 'success') setPurchaseSummary(response.data.data);
            } catch (error) { console.error(error); }
            finally { setLoadingPurchase(false); }
        };

        const fetchProductionSummary = async () => {
            setLoadingProductionSummary(true);
            try {
                const response = await axios.get('/palm/production/summary-card/api', {
                    params: { start_date: startDate, end_date: endDate }
                });
                if (response.data.status === 'success') setProductionSummary(response.data.data);
            } catch (error) { console.error(error); }
            finally { setLoadingProductionSummary(false); }
        };

        fetchReportData();
        fetchCPOSummary();
        fetchPurchaseSummary();
        fetchProductionSummary();
    }, [startDate, endDate]);

    const formatDateThai = (date: string) => {
        if (!date) return '';
        return dayjs(date).format('D MMMM BBBB');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 25 } }
    };

    const totalAmountMB = Object.values(reportData?.production || {}).reduce((acc: number, curr: any) => acc + (curr.amount_mb || 0), 0);
    const isLoading = loading || loadingPurchase || loadingProductionSummary || loadingCPOSummary;

    const generateSparklinePath = (data: any[], width: number, height: number, isClosed: boolean = false) => {
        if (!data || data.length < 2) return "";
        const padding = 10;
        const effectiveHeight = height - (padding * 2);
        const values = data.map(d => typeof d === 'number' ? d : (d.value || d.volume || d.production || 0));
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        const points = values.map((val, i) => ({
            x: (i / (values.length - 1)) * width,
            y: height - padding - ((val - min) / range) * effectiveHeight
        }));

        let path = `M ${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cp1x = p0.x + (p1.x - p0.x) / 3;
            const cp2x = p0.x + (p1.x - p0.x) * 2 / 3;
            path += ` C ${cp1x},${p0.y} ${cp2x},${p1.y} ${p1.x},${p1.y}`;
        }

        if (isClosed) {
            path += ` L ${width},${height} L 0,${height} Z`;
        }
        return path;
    };

    const daysCount = Math.max(dayjs(endDate).diff(dayjs(startDate), 'day') + 1, 1);
    const productionVolume = {
        total: cpoSummary?.period_good_qty || 0,
        target: 15000,
        efficiency: ((cpoSummary?.period_good_qty || 0) / 15000 * 100).toFixed(2)
    };

    const cpoHistory = cpoSummary?.history || [];
    const productionHistory = cpoSummary?.history?.map((h: any) => h.ffb_good_qty) || [];

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '#' }, { title: 'Production Report', href: '#' }]}>
            <Head title="Executive Production Report" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
                <div className="max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">

                    {/* PREMIUM HEADER */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5 rounded-3xl blur-3xl" />

                        <div className="relative flex flex-col xl:flex-row xl:items-end justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="relative group">
                                        <div className="relative bg-gradient-to-br from-blue-900 to-blue-800 p-4 rounded-2xl shadow-2xl border border-white/10">
                                            <Factory className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl xl:text-4xl font-black tracking-tight">
                                            <span className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                                                Production
                                            </span>
                                            <span className="text-blue-600 text-2xl"> Report</span>

                                        </h1>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-blue-800 rounded-full" />
                                            <div className="flex items-center gap-2 py-1.5">
                                                <span className="text-lg font-medium text-slate-600">
                                                    {dayjs(startDate).format('D MMMM BBBB')} — {formatDateThai(endDate)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2">
                                                <Eye className="w-3 h-3" />
                                                <span>Last updated: {dayjs().format('HH:mm')} น.</span>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-white/50 shadow-lg px-5 py-2.5">
                                    <div className="flex items-center gap-4">
                                        <CalendarDays className="w-5 h-5 text-indigo-500" />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:ring-0 p-0 cursor-pointer"
                                            />
                                            <ArrowUpRight className="w-3 h-3 text-slate-400" />
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:ring-0 p-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </motion.div>

                    {/* MAIN DASHBOARD GRID */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 lg:grid-cols-12 gap-2"
                    >
                        {/* LEFT SECTION - Procurement (4 cols) */}
                        <div className="lg:col-span-4 space-y-2">

                            {/* FFB RECEPTION - HERO CARD */}
                            <motion.div variants={itemVariants} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition-all duration-700" />
                                <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-3xl p-5 shadow-2xl overflow-hidden">
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2.5 rounded-xl shadow-lg">
                                                    <Package className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.1em]">ฝ่ายจัดซื้อปาล์ม</p>
                                                    <h3 className="text-lg font-black text-white">ปริมาณการรับซื้อ FFB</h3>
                                                </div>
                                            </div>
                                            <div className="bg-emerald-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-500/30">
                                                <span className="text-[9px] font-bold text-emerald-400">...</span>
                                            </div>
                                        </div>

                                        <div className="mb-2">
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-5xl font-black text-white font-mono tracking-tighter">
                                                    {isLoading ? '...' : <CountUp end={purchaseSummary?.period?.volume_ton ?? 0} decimals={2} duration={2} separator="," />}
                                                </span>
                                                <span className="text-base font-bold text-indigo-400 uppercase">TONS</span>
                                            </div>
                                        </div>

                                        {/* Market Valuation & Resource Cost */}
                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/50">
                                            <div className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all">
                                                <p className="text-[12px] font-semibold text-white uppercase tracking-wider mb-1">ราคาเฉลี่ย</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black text-amber-400 font-mono">
                                                        {isLoading ? '...' : <CountUp end={purchaseSummary?.period?.avg_price ?? 0} decimals={2} duration={2} />}
                                                    </span>
                                                    <span className="text-[12px] font-bold text-slate-400">B/KG</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    {(purchaseSummary?.monthly?.yoy_price_change_percent ?? 0) > 0 ? (
                                                        <><TrendingUp className="w-2.5 h-2.5 text-amber-400" /><span className="text-[10px] text-amber-400">+{purchaseSummary.monthly.yoy_price_change_percent}%</span></>
                                                    ) : (purchaseSummary?.monthly?.yoy_price_change_percent ?? 0) < 0 ? (
                                                        <><TrendingDown className="w-2.5 h-2.5 text-emerald-400" /><span className="text-[10px] text-emerald-400">{purchaseSummary.monthly.yoy_price_change_percent}%</span></>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400">0.00%</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all">
                                                <p className="text-[12px] font-semibold text-white uppercase tracking-wider mb-1">ยอดเงิน</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black text-emerald-400 font-mono">
                                                        {isLoading ? '...' : <CountUp end={(purchaseSummary?.period?.amount_bath ?? 0) / 1000000} decimals={2} duration={2} />}
                                                    </span>
                                                    <span className="text-[12px] font-bold text-slate-400">MB</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    {(purchaseSummary?.monthly?.yoy_amount_change_percent ?? 0) > 0 ? (
                                                        <><TrendingUp className="w-2.5 h-2.5 text-amber-400" /><span className="text-[8px] text-amber-400">+{purchaseSummary.monthly.yoy_amount_change_percent}%</span></>
                                                    ) : (purchaseSummary?.monthly?.yoy_amount_change_percent ?? 0) < 0 ? (
                                                        <><TrendingDown className="w-2.5 h-2.5 text-emerald-400" /><span className="text-[8px] text-emerald-400">{purchaseSummary.monthly.yoy_amount_change_percent}%</span></>
                                                    ) : (
                                                        <span className="text-[8px] text-slate-400">0.00%</span>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* PRODUCTION VOLUME CARD */}
                            <motion.div variants={itemVariants} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-40 transition-all duration-500" />
                                <div className="relative bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900 rounded-3xl p-5 shadow-2xl overflow-hidden">
                                    <div className="absolute top-0 right-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl" />
                                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl" />

                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30">
                                                    <ClipboardList className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">PRODUCTION</p>
                                                    <h3 className="text-lg font-black text-white">ปริมาณการผลิต FFB</h3>
                                                </div>
                                            </div>
                                            <div className="bg-emerald-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-500/30">
                                                <span className="text-[9px] font-bold text-emerald-400">Primary KPI</span>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-5xl font-black text-white font-mono tracking-tighter">
                                                    {isLoading ? '...' : <CountUp end={productionVolume.total} decimals={2} duration={2} separator="," />}
                                                </span>
                                                <span className="text-base font-bold text-emerald-400 uppercase">TONS</span>
                                            </div>
                                        </div>

                                        {/* Sparkline */}
                                        <div className="h-16 mb-2 -mx-6 -mt-7">
                                            <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                <path d={generateSparklinePath(productionHistory.length ? productionHistory : [320, 345, 338, 360, 355, 370, 365], 300, 60, true)} fill="url(#prodGrad)" />
                                                <path d={generateSparklinePath(productionHistory.length ? productionHistory : [320, 345, 338, 360, 355, 370, 365], 300, 60)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                                            </svg>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-emerald-500/20">
                                            <div className="flex items-center gap-2">
                                                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                                                <div>
                                                    <p className="text-[18px] font-bold text-white">คงเหลือ FFB</p>
                                                    <p className="font-bold text-amber-400 text-4xl">
                                                        {isLoading ? '...' : (productionSummary?.today?.ffb_remain ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base font-bold text-amber-400">Tons</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 justify-end">
                                                {/* <Weight className="w-3.5 h-3.5 text-emerald-400" /> */}
                                                <div className="text-right mt-6">
                                                    <p className="text-[10px] text-slate-200">น้ำหนักเฉลี่ยต่อกะบะ</p>
                                                    <p className="text-xl font-bold text-emerald-400">
                                                        {isLoading ? '...' : (productionSummary?.period?.avg_weight_per_bin ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-bold text-emerald-400">Tons</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* MIDDLE SECTION - Product Metrics (4 cols) */}
                        <div className="lg:col-span-4">
                            <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden group">
                                {/* Header with Premium Design */}
                                <div className="relative p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
                                    <div className="relative flex items-center gap-3">
                                        <div className="relative">
                                            <div className="relative bg-gradient-to-br from-indigo-500 to-purple-500 p-2.5 rounded-xl shadow-lg">
                                                <Hexagon className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                                รายงานการผลิต
                                            </h2>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider">
                                                    Product Performance Analytics
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Product List with Enhanced Design */}
                                <div className="p-2 space-y-2">
                                    {[
                                        {
                                            key: 'cpo',
                                            label: 'CPO',
                                            name: 'น้ำมันปาล์มดิบ',
                                            sub: 'Crude Palm Oil',
                                            icon: Droplets,
                                            color: 'rose',
                                            trend: '+5.2%',
                                            trendUp: true,
                                            bgGradient: 'from-rose-50 to-rose-100/20',
                                            metric: 'คุณภาพพรีเมียม'
                                        },
                                        {
                                            key: 'pkn',
                                            label: 'KN',
                                            name: 'เมล็ดในปาล์ม',
                                            sub: 'Palm Kernel',
                                            icon: Package,
                                            color: 'indigo',
                                            trend: '+3.8%',
                                            trendUp: true,
                                            bgGradient: 'from-indigo-50 to-indigo-100/20',
                                            metric: 'มาตรฐานเกรด A'
                                        },
                                        {
                                            key: 'shell',
                                            label: 'Shell',
                                            name: 'กะลาปาล์ม',
                                            sub: 'Palm Shell',
                                            icon: Flame,
                                            color: 'emerald',
                                            trend: '+12.4%',
                                            trendUp: true,
                                            bgGradient: 'from-emerald-50 to-emerald-100/20',
                                            metric: 'พลังงานชีวมวล'
                                        },
                                        {
                                            key: 'fiber',
                                            label: 'EFB Fiber',
                                            name: 'เส้นใยทะลาย',
                                            sub: 'EFB Fiber',
                                            icon: Leaf,
                                            color: 'slate',
                                            trend: '+2.1%',
                                            trendUp: true,
                                            bgGradient: 'from-slate-50 to-slate-100/20',
                                            metric: 'วัตถุดิบรอง'
                                        }
                                    ].map((item, i) => {
                                        const data = reportData?.production?.[item.key] || {};
                                        const IconComp = item.icon;
                                        const colorConfig = {
                                            rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', dark: 'bg-rose-600', glow: 'shadow-rose-200', light: 'bg-rose-500/10' },
                                            indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', dark: 'bg-indigo-600', glow: 'shadow-indigo-200', light: 'bg-indigo-500/10' },
                                            emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', dark: 'bg-emerald-600', glow: 'shadow-emerald-200', light: 'bg-emerald-500/10' },
                                            slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', dark: 'bg-slate-600', glow: 'shadow-slate-200', light: 'bg-slate-500/10' }
                                        };
                                        const colors = colorConfig[item.color as keyof typeof colorConfig];

                                        return (
                                            <motion.div
                                                key={item.key}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.08 }}
                                                whileHover={{ scale: 1.01, y: -2 }}
                                                className={`relative group/item bg-gradient-to-r ${item.bgGradient} rounded-2xl p-4 py-1 cursor-pointer transition-all duration-300 border ${colors.border} hover:shadow-xl ${colors.glow} overflow-hidden`}
                                            >
                                                {/* Hover Effect Background */}
                                                <div className={`absolute inset-0 bg-gradient-to-r ${colors.light} opacity-0 group-hover/item:opacity-100 transition-opacity duration-500`} />

                                                <div className="relative">
                                                    {/* Header Section */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center">
                                                            <div className={`relative p-3 rounded-xl ${colors.bg} ${colors.text} transition-all duration-300 group-hover/item:scale-105 group-hover/item:rotate-6`}>
                                                                <IconComp className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-6 flex-wrap">
                                                                    <p className="font-black text-slate-800 text-lg tracking-tight">{item.label}</p>
                                                                </div>
                                                                <p className="text-[10px] text-slate-700 mt-0.5">{item.name}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <div>
                                                                <div className="flex items-center gap-6 flex-wrap">
                                                                    <p className="text-xl font-black text-slate-700">
                                                                        <CountUp end={data.yield ?? 0} decimals={2} duration={1.2} />%
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-1 flex-wrap">
                                                                    <Gauge className={`w-3 h-3 ${colors.text}`} />
                                                                    <p className="text-[8px] text-slate-800 uppercase tracking-wider">Yield</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="text-right mt-3">
                                                            <p className={`text-xl font-black font-mono tracking-tighter ${colors.text}`}>
                                                                <CountUp end={data.volume ?? 0} decimals={2} duration={1.2} separator="," /> <span className="text-xs">Tons</span>
                                                            </p>
                                                            <p className={`text-lg font-black text-slate-800`}>
                                                                <CountUp end={data.amount_mb ?? 0} decimals={2} duration={1.2} /> <span className="text-xs">MB</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Total Value Footer with Premium Design */}
                                <div className="relative p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-t border-slate-100 overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-2xl" />
                                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-pink-200/30 to-rose-200/30 rounded-full blur-2xl" />

                                    <div className="relative flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="text-lg font-black text-slate-700 uppercase tracking-wider">รวมมูลค่าสินค้าทั้งหมด</p>
                                                <p className="text-[10px] text-slate-600">Total product Value</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                    <CountUp end={totalAmountMB} decimals={2} duration={2} />
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">MB</span>
                                            </div>
                                            {/* <div className="flex items-center justify-end gap-1 mt-0.5">
                                                <div className="bg-emerald-100 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                                                    <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
                                                    <span className="text-[8px] text-emerald-700 font-bold">+12.4%</span>
                                                </div>
                                                <span className="text-[8px] text-slate-400">vs last period</span>
                                            </div> */}
                                        </div>
                                    </div>

                                    {/* Mini Chart Decoration */}
                                    <div className="absolute bottom-2 right-20 opacity-10">
                                        <svg width="60" height="30" viewBox="0 0 60 30">
                                            <path d="M0,20 Q15,25 30,15 T60,10" fill="none" stroke="#6366f1" strokeWidth="1.5" />
                                            <path d="M0,20 Q15,25 30,15 T60,10 L60,30 L0,30 Z" fill="#6366f1" opacity="0.3" />
                                        </svg>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* RIGHT SECTION - CPO Stock (4 cols) */}
                        <div className="lg:col-span-4">
                            <motion.div variants={itemVariants} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl blur-2xl opacity-0 group-hover:opacity-50 transition-all duration-700" />
                                <div className="relative bg-gradient-to-br from-slate-900 via-[#0f172a] to-slate-900 rounded-3xl shadow-2xl h-full overflow-hidden border border-white/5">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/8 via-transparent to-transparent" />
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                                    <div className="relative p-4 flex flex-col h-full">
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2.5 rounded-xl shadow-lg">
                                                    <Database className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.1em]">ฝ่ายควบคุมคุณภาพ</p>
                                                    <h3 className="text-lg font-black text-white">ปริมาณน้ำมันปาล์มดิบ</h3>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="bg-white/5 backdrop-blur-3xl rounded-2xl p-2 border border-white/10 text-center min-w-[130px]">
                                                    <p className="text-[9px] font-black text-emerald-500 mb-2 uppercase tracking-[0.2em]">% Yield</p>
                                                    <div className="flex items-baseline justify-center gap-1">
                                                        <span className="text-3xl font-black text-white">
                                                            {isLoading ? '...' : <CountUp end={reportData?.production?.cpo?.yield || 0} decimals={2} duration={2} />}
                                                        </span>
                                                        <span className="text-base font-black text-emerald-500">%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Main Stats */}
                                        <div className="mb-2.5">
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-6xl font-black text-white tracking-tighter">
                                                    {isLoading ? '...' : <CountUp end={cpoSummary?.total_stock || 0} decimals={2} duration={2} separator="," />}
                                                </span>
                                                <span className="text-base font-black text-amber-500 uppercase">MT</span>
                                            </div>
                                        </div>

                                        {/* Trend Sparkline */}
                                        <div className="relative mb-8 h-16">
                                            <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                                <span>7-Day Volume Trend</span>
                                                <span className="text-emerald-500 flex items-center gap-0.5">
                                                    <LineChart className="w-2.5 h-2.5" /> Trend Active
                                                </span>
                                            </div>
                                            <svg className="h-full -ml-7 -mr-7" viewBox="0 0 400 50" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="cpoSparkGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                <motion.path
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 1 }}
                                                    d={generateSparklinePath(cpoSummary?.history || [42, 45, 43, 48, 46, 52, 50], 400, 50, true)}
                                                    fill="url(#cpoSparkGrad)"
                                                />
                                                <motion.path
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                                    d={generateSparklinePath(cpoSummary?.history || [42, 45, 43, 48, 46, 52, 50], 400, 50)}
                                                    fill="none"
                                                    stroke="#f59e0b"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </div>

                                        {/* Tank Visualization */}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2.5">
                                                <div className="flex items-center gap-2">
                                                    <Layers className="w-3.5 h-3.5 text-slate-200" />
                                                    <span className="text-[10px] font-black text-slate-200 uppercase tracking-[0.3em]">Storage Tanks Status</span>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                        <span className="text-[7px] font-bold text-slate-500">Oil</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                                        <span className="text-[7px] font-bold text-slate-500">Residue</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-3 h-40 mb-3">
                                                {[
                                                    { label: 'T1', val: cpoSummary?.tanks?.tank1, cap: 500, color: 'from-amber-400 to-amber-600' },
                                                    { label: 'T2', val: cpoSummary?.tanks?.tank2, cap: 500, color: 'from-orange-500 to-amber-700' },
                                                    { label: 'T3', val: cpoSummary?.tanks?.tank3, cap: 500, color: 'from-amber-500 to-amber-700' },
                                                    { label: 'T4', val: cpoSummary?.tanks?.tank4, cap: 500, color: 'from-rose-500 to-rose-700' }
                                                ].map((tank, i) => {
                                                    const percentage = Math.min(((tank.val || 0) / (tank.cap || 500)) * 100, 100);
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="flex flex-col items-center group/tank h-full cursor-pointer"
                                                            onMouseEnter={() => setSelectedTank(tank.label)}
                                                            onMouseLeave={() => setSelectedTank(null)}
                                                        >
                                                            <div className="text-[18px] font-black text-amber-500 font-mono mb-1 group-hover/tank:text-amber-400 transition-colors">
                                                                {isLoading ? '...' : <CountUp end={tank.val || 0} decimals={1} duration={1.2} />}
                                                            </div>
                                                            <div className="relative w-full flex-1 bg-white/5 rounded-xl overflow-hidden border border-white/5 group-hover/tank:border-white/15 transition-all">
                                                                <motion.div
                                                                    initial={{ height: 0 }}
                                                                    animate={{ height: `${percentage}%` }}
                                                                    transition={{ duration: 1.5, delay: 0.3 + i * 0.1, ease: "circOut" }}
                                                                    className={`absolute bottom-0 w-full bg-gradient-to-t ${tank.color}`}
                                                                >
                                                                    <div className="absolute top-0 left-0 w-full h-1 bg-white/20 blur-[1px]" />
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover/tank:translate-x-[200%] transition-transform duration-1000" />
                                                                </motion.div>
                                                                {selectedTank === tank.label && (
                                                                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] flex items-center justify-center">
                                                                        <div className="bg-black/70 rounded px-1.5 py-0.5">
                                                                            <span className="text-[7px] text-white font-bold">{percentage.toFixed(1)}%</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-[12px] font-black text-slate-200 uppercase tracking-[0.2em] mt-2">{tank.label}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Footer Metrics */}
                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-amber-500/20 transition-all">
                                                <p className="text-[7px] font-black text-slate-200 mb-1 uppercase tracking-[0.2em]">Oil Room Inventory</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-amber-500 ml-4">
                                                        {isLoading ? '...' : <CountUp end={cpoSummary?.tanks?.oil_room || 0} decimals={2} duration={2} />}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-slate-500">MT</span>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-indigo-500/20 transition-all">
                                                <p className="text-[7px] font-black text-slate-200 mb-1 uppercase tracking-[0.2em]">Yield + Oil Room</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-white ml-6">
                                                        {isLoading ? '...' : <CountUp end={cpoSummary?.yield_oil_room || 0} decimals={2} duration={2} />}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-emerald-500">%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                        </div>



                    </motion.div>
                </div>
            </div>
        </AppLayout>
    );
}