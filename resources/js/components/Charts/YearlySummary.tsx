import { motion } from 'framer-motion';
import { BarChart3, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import {
  CartesianGrid,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface YearlySummaryProps {
  data?: { name: string; revenue: number; avgPrice: number }[];
  timeframe?: string;
  title?: string;
  totalRevenue?: number;
  growthRate?: number;
  avgPrice?: number;
  invoiced?: number;
}

export default function YearlySummary({
  data = [],
  timeframe = '2024',
  title = 'ยอดขายและราคาเฉลี่ยรายเดือน',
//   growthRate = 15.3,
}: YearlySummaryProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-xl backdrop-blur-sm"
        >
          <p className="mb-3 font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: entry.color,
                      border: entry.dataKey === 'avgPrice' ? '2px solid #f59e0b' : 'none'
                    }}
                  />
                  <span className="text-gray-600">{entry.name}</span>
                </div>
                <span className="font-bold text-gray-900">
                  {entry.dataKey === 'revenue' ? ` ${entry.value} MB` : `${entry.value} ฿`}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      );
    }
    return null;
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="rounded-3xl bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-lg border border-blue-100/50 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {title}
          </h3>
          <p className="text-gray-500 text-sm mt-1 flex items-center">
            <Calendar size={14} className="mr-1" />
            ข้อมูลประจำปี {timeframe}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Growth Badge */}
          {/* <div className="flex items-center space-x-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <TrendingUp size={14} className="text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">+{growthRate}%</span>
          </div> */}

          <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-xl">
            <BarChart3 size={18} />
            <span className="text-sm font-medium">{timeframe}</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {/* <div className="grid grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm"
        >
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-600">ยอดขายรวม</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalRevenue}K</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm"
        >
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp size={16} className="text-amber-600" />
            <span className="text-sm font-medium text-gray-600">ราคาเฉลี่ย</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgPrice}฿</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm"
        >
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 size={16} className="text-emerald-600" />
            <span className="text-sm font-medium text-gray-600">เดือนที่ดีที่สุด</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">${maxRevenue}K</p>
        </motion.div>
      </div> */}

      {/* Chart */}
      <div className="h-80 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
          >
            {/* กริด */}
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e1e5e9"
              opacity={0.6}
            />

            {/* แกน X */}
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />

            {/* แกน Y ซ้าย (ยอดเงิน) */}
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => `฿${v}`}
              axisLine={false}
              tickLine={false}
            />

            {/* แกน Y ขวา (ราคาเฉลี่ย) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => `${v}฿`}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />

            <Legend
              wrapperStyle={{
                fontSize: '12px',
                color: '#64748b',
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'center',
                gap: '32px'
              }}
              verticalAlign="bottom"
              height={40}
              iconSize={10}
              iconType="circle"
            />

            {/* ✅ แท่งยอดเงิน - Gradient Blue */}
            <Bar
              yAxisId="left"
              dataKey="revenue"
              name="ยอดขาย (ล้านบาท)"
              fill="url(#revenueGradient)"
              radius={[12, 12, 0, 0]}
              barSize={64}
            />
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.4} />
              </linearGradient>

              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>

            {/* ✅ เส้นราคาเฉลี่ย - Gradient Orange */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgPrice"
              name="ราคาเฉลี่ย (บาท/กก.)"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: '#ffffff',
                stroke: '#f59e0b',
                strokeWidth: 2
              }}
              activeDot={{
                r: 4,
                fill: '#ffffff',
                stroke: '#f59e0b',
                strokeWidth: 3
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </motion.div>
  );
}
