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
    id: number | string;
    orderNumber: string;
    loadingRequestNumber?: string;
    orderDate: string;
    productName: string;
    productType?: string;
    customerName: string | null;
    customerCode?: string | null;
    customerID?: string | null;
    licensePlate?: string | null;
    driverName?: string | null;
    netWeight: number; // Actual weight
    plannedWeight: number; // Planned weight
    unit: string;
    displayWeight?: string;
    coaNumber?: string;
    destination?: string | null;
    priority?: 'high' | 'medium' | 'normal';
    status: 'W' | 'P' | 'F' | 'C';
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
        loadingRequestNumber?: string;
        originalStatus?: string;
        originalCustID?: string;
        custCode?: string;
        custName?: string;
        amntLoad?: string;
    };
}

interface Props {
    orders: PlanOrder[];
    selectedOrders?: (number | string)[];
    onSelectOrder?: (orderId: number | string) => void;
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
    W: {
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        icon: Clock,
        label: 'กำลังรอ',
    },
    P: {
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        icon: TrendingUp,
        label: 'ดำเนินการ',
    },
    F: {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: CheckCircle,
        label: 'สิ้นสุด',
    },
    C: {
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
    // State สำหรับเรียงลำดับ
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
        key: 'orderNumber',
        direction: 'desc'
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);

