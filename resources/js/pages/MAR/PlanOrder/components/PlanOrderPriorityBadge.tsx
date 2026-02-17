import React from 'react';
import { Badge } from '@/components/ui/badge';

interface Props {
    priority: 'normal' | 'high' | 'urgent';
}

const priorityConfig = {
    normal: { label: 'ปกติ', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
    high: { label: 'สูง', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
    urgent: { label: 'ด่วน', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
};

export default function PlanOrderPriorityBadge({ priority }: Props) {
    const config = priorityConfig[priority] || priorityConfig.normal;
    
    return (
        <Badge className={config.className}>
            {config.label}
        </Badge>
    );
}