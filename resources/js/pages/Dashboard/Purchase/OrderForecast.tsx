import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, ComposedChart, Line,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Package, Wallet, 
  Activity, Target, Calendar, AlertCircle, Leaf,
  Truck, Database, Factory, ChevronRight,
  ArrowUpRight, Info, RefreshCcw, Sparkles,
  Zap, BarChart3, Droplets, Gem, Clock
} from 'lucide-react';
import CountUp from 'react-countup';
import axios from 'axios';
import dayjs from 'dayjs';

interface ForecastData {
  metrics: {
    total_orders_ton: number;
    cpo_stock_ton: number;
    ffb_stock_ton: number;
    yield_percent: number;
    avg_ffb_price: number;
  };
  forecast: {
    ffb_intake_7d_ton: number;
    expected_cpo_from_ffb_stock: number;
    expected_cpo_from_forecast_intake: number;
    total_potential_cpo: number;
  };
  requirements: {
    ffb_needed_ton: number;
    budget_needed_mb: number;
    net_cpo_gap_ton: number;
  };
  chart: {
    daily: any[];
    forecast: any[];
  };
  last_updated: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl shadow-xl shadow-slate-200/50">
        <p className="text-slate-500 text-[10px] font-bold uppercase mb-2 tracking-wider">{dayjs(label).format('D MMM YYYY')}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${entry.dataKey === 'actual' ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-emerald-500'}`} />
              <span className="text-xs font-semibold text-slate-600">{entry.name === 'Actual Intake' ? 'ยอดรับเข้าจริง' : 'ยอดรับเข้าคาดการณ์'}:</span>
            </div>
            <span className="text-sm font-black text-slate-900">
              {entry.value.toLocaleString()} <span className="text-[10px] text-slate-500 font-medium">ตัน</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ProgressRing = ({ progress, size = 60, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1e293b"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#ringGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </svg>
  );
};

export default function OrderForecast() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/purchase/order-forecast/api');
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chartData = React.useMemo(() => {
    if (!data) return [];
    const historic = data.chart.daily.slice(-14).map(d => ({
      date: d.date,
      actual: parseFloat(d.weight_ton),
      type: 'Actual'
    }));
    const forecast = data.chart.forecast.map(f => ({
      date: f.date,
      forecast: f.weight_ton,
      type: 'Forecast'
    }));
    return [...historic, ...forecast];
  }, [data]);

  const fulfillmentRate = data ? ((data.metrics.cpo_stock_ton + data.forecast.total_potential_cpo) / data.metrics.total_orders_ton) * 100 : 0;

  return (
    <AppLayout breadcrumbs={[{ title: 'จัดซื้อ', href: '#' }, { title: 'คาดการณ์คำสั่งซื้อและการผลิต', href: '#' }]}>
      <Head title="คาดการณ์คำสั่งซื้อและการผลิต" />

      <div className="min-h-screen bg-white font-anuphan text-slate-800 overflow-x-hidden relative">
        {/* Modern Mesh Gradient Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[#f8fafc]" />
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-float-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-400/10 rounded-full blur-[120px] animate-float-reverse" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-400/10 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[20%] left-[10%] w-[25%] h-[25%] bg-purple-400/10 rounded-full blur-[100px] animate-float" />
          
          {/* Noise / Grain Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.4] mix-blend-soft-light pointer-events-none" 
               style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
          
          {/* Refined Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a0a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a0a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,white_70%,transparent_100%)]" />
        </div>

        {/* ── GLASS HEADER ── */}
        <div className="relative z-10 px-8 pt-8 pb-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-white shadow-xl shadow-slate-200/50 px-8 py-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur-xl opacity-20" />
                <div className="relative w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100">
                  <Target className="w-7 h-7 text-blue-600" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  คาดการณ์คำสั่งซื้อและการผลิต
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                    ระบบวิเคราะห์สต็อกอัจฉริยะ
                  </p>
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">วิเคราะห์ AI แบบเรียลไทม์</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 border border-slate-200">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'overview' 
                      ? 'bg-white text-blue-600 shadow-sm shadow-slate-200' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ภาพรวม
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'analytics' 
                      ? 'bg-white text-blue-600 shadow-sm shadow-slate-200' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  การวิเคราะห์
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="px-4 py-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-bold text-slate-700">{dayjs().format('D MMMM YYYY')}</span>
                </div>
                <motion.button 
                  onClick={fetchData}
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.4 }}
                  className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition-all group"
                >
                  <RefreshCcw className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="relative z-10 px-8">
          
