import React, { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { 
    ArrowUpDown, 
    ChevronLeft, 
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Package,
    Eye,
    Edit,
    Trash2,
    MoreHorizontal,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Calendar,
    FileText,
    FileSpreadsheet,
    FileImage,
    Printer,
    Download,
    FileOutput,
    FileCheck,
    FileWarning,
    Truck,
    FileDigit,
    FileBox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface PlanOrder {
    id: number;
    orderNumber: string;
    orderDate: string;
    productName: string;
    customerName: string;
    netWeight: number;
    unit: string;
    status: 'pending' | 'confirmed' | 'production' | 'completed' | 'cancelled';
    productType?: string;
}

interface Props {
    orders: PlanOrder[];
    onViewDetails?: (order: PlanOrder) => void;
    onEdit?: (order: PlanOrder) => void;
    onDelete?: (order: PlanOrder) => void;
    onStatusChange?: (order: PlanOrder, status: string) => void;
    // PDF Actions
    onGeneratePDF?: (order: PlanOrder, type: string) => void;
    onPrint?: (order: PlanOrder, type: string) => void;
    onDownloadPDF?: (order: PlanOrder, type: string) => void;
    onEmailPDF?: (order: PlanOrder, type: string) => void;
    // Vehicle Check
    onCheckVehicle?: (order: PlanOrder) => void;
}

export default function PlanOrderTable({ 
    orders, 
    onViewDetails,
    onEdit,
    onDelete,
    onStatusChange,
    onGeneratePDF,
    onPrint,
    onDownloadPDF,
    onEmailPDF,
    onCheckVehicle
}: Props) {
    // States
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PlanOrder | null>(null);

    // เรียงลำดับ
    const sortedOrders = useMemo(() => {
        const sortableOrders = [...orders];
        if (sortConfig !== null) {
            sortableOrders.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof PlanOrder];
                const bValue = b[sortConfig.key as keyof PlanOrder];
                
                if (aValue == null || bValue == null) return 0;
                
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc' 
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableOrders;
    }, [orders, sortConfig]);

    // แบ่งหน้า
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return sortedOrders.slice(start, end);
    }, [sortedOrders, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(sortedOrders.length / rowsPerPage);
    const startItem = (currentPage - 1) * rowsPerPage + 1;
    const endItem = Math.min(currentPage * rowsPerPage, sortedOrders.length);

    // จัดการเรียงลำดับ
    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // จัดการลบ
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

    // จัดการ PDF
    const handlePDFAction = (order: PlanOrder, action: 'generate' | 'print' | 'download' | 'email', type: string) => {
        switch(action) {
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

    // สีตามสถานะ
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'production': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // ข้อความสถานะ
    const getStatusText = (status: string) => {
        switch(status) {
            case 'pending': return 'รอดำเนินการ';
            case 'confirmed': return 'ยืนยันแล้ว';
            case 'production': return 'กำลังผลิต';
            case 'completed': return 'เสร็จสิ้น';
            case 'cancelled': return 'ยกเลิก';
            default: return status;
        }
    };

    // ไอคอนตามสถานะ
    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'pending': return <Clock className="h-3 w-3 mr-1" />;
            case 'confirmed': return <CheckCircle className="h-3 w-3 mr-1" />;
            case 'production': return <Package className="h-3 w-3 mr-1" />;
            case 'completed': return <CheckCircle className="h-3 w-3 mr-1" />;
            case 'cancelled': return <XCircle className="h-3 w-3 mr-1" />;
            default: return null;
        }
    };

    // จัดรูปแบบวันที่
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // จัดรูปแบบน้ำหนัก
    const formatWeight = (weight: number, unit: string) => {
        return `${weight.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} ${unit}`;
    };

    // PDF Options ตามประเภทสินค้า
    const getPDFOptions = (productType?: string) => {
        // เมล็ดในปาล์ม (kernel) - มี 3 อัน
        if (productType === 'kernel') {
            return [
                { value: 'po_isp', label: 'ใบ PO ISP', icon: <FileText className="h-4 w-4 text-blue-600" /> },
                { value: 'po_mun', label: 'ใบ PO MUN', icon: <FileSpreadsheet className="h-4 w-4 text-green-600" /> },
                { value: 'check_vehicle', label: 'เช็ครถ', icon: <Truck className="h-4 w-4 text-purple-600" /> }
            ];
        }
        // น้ำมันปาล์ม (cpo) - มี 2 อัน
        else if (productType === 'cpo') {
            return [
                { value: 'po_isp', label: 'ใบ PO ISP', icon: <FileText className="h-4 w-4 text-blue-600" /> },
                { value: 'po_mun', label: 'ใบ PO MUN', icon: <FileSpreadsheet className="h-4 w-4 text-green-600" /> }
            ];
        }
        // สินค้าอื่นๆ - มีอันเดียว
        else {
            return [
                { value: 'standard', label: 'ใบมาตรฐาน', icon: <FileText className="h-4 w-4 text-gray-600" /> }
            ];
        }
    };

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <TableHead className="cursor-pointer hover:bg-gray-200 w-[100px] transition-colors" onClick={() => requestSort('orderDate')}>
                                    <div className="flex items-center gap-1 font-medium">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        วันที่
                                        {sortConfig?.key === 'orderDate' && (
                                            <ArrowUpDown className={`h-4 w-4 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                </TableHead>
                                
                                <TableHead className="cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('productName')}>
                                    <div className="flex items-center gap-1 font-medium">
                                        <Package className="h-4 w-4 text-gray-500" />
                                        สินค้า
                                        {sortConfig?.key === 'productName' && (
                                            <ArrowUpDown className={`h-4 w-4 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                </TableHead>
                                
                                <TableHead className="cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('customerName')}>
                                    <div className="flex items-center gap-1 font-medium">
                                        คู่ค้า
                                        {sortConfig?.key === 'customerName' && (
                                            <ArrowUpDown className={`h-4 w-4 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                </TableHead>
                                
                                <TableHead className="text-right cursor-pointer hover:bg-gray-200 w-[120px] transition-colors" onClick={() => requestSort('netWeight')}>
                                    <div className="flex items-center justify-end gap-1 font-medium">
                                        น้ำหนัก
                                        {sortConfig?.key === 'netWeight' && (
                                            <ArrowUpDown className={`h-4 w-4 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                </TableHead>
                                
                                <TableHead className="w-[100px]">สถานะ</TableHead>
                                
                                <TableHead className="w-[50px] text-center">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        
                        <TableBody>
                            {paginatedOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle className="h-12 w-12 text-gray-300" />
                                            <p className="text-gray-500 font-medium">ไม่พบข้อมูล</p>
                                            <p className="text-sm text-gray-400">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedOrders.map((order, index) => (
                                    <TableRow 
                                        key={order.id} 
                                        className={`
                                            hover:bg-blue-50/50 transition-colors
                                            ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                                        `}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <div className="font-medium">{formatDate(order.orderDate)}</div>
                                                    
                                                </div>
                                            </div>
                                        </TableCell>
                                        
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{order.productName}</div>
                                                <div className="text-xs text-gray-400">{order.orderNumber}</div>
                                            </div>
                                        </TableCell>
                                        
                                        <TableCell>{order.customerName}</TableCell>
                                        
                                        <TableCell className="text-right font-medium">
                                            {formatWeight(order.netWeight, order.unit)}
                                        </TableCell>
                                        
                                        <TableCell>
                                            <Badge className={`${getStatusColor(order.status)} border flex items-center w-fit px-2 py-1`}>
                                                {getStatusIcon(order.status)}
                                                {getStatusText(order.status)}
                                            </Badge>
                                        </TableCell>
                                        
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-8 w-8 p-0 hover:bg-gray-100"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuLabel>จัดการคำสั่งซื้อ</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    
                                                    {/* ดูรายละเอียด */}
                                                    <DropdownMenuItem onClick={() => onViewDetails?.(order)}>
                                                        <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                                        ดูรายละเอียด
                                                    </DropdownMenuItem>
                                                    
                                                    {/* แก้ไข */}
                                                    <DropdownMenuItem onClick={() => onEdit?.(order)}>
                                                        <Edit className="h-4 w-4 mr-2 text-gray-600" />
                                                        แก้ไข
                                                    </DropdownMenuItem>
                                                    
                                                    <DropdownMenuSeparator />
                                                    
                                                    {/* เอกสาร PDF - แยกตามประเภทสินค้า */}
                                                    <DropdownMenuLabel>เอกสาร</DropdownMenuLabel>
                                                    
                                                    {getPDFOptions(order.productType).map((pdf, idx) => (
                                                        <DropdownMenuItem 
                                                            key={idx}
                                                            onClick={() => {
                                                                if (pdf.value === 'check_vehicle') {
                                                                    onCheckVehicle?.(order);
                                                                } else {
                                                                    handlePDFAction(order, 'generate', pdf.value);
                                                                }
                                                            }}
                                                        >
                                                            {pdf.icon}
                                                            <span className="ml-2">{pdf.label}</span>
                                                        </DropdownMenuItem>
                                                    ))}
                                                    
                                                    <DropdownMenuSeparator />
                                                    
                                                    {/* พิมพ์และดาวน์โหลด */}
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <Printer className="h-4 w-4 mr-2" />
                                                            <span>พิมพ์</span>
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent className="w-48">
                                                                {getPDFOptions(order.productType)
                                                                    .filter(pdf => pdf.value !== 'check_vehicle')
                                                                    .map((pdf, idx) => (
                                                                        <DropdownMenuItem 
                                                                            key={idx}
                                                                            onClick={() => handlePDFAction(order, 'print', pdf.value)}
                                                                        >
                                                                            {pdf.icon}
                                                                            <span className="ml-2">พิมพ์{pdf.label}</span>
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>
                                                    
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <Download className="h-4 w-4 mr-2" />
                                                            <span>ดาวน์โหลด</span>
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent className="w-48">
                                                                {getPDFOptions(order.productType)
                                                                    .filter(pdf => pdf.value !== 'check_vehicle')
                                                                    .map((pdf, idx) => (
                                                                        <DropdownMenuItem 
                                                                            key={idx}
                                                                            onClick={() => handlePDFAction(order, 'download', pdf.value)}
                                                                        >
                                                                            {pdf.icon}
                                                                            <span className="ml-2">{pdf.label}</span>
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>
                                                    
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <FileWarning className="h-4 w-4 mr-2" />
                                                            <span>ส่งอีเมล</span>
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent className="w-48">
                                                                {getPDFOptions(order.productType)
                                                                    .filter(pdf => pdf.value !== 'check_vehicle')
                                                                    .map((pdf, idx) => (
                                                                        <DropdownMenuItem 
                                                                            key={idx}
                                                                            onClick={() => handlePDFAction(order, 'email', pdf.value)}
                                                                        >
                                                                            {pdf.icon}
                                                                            <span className="ml-2">ส่ง{pdf.label}</span>
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>
                                                    
                                                    <DropdownMenuSeparator />
                                                    
                                                    {/* เปลี่ยนสถานะ */}
                                                    <DropdownMenuLabel>เปลี่ยนสถานะ</DropdownMenuLabel>
                                                    
                                                    <DropdownMenuItem onClick={() => onStatusChange?.(order, 'confirmed')}>
                                                        <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                                                        ยืนยัน
                                                    </DropdownMenuItem>
                                                    
                                                    <DropdownMenuItem onClick={() => onStatusChange?.(order, 'production')}>
                                                        <Package className="h-4 w-4 mr-2 text-purple-600" />
                                                        เริ่มผลิต
                                                    </DropdownMenuItem>
                                                    
                                                    <DropdownMenuItem onClick={() => onStatusChange?.(order, 'completed')}>
                                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                                        เสร็จสิ้น
                                                    </DropdownMenuItem>
                                                    
                                                    <DropdownMenuItem onClick={() => onStatusChange?.(order, 'cancelled')}>
                                                        <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                                        ยกเลิก
                                                    </DropdownMenuItem>
                                                    
                                                    <DropdownMenuSeparator />
                                                    
                                                    {/* ลบ */}
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDelete(order)} 
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        ลบ
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 px-6 py-3 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        แสดง {startItem} - {endItem} จาก {sortedOrders.length} รายการ
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <span className="text-sm px-3 font-medium">
                            {currentPage} / {totalPages}
                        </span>
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ยืนยันการลบ</DialogTitle>
                        <DialogDescription>
                            คุณต้องการลบรายการ {selectedOrder?.orderNumber} ใช่หรือไม่?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>ยกเลิก</Button>
                        <Button variant="destructive" onClick={confirmDelete}>ลบ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}