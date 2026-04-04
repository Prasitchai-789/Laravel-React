import { useState, useEffect } from 'react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import Pusher from 'pusher-js';
import Swal from 'sweetalert2';
import { 
    Truck, 
    Factory, 
    Archive, 
    ArrowRight, 
    TrendingUp, 
    AlertTriangle, 
    Timer, 
    ShoppingBag,
    BarChart3,
    ArrowUp,
    ArrowDown,
    Clock,
    Zap,
    Gauge,
    Droplets,
    Leaf,
    Shield,
    Activity,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import CycleTimeMonitor from '@/components/Production/CycleTimeMonitor';
import { 
    LineChart, Line, BarChart, Bar, AreaChart, Area, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

// Enhanced Card Component with Glassmorphism
const GlassCard = ({ children, className = "", delay = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${className}`}
    >
        {children}
    </motion.div>
);

// Card 1: Palm Quantity - Enhanced
const DetailedPalmCard = ({ total, carry, incoming, progress }: { 
    total: number, carry: number, incoming: number, progress: number 
}) => (
    <GlassCard className="col-span-1 md:col-span-2 xl:col-span-3 overflow-hidden relative" delay={0.1}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-blue-500/10 rounded-full blur-2xl"></div>
        <div className="p-6 pb-4 relative">
            <div className="mb-2">
                <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center float-end"
                >
                    <span className="text-sm text-slate-500 font-medium">{progress}%</span>
                    {progress > 70 ? 
                        <ArrowUp className="w-4 h-4 text-emerald-500 ml-1 animate-bounce" /> : 
                        <ArrowDown className="w-4 h-4 text-rose-500 ml-1 animate-pulse" />
                    }
                </motion.span>
                <h5 className="truncate text-slate-700 font-bold font-prompt text-base flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    ปริมาณผลปาล์ม
                </h5>
            </div>
            <div className="mb-3 text-center">
                <h2 className="text-4xl font-bold text-slate-800">
                    <CountUp key={total} end={total} duration={2.5} separator="," /> <span className="text-base font-normal text-slate-500">kg.</span>
                </h2>
            </div>
            <div className="flex items-center justify-between mb-4">
                <div className="mx-6 text-center flex-1">
                    <p className="text-2xl font-bold text-slate-800 font-anuphan">{carry.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 font-anuphan">ยอดยกมา</p>
                </div>
                <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>
                <div className="mx-6 text-center flex-1">
                    <p className="text-2xl font-bold text-slate-800 font-anuphan">{incoming.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 font-anuphan">ผลปาล์มรับเข้า</p>
                </div>
            </div>
            <div className="relative">
                <div className="flex w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className={`flex flex-col justify-center overflow-hidden rounded-full transition-all ${
                            progress > 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-rose-400 to-rose-600'
                        }`}
                    />
                </div>
            </div>
        </div>
    </GlassCard>
);

// Card 2: Remaining Stock - Enhanced
const RemainingStockCard = ({ value, progress }: { value: number, progress: number }) => (
    <GlassCard className="col-span-1 md:col-span-2 xl:col-span-2 relative overflow-hidden" delay={0.15}>
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent"></div>
        <div className="p-6 relative">
            <div className="mb-8 flex justify-between items-start">
                <h5 className="truncate text-slate-700 font-bold font-prompt text-base flex items-center gap-2">
                    <Archive className="w-4 h-4 text-rose-600" />
                    ปริมาณผลปาล์มคงเหลือ
                </h5>
                <motion.span 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="px-3 py-1 text-[10px] font-bold rounded-full text-emerald-600 bg-emerald-100 uppercase tracking-widest shadow-sm"
                >
                    Daily
                </motion.span>
            </div>
            <div className="flex items-center justify-between mb-11">
                <h2 className="text-4xl font-bold text-slate-800">
                    <CountUp key={value} end={value} duration={2} separator="," /> <span className="text-base font-normal text-slate-500">kg.</span>
                </h2>
            </div>
            <div className="relative">
                <div className="flex w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="flex flex-col justify-center overflow-hidden rounded-full bg-gradient-to-r from-rose-400 to-rose-600"
                    />
                </div>
            </div>
        </div>
    </GlassCard>
);

// Card 3: Basket Count - Enhanced
const BasketCountCard = ({ total, start, hours, progress }: { total: number, start: string, hours: string, progress: number }) => (
    <GlassCard className="col-span-1 md:col-span-2 xl:col-span-2 relative overflow-hidden" delay={0.2}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl"></div>
        <div className="p-6 pb-4 relative">
            <div className="mb-1">
                <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center float-end"
                >
                    <span className="text-sm text-slate-500 font-medium">{progress}%</span>
                    {progress > 70 ? 
                        <ArrowUp className="w-4 h-4 text-emerald-500 ml-1 animate-bounce" /> : 
                        <ArrowDown className="w-4 h-4 text-rose-500 ml-1 animate-pulse" />
                    }
                </motion.span>
                <h5 className="truncate text-slate-700 font-bold font-prompt text-base flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    จำนวนกะบะ
                </h5>
            </div>
            <div className="mb-3 text-center">
                <h2 className="text-4xl font-bold text-slate-800">
                    <CountUp key={total} end={total} duration={2} separator="," /> <span className="text-base font-normal text-slate-500">กะบะ</span>
                </h2>
            </div>
            <div className="flex items-center justify-between mb-4">
                <div className="mx-6 text-center flex-1">
                    <p className="text-2xl font-bold text-slate-800 font-anuphan">{start} น.</p>
                    <p className="text-xs text-slate-500 font-anuphan">เริ่มงาน</p>
                </div>
                <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>
                <div className="mx-6 text-center flex-1">
                    <p className="text-2xl font-bold text-slate-800 font-anuphan">{hours}</p>
                    <p className="text-xs text-slate-500 font-anuphan">ชั่วโมงการผลิต</p>
                </div>
            </div>
            <div className="relative">
                <div className="flex w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="flex flex-col justify-center overflow-hidden rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                    />
                </div>
            </div>
        </div>
    </GlassCard>
);

// Card 4: Production Quantity - Enhanced
const ProductionDetailedCard = ({ total, avg, yieldVal, progress }: { total: number, avg: number, yieldVal: number, progress: number }) => (
    <GlassCard className="col-span-1 md:col-span-2 xl:col-span-3 overflow-hidden relative" delay={0.25}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"></div>
        <div className="p-6 pb-4 relative">
            <div className="mb-1">
                <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center float-end"
                >
                    <span className="text-sm text-slate-500 font-medium">{progress.toFixed(0)}%</span>
                    {progress > 70 ? 
                        <ArrowUp className="w-4 h-4 text-emerald-500 ml-1 animate-bounce" /> : 
                        <ArrowDown className="w-4 h-4 text-rose-500 ml-1 animate-pulse" />
                    }
                </motion.span>
                <h5 className="truncate text-slate-700 font-bold font-prompt text-base flex items-center gap-2">
                    <Factory className="w-4 h-4 text-blue-600" />
                    ปริมาณการผลิต
                </h5>
            </div>
            <div className="mb-3 text-center">
                <h2 className="text-4xl font-bold text-blue-700">
                    <CountUp key={total} end={total} duration={2.5} separator="," /> <span className="text-base font-normal text-slate-500">kg.</span>
                </h2>
            </div>
            <div className="flex items-center justify-between mb-4">
                <div className="mx-6 text-center flex-1">
                    <p className="text-2xl font-bold text-blue-600 font-anuphan">{avg.toFixed(2)}</p>
                    <p className="text-xs text-slate-500 font-anuphan">ตัน / กะบะ</p>
                </div>
                <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>
                <div className="mx-6 text-center flex-1">
                    <p className="text-2xl font-bold text-rose-600 font-anuphan">{yieldVal.toFixed(2)}%</p>
                    <p className="text-xs text-slate-500 font-anuphan">Yield</p>
                </div>
            </div>
            <div className="relative">
                <div className="flex w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="flex flex-col justify-center overflow-hidden rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    />
                </div>
            </div>
        </div>
    </GlassCard>
);

export default function ProductionDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [cycleTimeData, setCycleTimeData] = useState<any>(null);
    const [cycleTimeLoading, setCycleTimeLoading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, cycleRes] = await Promise.all([
                axios.get('/api/dashboard/production'),
                axios.get('/api/dashboard/cycle-time')
            ]);
            
            setData(prodRes.data);
            setCycleTimeData(cycleRes.data.data);
            setLastUpdate(new Date());

            // Handle Real-time Alerts
            const latest = cycleRes.data.data.kpis;
            if (latest.latest_status === 'DOWNTIME') {
                Swal.fire({
                    icon: 'error',
                    title: 'ตรวจพบเครื่องหยุดทำงาน!',
                    text: `การผลิตหยุดนิ่งเป็นเวลา ${latest.latest_diff} วินาที`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 5000
                });
            } else if (latest.latest_status === 'SLOW') {
                Swal.fire({
                    icon: 'warning',
                    title: 'ระบบทำงานช้าลง',
                    text: `รอบปัจจุบันใช้เวลา: ${latest.latest_diff} วินาที`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
        } catch (e) {
            console.error('Error fetching production data', e);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถโหลดข้อมูลได้',
                toast: true,
                timer: 3000,
                showConfirmButton: false
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Pusher Real-time Listener
    useEffect(() => {
        const pusher = new Pusher('5e2e0382066d67e433a6', {
            cluster: 'ap1'
        });

        const channel = pusher.subscribe('notificationPickup');
        
        channel.bind('form-submit', (data: any) => {
            fetchData(); // Refresh immediately
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: data.title || 'อัปเดตข้อมูลการผลิตแล้ว',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                customClass: {
                    title: "font-anuphan text-sm"
                },
            });
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe('notificationPickup');
        };
    }, []);

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
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
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
                        
                        {/* Animated Header */}
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
                                <button 
                                    onClick={fetchData}
                                    className="ml-2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4 text-slate-500" />
                                </button>
                            </motion.div>
                        </motion.div>

                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-6">
                            <DetailedPalmCard 
                                total={data.total_palm_kg} 
                                carry={data.carry} 
                                incoming={data.incoming} 
                                progress={data.progress_palm} 
                            />
                            <RemainingStockCard 
                                value={data.remaining_stock_kg} 
                                progress={data.progress_stock} 
                            />
                            <BasketCountCard 
                                total={data.basket} 
                                start={data.start_time} 
                                hours={data.working_hours} 
                                progress={data.progress_basket} 
                            />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-7 gap-6">
                            <ProductionDetailedCard 
                                total={data.production_kg} 
                                avg={data.avg_pickup} 
                                yieldVal={data.yield} 
                                progress={data.progress_palm}
                            />
                            
                            {/* Enhanced Production Summary */}
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
                                            { label: 'Capacity Usage', value: '94%', icon: Zap, color: 'amber' },
                                            { label: 'Process Status', value: 'Active', icon: Shield, color: 'emerald' }
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

                        {/* Cycle Time Analysis Section */}
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
                            <CycleTimeMonitor data={cycleTimeData} loading={cycleTimeLoading} />
                        </motion.div>

                        {/* Enhanced Flow Diagram */}
                        <GlassCard className="overflow-hidden" delay={0.35}>
                            <div className="p-8">
                                <div className="flex items-center gap-2 mb-8">
                                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                                        <BarChart3 className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800">Production Flow Visualization</h2>
                                </div>
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
                                    <FlowStep label="Existing Stock" value={data.carry} color="blue" icon={<Archive />} />
                                    <FlowArrow />
                                    <FlowStep label="New Harvest" value={data.incoming} color="indigo" icon={<Truck />} />
                                    <FlowArrow />
                                    <FlowStep label="Processed" value={data.production_kg ? data.production_kg / 1000 : 0} color="emerald" icon={<Factory />} />
                                    <FlowArrow />
                                    <FlowStep label="Current Stock" value={data.stock} color={data.stock < 50 ? 'rose' : 'slate'} icon={<Archive />} highlight={data.stock < 50} />
                                </div>
                            </div>
                        </GlassCard>

                        {/* Enhanced Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Palm vs Production Trend */}
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
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                                <Tooltip 
                                                    contentStyle={{
                                                        borderRadius: '16px',
                                                        border: 'none',
                                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                                        background: 'rgba(255, 255, 255, 0.95)',
                                                        backdropFilter: 'blur(8px)'
                                                    }}
                                                />
                                                <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="palm" 
                                                    name="Incoming Palm" 
                                                    stroke="#6366f1" 
                                                    strokeWidth={3} 
                                                    dot={{r: 4, strokeWidth: 2, fill: '#fff', stroke: '#6366f1'}} 
                                                    activeDot={{r: 8, stroke: '#6366f1', strokeWidth: 2}}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="production" 
                                                    name="FFB Production" 
                                                    stroke="#10b981" 
                                                    strokeWidth={3} 
                                                    dot={{r: 4, strokeWidth: 2, fill: '#fff', stroke: '#10b981'}} 
                                                    activeDot={{r: 8, stroke: '#10b981', strokeWidth: 2}}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* Yield % Trend */}
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
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[15, 'auto']} />
                                                <Tooltip 
                                                    contentStyle={{
                                                        borderRadius: '16px',
                                                        border: 'none',
                                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                                        background: 'rgba(255, 255, 255, 0.95)',
                                                        backdropFilter: 'blur(8px)'
                                                    }}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="yield" 
                                                    name="Yield %" 
                                                    stroke="#8b5cf6" 
                                                    strokeWidth={3} 
                                                    fillOpacity={1} 
                                                    fill="url(#colorYield)" 
                                                />
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

function FlowStep({ label, value, color, icon, highlight }: any) {
    const colorClasses: any = {
        blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700',
        indigo: 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700',
        emerald: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700',
        rose: 'border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100 text-rose-700',
        slate: 'border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700',
    };
    
    const displayValue = typeof value === 'number' ? value.toLocaleString() : '0';
    
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-3 group"
        >
            <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-24 h-24 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${colorClasses[color]} ${highlight ? 'ring-4 ring-rose-300 animate-pulse' : ''}`}
            >
                {icon}
            </motion.div>
            <div className="text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
                <p className="text-xl font-black text-slate-800">
                    <CountUp key={value} end={typeof value === 'number' ? value : 0} duration={1.5} decimals={value % 1 !== 0 ? 2 : 0} separator="," /> <span className="text-[10px]">T</span>
                </p>
            </div>
        </motion.div>
    );
}

function FlowArrow() {
    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="hidden md:flex flex-col items-center"
        >
            <ChevronRight className="w-8 h-8 text-slate-300 group-hover:text-slate-400 transition-colors" />
        </motion.div>
    );
}