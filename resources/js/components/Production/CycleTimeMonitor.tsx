import { useState, useEffect, useMemo } from 'react';
import { 
    AreaChart, Area, LineChart, Line, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
    Timer, AlertCircle, TrendingUp, Zap, 
    Clock, Activity, Gauge, AlertTriangle, 
    Info, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';

const StatusBadge = ({ status }: { status: string }) => {
    const configs: any = {
        'NORMAL': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'ปกติ' },
        'SLOW': { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle, label: 'ช้ากว่าปกติ' },
        'DOWNTIME': { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertCircle, label: 'เครื่องหยุด / ขัดข้อง' },
        'OFFLINE': { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Clock, label: 'รอข้อมูล...' },
    };

    const config = configs[status] || configs['OFFLINE'];
    const Icon = config.icon;

    return (
        <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 font-bold text-sm shadow-sm ${config.color}`}>
            <Icon className="w-4 h-4" />
            <span className="font-prompt">{config.label}</span>
            {status === 'DOWNTIME' && (
                <motion.div 
                    animate={{ opacity: [1, 0.5, 1] }} 
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-2 h-2 rounded-full bg-rose-500" 
                />
            )}
        </div>
    );
};

export default function CycleTimeMonitor({ data, loading }: { data: any, loading: boolean }) {
    if (!data || loading) return null;

    const { items, kpis } = data;
    const latest = items[0] || null;

    // Format chart data (limit to last 20 for density)
    const chartData = useMemo(() => {
        return [...items].reverse().slice(-30).map((item: any) => ({
            time: new Date(item.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            value: item.diff_sec,
            ma: item.moving_avg,
            status: item.status
        }));
    }, [items]);

    const getStatusColor = (status: string) => {
        if (status === 'NORMAL') return '#10b981';
        if (status === 'SLOW') return '#f59e0b';
        if (status === 'DOWNTIME') return '#ef4444';
        return '#64748b';
    };

    return (
        <div className="space-y-6">
            {/* Cycle Time KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Average Cycle Time */}
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <Timer className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ค่าเฉลี่ยปกติ</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800">
                        <CountUp end={kpis.avg_cycle_time} duration={2} decimals={1} />
                        <span className="text-sm font-normal text-slate-400 ml-1">วินาที</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        เป้าหมาย:น้อยกว่า 240 วินาที
                    </p>
                </motion.div>

                {/* Efficiency Index */}
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-100 rounded-xl">
                            <Zap className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ประสิทธิภาพ</span>
                    </div>
                    <h3 className={`text-3xl font-black ${kpis.efficiency >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        <CountUp end={kpis.efficiency} duration={2} decimals={1} />
                        <span className="text-sm font-normal text-slate-400 ml-1">%</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-2">เทียบกับเกณฑ์ 240 วินาที</p>
                </motion.div>

                {/* Downtime Alert Count */}
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-rose-100 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ความผิดปกติ</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800">
                        {kpis.downtime_count}
                        <span className="text-sm font-normal text-slate-400 ml-1">ครั้ง</span>
                    </h3>
                    <p className="text-xs text-rose-500 mt-2 font-bold">พบรอบล่าช้า {kpis.slow_count} ครั้ง</p>
                </motion.div>
            </div>

            {/* Main Monitor Row */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Real-time Indicator */}
                <div className="xl:col-span-2 bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-white/50 shadow-lg relative overflow-hidden flex flex-col items-center justify-center text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((kpis.latest_diff / 600) * 100, 100)}%` }}
                            className={`h-full ${latest?.status === 'NORMAL' ? 'bg-emerald-500' : latest?.status === 'SLOW' ? 'bg-amber-500' : 'bg-rose-500'}`}
                        />
                    </div>
                    
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">รอบเวลาการทำงานปัจจุบัน</h4>
                    
                    <div className="relative mb-6">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            key={kpis.latest_diff}
                            className={`text-8xl font-black tracking-tighter ${latest?.status === 'NORMAL' ? 'text-slate-800' : latest?.status === 'SLOW' ? 'text-amber-600' : 'text-rose-600'}`}
                        >
                            {kpis.latest_diff}
                        </motion.div>
                        <span className="text-xl font-bold text-slate-400 absolute -bottom-4 left-1/2 -translate-x-1/2 uppercase tracking-widest">วินาที</span>
                    </div>

                    <StatusBadge status={kpis.latest_status} />
                    
                    <div className="mt-8 grid grid-cols-2 gap-8 w-full border-t border-slate-100 pt-6">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">จำนวนกะบะ</p>
                            <p className="text-lg font-bold text-slate-700"># {latest?.sequence || '-'}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">อัปเดตล่าสุด</p>
                            <p className="text-lg font-bold text-slate-700">{latest ? new Date(latest.timestamp).toLocaleTimeString('th-TH') : '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Trend Chart */}
                <div className="xl:col-span-3 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            แนวโน้มรอบเวลาการทำงาน (MA-5)
                        </h3>
                        <div className="flex gap-4 text-[10px] font-bold">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> รอบจริง</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> ค่าเฉลี่ย</span>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCycle" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="time" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10}}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10}}
                                    unit="s"
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        background: 'rgba(255, 255, 255, 0.9)'
                                    }} 
                                />
                                <ReferenceLine y={240} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'เป้าหมาย', position: 'right', fill: '#f59e0b', fontSize: 10 }} />
                                <ReferenceLine y={600} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'จุดหยุดงาน', position: 'right', fill: '#ef4444', fontSize: 10 }} />
                                
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    name="รอบเวลาจริง"
                                    stroke="#3b82f6" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorCycle)" 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="ma" 
                                    name="ค่าเฉลี่ยสมูท"
                                    stroke="#6366f1" 
                                    strokeWidth={3} 
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
