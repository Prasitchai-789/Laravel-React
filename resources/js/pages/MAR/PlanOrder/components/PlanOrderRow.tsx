import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, FileText, Truck } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PlanOrderStatusBadge from './PlanOrderStatusBadge';

interface PlanOrder {
    id: number;
    orderNumber: string;
    orderDate: string;
    productName: string;
    licensePlate: string;
    driverName: string;
    customerName: string;
    netWeight: number;
    unit: string;
    status: 'pending' | 'confirmed' | 'production' | 'completed' | 'cancelled';
}

interface Props {
    order: PlanOrder;
    isSelected: boolean;
    onSelect: (id: number) => void;
}

// ฟังก์ชันจัดรูปแบบวันที่
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear() + 543;
    
    return `${day}/${month}/${year}`;
};

// ฟังก์ชันจัดรูปแบบน้ำหนัก
const formatWeight = (weight: number, unit: string = 'กก.') => {
    return new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(weight) + ' ' + unit;
};

export default function PlanOrderRow({ order, isSelected, onSelect }: Props) {
    return (
        <TableRow className={isSelected ? 'bg-blue-50' : ''}>
            <TableCell className="w-12">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect(order.id)}
                />
            </TableCell>
            
            <TableCell>
                <div className="text-sm">
                    {formatDate(order.orderDate)}
                </div>
            </TableCell>
            
            <TableCell>
                <div className="text-sm font-medium">
                    {order.productName}
                </div>
            </TableCell>
            
            <TableCell>
                <div className="text-sm">
                    {order.licensePlate || '-'}
                </div>
            </TableCell>
            
            <TableCell>
                <div className="text-sm">
                    {order.driverName || '-'}
                </div>
            </TableCell>
            
            <TableCell>
                <div className="text-sm">
                    {order.customerName}
                </div>
            </TableCell>
            
            <TableCell className="text-right">
                <div className="text-sm font-medium">
                    {formatWeight(order.netWeight, order.unit)}
                </div>
            </TableCell>
            
            <TableCell>
                <PlanOrderStatusBadge status={order.status} />
            </TableCell>
            
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span>ดูรายละเอียด</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            <span>แก้ไข</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            <span>จัดส่ง</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}