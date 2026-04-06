import AppLayout from '@/layouts/app-layout';
import { motion } from 'framer-motion';
import {
    Factory,
    Clock,
    TrendingUp,
    Droplets,
    Activity,
    Zap,
    Shield,
    Gauge,
    RefreshCw,
} from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import CycleTimeMonitor from '@/components/Production/CycleTimeMonitor';
import {
    GlassCard,
    DetailedPalmCard,
    RemainingStockCard,
    BasketCountCard,
    ProductionDetailedCard,
} from '@/components/Production/ProductionKPICards';
import ProductionFlowDiagram from '@/components/Production/ProductionFlowDiagram';
import { useProductionDashboard } from '@/hooks/useProductionDashboard';

const tooltipStyle = {
    borderRadius: '16px',
    border: 'none',
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
};

export default function ProductionDashboard() {
    const { data, cycleTimeData, loading, lastUpdate, refresh } = useProductionDashboard();

    if (loading || !data) {
        return (
            <AppLayout breadcrumbs={[{ title: 'Production Dashboard', href: '#' }]}>
                <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <Factory className="w-8 h-8 text-blue-600" />
                            </motion.div>
                        </div>
                        <p className="text-slate-600 font-medium text-lg">กำลังโหลดข้อมูลการผลิต...</p>
                        <p className="text-slate-400 text-sm">Palm Oil Processing Intelligence</p>
                    </motion.div>
                </div>
            </AppLayout>
        );
    }

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Production Monitoring', href: '#' },
    ];

    const chartData = data.trend.dates.map((date: string, i: number) => ({
        date: new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        palm: data.trend.palm_input[i],
        production: data.trend.production[i],
        yield: data.trend.yield[i],
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
                <div className="p-6 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                            <div>
                                <motion.h1
                                    initial={{ x: -20 }}
                                    animate={{ x: 0 }}
                                    className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent flex items-center gap-3"
                                >
                                    <Factory className="w-10 h-10 text-blue-600" />
                                    Production Intelligence
                                </motion.h1>
                                <motion.p
                                    initial={{ x: -20 }}
                                    animate={{ x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-slate-500 mt-2 text-lg"
                                >
                                    Real-time monitoring & analytics for palm oil processing
                                </motion.p>
                            </div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="flex items-center gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-white/50"
                            >
                                <div className="relative">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute"></div>
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full relative"></div>
                                </div>
                                <span className="text-sm font-bold text-slate-700">LIVE MONITORING</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {lastUpdate.toLocaleTimeString('th-TH')}
                                </span>
                                <button onClick={refresh} className="ml-2 p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                    <RefreshCw className="w-4 h-4 text-slate-500" />
                                </button>
                            </motion.div>
                        </motion.div>

                        {/* KPI Cards Row 1 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-6">
                            <DetailedPalmCard total={data.total_palm_kg} carry={data.carry} incoming={data.incoming} progress={data.progress_palm} />
                            <RemainingStockCard value={data.remaining_stock_kg} progress={data.progress_stock} />
                            <BasketCountCard total={data.basket} start={data.start_time} hours={data.working_hours} progress={data.progress_basket} />
                        </div>

                        {/* KPI Cards Row 2 + Analytics */}
                        <div className="grid grid-cols-1 xl:grid-cols-7 gap-6">
                            <ProductionDetailedCard total={data.production_kg} avg={data.avg_pickup} yieldVal={data.yield} progress={data.progress_palm} />

                            <GlassCard className="xl:col-span-4 relative overflow-hidden" delay={0.3}>
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-blue-50/30"></div>
                                <div className="p-6 relative">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                            <Gauge className="w-5 h-5 text-white" />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-800">Production Analytics</h2>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Yield Status', value: data.yield < 18 ? 'Below Target' : 'Optimal', icon: Activity, color: data.yield < 18 ? 'rose' : 'emerald' },
                                            { label: 'Avg Yield', value: `${data.yield}%`, icon: TrendingUp, color: 'indigo' },
                                            { label: 'Performance', value: `${data.plant_oee ?? 0}%`, icon: Zap, color: 'emerald' },
                                            { label: 'System Status', value: 'Active', icon: Shield, color: 'emerald' },
                                        ].map((item, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 + idx * 0.1 }}
                                                className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 hover:shadow-md transition-all"
                                            >
                                                <item.icon className={`w-5 h-5 text-${item.color}-500 mb-2`} />
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                                                <p className={`text-xl font-black text-${item.color}-600 mt-1`}>{item.value}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Cycle Time */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-lg">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800">ประสิทธิภาพการทำงาน</h2>
                            </div>
                            <CycleTimeMonitor data={cycleTimeData} loading={loading} />
                        </motion.div>

                        {/* Flow Diagram */}
                        <ProductionFlowDiagram
                            carry={data.carry}
                            incoming={data.incoming}
                            productionKg={data.production_kg}
                            stock={data.stock}
                        />

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <GlassCard className="overflow-hidden" delay={0.4}>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                        Palm Input vs Production Trend
                                    </h3>
                                    <div className="h-[320px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                                <Line type="monotone" dataKey="palm" name="Incoming Palm" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#6366f1' }} activeDot={{ r: 8, stroke: '#6366f1', strokeWidth: 2 }} />
                                                <Line type="monotone" dataKey="production" name="FFB Production" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#10b981' }} activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard className="overflow-hidden" delay={0.45}>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <Droplets className="w-5 h-5 text-purple-600" />
                                        Extraction Yield Trend
                                    </h3>
                                    <div className="h-[320px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[15, 'auto']} />
                                                <ReferenceLine y={18} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Yield Target (18%)', fill: '#ef4444', fontSize: 12, fontWeight: 'bold' }} />
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Area type="monotone" dataKey="yield" name="Yield %" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorYield)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}