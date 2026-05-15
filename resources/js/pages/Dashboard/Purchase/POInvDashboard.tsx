import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { purchaseApi } from '@/services/purchaseApi';
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
  const [selectedDate, setSelectedDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await purchaseApi.getPOInvDashboard({ date: selectedDate });
        if (isMounted && res.success) setData(res.data);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [selectedDate]);

  return (
    <AppLayout breadcrumbs={[{ title: 'Purchase', href: '#' }, { title: 'PO Invoice Dashboard', href: '#' }]}>
      <Head title="รายงานรับซื้อผลปาล์ม" />

      {/* Main Container: Responsive scrolling */}
      <div className="min-h-screen lg:h-screen flex flex-col bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100/80 font-anuphan text-slate-800 overflow-y-auto lg:overflow-hidden pb-10 lg:pb-0">

        {/* ── HEADER ── */}
        <div className="flex-none px-4 lg:px-6 pt-3 pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/80 backdrop-blur-2xl rounded-2xl ring-1 ring-slate-900/5 shadow-sm px-4 py-3 sm:py-2 gap-4 sm:gap-0">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="relative group shrink-0">
                <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative w-10 h-10 lg:w-11 lg:h-11 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-sm border border-white/20">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight truncate">
                  รายงานรับซื้อผลปาล์ม
                </h1>
                <p className="text-slate-700 text-[14px] sm:text-md font-semibold flex items-center gap-1.5 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  {dayjs(selectedDate).format('D MMMM BBBB')}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2">
              <div className="flex items-center gap-2.5 bg-white ring-1 ring-slate-900/5 rounded-xl px-3 sm:px-4 py-2 shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto">
                <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="border-none bg-transparent text-slate-700 text-sm p-0 focus:ring-0 font-mono font-bold cursor-pointer w-full sm:w-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 lg:max-h-0 px-4 lg:px-6 pb-4">
          {isLoading && !data ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
                </div>
                <p className="text-slate-500 font-medium font-anuphan">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : data ? (
            <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-1.5">

              {/* ── COL LEFT: Today Stats ── */}
              <div className="order-1 col-span-1 lg:col-span-3 flex flex-col gap-3 lg:gap-1.5 lg:h-full">
                {[
                  { key: 'vol', title: 'ปริมาณผลปาล์ม', value: data.today.volume, unit: 'Tons', color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', dataKey: 'volume', delay: 0 },
                  { key: 'amt', title: 'ยอดเงินวันนี้', value: data.today.amount_mb, unit: 'MB', color: '#0ea5e9', bg: 'bg-sky-50', text: 'text-sky-700', dataKey: 'amount', delay: 0.1 },
                  { key: 'prc', title: 'ราคาเฉลี่ยวันนี้', value: data.today.avg_price, unit: 'บาท/กก.', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', dataKey: 'price', delay: 0.2 },
                ].map((card) => (
                  <motion.div
                    key={card.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: card.delay }}
                    className="group relative flex-1 flex flex-col justify-between bg-white rounded-3xl p-4 lg:p-3.5 ring-1 ring-slate-900/5 shadow-sm hover:shadow-lg transition-all duration-300 min-h-[140px] sm:min-h-0"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2 lg:mb-1.5">
                        <p className="text-slate-700 font-bold text-sm lg:text-xs uppercase tracking-wide font-anuphan">{card.title}</p>
                        <div className={`px-2 py-1 rounded-md ${card.bg} ${card.text} font-black text-[9px] lg:text-[8px] uppercase tracking-widest`}>
                          Today
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl lg:text-4xl font-black text-slate-800 tabular-nums tracking-tight font-anuphan">
                          <CountUp end={card.value} decimals={2} duration={2} separator="," />
                        </span>
                        <span className="text-xs lg:text-[10px] font-bold text-slate-400 uppercase font-anuphan">{card.unit}</span>
                      </div>
                    </div>
                    <div className="h-16 lg:h-20 -mx-4 lg:-mx-4.5 mt-2 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
              <div className="order-3 lg:order-2 col-span-1 lg:col-span-6 flex flex-col gap-4 lg:gap-1.5 lg:h-full">

                {/* Bar Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="flex-[2] bg-white rounded-3xl border border-slate-100 shadow-sm p-5 lg:p-4 flex flex-col overflow-hidden min-h-[250px]"
                >
                  <div className="flex items-center justify-between mb-4 lg:mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-sm font-anuphan">แนวโน้มปริมาณรับซื้อ</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">ย้อนหลัง 7 วัน (ตัน)</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[140px] lg:min-h-0 relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <BarChart data={data.chart.slice(-7)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#000000ff', fontSize: 10, fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffffff', fontSize: 10 }} width={40} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={1500}>
                          {data.chart.slice(-7).map((_, i, arr) => (
                            <Cell key={i} fill={i === arr.length - 1 ? '#10b981' : '#0672ffff'} fillOpacity={i === arr.length - 1 ? 1 : 0.7} />
                          ))}
                          <LabelList dataKey="volume" position="top" fill="#1e293b" fontSize={10} fontWeight={800} formatter={(v: any) => v?.toLocaleString() ?? ''} dy={-8} />
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
                  className="flex-[3] bg-white rounded-3xl border border-slate-100 shadow-sm p-5 lg:p-4 flex flex-col overflow-hidden min-h-[300px] lg:min-h-0"
                >
                  <div className="flex items-center justify-between mb-4 flex-none">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center ring-1 ring-blue-100">
                        <Trophy className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-sm font-anuphan">สุดยอดผู้ขายประจำเดือน</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Top 5 Vendors by Volume</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:gap-1.5 flex-1 min-h-0 lg:overflow-y-auto pr-1 custom-scrollbar">
                    {data.top5.map((vendor, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.08 }}
                        className={`group flex items-center gap-3 px-3 py-2 lg:py-1 rounded-2xl flex-1 min-h-0 transition-all ${idx === 0 ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                          }`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 shadow-sm ${idx === 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' :
                          idx === 1 ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' :
                            idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white' :
                              'bg-slate-100 text-slate-400'
                          }`}>
                          {idx === 0 ? <Crown className="w-4 h-4" /> : idx === 1 ? <Medal className="w-4 h-4" /> : idx === 2 ? <Award className="w-4 h-4" /> : `${idx + 1}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-black text-sm truncate font-anuphan ${idx === 0 ? 'text-blue-900' : 'text-slate-700'}`}>{vendor.name}</p>
                          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(vendor.volume / data.top5[0].volume) * 100}%` }}
                              transition={{ duration: 1.2, delay: 0.5 + idx * 0.1, ease: "easeOut" }}
                              className={`h-full rounded-full bg-gradient-to-r ${topGradients[idx]}`}
                            />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-black text-slate-900 text-base tabular-nums">
                            <CountUp end={vendor.volume} decimals={2} duration={2} separator="," />
                          </span>
                          <span className="text-slate-400 text-[10px] font-bold uppercase ml-1">ตัน</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* ── COL RIGHT: Monthly Stats ── */}
              <div className="order-2 lg:order-3 col-span-1 lg:col-span-3 flex flex-col gap-3 lg:gap-1.5 lg:h-full">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="group relative flex-1 flex flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 rounded-3xl p-6 lg:p-5 ring-1 ring-white/10 shadow-xl shadow-blue-900/30 transition-all duration-500 overflow-hidden"
                >
                  {/* Background decorative elements */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-500/15 to-purple-500/15 rounded-full blur-3xl translate-y-16 -translate-x-16" />
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg_width=%2260%22_height=%2260%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern_id=%22grid%22_width=%2260%22_height=%2260%22_patternUnits=%22userSpaceOnUse%22%3E%3Cpath_d=%22M_60_0_L_0_0_0_60%22_fill=%22none%22_stroke=%22rgba(255,255,255,0.03)%22_stroke-width=%221%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect_width=%22100%25%22_height=%22100%25%22_fill=%22url(%23grid)%22/%3E%3C/svg%3E')] opacity-30" />

                  <div className="relative z-10 flex flex-col h-full">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-6 lg:mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-black text-sm font-anuphan tracking-wide">ยอดสะสมทั้งเดือน</h3>
                          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-0.5">MTD Performance</p>
                        </div>
                      </div>

                      {/* Trend Badge */}
                      <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full font-black text-[11px] uppercase tracking-wider backdrop-blur-sm ${data.monthly.volume >= data.monthly.volume_prev_year
                          ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                          : 'bg-rose-400/20 text-rose-200 border border-rose-400/30'
                        }`}>
                        {data.monthly.volume >= data.monthly.volume_prev_year ?
                          <TrendingUp className="w-3 h-3" /> :
                          <TrendingDown className="w-3 h-3" />
                        }
                        <span>
                          {data.monthly.volume_prev_year > 0
                            ? `${(((data.monthly.volume - data.monthly.volume_prev_year) / data.monthly.volume_prev_year) * 100).toFixed(1)}%`
                            : 'NEW'}
                        </span>
                      </div>
                    </div>

                    {/* Main Value */}
                    <div className="text-center mb-5 lg:mb-3">
                      <div className="flex items-baseline justify-end gap-2">
                        <span className="text-6xl lg:text-5xl font-black text-white tabular-nums tracking-tight">
                          <CountUp end={data.monthly.volume} decimals={2} duration={2} separator="," />
                        </span>
                        <span className="text-sm font-bold text-blue-200 uppercase tracking-wider">Tons</span>
                      </div>
                      <div className="h-px w-20 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent mx-auto my-4" />
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Avg Price Card */}
                      <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/15 transition-colors duration-300">
                        <p className="text-[11px] text-blue-200 font-bold uppercase mb-2 tracking-wider font-anuphan">
                          ราคาเฉลี่ยสะสม
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-white tabular-nums">
                            <CountUp end={data.monthly.avg_price} decimals={2} duration={2} />
                          </span>
                          <span className="text-[10px] font-bold text-blue-300 uppercase">บาท/กก.</span>
                        </div>
                      </div>

                      {/* Total Amount Card */}
                      <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/15 transition-colors duration-300">
                        <p className="text-[11px] text-blue-200 font-bold uppercase mb-2 tracking-wider font-anuphan">
                          ยอดเงินรวมทั้งเดือน
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-white tabular-nums">
                            <CountUp end={data.monthly.amount_mb} decimals={2} duration={2} />
                          </span>
                          <span className="text-[10px] font-bold text-blue-300 uppercase">MB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Remaining Stock Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="group relative flex-1 flex flex-col justify-between bg-emerald-950 rounded-3xl p-6 lg:p-5 shadow-xl shadow-emerald-900/20 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-6 lg:mb-4">
                      <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <Package className="w-5 h-5 text-emerald-300" />
                      </div>
                      <div>
                        <h3 className="text-white font-black text-sm font-anuphan">ปริมาณปาล์มคงเหลือ</h3>
                        <p className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">System Calculation</p>
                      </div>
                    </div>

                    <div className="text-center mb-6 lg:mb-4">
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl lg:text-4xl font-black text-white tabular-nums drop-shadow-lg">
                          <CountUp end={data.remaining_stock.volume} decimals={2} duration={2} separator="," />
                        </span>
                        <span className="text-sm font-black text-emerald-400 uppercase">Tons</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[11px] text-emerald-400 font-black uppercase mb-1 font-anuphan">มูลค่าคงเหลือ</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-white tabular-nums px-3">
                            <CountUp end={data.remaining_stock.amount_mb} decimals={2} duration={2} />
                          </span>
                          <span className="text-[9px] font-bold text-emerald-500 uppercase">MB</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[11px] text-emerald-400 font-black uppercase mb-1 font-anuphan">CPO ประมาณ</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-amber-400 tabular-nums px-3">
                            <CountUp end={data.remaining_stock.cpo_volume} decimals={2} duration={2} />
                          </span>
                          <span className="text-[9px] font-bold text-amber-600 uppercase">Tons</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/10">
                      <div className="flex items-center justify-center p-2 rounded-xl bg-black/20 text-[12px] font-black text-emerald-300/80 font-mono tracking-tighter">
                        ( {data.remaining_stock.volume.toLocaleString()} t × {data.remaining_stock.yield_7d} % ) = {data.remaining_stock.cpo_volume.toLocaleString()} t CPO
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="min-h-[40vh] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-rose-100">
                <Package className="w-8 h-8 text-rose-400" />
              </div>
              <p className="text-slate-800 font-black text-lg font-anuphan">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200">
                ลองใหม่อีกครั้ง
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
