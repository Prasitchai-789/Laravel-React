import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale('th');
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, LineChart, Line
} from 'recharts';
import {
  CalendarDays, Trophy, Award, Medal, Sparkles,
  ArrowUpRight, Package, Crown, Star,
  Leaf, Activity, BarChart3, TrendingUp, TrendingDown
} from 'lucide-react';
import { DetailedPalmCard } from '@/components/Production/ProductionKPICards';

interface DashboardData {
  today: { volume: number; amount_mb: number; avg_price: number };
  monthly: { 
    volume: number; 
    amount_mb: number; 
    avg_price: number;
    volume_prev_year: number;
  };
  remaining_stock: {
    volume: number;
    amount_mb: number;
    cpo_volume: number;
    yield_7d: number;
  };
  chart: { date: string; volume: number; amount: number; price: number }[];
  top5: { name: string; volume: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 border border-white/50 ring-1 ring-slate-900/5">
        <p className="text-slate-500 text-xs font-semibold mb-1.5 uppercase tracking-wider">{label}</p>
        <p className="text-emerald-600 text-lg font-black flex items-baseline gap-1">
          {payload[0].value.toLocaleString()} <span className="text-xs font-medium text-slate-400">ตัน</span>
        </p>
      </div>
    );
  }
  return null;
};

const topGradients = [
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-amber-600 to-amber-700',
  'from-emerald-400 to-teal-500',
  'from-indigo-400 to-violet-500',
];

