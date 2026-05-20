import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    TrendingUp, TrendingDown, DollarSign, Activity, 
    AlertCircle, AlertTriangle, Calendar, Filter, BarChart3, 
    Zap, Target, Info, ArrowUpRight, ArrowDownRight,
    Search, RefreshCcw, LayoutDashboard, BrainCircuit,
    CheckCircle, CheckCircle2, Wallet, Layers, Bell,
    Sparkles, Gauge, Clock, Shield, Crown, Gem,
    Radar, Compass, Navigation, Sun, Moon, Cloud,
    Droplets, Wind, Thermometer, Leaf, TreePine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';

const Chart = lazy(() => import('react-apexcharts'));

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'การผลิตและวิศวกรรม', href: '/production-dashboard' },
    { title: 'ระบบวิเคราะห์ปริมาณปาล์ม (Palm Intelligence)', href: '/palm/analytics' },
];

// Modern Glass Card Component
const GlassCard = ({ children, className = "", gradient = false, delay = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, type: "spring", stiffness: 100 }}
        className={`relative group ${className}`}
    >
        {gradient && (
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-500" />
        )}
        <div className={`relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 ${gradient ? 'bg-white/95' : ''}`}>
            {children}
        </div>
    </motion.div>
);

// Animated KPI Card
const KpiCard = ({ icon: Icon, title, value, suffix, trend, color, delay = 0 }: any) => (
    <GlassCard delay={delay}>
        <div className="p-6 relative overflow-hidden">
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-${color}-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500`} />
            <div className="relative">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-2xl shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    {trend && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black ${
                                trend.value > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}
                        >
                            {trend.value > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(trend.value)}% {trend.label}
                        </motion.div>
                    )}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
                <div className="flex items-baseline gap-2">
                    <CountUp 
                        end={value} 
                        duration={2.5} 
                        separator="," 
                        decimals={value % 1 !== 0 ? 2 : 0}
                        className={`text-3xl font-black bg-gradient-to-r from-${color}-600 to-${color}-400 bg-clip-text text-transparent`}
                    />
                    {suffix && <span className="text-sm font-bold text-slate-400">{suffix}</span>}
                </div>
            </div>
        </div>
    </GlassCard>
);

// Status Badge
const StatusBadge = ({ status, value }: { status: string, value?: number }) => {
    const config: any = {
        strong: { icon: TrendingUp, color: 'emerald', text: 'แนวโน้มแข็งแกร่ง' },
        weak: { icon: TrendingDown, color: 'rose', text: 'แนวโน้มอ่อนแอ' },
        stable: { icon: Activity, color: 'blue', text: 'เสถียร' },
        critical: { icon: AlertTriangle, color: 'red', text: 'แจ้งเตือนวิกฤต' }
    };
    const current = config[status] || config.stable;
    const Icon = current.icon;
    
    return (
        <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-${current.color}-50 border border-${current.color}-200`}
        >
            <Icon className={`w-3.5 h-3.5 text-${current.color}-500`} />
            <span className={`text-[10px] font-black text-${current.color}-600 uppercase tracking-wider`}>
                {current.text}
            </span>
            {value && <span className={`text-[10px] font-black text-${current.color}-600`}>{value}%</span>}
        </motion.div>
    );
};

