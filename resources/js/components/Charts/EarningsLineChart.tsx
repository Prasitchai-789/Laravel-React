import { Calendar } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EarningsLineChartProps {
  total?: number;
  growth?: number;
  difference?: number;
  label?: string;
  data?: { name: string; value: number }[];
}

export default function EarningsLineChart({
  total = 894.39,
  difference = 200.1,
  growth = 36,
  label = "Delivery Orders",
  data = [
    { name: "Jan", value: 30 },
    { name: "Feb", value: 60 },
    { name: "Mar", value: 40 },
    { name: "Apr", value: 70 },
    { name: "May", value: 50 },
    { name: "Jun", value: 169 },
    { name: "Jul", value: 55 },
    { name: "Aug", value: 60 },
    { name: "Sep", value: 45 },
    { name: "Oct", value: 65 },
    { name: "Nov", value: 50 },
    { name: "Dec", value: 200 },
  ],
}: EarningsLineChartProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6 w-full max-w-2xl">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-gray-800 font-semibold text-lg mb-1">Earnings</h3>
          <div className="flex items-end space-x-2">
            <span className="text-3xl font-bold text-gray-900">
              ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xl font-semibold text-gray-500">
              /+${difference.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span className="bg-emerald-100 text-emerald-600 text-xs font-semibold px-2 py-1 rounded-md">
              {growth}%
            </span>
          </div>
          <p className="text-gray-500 mt-2 text-sm">{label}</p>
        </div>

        <div className="flex items-center text-gray-400 text-sm space-x-2">
          <span>dd/mm/yyyy</span>
          <Calendar size={16} />
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fill: "#6b7280" }} axisLine={false} />
            <YAxis tick={{ fill: "#6b7280" }} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "white",
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              cursor={{ stroke: "#3b82f6", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              fill="url(#earnGrad)"
              strokeWidth={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