export default function POInvDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/purchase/po-invoice-dashboard/api', { params: { date: selectedDate } });
        if (isMounted) setData(response.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [selectedDate]);

  return (
    <AppLayout breadcrumbs={[{ title: 'Purchase', href: '#' }, { title: 'PO Invoice Dashboard', href: '#' }]}>
      <Head title="รายงานรับซื้อผลปาล์ม" />

      {/* พื้นหลังแบบ Soft Gradient ดูสะอาดตา */}
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100/80 font-anuphan text-slate-800 overflow-hidden">

        {/* ── HEADER ── */}
        <div className="flex-none px-6 pt-3 pb-2">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-2xl rounded-2xl ring-1 ring-slate-900/5 shadow-sm px-4 py-2">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-sm border border-white/20">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                  รายงานรับซื้อผลปาล์ม {dayjs(selectedDate).format('D MMMM BBBB')}
                </h1>
                <p className="text-slate-500 text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  Live PO Invoice Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* <div className="flex items-center gap-2 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/50 px-3 py-1.5 rounded-full shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-700 font-bold text-xs uppercase tracking-wide">Live Updates</span>
              </div> */}
              <div className="flex items-center gap-2.5 bg-white ring-1 ring-slate-900/5 rounded-xl px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="border-none bg-transparent text-slate-700 text-sm p-0 focus:ring-0 font-mono font-bold cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 max-h-0 px-6 pb-4">
          {isLoading && !data ? (
            <div className="h-full flex items-center justify-center">
              <div className="relative flex flex-col items-center gap-4">
                <div className="animate-spin w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-500" />
                <p className="text-slate-400 font-medium text-sm animate-pulse">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : data ? (
            <div className="h-full grid grid-cols-12 gap-1.5">

              {/* ── COL LEFT: Today Stats (Light & Clean Cards) ── */}
              <div className="col-span-3 flex flex-col gap-1.5">
                {[
                  { key: 'vol', title: 'ปริมาณวันนี้', value: data.today.volume, unit: 'ตัน', color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', dataKey: 'volume' },
                  { key: 'amt', title: 'ยอดเงินวันนี้', value: data.today.amount_mb, unit: 'MB.', color: '#0ea5e9', bg: 'bg-sky-50', text: 'text-sky-700', dataKey: 'amount' },
                  { key: 'prc', title: 'ราคาเฉลี่ยวันนี้', value: data.today.avg_price, unit: 'บาท/กก.', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', dataKey: 'price' },
                ].map((card, idx) => (
                  <motion.div
                    key={card.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative flex-1 flex flex-col justify-between bg-white rounded-3xl p-3.5 ring-1 ring-slate-900/5 shadow-sm hover:shadow-lg hover:ring-slate-900/10 transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-slate-700 font-semibold text-sm">{card.title}</p>
                        <div className={`px-2 py-1 rounded-md ${card.bg} ${card.text} font-bold text-[10px] uppercase tracking-wider`}>
                          Today
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-slate-800 font-mono tracking-tight">
                          <CountUp end={card.value} decimals={2} duration={2} separator="," />
                        </span>
                        <span className="text-sm text-slate-700">{card.unit}</span>
                      </div>
                    </div>
                    <div className="h-20 -mx-5">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.chart.slice(-7)}>
                          <defs>
                            <linearGradient id={`sg${card.key}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={card.color} stopOpacity={0.2} />
                              <stop offset="100%" stopColor={card.color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <YAxis hide domain={['auto', 'auto']} />
                          <Area type="monotone" dataKey={card.dataKey} stroke={card.color} strokeWidth={2.5} fill={`url(#sg${card.key})`} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* ── COL CENTER: Main Charts ── */}
              <div className="col-span-6 flex flex-col gap-1.5">
                
                {/* Bar Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">แนวโน้มปริมาณรับซื้อ</h3>
                        <p className="text-slate-400 text-[10px] font-medium">ย้อนหลัง 7 วัน (ตัน)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      {/* <span>+12.5%</span> */}
                    </div>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.chart} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#000000ff', fontSize: 10, fontWeight: 500 }} dy={6} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 10 }} width={35} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="volume" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1200}>
                          {data.chart.map((_, i) => (
                            <Cell key={i} fill={i === data.chart.length - 1 ? '#03981cff' : '#1b04eaff'} />
                          ))}
                          <LabelList dataKey="volume" position="top" fill="#000000ff" fontSize={10} fontWeight={600} formatter={(v: any) => v.toLocaleString()} dy={-5} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Top 5 Vendors */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex-[3] bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-2 flex-none">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center ring-1 ring-blue-100">
                        <Trophy className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">สุดยอดผู้ขายประจำเดือน</h3>
                        <p className="text-slate-400 text-[11px] font-medium mt-0.5">Top 5 Vendors by Volume</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-hidden pr-2">
                    {data.top5.map((vendor, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.08 }}
                        className={`group flex items-center gap-2 px-2 rounded-2xl flex-1 min-h-0 transition-all ${
                          idx === 0 ? '' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 shadow-sm ${
                          idx === 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' :
                          idx === 1 ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white' :
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {idx === 0 ? <Crown className="w-3.5 h-3.5" /> : idx === 1 ? <Medal className="w-3.5 h-3.5" /> : idx === 2 ? <Award className="w-3.5 h-3.5" /> : `${idx + 1}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm truncate ${idx === 0 ? 'text-blue-700' : 'text-slate-700'}`}>{vendor.name}</p>
                          <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(vendor.volume / data.top5[0].volume) * 100}%` }}
                              transition={{ duration: 1.2, delay: 0.5 + idx * 0.1, ease: "easeOut" }}
                              className={`h-full rounded-full bg-gradient-to-r ${topGradients[idx]}`}
                            />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-black text-slate-800 text-base font-mono">
                            <CountUp end={vendor.volume} decimals={2} duration={2} separator="," />
                          </span>
                          <span className="text-slate-400 text-xs font-medium ml-1">ตัน</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* ── COL RIGHT: Monthly Stats (Detailed View) ── */}
              <div className="col-span-3 flex flex-col gap-1.5">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="group relative flex-1 flex flex-col justify-between bg-white rounded-3xl p-5 ring-1 ring-slate-900/5 shadow-md hover:shadow-xl hover:ring-slate-900/10 transition-all duration-500 overflow-hidden"
                >
                  {/* Decorative Background */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl translate-y-12 -translate-x-8 group-hover:scale-110 transition-transform duration-700" />

                  <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center ring-1 ring-emerald-200 group-hover:rotate-6 transition-transform">
                          <BarChart3 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-slate-800 font-extrabold text-md tracking-tight">ยอดสะสมทั้งเดือน</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Monthly Accumulation</p>
                        </div>
                      </div>

                      {/* Trend Badge */}
                      <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full font-black text-[10px] uppercase tracking-wider ${
                        data.monthly.volume >= data.monthly.volume_prev_year 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {data.monthly.volume >= data.monthly.volume_prev_year ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {data.monthly.volume_prev_year > 0 
                            ? `${(((data.monthly.volume - data.monthly.volume_prev_year) / data.monthly.volume_prev_year) * 100).toFixed(1)}%` 
                            : 'NEW'}
                        </span>
                      </div>
                    </div>

                    {/* Main Metric */}
                    <div className="text-center mb-4 relative">
                      <div className="flex items-baseline justify-center gap-1.5">
                        <span className="text-5xl font-black text-blue-700 font-mono tracking-tighter drop-shadow-sm">
                          <CountUp end={data.monthly.volume} decimals={2} duration={2} separator="," />
                        </span>
                        <span className="text-lg font-black text-blue-500/70 uppercase tracking-tighter">ตัน</span>
                      </div>
                      <div className="h-1 w-12 bg-emerald-400 mx-auto mt-1 rounded-full opacity-50 group-hover:w-20 transition-all duration-500" />
                    </div>

                    {/* Sub Metrics Grid */}
                    <div className="grid grid-cols-2 gap-1 -ml-3  -mr-3">
                      <div className="relative group/item p-2 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-emerald-50/50 hover:border-emerald-100 transition-colors">
                        <p className="text-[14px] text-slate-700 font-bold uppercase tracking-wider mb-1">ราคาเฉลี่ย</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-red-600 font-mono">
                            <CountUp end={data.monthly.avg_price} decimals={2} duration={2} />
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">บ/กก.</span>
                        </div>
                      </div>

                      <div className="relative group/item p-2 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-emerald-50/50 hover:border-emerald-100 transition-colors">
                        <p className="text-[14px] text-slate-700 font-bold uppercase tracking-wider mb-1">ยอดเงินรวม</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-800 font-mono">
                            <CountUp end={data.monthly.amount_mb} decimals={2} duration={2} />
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">MB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ── Remaining Stock Card ── */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="group relative flex-1 flex flex-col justify-between bg-white rounded-3xl p-5 ring-1 ring-slate-900/5 shadow-md hover:shadow-xl hover:ring-slate-900/10 transition-all duration-500 overflow-hidden"
                >
                  {/* Decorative Gradient Background */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl translate-y-12 -translate-x-8 group-hover:scale-110 transition-transform duration-700" />

                  <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500/10 to-orange-500/20 rounded-2xl flex items-center justify-center ring-1 ring-amber-200/50 group-hover:rotate-6 transition-transform">
                          <Package className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-slate-800 font-extrabold text-sm tracking-tight">ปริมาณปาล์มคงเหลือ</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">...</p>
                        </div>
                      </div>
                    </div>

                    {/* Main Metric */}
                    <div className="text-center mb-2 relative">
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-black text-red-600 font-mono tracking-tighter drop-shadow-sm">
                          <CountUp end={data.remaining_stock.volume} decimals={2} duration={2} separator="," />
                        </span>
                        <span className="text-lg font-black text-red-500/70 uppercase tracking-tighter">ตัน</span>
                      </div>
                      <div className="h-1 w-12 bg-amber-400 mx-auto mt-1 rounded-full opacity-50 group-hover:w-20 transition-all duration-500" />
                    </div>

                    {/* Sub Metrics Grid */}
                    <div className="grid grid-cols-2 gap-1 -ml-3  -mr-3">
                      <div className="relative group/item p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-amber-50/50 hover:border-amber-100 transition-colors">
                        <div className="absolute top-2 right-2 opacity-20 group-hover/item:opacity-40 transition-opacity">
                          <TrendingUp className="w-3 h-3 text-amber-600" />
                        </div>
                        <p className="text-[12px] text-slate-600 font-bold uppercase tracking-wider mb-1">มูลค่าคงเหลือ</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-amber-600 font-mono">
                            <CountUp end={data.remaining_stock.amount_mb} decimals={2} duration={2} />
                          </span>
                          <span className="text-[10px] font-bold text-slate-600">MB</span>
                        </div>
                      </div>

                      <div className="relative group/item p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-blue-50/50 hover:border-blue-100 transition-colors">
                        <div className="absolute top-2 right-2 opacity-20 group-hover/item:opacity-40 transition-opacity">
                          <TrendingUp className="w-3 h-3 text-blue-600" />
                        </div>
                        <p className="text-[12px] text-slate-600 font-bold uppercase tracking-wider mb-1">CPO โดยประมาณ</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-blue-600 font-mono">
                            <CountUp end={data.remaining_stock.cpo_volume} decimals={2} duration={2} />
                          </span>
                          <span className="text-[10px] font-bold text-slate-600">ตัน</span>
                        </div>
                      </div>
                    </div>

                    {/* Formula Footer */}
                    <div className="mt-auto pt-1.5 border-t border-slate-100/80">
                      <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-50/50 border border-slate-100/50 text-[10px] font-mono">
                        <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                          
                        </span>
                        <div className="h-3 w-[1px] bg-slate-200 mx-1" />
                        <span className="text-slate-500 font-semibold truncate">
                          ({data.remaining_stock.volume.toLocaleString()} t × {data.remaining_stock.yield_7d} %) = {data.remaining_stock.cpo_volume.toLocaleString()} t CPO
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-red-100">
                <Package className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-slate-800 font-bold text-lg">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
              <p className="text-slate-400 text-sm mt-1">กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}