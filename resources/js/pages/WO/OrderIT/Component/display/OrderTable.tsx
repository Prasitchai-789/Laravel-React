import React from 'react';
import { User, Building, MapPin, Target, Users } from 'lucide-react';
import { ITOrder } from '../../types/order';
import { CategoryIcon } from '../ui/CategoryIcon';
import { StatusBadge } from '../ui/StatusBadge';
import { EmptyState } from './EmptyState';

interface OrderTableProps {
    orders: ITOrder[];
    onOrderClick: (order: ITOrder) => void;
}


export const OrderTable: React.FC<OrderTableProps> = ({ orders, onOrderClick }) => {
    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <EmptyState />
            </div>
        );
    }

     console.log(orders);

    return (
        <div className="bg-white rounded-4xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-[300px]">
                                อุปกรณ์
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-[200px]">
                                ผู้ขอ
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-[350px]">
                                สเปค
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-[250px]">
                                สถานที่
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-[180px]">
                                ผู้รับผิดชอบ
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-[180px]">
                                สถานะ
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {orders.map((order) => (
                            <tr
                                key={order.id}
                                className="hover:bg-blue-50 transition-all duration-200 group cursor-pointer"
                                onClick={() => onOrderClick(order)}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                                            <CategoryIcon category={order.category} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-900 text-lg leading-tight mb-1">
                                                {order.productName}

                                            </div>
                                            <div className="text-gray-500 text-sm mb-1">
                                                {order.brand} {order.model}
                                            </div>
                                            <div className="text-gray-400 text-xs">รหัส: {order.productCode}</div>
                                            <div className="text-gray-400 text-xs">Order: {order.orderNumber}</div>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <div className="font-semibold text-gray-900">{order.requester}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Building className="w-4 h-4 text-gray-400" />
                                            <div className="text-gray-500 text-sm">{order.department}</div>
                                        </div>
                                        <div className="text-gray-400 text-xs">{order.orderDate}</div>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                                            {order.specification}
                                        </p>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <div className="text-gray-700 font-medium text-sm leading-relaxed line-clamp-2">
                                                {order.location}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Target className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <div className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                                                {order.purpose}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    {order.assignee ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                <div className="font-semibold text-gray-900">{order.assignee}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-400 text-sm flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            ยังไม่มีผู้รับผิดชอบ
                                        </div>
                                    )}
                                </td>

                                <td className="px-6 py-4">
                                    <div className="space-y-2">
                                        <StatusBadge status={order.status} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
