import React from 'react';
import { Badge } from '@/components/ui/badge';

interface Props {
    status: 'pending' | 'confirmed' | 'production' | 'completed' | 'cancelled';
}

const statusConfig = {
    pending: { label: 'รอดำเนินการ', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
    confirmed: { label: 'ยืนยันแล้ว', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
    production: { label: 'กำลังผลิต', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
    completed: { label: 'เสร็จสิ้น', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
    cancelled: { label: 'ยกเลิก', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
};

export default function PlanOrderStatusBadge({ status }: Props) {
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
        <Badge className={config.className}>
            {config.label}
        </Badge>
    );
}