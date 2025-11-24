import React from 'react';
import { ITOrder } from '../../types/order';

interface OrderCardProps {
    order: ITOrder;
    onClick: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
    return (
        <div
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 leading-tight mb-1">
                        {order.productName}
                    </div>
                    <div className="text-gray-500 text-sm">
                        {order.brand} {order.model}
                    </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold ${
                    order.status === "ใช้งานอยู่" ? "bg-green-500 text-white" :
                    order.status === "พร้อมใช้งาน" ? "bg-blue-500 text-white" :
                    "bg-red-500 text-white"
                }`}>
                    {order.status}
                </span>
            </div>

            <div className="text-sm text-gray-500">
                ผู้ขอ: {order.requester} | แผนก: {order.department}
            </div>
        </div>
    );
};

interface OrderCardListProps {
    orders: ITOrder[];
    onOrderClick: (order: ITOrder) => void;
}

export const OrderCardList: React.FC<OrderCardListProps> = ({ orders, onOrderClick }) => {
    return (
        <div className="space-y-6">
            {orders.map((order) => (
                <OrderCard
                    key={order.id}
                    order={order}
                    onClick={() => onOrderClick(order)}
                />
            ))}
        </div>
    );
};
