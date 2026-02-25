// resources/js/pages/MAR/PlanOrder/components/PlanOrderTable.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    AlertCircle,
    ArrowUpDown,
    Building2,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Download,
    Edit,
    Eye,
    FileSpreadsheet,
    FileText,
    Hash,
    HelpCircle,
    MapPin,
    MoreHorizontal,
    Package,
    Printer,
    Scale,
    Settings2,
    Shield,
    Trash2,
    TrendingUp,
    Truck,
    User,
    XCircle,
    FileCheck,
    ClipboardCheck,
    Pencil,
    Droplets,
    Flower2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';

export interface PlanOrder {
    id: number;
    orderNumber: string;
    orderDate: string;
    productName: string;
    productType?: string;
    customerName: string | null;
    customerCode?: string | null;
    customerID?: string | null;
    licensePlate?: string | null;
    driverName?: string | null;
    netWeight: number;
    unit: string;
    displayWeight?: string;
    coaNumber?: string;
    destination?: string | null;
    priority?: 'high' | 'medium' | 'normal';
    status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'confirmed' | 'production';
    isInspected?: boolean;
    rawData?: {
        sopId?: string;
        goodId?: string;
        ibWei?: string;
        obWei?: string;
        netWei?: string;
        goodPrice?: string;
        goodAmnt?: string;
        remarks?: string;
        statusCoa?: string;
        coaNumber?: string;
        originalStatus?: string;
        originalCustID?: string;
        custCode?: string;
        custName?: string;
        amntLoad?: string;
    };
}

interface Props {
    orders: PlanOrder[];
    selectedOrders?: number[];
    onSelectOrder?: (orderId: number) => void;
    onSelectAll?: () => void;
    stats?: {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        cancelled: number;
        totalWeight: number;
        confirmed?: number;
        production?: number;
    };
    onViewDetails?: (order: PlanOrder) => void;
    onEdit?: (order: PlanOrder) => void;
    onDelete?: (order: PlanOrder) => Promise<void> | void;
    onStatusChange?: (order: PlanOrder, status: string) => void;
    onGeneratePDF?: (order: PlanOrder, type: string) => void;
    onPrint?: (order: PlanOrder, type: string) => void;
    onDownloadPDF?: (order: PlanOrder, type: string) => void;
    onEmailPDF?: (order: PlanOrder, type: string) => void;
    onCheckVehicle?: (order: PlanOrder) => void;
    onGenerateCOA?: (order: PlanOrder, type: string) => void;
    onEditClick?: (order: PlanOrder) => void;
}

// ============ STATUS CONFIG ============
const STATUS_CONFIG = {
    pending: {
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        icon: Clock,
        label: 'รอ',
    },
    confirmed: {
        color: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500',
        icon: CheckCircle,
        label: 'ยืนยัน',
    },
    production: {
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500',
        icon: Package,
        label: 'ผลิต',
    },
    processing: {
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        icon: TrendingUp,
        label: 'ดำเนินการ',
    },
    completed: {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: CheckCircle,
        label: 'เสร็จ',
    },
    cancelled: {
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        icon: XCircle,
        label: 'ยกเลิก',
    },
};

const DEFAULT_STATUS = {
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    dot: 'bg-gray-500',
    icon: HelpCircle,
    label: 'ไม่ทราบ',
};