    const ordersArray = Array.isArray(orders) ? orders : [];

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
        if (onDelete) {
            onDelete(order);
        }
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
                // Handle 'YYYY-MM-DD HH:mm:ss.0000000' or 'YYYY-MM-DD'
                const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString.split(' ')[0];
                date = new Date(dateOnly);
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
                <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-0 bg-gradient-to-r from-blue-800 to-blue-700 hover:bg-transparent">
                                    <TableHead
                                        className="w-[120px] cursor-pointer px-4 py-4 transition-colors hover:bg-blue-600/30 rounded-tl-2xl"
                                        onClick={() => requestSort('orderDate')}
                                    >
                                        <div className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap text-white">
                                            <Calendar className="h-3.5 w-3.5 text-blue-200" />
                                            <span>วันที่</span>
                                            {sortConfig?.key === 'orderDate' && (
                                                <ArrowUpDown className={`h-3 w-3 text-white transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                            )}
                                        </div>
                                    </TableHead>

                                    <TableHead
                                        className="cursor-pointer px-4 py-4 transition-colors hover:bg-blue-600/30 border-l border-blue-600"
                                        onClick={() => requestSort('productName')}
                                    >
                                        <div className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap text-white">
                                            <Package className="h-3.5 w-3.5 text-emerald-300" />
                                            <span>สินค้า</span>
                                            {sortConfig?.key === 'productName' && (
                                                <ArrowUpDown className={`h-3 w-3 text-white transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                            )}
                                        </div>
                                    </TableHead>

                                    <TableHead
                                        className="cursor-pointer px-4 py-4 transition-colors hover:bg-blue-600/30 border-l border-blue-600"
                                        onClick={() => requestSort('customerName')}
                                    >
                                        <div className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap text-white">
                                            <Building2 className="h-3.5 w-3.5 text-blue-200" />
                                            <span>คู่ค้า & ปลายทาง</span>
                                            {sortConfig?.key === 'customerName' && (
                                                <ArrowUpDown className={`h-3 w-3 text-white transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                            )}
                                        </div>
                                    </TableHead>

                                    <TableHead className="px-4 py-4 border-l border-blue-600">
                                        <div className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap text-white">
                                            <Truck className="h-3.5 w-3.5 text-blue-200" />
                                            <span>ขนส่ง</span>
                                        </div>
                                    </TableHead>

                                    <TableHead
                                        className="w-[140px] cursor-pointer px-4 py-4 text-right transition-colors hover:bg-blue-600/30 border-l border-blue-600"
                                        onClick={() => requestSort('netWeight')}
                                    >
                                        <div className="flex items-center justify-end gap-1.5 text-xs font-bold whitespace-nowrap text-white">
                                            <Scale className="h-3.5 w-3.5 text-orange-300" />
                                            <span>น้ำหนัก (กก.)</span>
                                            {sortConfig?.key === 'netWeight' && (
                                                <ArrowUpDown className={`h-3 w-3 text-white transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                            )}
                                        </div>
                                    </TableHead>

                                    <TableHead className="w-[120px] px-4 py-4 border-l border-blue-600 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold whitespace-nowrap text-white">
                                            <Shield className="h-3.5 w-3.5 text-blue-200" />
                                            <span>สถานะ</span>
                                        </div>
                                    </TableHead>

                                    <TableHead className="w-[70px] px-2 py-4 text-center border-l border-blue-600">
                                        <div className="flex items-center justify-center">
                                            <Settings2 className="h-3.5 w-3.5 text-blue-200" />
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {!ordersArray.length ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-16 text-center">
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
                                        const statusConfig = getStatusConfig(order.status || 'W');
                                        const StatusIcon = statusConfig.icon;
                                        return (
                                            <TableRow
                                                key={order.id || index}
                                                className={`group transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'} hover:bg-blue-50/50`}
                                            >
                                                {/* วันที่ */}
                                                <TableCell className="px-4 py-3 align-middle border-l border-blue-50">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-semibold text-slate-800">
                                                            {formatDateThai(order.orderDate)}
                                                        </span>
                                                        {order.loadingRequestNumber && (
                                                            <span className="w-fit rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                                                {order.loadingRequestNumber}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* สินค้า */}
                                                <TableCell className="px-4 py-3 align-middle border-l border-blue-50">
                                                    <div className="flex min-w-0 flex-col gap-1">
                                                        <span className="truncate text-sm font-semibold text-slate-900">
                                                            {order.productName || '-'}
                                                        </span>
                                                        {order.rawData?.coaNumber && order.rawData.coaNumber !== '-' ? (
                                                            <span className="w-fit rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                                                {order.rawData.coaNumber}
                                                            </span>
                                                        ) : (
                                                            (order.productType === 'cpo' || order.productType === 'palm-kernel') && (
                                                                <span className="text-[10px] text-slate-400">ยังไม่มี COA</span>
                                                            )
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* คู่ค้า */}
                                                <TableCell className="px-4 py-3 align-middle border-l border-blue-50">
                                                    <div className="flex min-w-0 flex-col gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="flex max-w-[220px] items-center gap-1.5 truncate text-sm font-semibold text-slate-800">
                                                                    <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                                                                    {order.customerName || 'ไม่ระบุ'}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="max-w-xs text-xs break-words">
                                                                {order.customerName || 'ไม่ระบุลูกค้า'}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        {order.destination && (
                                                            <span className="flex max-w-[220px] items-center gap-1.5 truncate text-[10px] text-slate-500">
                                                                <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                                                                {order.destination}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* ขนส่ง */}
                                                <TableCell className="px-4 py-3 align-middle border-l border-blue-50">
                                                    <div className="flex min-w-0 flex-col gap-1">
                                                        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                                                            <Truck className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                            {order.licensePlate || '-'}
                                                        </span>
                                                        {order.driverName && (
                                                            <span className="flex max-w-[200px] items-center gap-1.5 truncate text-[10px] text-slate-500">
                                                                <User className="h-3 w-3 shrink-0 text-slate-400" />
                                                                {order.driverName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* น้ำหนัก */}
                                                <TableCell className="px-4 py-3 text-right align-middle border-l border-blue-50">
                                                    <span className="text-sm font-bold text-slate-800">
                                                        {formatWeight(order.netWeight, '')}
                                                    </span>
                                                </TableCell>

                                                {/* สถานะ */}
                                                <TableCell className="px-4 py-3 align-middle border-l border-blue-50 text-center">
                                                    <span className={`inline-flex w-[80px] items-center justify-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${statusConfig.color}`}>
                                                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusConfig.dot}`} />
                                                        {statusConfig.label}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-2 py-3 text-center border-l border-blue-50 bg-blue-50/20">
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

                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    const url = route('mar.plan-order.print-loading-request', {
                                                                        selectedOrders: [order.rawData?.sopId || order.id]
                                                                    });
                                                                    window.open(url, '_blank');
                                                                }}
                                                                className="gap-2 text-xs cursor-pointer"
                                                            >
                                                                <div className="rounded bg-blue-100 p-1">
                                                                    <Printer className="h-3 w-3 text-blue-600" />
                                                                </div>
                                                                <span>พิมพ์ใบขอเข้าบรรทุก</span>
                                                            </DropdownMenuItem>

                                                            {(order.productType === 'cpo' || order.productType === 'palm-kernel') && (() => {
                                                                const isApproved = order.rawData?.statusCoa === 'A';
                                                                const isInspected = order.isInspected;
                                                                const isSeed = order.productType === 'palm-kernel';
                                                                const sopId = order.rawData?.sopId || order.id;

                                                                const docItems: {
                                                                    value: string;
                                                                    label: string;
                                                                    icon: React.ElementType;
                                                                    bg: string;
                                                                    color: string;
                                                                    disabled: boolean;
                                                                    hint: string | null;
                                                                    action: 'print' | 'download';
                                                                    url?: string;
                                                                }[] = [
                                                                    // ── พิมพ์ COA ──
                                                                    {
                                                                        value: 'print_coa',
                                                                        label: 'พิมพ์เอกสาร COA',
                                                                        icon: Printer,
                                                                        bg: 'bg-blue-50',
                                                                        color: 'text-blue-600',
                                                                        disabled: !isApproved,
                                                                        hint: !isApproved ? 'รออนุมัติผล LAB' : null,
                                                                        action: 'print',
                                                                        url: isSeed
                                                                            ? `/mar/plan-order/${sopId}/print/seed`
                                                                            : `/mar/plan-order/${sopId}/print/oil`,
                                                                    },
                                                                    // ── ดาวน์โหลด COA ISP ──
                                                                    {
                                                                        value: 'coa_isp',
                                                                        label: 'ดาวน์โหลด COA ISP',
                                                                        icon: FileCheck,
                                                                        bg: 'bg-indigo-50',
                                                                        color: 'text-indigo-600',
                                                                        disabled: !isApproved,
                                                                        hint: !isApproved ? 'รออนุมัติผล LAB' : null,
                                                                        action: 'download',
                                                                    },
                                                                    // ── ดาวน์โหลด COA MUN ──
                                                                    {
                                                                        value: 'coa_mun',
                                                                        label: 'ดาวน์โหลด COA MUN',
                                                                        icon: FileCheck,
                                                                        bg: 'bg-emerald-50',
                                                                        color: 'text-emerald-600',
                                                                        disabled: !isApproved,
                                                                        hint: !isApproved ? 'รออนุมัติผล LAB' : null,
                                                                        action: 'download',
                                                                    },
                                                                    // ── พิมพ์เอกสารรถ (เมล็ดในเท่านั้น) ──
                                                                    ...(isSeed ? [{
                                                                        value: 'generate_car_pdf',
                                                                        label: 'พิมพ์เอกสารรถ',
                                                                        icon: FileText,
                                                                        bg: 'bg-rose-50',
                                                                        color: 'text-rose-600',
                                                                        disabled: !isInspected,
                                                                        hint: !isInspected ? 'ยังไม่บันทึกข้อมูลรถ' : null,
                                                                        action: 'print' as const,
                                                                        url: `/mar/plan-order/${sopId}/vehicle-print`,
                                                                    }] : []),
                                                                ];

                                                                return (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuLabel className="text-[10px] text-gray-500">
                                                                            เอกสาร
                                                                        </DropdownMenuLabel>

                                                                        {docItems.map((item, idx) => {
                                                                            const Icon = item.icon;
                                                                            return (
                                                                                <DropdownMenuItem
                                                                                    key={idx}
                                                                                    disabled={item.disabled}
                                                                                    onClick={() => {
                                                                                        if (item.disabled) return;
                                                                                        if (item.action === 'print' && item.url) {
                                                                                            window.open(item.url, '_blank');
                                                                                        } else {
                                                                                            handlePDFAction(order, 'generate', item.value);
                                                                                        }
                                                                                    }}
                                                                                    className={`gap-2 text-xs ${item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                                                                >
                                                                                    <div className={`rounded p-1 ${item.bg}`}>
                                                                                        <Icon className={`h-3 w-3 ${item.color}`} />
                                                                                    </div>
                                                                                    <div className="flex flex-col">
                                                                                        <span>{item.label}</span>
                                                                                        {item.hint && (
                                                                                            <span className="text-[9px] font-bold text-rose-500">{item.hint}</span>
                                                                                        )}
                                                                                    </div>
                                                                                </DropdownMenuItem>
                                                                            );
                                                                        })}

                                                                        <DropdownMenuSeparator />
                                                                    </>
                                                                );
                                                            })()}

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
                                                                        onStatusChange?.(order, 'C');
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
                                        เรียงตาม: {sortConfig.key === 'orderNumber' ? 'ลำดับ' : sortConfig.key} {sortConfig.direction === 'desc' ? '↓' : '↑'}
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
            </div>
        </TooltipProvider>
    );
}
