import React from 'react';
import { Badge } from '@/components/ui/badge';

interface Props {
    status: 'W' | 'P' | 'F' | 'C';
}

const statusConfig = {
    W: { label: 'กำลังรอ', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
    P: { label: 'ดำเนินการ', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
    F: { label: 'สิ้นสุด', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
    C: { label: 'ยกเลิก', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
};

export default function PlanOrderStatusBadge({ status }: Props) {
    const config = statusConfig[status] || statusConfig.W;
    
    return (
        <Badge className={config.className}>
            {config.label}
        </Badge>
    );
}