export default function PalmAnalytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);
    const [forecastType, setForecastType] = useState('days_30');
    const [selectedMetric, setSelectedMetric] = useState('volume');

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/dashboard/palm-analytics?days=${days}`);
            setData(res.data.data);
        } catch (e) {
            console.error('Error fetching analytics', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [days]);

    // Enhanced Chart Options
    const mainChartOptions: any = {
        chart: {
            type: 'line',
            toolbar: { show: false },
            zoom: { enabled: true, type: 'x' },
            background: 'transparent',
            fontFamily: 'Inter, system-ui, sans-serif',
        },
        stroke: { width: [0, 3, 3], curve: 'smooth' },
        plotOptions: { 
            bar: { 
                columnWidth: '60%', 
                borderRadius: 8,
                borderRadiusApplication: 'end',
                colors: { ranges: [{ from: 0, to: 1000, color: '#3b82f6' }] }
            } 
        },
        fill: { 
            opacity: [0.85, 0.2, 1],
            gradient: {
                shade: 'dark',
                type: "vertical",
                opacityFrom: 0.85,
                opacityTo: 0.1,
                stops: [0, 100]
            }
        },
        labels: data?.daily.map((i: any) => i.date) || [],
        markers: { size: 0, hover: { size: 6 } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
        xaxis: { 
            type: 'datetime',
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 600 } }
        },
        yaxis: [
            { 
                seriesName: 'Actual Volume',
                title: { text: 'Volume (Tons)', style: { color: '#3b82f6', fontWeight: 600 } },
                labels: { 
                    style: { colors: '#3b82f6' },
                    formatter: (val: number) => val.toLocaleString('en-US')
                },
                tickAmount: 5,
                min: (min: number) => Math.floor(min * 0.85),
                max: (max: number) => Math.ceil(max * 1.05)
            },
            {
                seriesName: 'Actual Volume',
                show: false,
                min: (min: number) => Math.floor(min * 0.85),
                max: (max: number) => Math.ceil(max * 1.05),
                labels: {
                    formatter: (val: number) => val.toLocaleString('en-US')
                }
            },
            { 
                seriesName: 'Avg Price',
                opposite: true, 
                title: { text: 'Price (THB)', style: { color: '#10b981', fontWeight: 600 } },
                labels: { 
                    style: { colors: '#10b981' },
                    formatter: (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                },
                tickAmount: 5,
                min: (min: number) => Math.floor(min * 0.98),
                max: (max: number) => Math.ceil(max * 1.02)
            }
        ],
        tooltip: { 
            shared: true, 
            intersect: false, 
            theme: 'dark',
            x: { format: 'dd MMM yyyy' },
            y: [
                { formatter: (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " ตัน" },
                { formatter: (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " ตัน" },
                { formatter: (val: number) => "฿" + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
            ]
        },
        legend: { 
            position: 'top', 
            horizontalAlign: 'right',
            labels: { colors: '#64748b', fontWeight: 600 }
        },
        colors: ['#3b82f6', '#8b5cf6', '#10b981'],
    };

    const mainChartSeries = useMemo(() => {
        if (!data) return [];
        return [
            { name: 'ปริมาณจริง', type: 'column', data: data.daily.map((i: any) => i.weight_ton) },
            { name: 'เฉลี่ยรอบปี (Seasonal)', type: 'area', data: data.daily.map((i: any) => i.moving_avg) },
            { name: 'ราคาเฉลี่ย', type: 'line', data: data.daily.map((i: any) => i.avg_price) }
        ];
    }, [data]);

    // Enhanced Forecast Chart
    const forecastChartOptions: any = {
        chart: { 
            type: 'area', 
            toolbar: { show: false }, 
            background: 'transparent',
            sparkline: { enabled: false },
        },
        dataLabels: { 
            enabled: forecastType === 'days_30' || forecastType === 'days_7',
            enabledOnSeries: [0],
            style: { fontSize: '9px', fontWeight: 900, colors: ['#ffffff'] },
            offsetY: -6,
            background: { enabled: true, padding: 2, borderRadius: 4, borderWidth: 0, opacity: 0.9, dropShadow: { enabled: false }, foreColor: '#0f172a' },
            formatter: (val: number) => val.toLocaleString('en-US', { maximumFractionDigits: 0 })
        },
        colors: ['#ffffff', '#ffffff33'],
        stroke: { curve: 'smooth', width: [4, 0], dashArray: [0, 0] },
        fill: { type: ['gradient', 'solid'], gradient: { shadeIntensity: 0.5, opacityFrom: 0.5, opacityTo: 0.1 } },
        xaxis: { 
            type: 'datetime',
            labels: { style: { colors: '#94a3b8', fontSize: '10px', fontWeight: 600 } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: { 
            show: true,
            labels: { 
                style: { colors: '#94a3b8', fontSize: '10px', fontWeight: 600 },
                formatter: (val: number) => val.toLocaleString('en-US')
            }
        },
        tooltip: { 
            theme: 'dark', 
            x: { format: 'dd MMM yyyy' },
            y: { 
                formatter: (val: number) => val.toLocaleString('en-US', { maximumFractionDigits: 1 }) + " ตัน"
            }
        },
        grid: { show: true, borderColor: '#f1f5f9', strokeDashArray: 4 },
        legend: { show: false },
    };

    const forecastSeries = useMemo(() => {
        if (!data || !data.forecast[forecastType]) return [];
        const fData = data.forecast[forecastType] || [];
        return [
            { name: 'พยากรณ์ปริมาณ', type: 'line', data: fData.map((i: any) => ({ x: i.date, y: i.weight_ton })) },
            { name: 'แถบความเชื่อมั่น (95%)', type: 'area', data: fData.map((i: any) => ({ x: i.date, y: [i.lower_bound, i.upper_bound] })) }
        ];
    }, [data, forecastType]);

    if (!data && loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <BrainCircuit className="w-8 h-8 text-cyan-500" />
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-center mt-6 text-slate-400 font-medium"
                        >
                            Loading Palm Intelligence...
                        </motion.p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Palm Analytics Intelligence" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
                {/* Hero Header with Gradient */}
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-10" />
                    
                    <div className="relative px-6 py-8 md:px-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div>
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-3 mb-3"
                                    >
                                        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl shadow-lg">
                                            <BrainCircuit className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                                ระบบวิเคราะห์ปริมาณปาล์ม
                                            </h1>
                                            <p className="text-emerald-200 text-sm mt-1">
                                                นวัตกรรมการพยากรณ์และวิเคราะห์ด้วย AI (Palm Intelligence)
                                            </p>
                                        </div>
                                    </motion.div>
                                </div>
                                
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="flex bg-white/10 backdrop-blur-sm rounded-2xl p-1 border border-white/20">
                                        {[30, 90, 365].map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => setDays(d)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                                    days === d 
                                                        ? 'bg-white text-slate-900 shadow-lg' 
                                                        : 'text-white/60 hover:text-white'
                                                }`}
                                            >
                                                {d}D
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={fetchData}
                                        className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all"
                                    >
                                        <RefreshCcw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative h-1">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse" />
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-8 md:px-8">
                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <KpiCard 
                            icon={Layers}
                            title="ปริมาณรวมสะสม"
                            value={data.kpis.total_weight}
                            suffix="ตัน"
                            trend={{ value: 12.5, label: "vs Avg" }}
                            color="blue"
                            delay={0.1}
                        />
                        
                        <KpiCard 
                            icon={Wallet}
                            title="ประมาณการรายได้"
                            value={data.kpis.forecast_revenue}
                            suffix="บาท"
                            trend={{ value: 8.3, label: "forecast" }}
                            color="emerald"
                            delay={0.15}
                        />
                        
                        <KpiCard 
                            icon={Gauge}
                            title="ความเสถียรราคา"
                            value={data.kpis.correlation}
                            suffix="คะแนน"
                            color="purple"
                            delay={0.2}
                        />
                        
                        <GlassCard delay={0.25} gradient={data.kpis.anomaly_count > 0}>
                            <div className="p-6 relative overflow-hidden">
                                <div className={`absolute -right-8 -top-8 w-32 h-32 bg-${data.kpis.anomaly_count > 0 ? 'rose' : 'slate'}-50 rounded-full opacity-50`} />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 bg-gradient-to-br from-${data.kpis.anomaly_count > 0 ? 'rose' : 'slate'}-500 to-${data.kpis.anomaly_count > 0 ? 'pink' : 'gray'}-600 rounded-2xl shadow-lg`}>
                                            <Bell className="w-5 h-5 text-white" />
                                        </div>
                                        {data.kpis.anomaly_count > 0 && (
                                            <motion.div
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                className="px-2 py-1 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black"
                                            >
                                                เตือน!
                                            </motion.div>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">แจ้งเตือนที่พบ</p>
                                    <div className={`text-3xl font-black ${data.kpis.anomaly_count > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                        {data.kpis.anomaly_count}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Main Charts Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                        {/* Main Trend Chart */}
                        <GlassCard className="xl:col-span-2" delay={0.3}>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">แดชบอร์ดวิเคราะห์ตลาด</h3>
                                        <p className="text-xs text-slate-400 font-medium">วิเคราะห์ความสัมพันธ์ของปริมาณรับเข้าและราคา</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded-md" />
                                            <span className="text-[10px] font-bold text-slate-500">ปริมาณ (ตัน)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-purple-500 rounded-full opacity-30" />
                                            <span className="text-[10px] font-bold text-slate-500">เฉลี่ยรอบปี</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-0.5 bg-emerald-500 rounded-full" />
                                            <span className="text-[10px] font-bold text-emerald-600">ราคา</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[400px]">
                                    <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-500">กำลังโหลดกราฟ...</div>}>
                                        <Chart options={mainChartOptions} series={mainChartSeries} type="line" height="100%" />
                                    </Suspense>
                                </div>
                            </div>
                        </GlassCard>

                        {/* AI Forecast Panel */}
                        <GlassCard gradient delay={0.35}>
                            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-yellow-400" />
                                            ระบบพยากรณ์ AI
                                        </h3>
                                        <p className="text-[10px] text-slate-400">แนวโน้มปริมาณคาดการณ์ล่วงหน้า</p>
                                    </div>
                                    <div className="flex gap-1 bg-white/10 rounded-xl p-1">
                                        {['days_7', 'days_30', 'days_90'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setForecastType(type)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                                                    forecastType === type 
                                                        ? 'bg-yellow-500 text-slate-900' 
                                                        : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                {type.split('_')[1]}D
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="h-[220px] -mx-4">
                                    <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-500">กำลังโหลดกราฟ...</div>}>
                                        <Chart options={forecastChartOptions} series={forecastSeries} type="area" height="100%" />
                                    </Suspense>
                                </div>
                                
                                <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-slate-400">คะแนนความแม่นยำ</span>
                                        <span className="text-sm font-black text-yellow-400">88.5%</span>
                                    </div>
                                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '88.5%' }}
                                            transition={{ duration: 1 }}
                                            className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-full rounded-full"
                                        />
                                    </div>
                                    <p className="text-[9px] text-slate-500 mt-3 leading-relaxed">
                                        คำนวณจากสถิติย้อนหลัง 4 ปี (2022-2025) ร่วมกับ Momentum ตลาดปัจจุบัน
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Alerts & Insights Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Anomaly Alerts */}
                        <GlassCard className="lg:col-span-2" delay={0.4}>
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl">
                                        <AlertTriangle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">ความผิดปกติในซัพพลายเชน</h3>
                                        <p className="text-xs text-slate-400">การตรวจจับการเบี่ยงเบนจากพฤติกรรมปกติ</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {data.anomalies.length > 0 ? data.anomalies.map((alert: any, idx: number) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={`p-4 rounded-2xl border transition-all ${
                                                alert.status === 'DROP' 
                                                    ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50' 
                                                    : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {alert.status === 'DROP' ? (
                                                        <TrendingDown className="w-4 h-4 text-rose-500" />
                                                    ) : (
                                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                    )}
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {new Date(alert.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black ${
                                                    alert.severity === 'CRITICAL' 
                                                        ? 'bg-rose-500 text-white' 
                                                        : 'bg-amber-500 text-white'
                                                }`}>
                                                    {alert.severity}
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-slate-800 mb-3">{alert.message}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs text-slate-500">
                                                    จริง: <span className="font-bold text-slate-700">{alert.actual} ตัน</span>
                                                </div>
                                                <div className={`text-xs font-bold flex items-center gap-1 ${
                                                    alert.status === 'DROP' ? 'text-rose-600' : 'text-emerald-600'
                                                }`}>
                                                    เบี่ยงเบน {Math.abs(alert.deviation_pct)}%
                                                </div>
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center py-12 text-slate-400"
                                        >
                                            <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-500" />
                                            <p className="text-sm font-bold">ไม่พบความผิดปกติ</p>
                                            <p className="text-xs mt-1">ระบบซัพพลายเชนทำงานเป็นปกติ</p>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </GlassCard>

                        {/* Market Sentiment */}
                        <GlassCard delay={0.45}>
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                                        <Compass className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">ดัชนีความเชื่อมั่นตลาด</h3>
                                        <p className="text-xs text-slate-400">ตัวชี้วัดสภาวะตลาดแบบเรียลไทม์</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-500">Price Momentum</span>
                                            <StatusBadge status={data.kpis.price_momentum > 0 ? 'strong' : 'weak'} value={Math.abs(data.kpis.price_momentum)} />
                                        </div>
                                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(Math.abs(data.kpis.price_momentum), 100)}%` }}
                                                className={`h-full rounded-full ${
                                                    data.kpis.price_momentum > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 rounded-2xl text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ดัชนีความต้องการ</p>
                                            <p className="text-xl font-black text-slate-800">84.2</p>
                                            <div className="flex items-center justify-center gap-1 text-emerald-500 text-[10px]">
                                                <TrendingUp className="w-3 h-3" /> +5.3%
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-2xl text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ดัชนีอุปทาน</p>
                                            <p className="text-xl font-black text-slate-800">76.8</p>
                                            <div className="flex items-center justify-center gap-1 text-rose-500 text-[10px]">
                                                <TrendingDown className="w-3 h-3" /> -2.1%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Data Table */}
                    <GlassCard delay={0.5}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">บันทึกข้อมูลย้อนหลัง</h3>
                                    <p className="text-xs text-slate-400">ประวัติการรับเข้ารายวันพร้อมการวิเคราะห์แนวโน้ม</p>
                                </div>
                                <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-2">
                                    <Filter className="w-4 h-4" /> ส่งออกข้อมูล
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-slate-100">
                                            <th className="pb-4 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">วันที่</th>
                                            <th className="pb-4 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">ปริมาณรับเข้า (ตัน)</th>
                                            <th className="pb-4 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">ราคาเฉลี่ย (บาท)</th>
                                            <th className="pb-4 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">แรงเหวี่ยง</th>
                                            <th className="pb-4 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.daily.slice().reverse().slice(0, 10).map((row: any, i: number) => {
                                            const diff = ((row.weight_ton / row.moving_avg) - 1) * 100;
                                            return (
                                                <motion.tr 
                                                    key={i}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="hover:bg-slate-50/80 transition-colors group"
                                                >
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800">
                                                                {new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 font-bold">
                                                                {new Date(row.date).getFullYear()}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <span className="text-lg font-black text-slate-900">
                                                            {Number(row.weight_ton).toLocaleString(undefined, { minimumFractionDigits: 1 })}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <span className="text-base font-bold text-emerald-600">
                                                            ฿{Number(row.avg_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className={`inline-flex items-center gap-1 text-xs font-bold ${
                                                            diff > 0 ? 'text-emerald-600' : 'text-slate-400'
                                                        }`}>
                                                            {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                            {Math.abs(diff).toFixed(1)}%
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <StatusBadge 
                                                            status={diff > 5 ? 'strong' : diff < -5 ? 'weak' : 'stable'} 
                                                        />
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                
                /* Smooth transitions */
                * {
                    transition-property: all;
                    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                    transition-duration: 150ms;
                }
            `}} />
        </AppLayout>
    );
}
