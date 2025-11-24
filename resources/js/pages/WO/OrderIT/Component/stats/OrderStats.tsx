import React from 'react';
import { BarChart3, Settings, CheckCircle, XCircle } from 'lucide-react';
import { ITOrder } from '../../types/order';

interface OrderStatsProps {
    orders: ITOrder[];
    totalCount?: number;
}

export const OrderStats: React.FC<OrderStatsProps> = ({ orders, totalCount }) => {
    const stats = [
        {
            label: "อุปกรณ์ทั้งหมด",
            value: totalCount || orders.length,
            color: "blue",
            icon: BarChart3
        },
        {
            label: "ใช้งานอยู่",
            value: orders.filter(o => o.status === "ใช้งานอยู่").length,
            color: "green",
            icon: Settings
        },
        {
            label: "พร้อมใช้งาน",
            value: orders.filter(o => o.status === "พร้อมใช้งาน").length,
            color: "blue",
            icon: CheckCircle
        },
        {
            label: "ไม่พร้อมใช้งาน",
            value: orders.filter(o => o.status === "ไม่พร้อมใช้งาน").length,
            color: "red",
            icon: XCircle
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide">
                            {stat.label}
                        </h3>
                        <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
                    </div>
                    <p className="text-3xl font-bold text-gray-800 mb-2">{stat.value}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`bg-${stat.color}-500 h-2 rounded-full transition-all duration-1000`}
                            style={{ width: `${totalCount ? (stat.value / totalCount) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};