// ============ PDF Options ============
const getPDFOptions = (productType?: string) => {
    const type = productType?.toLowerCase() || '';

    const baseOptions = [
        { value: 'coa_isp', label: 'ดาวน์โหลด COA ISP', icon: FileCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
        { value: 'coa_mun', label: 'ดาวน์โหลด COA MUN', icon: FileCheck, color: 'text-green-600', bg: 'bg-green-50' },
    ];

    const vehicleCheckOption = {
        value: 'check_vehicle',
        label: 'ตรวจเช็คสภาพรถ (บันทึกข้อมูล)',
        icon: ClipboardCheck,
        color: 'text-purple-600',
        bg: 'bg-purple-50'
    };

    const generateCarOption = {
        value: 'generate_car_pdf',
        label: 'ดาวน์โหลดเอกสาร CAR (PDF)',
        icon: FileText,
        color: 'text-rose-600',
        bg: 'bg-rose-50'
    };

    if (type === 'kernel' || type === 'palm-kernel' || type.includes('kernel')) {
        return [
            ...baseOptions,
            generateCarOption,
        ];
    } else if (type === 'cpo' || type.includes('cpo') || type.includes('น้ำมัน')) {
        return [
            ...baseOptions,
        ];
    } else {
        // สำหรับสินค้าอื่นๆ ไม่ต้องแสดงเมนูเอกสารใดๆ
        return [];
    }
};

export default function PlanOrderTable({
    orders = [],
    selectedOrders = [],
    onSelectOrder,
    onSelectAll,
    stats,
    onViewDetails,
    onEdit,
    onDelete,
    onStatusChange,
    onGeneratePDF,
    onPrint,
    onDownloadPDF,
    onEmailPDF,
    onCheckVehicle,
    onGenerateCOA,
    onEditClick,
}: Props) {
    console.log('📦 PlanOrderTable received orders:', orders?.length || 0, 'records');


    // State สำหรับเรียงลำดับ
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
        key: 'orderNumber',
        direction: 'desc'
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PlanOrder | null>(null);

    const ordersArray = Array.isArray(orders) ? orders : [];

    // ฟังก์ชันสกัดตัวเลขจาก SOPID
    const extractNumberFromId = (id: string): number => {
        if (!id) return 0;
        const numbers = id.replace(/[^0-9]/g, '');
        return numbers ? parseInt(numbers, 10) : 0;
    };

    // เรียงลำดับ
    const sortedOrders = useMemo(() => {
        if (!ordersArray.length) return [];

        const sortableOrders = [...ordersArray];

        if (sortConfig !== null) {
            sortableOrders.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof PlanOrder];
                const bValue = b[sortConfig.key as keyof PlanOrder];

                if (aValue == null || bValue == null) return 0;

                if (sortConfig.key === 'orderNumber') {
                    const aNum = extractNumberFromId(String(aValue));
                    const bNum = extractNumberFromId(String(bValue));
                    return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
                }

                if (sortConfig.key === 'orderDate') {
                    const aDate = new Date(String(aValue)).getTime();
                    const bDate = new Date(String(bValue)).getTime();
                    if (!isNaN(aDate) && !isNaN(bDate)) {
                        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
                    }
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
                }

                return 0;
            });
        }

        return sortableOrders;
    }, [ordersArray, sortConfig]);

    // แบ่งหน้า
    const paginatedOrders = useMemo(() => {
        if (!sortedOrders.length) return [];
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return sortedOrders.slice(start, end);
    }, [sortedOrders, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(sortedOrders.length / rowsPerPage);
    const startItem = sortedOrders.length ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * rowsPerPage, sortedOrders.length);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            setSortConfig(null);
            return;
        }
        setSortConfig({ key, direction });
    };

    // ============ ฟังก์ชันจัดการแก้ไข ============
    const handleEditClick = (order: PlanOrder) => {
        if (onEdit) {
            onEdit(order);
        } else if (onEditClick) {
            onEditClick(order);
        }
    };


    // ============ ฟังก์ชันอื่นๆ ============
    const handleDelete = (order: PlanOrder) => {
        setSelectedOrder(order);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (selectedOrder && onDelete) {
            onDelete(selectedOrder);
        }
        setShowDeleteDialog(false);
        setSelectedOrder(null);
    };

    const handlePDFAction = (order: PlanOrder, action: 'generate' | 'print' | 'download' | 'email', type: string) => {
        if (type === 'oil_coa' || type === 'seed_coa') {
            if (action === 'generate' && onGenerateCOA) {
                onGenerateCOA(order, type);
            }
            return;
        }

        if (type === 'coa_isp' || type === 'coa_mun') {
            onGeneratePDF?.(order, type);
            return;
        }

        switch (action) {
            case 'generate':
                onGeneratePDF?.(order, type);
                break;
            case 'print':
                onPrint?.(order, type);
                break;
            case 'download':
                onDownloadPDF?.(order, type);
                break;
            case 'email':
                onEmailPDF?.(order, type);
                break;
        }
    };

    // ฟังก์ชันแปลงวันที่เป็นรูปแบบ DD/MM/YYYY (ไทย)
    const formatDateThai = (dateString: string) => {
        if (!dateString) return '-';
        try {
            let date: Date;
            if (dateString.includes('/')) {
                const [day, month, year] = dateString.split(' ')[0].split('/');
                date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
                date = new Date(dateString);
            }

            return date.toLocaleDateString('th-TH', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    const formatWeight = (weight: number, unit: string) => {
        if (weight === undefined || weight === null) return '-';
        return `${weight.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })} ${unit}`;
    };

    const getStatusConfig = (status: string) => {
        return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || DEFAULT_STATUS;
    };

    return (
        <TooltipProvider>
            <div className="space-y-4 font-anuphut">

                {/* ตารางข้อมูล */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md font-anuphut">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/80">
                                    <TableHead
                                        className="w-[110px] cursor-pointer transition-colors hover:bg-gray-200/80"
                                        onClick={() => requestSort('orderDate')}
                                    >
                                        <div className="flex items-center gap-1.5 font-medium text-gray-700">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            <span>วันที่</span>
                                            {sortConfig?.key === 'orderDate' && (
                                                <ArrowUpDown
                                                    className={`h-3.5 w-3.5 text-blue-600 transition-transform duration-300 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''
                                                        }`}
                                                />
                                            )}
                                        </div>
                                    </TableHead>

                                    <TableHead
                                        className="cursor-pointer transition-colors hover:bg-gray-200/80"
                                        onClick={() => requestSort('orderNumber')}
                                    >
                                        <div className="flex items-center gap-1.5 font-medium text-gray-700">
                                            <Hash className="h-4 w-4 text-gray-500" />
                                            <span>เลขที่ (SOPID)</span>
                                            {sortConfig?.key === 'orderNumber' && (
                                                <ArrowUpDown
                                                    className={`h-3.5 w-3.5 text-blue-600 transition-transform duration-300 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''
                                                        }`}
                                                />
                                            )}
                                        </div>
                                    </TableHead>

                                    <TableHead>
                                        <div className="flex items-center gap-1.5 font-medium text-gray-700">
                                            <FileCheck className="h-4 w-4 text-gray-500" />
                                            <span>COA No.</span>
                                        </div>
                                    </TableHead>

                                    <TableHead
                                        className="cursor-pointer transition-colors hover:bg-gray-200/80"
                                        onClick={() => requestSort('productName')}
                                    >
                                        <div className="flex items-center gap-1.5 font-medium text-gray-700">
                                            <Package className="h-4 w-4 text-gray-500" />
                                            <span>สินค้า</span>
                                            {sortConfig?.key === 'productName' && (
                                                <ArrowUpDown
                                                    className={`h-3.5 w-3.5 text-blue-600 transition-transform duration-300 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''
                                                        }`}
                                                />
                                            )}
                                        </div>
                                    </TableHead>

                                    <TableHead
                                        className="cursor-pointer transition-colors hover:bg-gray-200/80"
                                        onClick={() => requestSort('customerName')}
                                    >
                                        <div className="flex items-center gap-1.5 font-medium text-gray-700">
                                            <Building2 className="h-4 w-4 text-gray-500" />
                                            <span>คู่ค้า</span>
                                            {sortConfig?.key === 'customerName' && (
                                                <ArrowUpDown
                                                    className={`h-3.5 w-3.5 text-blue-600 transition-transform duration-300 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''
                                                        }`}
                                                />
                                            )}
                                        </div>
                                    </TableHead>

                                    <TableHead>ขนส่ง</TableHead>

                                    <TableHead
                                        className="w-[130px] cursor-pointer text-right transition-colors hover:bg-gray-200/80"
                                        onClick={() => requestSort('netWeight')}
                                    >
                                        <div className="flex items-center justify-end gap-1.5 font-medium text-gray-700">
                                            <Scale className="h-4 w-4 text-gray-500" />
                                            <span>น้ำหนัก</span>
                                            {sortConfig?.key === 'netWeight' && (
                                                <ArrowUpDown
                                                    className={`h-3.5 w-3.5 text-blue-600 transition-transform duration-300 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''
                                                        }`}
                                                />
                                            )}
                                        </div>
                                    </TableHead>

                                    <TableHead className="w-[80px]">
                                        <div className="flex items-center gap-1.5 font-medium text-gray-700">
                                            <Shield className="h-4 w-4 text-gray-500" />
                                            <span>สถานะ</span>
                                        </div>
                                    </TableHead>

                                    <TableHead className="w-[50px] text-center">
                                        <div className="flex items-center justify-center">
                                            <Settings2 className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {!ordersArray.length ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="rounded-2xl bg-gray-100 p-4">
                                                    <AlertCircle className="h-12 w-12 text-gray-400" />
                                                </div>
                                                <p className="text-lg font-medium text-gray-600">ไม่พบข้อมูล</p>
                                                <p className="text-sm text-gray-400">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedOrders.map((order, index) => {
                                        const statusConfig = getStatusConfig(order.status || 'pending');
                                        const StatusIcon = statusConfig.icon;

                                        return (
                                            <TableRow
                                                key={order.id || index}
                                                className={`group transition-all duration-200 hover:bg-blue-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {formatDateThai(order.orderDate)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="inline-block rounded-lg bg-blue-50/50 px-2 py-1 font-mono text-xs font-medium text-blue-600">
                                                        {order.orderNumber || '-'}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="inline-block rounded-lg bg-emerald-50/50 px-2 py-1 font-mono text-xs font-medium text-emerald-600">
                                                        {order.rawData?.coaNumber || '-'}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{order.productName || '-'}</div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
                                                        <div className="min-w-0">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                        className="max-w-[200px] truncate text-sm font-medium"
                                                                        title={order.customerName || ''}
                                                                    >
                                                                        {order.customerName || 'ไม่ระบุลูกค้า'}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="max-w-xs text-xs break-words">
                                                                    {order.customerName || 'ไม่ระบุลูกค้า'}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {order.licensePlate && (
                                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                                <Truck className="h-3 w-3 shrink-0 text-gray-500" />
                                                                <span className="max-w-[100px] truncate text-gray-700" title={order.licensePlate}>
                                                                    {order.licensePlate}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {order.driverName && (
                                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                                <User className="h-3 w-3 shrink-0 text-gray-500" />
                                                                <span className="max-w-[100px] truncate text-gray-700" title={order.driverName}>
                                                                    {order.driverName}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {order.destination && (
                                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                                <MapPin className="h-3 w-3 shrink-0 text-gray-500" />
                                                                <span className="max-w-[100px] truncate text-gray-700" title={order.destination}>
                                                                    {order.destination}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {!order.licensePlate && !order.driverName && (
                                                            <span className="text-[10px] text-gray-400">-</span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {formatWeight(order.netWeight, order.unit)}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <Badge
                                                        className={`${statusConfig.color} flex w-fit items-center gap-1 border px-2 py-0.5 text-[10px] shadow-sm transition-all hover:shadow`}
                                                    >
                                                        <StatusIcon className="h-3 w-3" />
                                                        {statusConfig.label}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 rounded-lg p-0 transition-all hover:scale-105 hover:bg-gray-100"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>

                                                        <DropdownMenuContent align="end" className="w-64">
                                                            <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                                                                <div className="rounded-lg bg-blue-100 p-1">
                                                                    <Package className="h-3 w-3 text-blue-600" />
                                                                </div>
                                                                <span>จัดการคำสั่งซื้อ</span>
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuSeparator />

                                                            <DropdownMenuItem
                                                                onClick={() => handleEditClick(order)}
                                                                className="gap-2 text-xs cursor-pointer"
                                                            >
                                                                <div className="rounded bg-amber-100 p-1">
                                                                    <Pencil className="h-3 w-3 text-amber-600" />
                                                                </div>
                                                                <span>แก้ไขข้อมูล</span>
                                                            </DropdownMenuItem>

                                                            {getPDFOptions(order.productType).length > 0 && (
                                                                <>
                                                                    <DropdownMenuSeparator />

                                                                    <DropdownMenuLabel className="text-[10px] text-gray-500">
                                                                        เอกสาร
                                                                    </DropdownMenuLabel>

                                                                    {getPDFOptions(order.productType).map((pdf, idx) => {
                                                                        // ล็อกการดาวน์โหลด COA ไว้จนกว่าจะอนุมัติผลแลป (Status A)
                                                                        const isDownloadCOA = pdf.value === 'coa_isp' || pdf.value === 'coa_mun';
                                                                        const isDownloadCAR = pdf.value === 'generate_car_pdf';
                                                                        const isApproved = order.rawData?.statusCoa === 'A';
                                                                        const isInspected = order.isInspected;
                                                                        const isDisabled = (isDownloadCOA && !isApproved) || (isDownloadCAR && !isInspected);

                                                                        const Icon = pdf.icon;
                                                                        return (
                                                                            <DropdownMenuItem
                                                                                key={idx}
                                                                                disabled={isDisabled}
                                                                                onClick={() => {
                                                                                    if (isDisabled) return;
                                                                                    if (pdf.value === 'check_vehicle' && onCheckVehicle) {
                                                                                        onCheckVehicle(order);
                                                                                    } else {
                                                                                        handlePDFAction(order, 'generate', pdf.value);
                                                                                    }
                                                                                }}
                                                                                className={`gap-2 text-xs cursor-pointer ${isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                                                            >
                                                                                <div className={`rounded p-1 ${pdf.bg}`}>
                                                                                    <Icon className={`h-3 w-3 ${pdf.color}`} />
                                                                                </div>
                                                                                <div className="flex flex-col">
                                                                                    <span>{pdf.label}</span>
                                                                                    {isDownloadCOA && !isApproved && <span className="text-[9px] text-rose-500 font-bold">รออนุมัติผล LAB</span>}
                                                                                    {isDownloadCAR && !isInspected && <span className="text-[9px] text-rose-500 font-bold">ยังไม่บันทึกข้อมูลรถ</span>}
                                                                                </div>
                                                                            </DropdownMenuItem>
                                                                        );
                                                                    })}

                                                                    <DropdownMenuSeparator />
                                                                </>
                                                            )}

                                                            <DropdownMenuItem
                                                                onClick={async () => {
                                                                    const confirmed = await Swal.fire({
                                                                        title: 'ยืนยันการยกเลิก?',
                                                                        text: "คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?",
                                                                        icon: 'warning',
                                                                        showCancelButton: true,
                                                                        confirmButtonColor: '#ef4444',
                                                                        cancelButtonColor: '#6b7280',
                                                                        confirmButtonText: 'ใช่, ยกเลิก!',
                                                                        cancelButtonText: 'กลับ'
                                                                    });
                                                                    if (confirmed.isConfirmed) {
                                                                        onStatusChange?.(order, 'cancelled');
                                                                    }
                                                                }}
                                                                className="gap-2 text-xs text-orange-600 focus:text-orange-600 cursor-pointer"
                                                            >
                                                                <div className="rounded bg-orange-100 p-1">
                                                                    <XCircle className="h-3 w-3 text-orange-600" />
                                                                </div>
                                                                <span>ยกเลิก</span>
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(order)}
                                                                className="gap-2 text-xs text-rose-600 focus:text-rose-600 cursor-pointer"
                                                            >
                                                                <div className="rounded bg-rose-100 p-1">
                                                                    <Trash2 className="h-3 w-3 text-rose-600" />
                                                                </div>
                                                                <span>ลบ</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {sortedOrders.length > 0 && (
                        <div className="flex items-center justify-between border-t bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-3">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600">
                                    แสดง {startItem} - {endItem} จาก {sortedOrders.length} รายการ
                                </div>
                                {sortConfig && (
                                    <div className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] text-blue-600">
                                        เรียงตาม: {sortConfig.key === 'orderNumber' ? 'SOPID' : sortConfig.key} {sortConfig.direction === 'desc' ? '↓' : '↑'}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="h-7 w-7 p-0 transition-transform hover:scale-110"
                                >
                                    <ChevronsLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="h-7 w-7 p-0 transition-transform hover:scale-110"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>

                                <div className="mx-2 flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum = i + 1;
                                        if (totalPages > 5 && currentPage > 3) {
                                            pageNum = currentPage - 3 + i;
                                        }
                                        if (pageNum <= totalPages && pageNum > 0) {
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`h-7 w-7 p-0 text-xs font-medium transition-all ${currentPage === pageNum
                                                        ? 'scale-110 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                                                        : 'hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        }
                                        return null;
                                    })}
                                    {totalPages > 5 && currentPage < totalPages - 2 && (
                                        <span className="mx-1 text-xs text-gray-400">...</span>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-7 w-7 p-0 transition-transform hover:scale-110"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="h-7 w-7 p-0 transition-transform hover:scale-110"
                                >
                                    <ChevronsRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base">
                                <div className="rounded-lg bg-red-100 p-2">
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </div>
                                <span>ยืนยันการลบ</span>
                            </DialogTitle>
                            <DialogDescription className="pt-2 text-sm">
                                คุณต้องการลบรายการ <span className="font-semibold text-gray-900">{selectedOrder?.orderNumber}</span> ใช่หรือไม่?
                                <br />
                                <span className="mt-2 block text-xs text-red-600">การดำเนินการนี้ไม่สามารถเรียกคืนได้</span>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)} className="text-xs">
                                ยกเลิก
                            </Button>
                            <Button variant="destructive" size="sm" onClick={confirmDelete} className="gap-2 text-xs">
                                <Trash2 className="h-3.5 w-3.5" />
                                ลบ
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}