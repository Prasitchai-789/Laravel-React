import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale('th');

import {
    TrendingUp, Package, Factory, Droplets,
    CircleDollarSign, Percent, CalendarDays,
    ArrowUpRight, ArrowDownRight, Leaf, Flame, Zap,
    Wallet, Gauge, ChartNoAxesCombined, Ship, Truck, Eye
} from 'lucide-react';

export default function ExecutiveReport() {
    const [salesData, setSalesData] = useState<any>({
        cpo: null,
        pkn: null,
        shell: null,
        efb: null,
        fiber: null
    });
    const [loadingSales, setLoadingSales] = useState<boolean>(true);
    const [cpoSummary, setCPOSummary] = useState<any>(null);
    const [loadingCPOSummary, setLoadingCPOSummary] = useState<boolean>(true);

    const salesItems: any[] = [
        { id: 2147, key: 'cpo', name: 'CPO', icon: Droplets, iconBg: 'from-amber-500 to-orange-600', color: 'text-amber-600' },
        { id: 2152, key: 'pkn', name: 'PKN', icon: Package, iconBg: 'from-indigo-500 to-purple-600', color: 'text-indigo-600' },
        { id: 2151, key: 'shell', name: 'Shell', icon: Ship, iconBg: 'from-stone-600 to-neutral-700', color: 'text-stone-600' },
        { id: 9012, key: 'efb', name: 'EFB Fiber', icon: Leaf, iconBg: 'from-emerald-500 to-teal-600', color: 'text-emerald-600' },
        { id: 2150, key: 'fiber', name: 'ใยปาล์ม', icon: Truck, iconBg: 'from-slate-500 to-slate-600', color: 'text-slate-500' },
    ];

    const getInitialDates = () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const format = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };
        return { start: format(startDate), end: format(yesterday) };
    };

    const [startDate, setStartDate] = useState(getInitialDates().start);
    const [endDate, setEndDate] = useState(getInitialDates().end);
    const [purchaseData, setPurchaseData] = useState<any>(null);
    const [loadingPurchase, setLoadingPurchase] = useState<boolean>(true);
    const [productionData, setProductionData] = useState<any>(null);
    const [loadingProduction, setLoadingProduction] = useState<boolean>(true);

    useEffect(() => {
        const fetchPurchaseData = async () => {
            setLoadingPurchase(true);
            try {
                const response = await axios.get(`/purchase/summary-card/api`, {
                    params: { start_date: startDate, end_date: endDate }
                });
                if (response.data.status === 'success') setPurchaseData(response.data.data);
            } catch (error) { console.error(error); }
            finally { setLoadingPurchase(false); }
        };

        const fetchProductionData = async () => {
            setLoadingProduction(true);
            try {
                const response = await axios.get(`/palm/production/summary-card/api`, {
                    params: { start_date: startDate, end_date: endDate }
                });
                if (response.data.status === 'success') setProductionData(response.data.data);
            } catch (error) { console.error(error); }
            finally { setLoadingProduction(false); }
        };

        const fetchSalesData = async () => {
            setLoadingSales(true);
            try {
                const requests = salesItems.map(item =>
                    axios.get(`/sales/summary-card/api`, {
                        params: { good_id: item.id, start_date: startDate, end_date: endDate }
                    })
                );
                const results = await Promise.all(requests);
                const newData: any = {};
                results.forEach((res, index) => {
                    if (res.data.status === 'success') newData[salesItems[index].key] = res.data.data;
                });
                setSalesData(newData);
            } catch (error) { console.error(error); }
            finally { setLoadingSales(false); }
        };

        const fetchCPOSummary = async () => {
            setLoadingCPOSummary(true);
            try {
                const response = await axios.get(`/palm/cpo/summary-card/api`, {
                    params: { start_date: startDate, end_date: endDate }
                });
                if (response.data.status === 'success') setCPOSummary(response.data.data);
            } catch (error) { console.error(error); }
            finally { setLoadingCPOSummary(false); }
        };

        fetchPurchaseData();
        fetchProductionData();
        fetchSalesData();
        fetchCPOSummary();
    }, [startDate, endDate]);

    const formatDateThai = (date: string) => {
        if (!date) return '-';
        return dayjs(date).format('D MMM BBBB');
    };

    const calculateTotalSalesRevenue = () => {
        let total = 0;
        salesItems.forEach(itemConfig => {
            const itemData = salesData[itemConfig.key];
            if (itemData && itemData.period) total += (itemData.period.amount_bath || 0);
        });
        return total / 1000000;
    };

    const generateSparklinePath = (data: any[], width: number, height: number, isClosed: boolean = false) => {
        if (!data || data.length < 2) return "";
        const padding = 2;
        const effectiveHeight = height - (padding * 2);
        const volumes = data.map(d => d.volume);
        const min = Math.min(...volumes);
        const max = Math.max(...volumes);
        const range = max - min || 1;
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - padding - ((d.volume - min) / range) * effectiveHeight;
            return { x, y };
        });
        let path = `M ${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const midX = (p0.x + p1.x) / 2;
            path += ` C ${midX},${p0.y} ${midX},${p1.y} ${p1.x},${p1.y}`;
        }
        if (isClosed) path += ` L ${width},${height} L 0,${height} Z`;
        return path;
    };

    const containerVariants: any = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    // ฟังก์ชันช่วย format ตัวเลข
    const formatNumber = (num: number, decimals: number = 2) => {
        if (num === undefined || num === null) return '0';
        return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '#' }, { title: 'Executive Report', href: '#' }]}>
            <Head title="Executive Report" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-2 md:p-4 lg:p-6 font-sans">
                <div className="max-w-[1600px] mx-auto flex flex-col gap-2">

                    {/* Header Section */}
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
                                            <Truck className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl xl:text-4xl font-black tracking-tight">
                                            <span className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                                                ISANPALM
                                            </span>
                                            <span className="text-blue-600 text-2xl"> Report</span>

                                        </h1>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-blue-800 rounded-full" />
                                            <div className="flex items-center gap-2 py-1.5">
                                                <span className="text-lg font-medium text-slate-600">
                                                    {formatDateThai(startDate)} — {formatDateThai(endDate)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
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

                    {/* Main Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 lg:grid-cols-12 gap-2"
                    >

                        {/* LEFT COLUMN - 5 cols */}
                        <div className="lg:col-span-5 flex flex-col gap-1">

                            {/* ปริมาณรับซื้อรวม - Big Card */}
                            <motion.div variants={itemVariants}
                                className="group relative bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-500 border border-rose-100"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-rose-200/30 to-transparent rounded-full blur-2xl" />

                                <div className="relative px-4 py-2 md:px-6 md:py-4 md:pr-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                                                <Package className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-md uppercase tracking-wide">ปริมาณรับซื้อรวม</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <CalendarDays className="w-4 h-4 text-blue-800" />
                                                    <p className="text-sm font-semibold text-blue-800">
                                                        {formatDateThai(startDate)} - {formatDateThai(endDate)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-medium text-slate-900">ราคาเฉลี่ย</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-rose-600 font-mono">
                                                    {loadingPurchase ? '...' : <CountUp end={purchaseData?.period?.avg_price || 0} decimals={2} duration={1.5} />}
                                                </span>
                                                <span className="text-sm text-slate-600">Baht</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-baseline justify-between border-t border-slate-100 pt-2">
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight font-mono">
                                                    {loadingPurchase ? '...' : <CountUp end={purchaseData?.period?.volume_ton || 0} decimals={2} duration={1.8} separator="," />}
                                                </span>
                                                <span className="text-base text-slate-700">Tons</span>
                                            </div>
                                            <p className="text-sm text-slate-700 mt-2 flex items-center gap-1">
                                                <Wallet className="w-4 h-4" />
                                                มูลค่า {loadingPurchase ? '...' :
                                                    <span className="font-bold text-slate-700">
                                                        {formatNumber((purchaseData?.period?.amount_bath || 0) / 1000000, 2)} MB
                                                    </span>
                                                }
                                            </p>
                                        </div>
                                        <div className="bg-rose-50 rounded-full px-4 py-2">
                                            <span className="text-xs font-bold text-rose-600">FFB</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* ยอดขายสินค้า - Enhanced Table */}
                            <motion.div variants={itemVariants}
                                className="bg-white rounded-3xl shadow-xl shadow-slate-400/50 overflow-hidden flex flex-col border border-emerald-200"
                            >
                                <div className="px-6 pt-2 pb-2 border-b border-slate-100 mt-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                            <CircleDollarSign className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-lg">รายงานยอดขายสินค้า</h3>
                                            <p className="text-xs text-slate-900 mt-0.5">แยกตามประเภทสินค้า</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 px-6 py-2.5">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-4 gap-2 pb-3 border-b-2 border-slate-100 text-xs font-black text-slate-900 uppercase tracking-wider">
                                        <div className="col-span-1">สินค้า</div>
                                        <div className="text-right">ปริมาณ (Tons)</div>
                                        <div className="text-right">ราคาเฉลี่ย</div>
                                        <div className="text-right">มูลค่า (MB)</div>
                                    </div>

                                    {/* Table Body */}
                                    <div className="divide-y divide-slate-50">
                                        {salesItems.map((item, idx) => {
                                            const data = salesData[item.key];
                                            const IconComponent = item.icon;
                                            return (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.2 + idx * 0.08 }}
                                                    key={idx}
                                                    className="grid grid-cols-4 gap-1 py-2 hover:bg-slate-50/80 transition-all rounded-xl px-2 -mx-2"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 bg-gradient-to-br ${item.iconBg} rounded-xl flex items-center justify-center shadow-md`}>
                                                            <IconComponent className="w-5 h-5 text-white" />
                                                        </div>
                                                        <span className="font-bold text-slate-700 text-sm uppercase tracking-wide">{item.name}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end justify-center">
                                                        {loadingSales ? (
                                                            <div className="h-5 w-16 bg-slate-100 animate-pulse rounded" />
                                                        ) : (
                                                            <span className="font-bold text-slate-800 text-lg font-mono">
                                                                <CountUp end={data?.period?.volume_ton ?? 0} decimals={2} duration={1.5} separator="," />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end justify-center">
                                                        {loadingSales ? (
                                                            <div className="h-5 w-16 bg-slate-100 animate-pulse rounded" />
                                                        ) : (
                                                            <span className={`font-bold text-lg font-mono ${item.color || 'text-slate-700'}`}>
                                                                <CountUp end={data?.period?.avg_price ?? 0} decimals={2} duration={1.5} />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-end">
                                                        {loadingSales ? (
                                                            <div className="h-6 w-20 bg-slate-100 animate-pulse rounded" />
                                                        ) : (
                                                            <span className="font-black text-slate-800 text-xl font-mono bg-slate-50 px-2 py-1 rounded-lg">
                                                                <CountUp end={(data?.period?.amount_bath ?? 0) / 1000000} decimals={2} duration={1.5} />
                                                            </span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Sales Total Footer */}
                                <div className="relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900" />
                                    <div className="relative px-6 py-3 flex justify-between items-center">
                                        <div>
                                            <p className="text-slate-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                                                <Flame className="w-3.5 h-3.5 text-amber-500" />
                                                TOTAL REVENUE
                                            </p>
                                            <span className="font-bold text-white text-sm">ยอดขายรวมสุทธิ</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-black text-5xl text-emerald-400 tracking-tight font-mono">
                                                    {loadingSales ? '...' : <CountUp end={calculateTotalSalesRevenue()} decimals={2} duration={2} />}
                                                </span>
                                                <span className="font-bold text-emerald-400/70 text-sm">MB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* MIDDLE COLUMN - 4 cols */}
                        <div className="lg:col-span-4 flex flex-col gap-2">

                            {/* Production & Stock Row */}
                            <div className="grid grid-cols-2 gap-2">
                                <motion.div variants={itemVariants}
                                    className="bg-white rounded-2xl p-4 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all border border-blue-100"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
                                            <Factory className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-xs uppercase tracking-wide">การผลิต CPO</p>
                                            <p className="text-xs text-slate-700">ช่วงเวลาที่เลือก</p>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        {loadingCPOSummary ? (
                                            <div className="h-10 w-24 bg-slate-400 animate-pulse rounded" />
                                        ) : (
                                            <>
                                                <span className="text-3xl font-black text-slate-800 tracking-tight font-mono">
                                                    <CountUp end={cpoSummary?.period_good_qty ?? 0} decimals={2} duration={2} separator="," />
                                                </span>
                                                <span className="text-sm text-slate-400">Tons</span>
                                            </>
                                        )}
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants}
                                    className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-4 shadow-lg border border-emerald-100 hover:shadow-xl transition-all"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200">
                                            <Leaf className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-emerald-800 text-xs uppercase tracking-wide">FFB คงเหลือ</p>
                                            <p className="text-xs text-emerald-700">สต็อกปัจจุบัน</p>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        {loadingProduction ? (
                                            <div className="h-10 w-24 bg-emerald-100 animate-pulse rounded" />
                                        ) : (
                                            <>
                                                <span className="text-3xl font-black text-emerald-800 tracking-tight font-mono">
                                                    <CountUp end={productionData?.today?.ffb_remain || 0} decimals={2} duration={2} separator="," />
                                                </span>
                                                <span className="text-sm text-emerald-400">Tons</span>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Total Stock CPO - Main Feature */}
                            <motion.div variants={itemVariants}
                                className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl flex-1 flex flex-col"
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/5 via-transparent to-transparent" />

                                <div className="relative z-10 p-6 flex-1">
                                    {/* Header */}
                                    <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                        <div>
                                            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/20 px-4 py-2 rounded-full mb-4">
                                                <Droplets className="w-4 h-4 text-emerald-400" />
                                                <p className="font-black text-xs text-emerald-300 uppercase tracking-wider">
                                                    TOTAL STOCK CPO
                                                </p>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-5xl font-black text-amber-400 tracking-tight font-mono">
                                                    {loadingCPOSummary ? '...' : <CountUp end={cpoSummary?.total_stock || 0} decimals={2} duration={2.5} separator="," />}
                                                </span>
                                                <span className="text-sm font-bold text-amber-400">Tons</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                            <p className="font-bold text-xs text-emerald-200/80 mb-1 uppercase tracking-wider">% Yield</p>
                                            <div className="flex items-baseline gap-1">
                                                <p className="text-3xl font-black text-white font-mono">
                                                    {loadingCPOSummary ? '...' : <CountUp end={cpoSummary?.yield_percent || 0} decimals={2} duration={2} />}
                                                </p>
                                                <p className="text-sm font-bold text-emerald-400">%</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sparkline Chart */}
                                    <div className="mt-6 mb-4 h-16 w-full -ml-7 -mr-7">
                                        {loadingCPOSummary ? (
                                            <div className="w-full h-full bg-white/5 rounded-lg animate-pulse" />
                                        ) : (
                                            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 20">
                                                <defs>
                                                    <linearGradient id="gradPath" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                                                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
                                                    </linearGradient>
                                                    <linearGradient id="gradFill" x1="0%" y1="0%" x2="0%" y2="100%">
                                                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                                                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                <motion.path
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                    transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                                                    d={generateSparklinePath(cpoSummary?.history || [], 100, 20)}
                                                    fill="none" stroke="url(#gradPath)" strokeWidth="1.5" strokeLinecap="round"
                                                />
                                                <motion.path
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 1, delay: 2 }}
                                                    d={generateSparklinePath(cpoSummary?.history || [], 100, 20, true)}
                                                    fill="url(#gradFill)"
                                                />
                                                {/* ปลายกราฟจุดสุดท้าย */}
                                                {cpoSummary?.history?.length > 0 && (
                                                    <motion.circle
                                                        initial={{ opacity: 0, scale: 0 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 2.2 }}
                                                        cx="100"
                                                        cy={20 - 2 - ((cpoSummary.history[cpoSummary.history.length - 1].volume - Math.min(...cpoSummary.history.map((d: any) => d.volume))) / (Math.max(...cpoSummary.history.map((d: any) => d.volume)) - Math.min(...cpoSummary.history.map((d: any) => d.volume)) || 1)) * 16}
                                                        r="1.5"
                                                        fill="#fff"
                                                        className="drop-shadow-[0_0_8px_rgba(251,191,36,1)]"
                                                    />
                                                )}
                                            </svg>
                                        )}
                                    </div>
                                    {/* Tanks Display */}
                                    <div className="mb-6">
                                        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-6">สถานะถังเก็บ CPO</p>
                                        <div className="flex gap-3">
                                            {[
                                                { label: 'T1', val: cpoSummary?.tanks?.tank1, cap: 500 },
                                                { label: 'T2', val: cpoSummary?.tanks?.tank2, cap: 500 },
                                                { label: 'T3', val: cpoSummary?.tanks?.tank3, cap: 500 },
                                                { label: 'T4', val: cpoSummary?.tanks?.tank4, cap: 500 },
                                            ].map((tank, i) => {
                                                const percent = ((tank.val || 0) / tank.cap) * 100;
                                                return (
                                                    <div key={i} className="flex-1 text-center">
                                                        <div className="mb-1 h-5 flex items-end justify-center">
                                                            <span className="text-[18px] font-black text-amber-300 font-mono leading-none tracking-tight">
                                                                {loadingCPOSummary ? '...' : <CountUp end={tank.val || 0} decimals={2} duration={1.5} />}
                                                            </span>
                                                        </div>
                                                        <div className="relative">
                                                            <div className="bg-slate-950/50 rounded-xl overflow-hidden h-24 relative border border-white/5">
                                                                <motion.div
                                                                    initial={{ height: 0 }}
                                                                    animate={{ height: `${Math.min(percent, 100)}%` }}
                                                                    transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }}
                                                                    className={`absolute bottom-0 w-full bg-gradient-to-t from-amber-500 to-orange-400 rounded-t-[4px]`}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="mt-1.5 flex items-center justify-center">
                                                            <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{tank.label}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Footer Stats */}
                                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-200">Oil Room</p>
                                            <p className="text-3xl font-black text-amber-400 font-mono">
                                                {loadingCPOSummary ? '...' : <CountUp end={cpoSummary?.tanks?.oil_room || 0} decimals={2} duration={2} />}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-200 flex items-center gap-1">
                                                <Zap className="w-3 h-3 text-emerald-400" /> Yield + Oil Room
                                            </p>
                                            <p className="text-3xl font-black text-white font-mono">
                                                {loadingCPOSummary ? '...' : <CountUp end={cpoSummary?.yield_oil_room || 0} decimals={2} duration={2} />}%
                                            </p>
                                        </div>

                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* RIGHT COLUMN - 3 cols */}
                        <div className="lg:col-span-3 flex flex-col gap-2">

                            {/* Yield Main Card */}
                            <motion.div variants={itemVariants}
                                className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 rounded-3xl p-7 shadow-xl shadow-indigo-200/50 text-center"
                            >
                                <div className="absolute -right-8 -bottom-8 opacity-10">
                                    <Percent className="w-40 h-40" />
                                </div>
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-5 py-2 rounded-full border border-white/20 mb-5">
                                        <Gauge className="w-4 h-4 text-yellow-300" />
                                        <p className="font-black text-white text-sm uppercase tracking-wider">% YIELD (Monthly)</p>
                                    </div>
                                    <div className="flex items-baseline justify-center gap-2">
                                        <span className="text-7xl font-black text-white tracking-tighter font-mono">
                                            {loadingCPOSummary ? '...' : <CountUp end={cpoSummary?.yield_period ?? 0} decimals={2} duration={2.5} />}
                                        </span>
                                        <span className="text-3xl font-bold text-white/70">%</span>
                                    </div>
                                    <div className="mt-4 flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-xs font-medium text-white/60">อัตราส่วนการผลิต CPO จาก FFB</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Cost Cards */}
                            <div className="grid grid-cols-2 gap-2">
                                <motion.div variants={itemVariants}
                                    className="bg-white rounded-2xl p-4 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl transition-all"
                                >
                                    <p className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-3">ต้นทุนเฉลี่ย / เดือน</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-rose-600 tracking-tight font-mono">
                                            {loadingCPOSummary || loadingPurchase ? '...' :
                                                <CountUp end={cpoSummary?.yield_period_no_oil_room > 0 ? ((purchaseData?.period?.avg_price ?? 0) / cpoSummary.yield_period_no_oil_room) * 100 : 0}
                                                    decimals={2} duration={2} />
                                            }
                                        </span>
                                        <span className="text-sm text-slate-500">Baht</span>
                                    </div>
                                    <p className="text-xs text-slate-700 mt-2">ต่อหน่วย CPO</p>
                                </motion.div>

                                <motion.div variants={itemVariants}
                                    className="bg-white rounded-2xl p-4 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl transition-all"
                                >
                                    <p className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-3">ต้นทุนปัจจุบัน</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-800 tracking-tight font-mono">
                                            {loadingCPOSummary || loadingPurchase ? '...' :
                                                <CountUp end={cpoSummary?.yield_period_no_oil_room > 0 ? ((purchaseData?.today?.avg_price ?? 0) / cpoSummary.yield_period_no_oil_room) * 100 : 0}
                                                    decimals={2} duration={2} />
                                            }
                                        </span>
                                        <span className="text-sm text-slate-500">Baht</span>
                                    </div>
                                    <p className="text-xs text-slate-700 mt-2">อิงราคาวันที่ล่าสุด</p>
                                </motion.div>
                            </div>

                            {/* CPO Price Card */}
                            <motion.div variants={itemVariants}
                                className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl shadow-slate-900/20 hover:shadow-2xl transition-all"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/3" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                                <ChartNoAxesCombined className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <p className="font-bold text-slate-300 text-sm">ราคาเฉลี่ย CPO</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">ช่วงเวลาที่เลือก</p>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-white tracking-tight font-mono">
                                            {loadingSales ? '...' : <CountUp end={salesData?.cpo?.period?.avg_price || 0} decimals={2} duration={2} />}
                                        </span>
                                        <span className="text-base font-bold text-amber-400">บาท/กก.</span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                                        <span className="text-xs text-slate-400">เปรียบเทียบกับต้นทุน</span>
                                        {loadingCPOSummary || loadingPurchase || loadingSales ? (
                                            <span className="text-sm font-bold text-slate-400">...</span>
                                        ) : (
                                            (() => {
                                                const cost = (purchaseData?.period?.avg_price ?? 0) / (cpoSummary?.yield_period_no_oil_room || 1) * 100;
                                                const price = salesData?.cpo?.period?.avg_price || 0;
                                                const isProfit = price >= cost;
                                                const diff = cost > 0 ? ((price - cost) / cost) * 100 : 0;

                                                return (
                                                    <span className={`text-sm font-bold flex items-center gap-1 ${isProfit ? 'text-emerald-400' : 'text-rose-500'}`}>
                                                        {isProfit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                                        {diff.toFixed(2)}%
                                                    </span>
                                                );
                                            })()
                                        )}
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