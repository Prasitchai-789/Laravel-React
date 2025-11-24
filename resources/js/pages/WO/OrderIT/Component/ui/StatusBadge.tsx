import React from 'react';
import { Settings, CheckCircle, XCircle, Package } from "lucide-react";
import { ITOrder } from '../../types/order';

interface StatusBadgeProps {
    status: ITOrder["status"];
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    size = 'md',
    showIcon = true
}) => {
    const sizeClasses = {
        sm: 'px-3 py-1 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-lg'
    };

    const statusColors = {
        "ใช้งานอยู่": "bg-gradient-to-r from-green-500 to-green-600 text-white border border-green-200",
        "พร้อมใช้งาน": "bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-200",
        "ไม่พร้อมใช้งาน": "bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-200"
    };

    const StatusIcon = ({ status }: { status: ITOrder["status"] }) => {
        const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';

        switch (status) {
            case "ใช้งานอยู่": return <Settings className={`${iconSize}`} />;
            case "พร้อมใช้งาน": return <CheckCircle className={`${iconSize}`} />;
            case "ไม่พร้อมใช้งาน": return <XCircle className={`${iconSize}`} />;
            default: return <Package className={`${iconSize}`} />;
        }
    };

    return (
        <span className={`inline-flex items-center rounded-xl font-bold ${statusColors[status]} ${sizeClasses[size]}`}>
            {showIcon && <StatusIcon status={status} className="mr-2 flex-shrink-0" />}
            {status}
        </span>
    );
};
