import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
    TrendingUp, Package, Factory, Droplets,
    CircleDollarSign, Percent, BarChart3, CalendarDays,
    ArrowUpRight, ArrowDownRight, Leaf, Flame, Zap
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
        { id: 2147, key: 'cpo', name: 'CPO', iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500', color: 'text-amber-600' },
        { id: 2152, key: 'pkn', name: 'PKN', iconBg: 'bg-gradient-to-br from-indigo-400 to-purple-500', color: 'text-indigo-600' },
        { id: 2151, key: 'shell', name: 'Shell', iconBg: 'bg-gradient-to-br from-stone-500 to-neutral-600', color: 'text-stone-600' },
        { id: 9012, key: 'efb', name: 'EFB Fiber', iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500', color: 'text-emerald-600' },
        { id: 2150, key: 'fiber', name: 'ใยปาล์ม', iconBg: 'bg-gradient-to-br from-slate-400 to-slate-500', color: 'text-slate-500' },
    ];

    const getInitialDates = () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // ถ้าเป็นวันที่ 1 ของเดือน, last day ของเดือนที่แล้วคือ "yesterday"
        // month เริ่มต้นคือของ yesterday ก็ได้ หรือ month นี้ 
        // โจทย์: ค่าปกติให้เริ่มวันที่ 1 ของเดือนนั้นและถึงวันที่ก่อนหน้า 1 วัน
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);

        const format = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        return {
            start: format(startDate),
            end: format(yesterday)
        };
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
                if (response.data.status === 'success') {
                    setPurchaseData(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching purchase data", error);
            } finally {
                setLoadingPurchase(false);
            }
        };

        const fetchProductionData = async () => {
            setLoadingProduction(true);
            try {
                const response = await axios.get(`/palm/production/summary-card/api`, {
                    params: { start_date: startDate, end_date: endDate }
                });
                if (response.data.status === 'success') {
                    setProductionData(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching production data", error);
            } finally {
                setLoadingProduction(false);
            }
        };

        const fetchSalesData = async () => {
            setLoadingSales(true);
            try {
                const requests = salesItems.map(item => 
                    axios.get(`/sales/summary-card/api`, {
                        params: { 
                            good_id: item.id, 
                            start_date: startDate, 
                            end_date: endDate 
                        }
                    })
                );

                const results = await Promise.all(requests);
                const newData: any = {};
                results.forEach((res, index) => {
                    if (res.data.status === 'success') {
                        newData[salesItems[index].key] = res.data.data;
                    }
                });
                setSalesData(newData);
            } catch (error) {
                console.error("Error fetching sales data", error);
            } finally {
                setLoadingSales(false);
            }
        };

        const fetchCPOSummary = async () => {
            setLoadingCPOSummary(true);
            try {
                const response = await axios.get(`/palm/cpo/summary-card/api`, {
                    params: { 
                        start_date: startDate,
                        end_date: endDate 
                    }
                });
                if (response.data.status === 'success') {
                    setCPOSummary(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching CPO summary", error);
            } finally {
                setLoadingCPOSummary(false);
            }
        };

        fetchPurchaseData();
        fetchProductionData();
        fetchSalesData();
        fetchCPOSummary();
    }, [startDate, endDate]);

    const calculateTotalSalesRevenue = () => {
        let total = 0;
        salesItems.forEach(itemConfig => {
            const itemData = salesData[itemConfig.key];
            if (itemData && itemData.period) {
                total += (itemData.period.amount_bath || 0);
            }
        });
        return total / 1000000; // Convert to MB
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

        // Generate cubic bezier or simple lines. Simple lines with smooth points usually look like:
        let path = `M ${points[0].x},${points[0].y}`;
        
        // Use a simple curve approach
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const midX = (p0.x + p1.x) / 2;
            path += ` C ${midX},${p0.y} ${midX},${p1.y} ${p1.x},${p1.y}`;
        }

        if (isClosed) {
            path += ` L ${width},${height} L 0,${height} Z`;
        }

        return path;
    };

    const containerVariants: any = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '#' }, { title: 'Executive Report', href: '#' }]}>
            <Head title="Executive Report" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-3 md:p-4 lg:p-6 xl:p-8 font-sans antialiased">
                <div className="max-w-[1600px] mx-auto flex flex-col gap-4 md:gap-5 lg:gap-6 relative">

                    {/* Decorative Background Elements */}
                    <div className="fixed top-0 -left-48 w-96 h-96 bg-gradient-to-r from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="fixed bottom-0 -right-48 w-96 h-96 bg-gradient-to-l from-emerald-300/15 to-teal-300/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-300/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10"
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Executive Report</h1>
                                    <p className="text-sm text-slate-500">ภาพรวมธุรกิจแบบเรียลไทม์</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-full px-4 py-2 shadow-sm border border-white/50">
                                    <CalendarDays className="w-4 h-4 text-indigo-500" />
                                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-transparent border-none outline-none focus:ring-0 p-0 m-0 text-sm font-bold text-slate-700 cursor-pointer w-auto"
                                            style={{ colorScheme: 'light' }}
                                        />
                                        <span className="text-slate-400 font-medium px-1">-</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-transparent border-none outline-none focus:ring-0 p-0 m-0 text-sm font-bold text-slate-700 cursor-pointer w-auto"
                                            style={{ colorScheme: 'light' }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-emerald-50/80 backdrop-blur-md rounded-full px-3 py-2 border border-emerald-100">
                                    <div className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </div>
                                    <span className="text-emerald-700 font-black text-xs tracking-wider">LIVE</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10"
                    >

                        {/* LEFT COLUMN - 5 cols */}
                        <div className="lg:col-span-5 flex flex-col gap-4">

                            {/* ปริมาณรับซื้อ */}
                            <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-5 lg:p-6 shadow-xl shadow-slate-200/40 border border-white flex justify-between items-center relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-32 h-32 md:w-40 md:h-40 bg-gradient-to-bl from-rose-100/60 via-rose-50/40 to-transparent rounded-bl-full" />
                                <div className="absolute bottom-0 left-0 w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-amber-50 to-transparent rounded-tr-full opacity-50" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
                                            <Package className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                        </div>
                                        <h3 className="font-bold text-slate-500 text-xs md:text-sm tracking-wide">ปริมาณรับซื้อรวม</h3>
                                    </div>
                                    <div className="flex items-baseline gap-1 md:gap-2 mt-2 md:mt-3 pl-10 md:pl-12">
                                        {loadingPurchase ? (
                                            <span className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-300 tracking-tight font-mono animate-pulse">...</span>
                                        ) : (
                                            <span className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight font-mono">
                                                <CountUp end={purchaseData?.period?.volume_ton || 0} decimals={2} duration={1.5} separator="," />
                                            </span>
                                        )}
                                        <span className="text-xs md:text-sm font-bold text-slate-400">ตัน</span>
                                    </div>
                                </div>
                                <div className="relative z-10 text-right">
                                    <p className="text-xs md:text-sm font-semibold text-slate-500 mb-1 flex items-baseline justify-end gap-1 md:gap-2">

                                        ราคาเฉลี่ย
                                        {loadingPurchase ? (
                                            <span className="font-bold text-slate-300 text-xs md:text-sm font-mono animate-pulse">...</span>
                                        ) : (
                                            <span className="font-black text-rose-600 text-lg md:text-xl font-mono">

                                                <CountUp end={purchaseData?.period?.avg_price || 0} decimals={2} duration={1.5} />
                                            </span>
                                        )}
                                        <span className="text-[8px] md:text-[10px] font-bold">บาท</span>
                                    </p>
                                    <p className="text-[10px] md:text-xs font-medium text-slate-400 flex items-baseline justify-end gap-1">
                                        ยอดเงิน
                                        {loadingPurchase ? (
                                            <span className="font-black text-rose-300 text-lg md:text-xl font-mono animate-pulse">...</span>
                                        ) : (
                                            <span className="font-bold text-slate-700 text-xs md:text-sm font-mono">
                                                <CountUp end={((purchaseData?.period?.amount_bath || 0) / 1000000)} decimals={2} duration={1.5} />
                                            </span>
                                        )}
                                        <span className="text-[10px] md:text-xs font-bold text-slate-400">MB</span>
                                    </p>
                                    {/* Optional: Trend indicator for purchase logic */}
                                </div>
                            </motion.div>

                            {/* ยอดขายสินค้า */}
                            <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-xl shadow-slate-200/40 border border-white overflow-hidden flex flex-col flex-1">
                                <div className="p-4 md:p-4 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent">
                                    <h3 className="font-black text-slate-800 flex items-center gap-2 md:gap-3 text-sm md:text-base">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                            <CircleDollarSign className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                        </div>
                                        รายละเอียดยอดขายสินค้า
                                    </h3>
                                </div>

                                <div className="flex-1 px-4 md:px-5 lg:px-6 py-3 md:py-4">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-4 pb-2 md:pb-3 border-b-2 border-slate-100 text-[10px] md:text-[12px] font-black text-slate-700 uppercase tracking-wider">
                                        <div className="text-left py-1 md:py-2">สินค้า</div>
                                        <div className="text-right py-1 md:py-2">ปริมาณ (ตัน)</div>
                                        <div className="text-right py-1 md:py-2">ราคาเฉลี่ย</div>
                                        <div className="text-right py-1 md:py-2">ยอดเงิน (MB)</div>
                                    </div>

                                    {/* Table Body */}
                                    <div className="flex flex-col">
                                        {salesItems.map((item, idx) => {
                                            const data = salesData[item.key];
                                            return (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 + idx * 0.1 }}
                                                    key={idx}
                                                    className="grid grid-cols-4 py-2 md:py-3 lg:py-3.5 hover:bg-slate-50/80 transition-all duration-200 border-b border-slate-50 last:border-0 rounded-lg px-1 md:px-2 -mx-1 md:-mx-2"
                                                >
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <div className={`w-1 h-6 md:w-1.5 md:h-8 rounded-full ${item.iconBg} shadow-sm`} />
                                                        <span className="font-black text-slate-600 text-xs md:text-sm uppercase tracking-wide">{item.name}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end justify-center">
                                                        {loadingSales ? (
                                                            <div className="h-4 w-12 bg-slate-100 animate-pulse rounded" />
                                                        ) : (
                                                            <span className="font-black text-slate-800 text-xs md:text-[18px] font-mono">
                                                                <CountUp end={data?.period?.volume_ton ?? 0} decimals={2} duration={2} separator="," />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end justify-center">
                                                        {loadingSales ? (
                                                            <div className="h-4 w-12 bg-slate-100 animate-pulse rounded" />
                                                        ) : (
                                                            <span className={`font-black text-xs md:text-[18px] font-mono ${item.color || 'text-slate-700'}`}>
                                                                <CountUp end={data?.period?.avg_price ?? 0} decimals={2} duration={2} />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-end">
                                                        {loadingSales ? (
                                                            <div className="h-6 w-16 bg-slate-100 animate-pulse rounded" />
                                                        ) : (
                                                            <span className="font-black text-slate-800 text-lg md:text-xl font-mono bg-slate-50 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded text-right min-w-[2.5rem] md:min-w-[3rem]">
                                                                <CountUp end={(data?.period?.amount_bath ?? 0) / 1000000} decimals={2} duration={2} />
                                                            </span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Sales Total */}
                                <div className="relative overflow-hidden mt-auto">
                                    <div className="absolute inset-0 bg-slate-900" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-slate-900/50" />
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent opacity-60" />
                                    <div className="relative px-4 md:px-5 lg:px-6 py-4 md:py-5 flex justify-between items-center md:items-end flex-wrap gap-3">
                                        <div>
                                            <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <Flame className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-amber-500" />
                                                Total Sales Revenue
                                            </p>
                                            <span className="font-bold text-sm md:text-base lg:text-lg text-white">ยอดขายรวม</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-black text-3xl md:text-4xl lg:text-5xl text-emerald-400 tracking-tight drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] font-mono">
                                                    {loadingSales ? (
                                                        <span className="animate-pulse">...</span>
                                                    ) : (
                                                        <CountUp end={calculateTotalSalesRevenue()} decimals={2} duration={2} />
                                                    )}
                                                </span>
                                                <span className="font-black text-emerald-500/70 text-xs md:text-sm">MB</span>
                                            </div>
                                            {/* <div className="flex items-center justify-end gap-1 mt-1">
                                                <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400" />
                                                <span className="text-[8px] md:text-[10px] font-bold text-emerald-400/80">+8.3%</span>
                                            </div> */}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* MIDDLE COLUMN - 4 cols */}
                        <div className="lg:col-span-4 flex flex-col gap-4">

                            {/* Top Row - Production & Stock */}
                            <div className="grid grid-cols-2 gap-4">
                                <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
                                            <Factory className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="font-bold text-slate-500 text-sm">ปริมาณการผลิต</p>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        {loadingCPOSummary ? (
                                            <span className="text-3xl font-black text-slate-300 tracking-tight font-mono animate-pulse">...</span>
                                        ) : (
                                            <span className="text-3xl font-black text-slate-800 tracking-tight font-mono">
                                                <CountUp end={cpoSummary?.period_good_qty ?? 0} decimals={2} duration={2} separator="," />
                                            </span>
                                        )}
                                        <span className="text-xs font-bold text-slate-400">ตัน</span>
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-5 shadow-md shadow-indigo-100/50 border border-indigo-100">
                                    <div className="absolute -right-4 -bottom-4 text-6xl opacity-5">🥥</div>
                                    <div className="flex items-center gap-3 mb-4 relative z-10">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
                                            <Leaf className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="font-bold text-indigo-700 text-sm">คงเหลือ FFB</p>
                                    </div>
                                    <div className="flex items-baseline gap-1 relative z-10">
                                        {loadingProduction ? (
                                            <span className="text-3xl font-black text-indigo-300 tracking-tight font-mono animate-pulse">...</span>
                                        ) : (
                                            <span className="text-3xl font-black text-indigo-600 tracking-tight font-mono">
                                                <CountUp end={productionData?.today?.ffb_remain || 0} decimals={2} duration={2} separator="," />
                                            </span>
                                        )}
                                        <span className="text-xs font-bold text-indigo-400">ตัน</span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Total Stock CPO - Main Feature Card */}
                            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 shadow-2xl shadow-slate-900/30 flex-1 flex flex-col">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
                                <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-emerald-500/15 to-transparent rounded-full blur-xl translate-y-1/3 -translate-x-1/4" />

                                <div className="relative z-10 flex-1">
                                    <div className="flex flex-wrap justify-between items-start gap-4">
                                        <div>
                                            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full mb-3">
                                                <Droplets className="w-4 h-4 text-emerald-400" />
                                                <p className="font-black text-xs text-emerald-300 uppercase tracking-wider">
                                                    Total Stock CPO
                                                </p>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-black text-amber-400 tracking-tight font-mono">
                                                    {loadingCPOSummary ? (
                                                        <span className="animate-pulse">...</span>
                                                    ) : (
                                                        <CountUp end={cpoSummary?.total_stock || 0} decimals={2} duration={2.5} />
                                                    )}
                                                </span>
                                                <span className="text-sm font-bold text-amber-400/60">TONS</span>
                                            </div>
                                        </div>
                                        <div className="text-right bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                            <p className="font-bold text-xs text-emerald-200/80 mb-1 uppercase tracking-wider">% Yield</p>
                                            <div className="flex items-baseline gap-0.5 justify-end">
                                                <p className="text-2xl font-black text-white font-mono">
                                                    {loadingCPOSummary ? (
                                                        <span className="animate-pulse">...</span>
                                                    ) : (
                                                        <CountUp end={cpoSummary?.yield_percent || 0} decimals={2} duration={2} />
                                                    )}
                                                </p>
                                                <p className="text-xs font-bold text-emerald-400">%</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sparkline Chart */}
                                    <div className="mt-6 mb-4 h-16 w-full">
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
                                                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
                                                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                <motion.path
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                    transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                                                    d={generateSparklinePath(cpoSummary?.history || [], 100, 20)}
                                                    fill="none" stroke="url(#gradPath)" strokeWidth="2.5" strokeLinecap="round"
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
                                                        cy={20 - 2 - ((cpoSummary.history[cpoSummary.history.length - 1].volume - Math.min(...cpoSummary.history.map((d:any) => d.volume))) / (Math.max(...cpoSummary.history.map((d:any) => d.volume)) - Math.min(...cpoSummary.history.map((d:any) => d.volume)) || 1)) * 16} 
                                                        r="2.5" 
                                                        fill="#fff" 
                                                        className="drop-shadow-[0_0_8px_rgba(251,191,36,1)]"
                                                    />
                                                )}
                                            </svg>
                                        )}
                                    </div>

                                    {/* Tanks & Yield Details */}
                                    <div className="flex flex-col md:flex-row justify-between gap-4 pt-4 border-t border-white/10">
                                        <div className="flex-1 flex justify-between gap-2 md:gap-4 lg:gap-6">
                                            {[
                                                { label: 'Tank 1', val: cpoSummary?.tanks?.tank1, percent: (cpoSummary?.tanks?.tank1 / 500) * 100, color: 'from-amber-400 to-orange-400', active: (cpoSummary?.tanks?.tank1 > 1) },
                                                { label: 'Tank 2', val: cpoSummary?.tanks?.tank2, percent: (cpoSummary?.tanks?.tank2 / 500) * 100, color: 'from-amber-400 to-orange-500', active: (cpoSummary?.tanks?.tank2 > 1) },
                                                { label: 'Tank 3', val: cpoSummary?.tanks?.tank3, percent: (cpoSummary?.tanks?.tank3 / 500) * 100, color: 'from-amber-400 to-orange-500', active: (cpoSummary?.tanks?.tank3 > 1) },
                                                { label: 'Tank 4', val: cpoSummary?.tanks?.tank4, percent: (cpoSummary?.tanks?.tank4 / 500) * 100, color: 'from-amber-400 to-orange-500', active: (cpoSummary?.tanks?.tank4 > 1) },
                                            ].map((tank, i) => (
                                                <div key={i} className="flex flex-col items-center justify-end flex-1">
                                                    <span className={`text-[10px] md:text-xs font-bold mb-1 font-mono ${tank.active ? 'text-amber-300' : 'text-slate-500'}`}>
                                                        {loadingCPOSummary ? '...' : (tank.val !== undefined ? <CountUp end={tank.val} decimals={2} duration={2} /> : '-')}
                                                    </span>
                                                    <div className="w-full bg-slate-950/50 rounded-t-lg overflow-hidden h-12 relative flex items-end">
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${Math.min(tank.percent || 0, 100)}%` }}
                                                            transition={{ duration: 1.5, delay: 0.5 + i * 0.1, type: "spring", bounce: 0.3 }}
                                                            className={`w-full bg-gradient-to-t ${tank.color} rounded-t-lg opacity-90 relative`}
                                                        >
                                                            {tank.active && (
                                                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/30 rounded-t-lg"></div>
                                                            )}
                                                        </motion.div>
                                                    </div>
                                                    <span className="text-[10px] md:text-xs font-bold mt-2 text-slate-400 uppercase tracking-wider">{tank.label}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="text-right pl-0 md:pl-5 md:ml-5 md:border-l border-white/10">
                                            <p className="font-black text-xs text-emerald-300/80 uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                                                <Zap className="w-3 h-3 text-emerald-400" /> Yield+Oil Room
                                            </p>
                                            <p className="text-3xl font-black text-white mb-3 font-mono">
                                                {loadingCPOSummary ? '...' : <CountUp end={cpoSummary?.yield_oil_room || 0} decimals={2} duration={2} />} %
                                            </p>
                                            <div className="bg-slate-950/40 rounded-lg px-2 py-1.5 text-center min-w-[52px]">
                                                <span className="text-amber-400 font-black text-sm font-mono">{loadingCPOSummary ? '..' : <CountUp end={cpoSummary?.tanks?.oil_room || 0} decimals={2} duration={2} />}</span>
                                                <p className="text-[10px] font-black text-slate-400 uppercase mt-0.5">Oil Room</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* RIGHT COLUMN - 3 cols */}
                        <div className="lg:col-span-3 flex flex-col gap-4">

                            {/* Yield Main */}
                            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-2xl p-6 shadow-xl shadow-indigo-200/50 text-center">
                                <div className="absolute -right-4 -bottom-4 opacity-10">
                                    <Percent className="w-36 h-36" />
                                </div>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm mb-4">
                                        <Zap className="w-4 h-4 text-yellow-300" />
                                        <p className="font-black text-white text-xs uppercase tracking-wider">% YIELD Monthly</p>
                                    </div>
                                    <span className="text-5xl font-black text-white tracking-tighter font-mono pr-2">
                                        {loadingCPOSummary ? (
                                            <span className="animate-pulse text-3xl">...</span>
                                        ) : (
                                            <CountUp end={cpoSummary?.yield_period ?? 0} decimals={2} duration={2.5} />
                                        )}
                                    </span>
                                    {/* <div className="inline-flex items-center gap-1 mt-3 bg-black/20 rounded-lg px-3 py-1">
                                        <ArrowUpRight className="w-3 h-3 text-emerald-200" />
                                        <span className="text-xs font-bold text-emerald-200">+2.1%</span>
                                    </div> */}
                                </div>
                            </motion.div>

                            {/* Cost Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100">
                                    <div className="flex justify-between items-start mb-3">
                                        <p className="font-bold text-slate-500 text-sm">ต้นทุน/เดือน</p>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-rose-600 tracking-tight font-mono">
                                            {loadingCPOSummary || loadingPurchase ? (
                                                <span className="animate-pulse text-xl">...</span>
                                            ) : (
                                                // Formula: (ราคาผลปาล์มเฉลี่ย / %Yield รวมของคาบเวลา *ไม่รวม oil room*) * 100
                                                <CountUp 
                                                    end={cpoSummary?.yield_period_no_oil_room > 0 ? ((purchaseData?.period?.avg_price ?? 0) / cpoSummary.yield_period_no_oil_room) * 100 : 0} 
                                                    decimals={2} 
                                                    duration={2} 
                                                />
                                            )}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">บาท</span>
                                    </div>
                                    {/* <div className="flex items-center gap-1 mt-2 bg-rose-50 px-2 py-1 rounded-md w-max">
                                        <ArrowUpRight className="w-3 h-3 text-rose-500" />
                                        <span className="text-xs font-black text-rose-600">+3.2%</span>
                                    </div> */}
                                </motion.div>

                                <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100">
                                    <p className="font-bold text-slate-500 text-sm mb-3">ต้นทุนปัจจุบัน</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-slate-800 tracking-tight font-mono">
                                            {loadingCPOSummary || loadingPurchase ? (
                                                <span className="animate-pulse text-xl">...</span>
                                            ) : (
                                                // Formula: (ราคาผลปาล์มเฉลี่ยวันนี้ / %Yield วันนี้ *ไม่รวม oil room*) * 100
                                                <CountUp 
                                                    end={cpoSummary?.yield_percent > 0 ? ((purchaseData?.today?.avg_price ?? 0) / cpoSummary.yield_percent) * 100 : 0} 
                                                    decimals={2} 
                                                    duration={2} 
                                                />
                                            )}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">บาท</span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Price Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 shadow-xl shadow-slate-900/20">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <p className="font-bold text-slate-300 text-sm">ราคาเฉลี่ย CPO</p>
                                        {/* <div className="w-9 h-9 rounded-xl bg-slate-700/80 border border-slate-600 flex items-center justify-center">
                                            <BarChart3 className="w-4 h-4 text-blue-400" />
                                        </div> */}
                                    </div>
                                    <div className="flex items-baseline gap-1 relative z-10">
                                                <span className="text-3xl font-black text-white tracking-tight font-mono">
                                                    {loadingSales ? (
                                                        <span className="animate-pulse">...</span>
                                                    ) : (
                                                        <CountUp end={salesData?.cpo?.period?.avg_price || 0} decimals={2} duration={2} />
                                                    )}
                                                </span>
                                        <span className="text-xs font-bold text-slate-400">บาท</span>
                                    </div>
                                    {/* <div className="flex items-center gap-1 mt-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md w-max relative z-10">
                                        <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                                        <span className="text-xs font-black text-emerald-400">+1.8%</span>
                                    </div> */}
                                </motion.div>

                                {/* <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100">
                                    <p className="font-bold text-slate-500 text-sm mb-3 flex items-center gap-2">
                                        ราคารอขาย
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                        </span>
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-indigo-600 tracking-tight font-mono"><CountUp end={38.04} decimals={2} duration={2} /></span>
                                        <span className="text-xs font-bold text-slate-400">บาท</span>
                                    </div>
                                </motion.div> */}
                            </div>
                        </div>

                    </motion.div>
                </div>
            </div>
        </AppLayout>
    );
}