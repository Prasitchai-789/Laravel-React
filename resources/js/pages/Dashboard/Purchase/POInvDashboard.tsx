import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, LineChart, Line
} from 'recharts';
import {
  CalendarDays, Trophy, Award, Medal, Sparkles,
  ArrowUpRight, Package, Crown, Star,
  Leaf, Activity, BarChart3
} from 'lucide-react';

interface DashboardData {
  today: { volume: number; amount_mb: number; avg_price: number };
  monthly: { volume: number; amount_mb: number; avg_price: number };
  chart: { date: string; volume: number }[];
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
  'from-amber-400 to-orange-500',
  'from-slate-400 to-slate-500',
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
        <div className="flex-none px-6 pt-5 pb-3">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-2xl rounded-2xl ring-1 ring-slate-900/5 shadow-sm px-5 py-3">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-sm border border-white/20">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                  รายงานรับซื้อผลปาล์ม
                </h1>
                <p className="text-slate-500 text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  Live PO Invoice Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/50 px-3 py-1.5 rounded-full shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-700 font-bold text-xs uppercase tracking-wide">Live Updates</span>
              </div>
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
        <div className="flex-1 min-h-0 px-6 pb-6">
          {isLoading && !data ? (
            <div className="h-full flex items-center justify-center">
              <div className="relative flex flex-col items-center gap-4">
                <div className="animate-spin w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-500" />
                <p className="text-slate-400 font-medium text-sm animate-pulse">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : data ? (
            <div className="h-full grid grid-cols-12 gap-5">

              {/* ── COL LEFT: Today Stats (Light & Clean Cards) ── */}
              <div className="col-span-3 flex flex-col gap-4">
                {[
                  { key: 'vol', title: 'ปริมาณวันนี้', value: data.today.volume, unit: 'ตัน', color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600' },
                  { key: 'amt', title: 'ยอดเงินวันนี้', value: data.today.amount_mb, unit: 'ล้านบาท', color: '#0ea5e9', bg: 'bg-sky-50', text: 'text-sky-600' },
                  { key: 'prc', title: 'ราคาเฉลี่ยวันนี้', value: data.today.avg_price, unit: 'บาท/กก.', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600' },
                ].map((card, idx) => (
                  <motion.div
                    key={card.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative flex-1 flex flex-col justify-between bg-white rounded-3xl p-5 ring-1 ring-slate-900/5 shadow-sm hover:shadow-lg hover:ring-slate-900/10 transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-500 font-semibold text-sm">{card.title}</p>
                        <div className={`px-2 py-1 rounded-md ${card.bg} ${card.text} font-bold text-[10px] uppercase tracking-wider`}>
                          Today
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-slate-800 font-mono tracking-tight">
                          <CountUp end={card.value} decimals={2} duration={2} separator="," />
                        </span>
                        <span className="text-sm font-semibold text-slate-400">{card.unit}</span>
                      </div>
                    </div>
                    <div className="h-12 mt-4 -mx-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.chart.slice(-7)}>
                          <defs>
                            <linearGradient id={`sg${card.key}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={card.color} stopOpacity={0.2} />
                              <stop offset="100%" stopColor={card.color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="volume" stroke={card.color} strokeWidth={2.5} fill={`url(#sg${card.key})`} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* ── COL CENTER: Main Charts ── */}
              <div className="col-span-6 flex flex-col gap-5">
                
                {/* Bar Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex-[6] bg-white rounded-3xl ring-1 ring-slate-900/5 shadow-sm p-6 flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-6 flex-none">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-500" />
                        แนวโน้มปริมาณรับซื้อ
                      </h3>
                      <p className="text-slate-400 text-xs font-medium mt-1">ข้อมูลย้อนหลัง 7 วันล่าสุด (หน่วย: ตัน)</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>พยากรณ์: ขาขึ้น</span>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.chart} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 11 }} width={40} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={1500}>
                          {data.chart.map((_, i) => (
                            <Cell key={i} fill={i === data.chart.length - 1 ? '#10b981' : '#99f6e4'} className="transition-all duration-300 hover:opacity-80" />
                          ))}
                          <LabelList dataKey="volume" position="top" fill="#64748b" fontSize={11} fontWeight={700} formatter={(v: any) => v.toLocaleString()} dy={-8} />
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
                  className="flex-[4] bg-white rounded-3xl ring-1 ring-slate-900/5 shadow-sm p-5 flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4 flex-none">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center ring-1 ring-amber-100">
                        <Trophy className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">สุดยอดผู้ขายประจำเดือน</h3>
                        <p className="text-slate-400 text-[11px] font-medium mt-0.5">Top 5 Vendors by Volume</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden pr-2">
                    {data.top5.map((vendor, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.08 }}
                        className={`group flex items-center gap-4 px-4 py-2.5 rounded-2xl flex-1 min-h-0 transition-all ${
                          idx === 0 ? 'bg-gradient-to-r from-amber-50 to-transparent ring-1 ring-amber-100/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 shadow-sm ${
                          idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                          idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white' :
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {idx === 0 ? <Crown className="w-3.5 h-3.5" /> : idx === 1 ? <Medal className="w-3.5 h-3.5" /> : idx === 2 ? <Award className="w-3.5 h-3.5" /> : `${idx + 1}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm truncate ${idx === 0 ? 'text-amber-700' : 'text-slate-700'}`}>{vendor.name}</p>
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

              {/* ── COL RIGHT: Monthly Stats (same style as Today cards) ── */}
              <div className="col-span-3 flex flex-col gap-4">
                {[
                  { title: 'ยอดสะสมทั้งเดือน', value: data.monthly.volume, unit: 'ตัน', trend: '+15%', accent: 'from-emerald-400 to-emerald-500', color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600' },
                  { title: 'รายได้รวมทั้งเดือน', value: data.monthly.amount_mb, unit: 'ล้านบาท', trend: '+22%', accent: 'from-sky-400 to-sky-500', color: '#0ea5e9', bg: 'bg-sky-50', text: 'text-sky-600' },
                  { title: 'ราคาเฉลี่ยทั้งเดือน', value: data.monthly.avg_price, unit: 'บาท/กก.', trend: '+8%', accent: 'from-amber-400 to-amber-500', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600' },
                ].map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className="group relative flex-1 flex flex-col justify-between bg-white rounded-3xl p-5 ring-1 ring-slate-900/5 shadow-sm hover:shadow-lg hover:ring-slate-900/10 transition-all duration-300"
                  >
                    <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${card.accent} opacity-[0.06] rounded-full blur-2xl -translate-y-12 translate-x-12 group-hover:opacity-[0.12] transition-opacity duration-500`} />

                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-500 font-semibold text-sm">{card.title}</p>
                        <div className={`px-2 py-1 rounded-md ${card.bg} ${card.text} font-bold text-[10px] uppercase tracking-wider`}>
                          Monthly
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-slate-800 font-mono tracking-tight">
                          <CountUp end={card.value} decimals={2} duration={2} separator="," />
                        </span>
                        <span className="text-sm font-semibold text-slate-400">{card.unit}</span>
                      </div>
                    </div>

                    <div className="h-12 mt-4 -mx-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.chart.slice(-7)}>
                          <defs>
                            <linearGradient id={`mg${idx}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={card.color} stopOpacity={0.2} />
                              <stop offset="100%" stopColor={card.color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="volume" stroke={card.color} strokeWidth={2.5} fill={`url(#mg${idx})`} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                ))}
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