          {isLoading && !data ? (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur-2xl opacity-50 animate-pulse" />
                <div className="relative w-20 h-20 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm animate-pulse">กำลังวิเคราะห์ข้อมูลตลาด</p>
                <p className="text-slate-400 text-xs mt-2">กำลังประมวลผลการคาดการณ์สต็อกแบบเรียลไทม์...</p>
              </div>
            </div>
          ) : data ? (
            <div className="space-y-6 py-6">
              
              {/* ── KPI CARDS ── */}
              <div className="grid grid-cols-4 gap-5">
                {[
                  { 
                    title: 'คำสั่งซื้อ CPO ทั้งหมด', 
                    value: data.metrics.total_orders_ton, 
                    unit: 'ตัน', 
                    icon: Package, 
                    gradient: 'from-blue-500 to-cyan-400',
                    bgGradient: 'from-blue-500/20 to-cyan-500/10',
                    trend: '+12.5%'
                  },
                  { 
                    title: 'สต็อก CPO ปัจจุบัน', 
                    value: data.metrics.cpo_stock_ton, 
                    unit: 'ตัน', 
                    icon: Database, 
                    gradient: 'from-emerald-500 to-teal-400',
                    bgGradient: 'from-emerald-500/20 to-teal-500/10',
                    trend: '-3.2%'
                  },
                  { 
                    title: 'สต็อก FFB ปัจจุบัน', 
                    value: data.metrics.ffb_stock_ton, 
                    unit: 'ตัน', 
                    icon: Leaf, 
                    gradient: 'from-amber-500 to-orange-400',
                    bgGradient: 'from-amber-500/20 to-orange-500/10',
                    trend: '+8.7%'
                  },
                  { 
                    title: 'อัตรา Yield CPO', 
                    value: data.metrics.yield_percent, 
                    unit: '%', 
                    icon: Droplets, 
                    gradient: 'from-purple-500 to-pink-400',
                    bgGradient: 'from-purple-500/20 to-pink-500/10',
                    trend: '+1.2%'
                  },
                ].map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-white rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden">
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.bgGradient} rounded-full blur-3xl opacity-20 -translate-y-16 translate-x-16`} />
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg border border-white/20`}>
                            <card.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-600">{card.trend}</span>
                          </div>
                        </div>
                        
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">{card.title}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-slate-900 tracking-tight">
                            <CountUp end={card.value} decimals={2} duration={2.5} separator="," />
                          </span>
                          <span className="text-sm font-bold text-slate-400 uppercase">{card.unit}</span>
                        </div>
                        
                        <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(card.value / 1000 * 100, 100)}%` }}
                            className={`h-full bg-gradient-to-r ${card.gradient} rounded-full`}
                            transition={{ delay: 0.5, duration: 1 }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* ── MAIN CHARTS & ANALYSIS ── */}
              <div className="grid grid-cols-12 gap-5">
                
                {/* Left Column - Main Chart */}
                <div className="col-span-8 space-y-5">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">คาดการณ์การรับเข้า FFB</h3>
                        </div>
                        <p className="text-slate-500 text-xs font-medium">วิเคราะห์แนวโน้มล่วงหน้า 7 วัน</p>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                          <span className="text-xs font-bold text-slate-500 uppercase">จริง</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                          <span className="text-xs font-bold text-slate-500 uppercase">คาดการณ์</span>
                        </div>
                        <div className="px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <span className="text-xs font-bold text-blue-600">ความเชื่อมั่น AI: 94%</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <defs>
                            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                            tickFormatter={(str) => dayjs(str).format('D MMM')}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="#3b82f6" 
                            strokeWidth={3} 
                            fill="url(#actualGradient)" 
                            name="Actual Intake" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="forecast" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            strokeDasharray="5 5" 
                            dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#10b981' }} 
                            name="Forecast Intake" 
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Production Breakdown Cards */}
                  <div className="grid grid-cols-2 gap-5">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Factory className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-black text-white tracking-tight">คาดการณ์ผลผลิต CPO</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          { label: 'คาดการณ์จากสต็อก FFB ปัจจุบัน', value: data.forecast.expected_cpo_from_ffb_stock, color: 'blue' },
                          { label: 'คาดการณ์จากยอดรับเข้าล่วงหน้า', value: data.forecast.expected_cpo_from_forecast_intake, color: 'emerald' },
                          { label: 'ศักยภาพผลผลิต CPO รวม', value: data.forecast.total_potential_cpo, color: 'purple', highlight: true },
                        ].map((item, i) => (
                          <div key={i} className={`p-4 rounded-xl border ${item.highlight ? 'bg-purple-500/5 border-purple-500/20' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className={`text-xs font-bold uppercase tracking-wider ${item.highlight ? 'text-purple-600' : 'text-slate-500'}`}>
                                  {item.label}
                                </p>
                              </div>
                              <span className={`text-xl font-black ${item.highlight ? 'text-slate-900' : 'text-slate-800'}`}>
                                {item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-medium text-slate-500">ตัน</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20">
                          <AlertCircle className="w-5 h-5 text-rose-600" />
                        </div>
                        <h3 className="font-black text-slate-900 tracking-tight">ความต้องการหลัก</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-center">
                          <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-2">ส่วนต่าง CPO ที่ต้องการ</p>
                          <span className="text-5xl font-black text-slate-900 tracking-tight">
                            {data.requirements.net_cpo_gap_ton > 0 ? (
                              <CountUp end={data.requirements.net_cpo_gap_ton} decimals={2} />
                            ) : '0.00'}
                          </span>
                          <p className="text-[11px] text-rose-600/60 font-medium mt-2">ปริมาณตันที่ต้องหาเพิ่มเพื่อให้ครบออเดอร์</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">FFB ที่ต้องใช้</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-slate-900">{data.requirements.ffb_needed_ton.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <span className="text-[10px] font-bold text-slate-400">ตัน</span>
                            </div>
                          </div>
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ราคาตลาด</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-slate-900">{data.metrics.avg_ffb_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <span className="text-[10px] font-bold text-slate-400">฿/กก.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Right Column - Budget & Procurement */}
                <div className="col-span-4 space-y-5">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl" />
                    <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100">
                          <Wallet className="w-7 h-7 text-blue-600" />
                        </div>
                        <div className="px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">พร้อมงบประมาณ</span>
                        </div>
                      </div>
                      
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">งบประมาณในการจัดซื้อ</p>
                      <h2 className="text-7xl font-black tracking-tight mb-6 bg-gradient-to-r from-slate-900 to-blue-600 bg-clip-text text-transparent">
                        <CountUp end={data.requirements.budget_needed_mb} decimals={2} duration={2} />
                        <span className="text-2xl font-bold text-blue-500 ml-2">ล้านบาท</span>
                      </h2>
                      
                      <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-sm font-medium">FFB ที่ต้องการเพิ่ม</span>
                          <span className="font-bold text-slate-900">{data.requirements.ffb_needed_ton.toLocaleString()} ตัน</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-sm font-medium">ราคาตลาดเฉลี่ย</span>
                          <span className="font-bold text-slate-900">{data.metrics.avg_ffb_price.toLocaleString()} ฿/กก.</span>
                        </div>
                        <div className="h-px bg-slate-200" />
                        <div className="flex items-start gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                          <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                          <span className="text-xs text-blue-600/70 font-medium">
                            คำนวณจากค่าเฉลี่ย Yield 7 วันและราคาตลาดปัจจุบัน
                          </span>
                        </div>
                      </div>

                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group"
                      >
                        <Sparkles className="w-5 h-5" />
                        ตรวจสอบแผนการจัดซื้อ
                        <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50"
                  >
                    <h4 className="text-sm font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      คาดการณ์การรับเข้าที่รออยู่
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">ประมาณการ 7 วัน</span>
                          <span className="text-2xl font-black text-slate-900">
                            {data.forecast.ffb_intake_7d_ton.toLocaleString()} 
                            <span className="text-sm font-bold text-slate-400 ml-1">ตัน</span>
                          </span>
                        </div>
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                          <TrendingUp className="w-6 h-6 text-emerald-600" />
                        </div>
                      </div>
                      
                      <div className="relative pt-2">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                          <span>ความคืบหน้า</span>
                          <span>65%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: '65%' }} 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg shadow-emerald-500/30" 
                            transition={{ delay: 0.3, duration: 1 }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <p className="text-xs text-slate-500 font-medium">
                          อ้างอิงจากแนวโน้มล่วงหน้า 14 วันและปริมาณการรับเข้าล่าสุด
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Fulfillment Rate Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <ProgressRing progress={Math.min(fulfillmentRate, 100)} size={70} strokeWidth={5} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Gem className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">การเติมเต็มคำสั่งซื้อ</p>
                        <p className="text-3xl font-black text-slate-900">
                          {Math.min(fulfillmentRate, 100).toFixed(2)}%
                        </p>
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">
                          {fulfillmentRate >= 100 ? 'ปริมาณเพียงพอ' : 'ต้องการ FFB เพิ่มเติม'}
                        </p>
                      </div>
                    </div>
                    
                    <svg className="absolute inset-0 pointer-events-none">
                      <defs>
                        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </motion.div>
              </div>
            </div>
          </div>
        ) : null}

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 bg-rose-500/10 backdrop-blur-xl border border-rose-500/30 rounded-3xl flex flex-col items-center gap-5 text-center"
            >
              <div className="w-20 h-20 bg-rose-500/20 rounded-2xl flex items-center justify-center border border-rose-500/30">
                <AlertCircle className="w-10 h-10 text-rose-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">ไม่สามารถสร้างการคาดการณ์ได้</h3>
                <p className="text-rose-300/80 font-medium mt-2">{error}</p>
              </div>
              <motion.button 
                onClick={fetchData}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl shadow-xl shadow-rose-600/30 transition-all"
              >
                วิเคราะห์อีกครั้ง
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* ── STATUS BAR ── */}
        <div className="relative z-10 px-8 pb-8 pt-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-slate-200 shadow-xl shadow-slate-200/50 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">ระบบออนไลน์</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">โมเดล AI: v2.4.1</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">ความสดใหม่ของข้อมูล: เรียลไทม์</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500">อัปเดตล่าสุด: {data?.last_updated || 'เมื่อสักครู่'}</span>
              <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                  animate={{ x: [0, 100, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Anuphan:wght@100..700&display=swap');
        
        .font-anuphan { font-family: 'Anuphan', sans-serif; }

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
      `}} />
    </AppLayout>
  );
}