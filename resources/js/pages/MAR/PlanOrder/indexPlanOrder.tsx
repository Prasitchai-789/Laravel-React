// resources/js/pages/MAR/PlanOrder/indexPlanOrder.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import {
    PlanOrderHeader,
    PlanOrderFilters,
    PlanOrderTable,
    PlanOrderSummary,
    PlanOrderActions,
    CreatePlanOrderModal,
    VehicleCheckModal
} from './components';
import { PlanOrder } from './components/PlanOrderTable';
import { Package, Droplets, Leaf, Trees, Flower2, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import { generateAndDownloadCoa } from '../../QAC/COA/PDF/coaPdfGenerator';

// ============ INTERFACES ============

interface CreateOrderFormData {
    id?: number;
    sopId?: string;
    receiveDate: string;
    goodID: string;
    goodName: string;
    loadPlan: string;
    custID: string;
    destination: string;
    notes: string;
    Notes?: string;
    vehicles: Array<{ numberCar: string; driverName: string }>;
    [key: string]: any;
}

interface SOPlanData {
    SOPID: string;
    SOPDate: string;
    GoodID: string;
    GoodName: string;
    NumberCar: string;
    DriverName: string;
    CustID: string;
    CustCode: string;
    CustName: string;
    Recipient: string;
    AmntLoad: string;
    IBWei: string;
    OBWei: string;
    NetWei: string;
    GoodPrice: string;
    GoodAmnt: string;
    Status: string;
    ReceivedDate: string;
    Remarks: string;
    Status_coa: string;
    coa_number?: string;
    productType?: string;
    is_inspected?: boolean;
}

// ============ CONSTANTS ============
const PRODUCT_TYPE_MAP: { [key: string]: string } = {
    'CPO': 'cpo',
    ' crude palm oil': 'cpo',
    'น้ำมันปาล์มดิบ': 'cpo',
    'RBD': 'palm-oil',
    'น้ำมันปาล์มบริสุทธิ์': 'palm-oil',
    'Kernel': 'palm-kernel',
    'PKE': 'palm-kernel',
    'เมล็ดในปาล์ม': 'palm-kernel',
    'เมล็ดปาล์ม': 'palm-kernel',
    'Shell': 'shell',
    'กะลาปาล์ม': 'shell',
    'PKS': 'shell',
    'Fiber': 'fiber',
    'ใยปาล์ม': 'fiber',
    'EFB': 'efb',
    'ทะลายสับ': 'efb',
    'ทะลายปาล์ม': 'efb',
    'ปุ๋ย': 'fertilizer',
    'Organic': 'fertilizer',
    'Bio': 'fertilizer',
};

// ============ HELPER FUNCTIONS ============

const formatDateForComparison = (dateStr: string): string => {
    if (!dateStr) return '';

    if (dateStr.includes('/')) {
        const [datePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('/');
        return `${year}-${month}-${day}`;
    }

    return dateStr.split('T')[0];
};

const mapProductType = (goodId: string, goodName: string): string => {
    const searchStr = (goodId + ' ' + goodName).toLowerCase();
    for (const [key, value] of Object.entries(PRODUCT_TYPE_MAP)) {
        if (searchStr.includes(key.toLowerCase())) {
            return value;
        }
    }
    return 'other';
};

const parseWeight = (weightStr: string): number => {
    if (!weightStr) return 0;
    const cleaned = weightStr.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

// ============ STATUS MAPPING ============
// ฟังก์ชัน map สถานะจาก database เป็น frontend status
const mapStatus = (dbStatus: string): string => {
    const statusMap: { [key: string]: string } = {
        'w': 'pending',
        'p': 'processing',
        'f': 'completed',
        'c': 'cancelled',
        'pending': 'pending',
        'processing': 'processing',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'รอ': 'pending',
        'ดำเนินการ': 'processing',
        'เสร็จ': 'completed',
        'ยกเลิก': 'cancelled',
    };

    // ถ้าไม่มีใน map ให้ส่งค่ากลับเป็น pending
    return statusMap[dbStatus?.toLowerCase()] || 'pending';
};

// ฟังก์ชันแปลง SOPlanData เป็น PlanOrder
const convertSOPlanToPlanOrder = (s: SOPlanData, index?: number): PlanOrder => {
    const netWeight = parseWeight(s.NetWei) || parseWeight(s.IBWei) || parseWeight(s.OBWei) || parseWeight(s.AmntLoad) || 0;
    const unit = netWeight > 1000 ? 'ตัน' : 'กก.';
    const displayWeight = netWeight > 1000 ? netWeight / 1000 : netWeight;

    const productType = s.productType || mapProductType(s.GoodID, s.GoodName);
    const mappedStatus = mapStatus(s.Status); // แปลงสถานะ

    return {
        id: parseInt(s.SOPID) || (index || 0) + 1,
        orderNumber: s.SOPID || `SOP-${String((index || 0) + 1).padStart(3, '0')}`,
        orderDate: s.ReceivedDate || s.SOPDate || new Date().toISOString().split('T')[0],
        productType: productType,
        productName: s.GoodName || 'ไม่ระบุสินค้า',
        licensePlate: s.NumberCar || '-',
        driverName: s.DriverName,
        customerName: s.CustName || s.Recipient || s.CustID || 'ไม่ระบุลูกค้า',
        customerCode: s.CustCode || '',
        customerID: s.CustID || '',
        netWeight: displayWeight,
        unit: unit,
        displayWeight: displayWeight.toFixed(2),
        status: mappedStatus as 'pending' | 'processing' | 'completed' | 'cancelled' | 'confirmed' | 'production',
        priority: 'normal',
        destination: s.Recipient,
        coaNumber: s.coa_number,
        isInspected: s.is_inspected || false,
        rawData: {
            sopId: s.SOPID,
            goodId: s.GoodID,
            ibWei: s.IBWei,
            obWei: s.OBWei,
            netWei: s.NetWei,
            goodPrice: s.GoodPrice,
            goodAmnt: s.GoodAmnt,
            remarks: s.Remarks,
            statusCoa: s.Status_coa,
            coaNumber: s.coa_number,
            originalStatus: s.Status,
            originalCustID: s.CustID,
            custCode: s.CustCode,
            custName: s.CustName,
            amntLoad: s.AmntLoad,
        }
    };
};

// Mock data
const mockOrders: PlanOrder[] = [
    {
        id: 1,
        orderNumber: 'SOP-001',
        orderDate: new Date().toISOString().split('T')[0],
        productName: 'CPO',
        productType: 'cpo',
        customerName: 'บริษัท ก ข ค จำกัด',
        customerID: 'C001',
        licensePlate: '1กข 1234',
        driverName: 'นายสมชาย รักดี',
        netWeight: 30000,
        unit: 'กก.',
        status: 'pending',
        priority: 'high',
        destination: 'โรงงานระยอง'
    },
    {
        id: 2,
        orderNumber: 'SOP-002',
        orderDate: new Date().toISOString().split('T')[0],
        productName: 'PKE',
        productType: 'palm-kernel',
        customerName: 'หจก. พลังงานไทย',
        customerID: 'C002',
        licensePlate: '2คก 5678',
        driverName: 'นายสมปอง สุดยอด',
        netWeight: 15000,
        unit: 'กก.',
        status: 'processing',
        priority: 'normal',
        destination: 'โรงงานชลบุรี'
    }
];

// ============ SweetAlert2 Helpers ============
const showSuccess = (message: string) => {
    Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: message,
        timer: 3000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
        background: '#10b981',
        color: '#ffffff',
        iconColor: '#ffffff',
        customClass: {
            popup: 'rounded-lg shadow-lg'
        }
    });
};

const showError = (message: string) => {
    Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: message,
        timer: 3000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
        background: '#ef4444',
        color: '#ffffff',
        iconColor: '#ffffff',
        customClass: {
            popup: 'rounded-lg shadow-lg'
        }
    });
};

const showWarning = (message: string) => {
    Swal.fire({
        icon: 'warning',
        title: 'คำเตือน!',
        text: message,
        timer: 3000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
        background: '#f59e0b',
        color: '#ffffff',
        iconColor: '#ffffff',
        customClass: {
            popup: 'rounded-lg shadow-lg'
        }
    });
};

const showConfirmDelete = async (orderNumber: string): Promise<boolean> => {
    const result = await Swal.fire({
        title: 'ยืนยันการลบ',
        text: `คุณต้องการลบรายการ ${orderNumber} ใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก',
        reverseButtons: true
    });
    return result.isConfirmed;
};

// ============ MAIN COMPONENT ============

interface PageProps {
    soplans?: SOPlanData[];
    selectedYear?: number;
    availableYears?: number[];
}

export default function IndexPlanOrder({ soplans = [], selectedYear, availableYears = [] }: PageProps) {
    const { props } = usePage<any>();
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [isLoading, setIsLoading] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<PlanOrder | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedProductType, setSelectedProductType] = useState<string | null>(null);

    // State สำหรับ Vehicle Check Modal
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [vehicleCheckOrder, setVehicleCheckOrder] = useState<PlanOrder | null>(null);

    // State สำหรับ orders
    const [orders, setOrders] = useState<PlanOrder[]>([]);

    // ถ้าดูปีปัจจุบัน → เริ่มต้นด้วยวันนี้
    // ถ้าดูปีอื่น → เริ่มต้นว่าง (แสดงทั้งปีนั้น)
    const currentYear = new Date().getFullYear();
    const isCurrentYear = !selectedYear || selectedYear === currentYear;
    const todayStr = new Date().toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        productType: 'all',
        dateFrom: isCurrentYear ? todayStr : '',
        dateTo: isCurrentYear ? todayStr : '',
    });

    // ============ ฟังก์ชันเปลี่ยนปี — reload จาก server ============
    const handleYearChange = useCallback((year: string) => {
        router.get('/mar/plan-order', { year }, {
            preserveScroll: false,
            preserveState: false,
        });
    }, []);

    const handleGenerateCOA = useCallback((order: PlanOrder, type: string) => {
        if (type === 'oil_coa') {
            router.visit('/qac/coa/oil?sopid=' + (order.rawData?.sopId || order.orderNumber));
        } else if (type === 'seed_coa') {
            router.visit('/qac/coa/seed?sopid=' + (order.rawData?.sopId || order.orderNumber));
        }
    }, []);

    // ฟังก์ชันสำหรับสร้าง PDF จากหน้าตารางโดยตรง ไม่ต้องเข้าไปใน Modal
    const handleGeneratePDF = useCallback(async (order: PlanOrder, type: string) => {
        // จำกัดเฉพาะการออกใบ COA ISP, COA MUN, และ CAR
        if (type !== 'coa_isp' && type !== 'coa_mun' && type !== 'check_vehicle' && type !== 'generate_car_pdf') return;

        const sopId = order.rawData?.sopId || order.orderNumber;
        if (!sopId) return;

        if (type === 'check_vehicle') {
            setVehicleCheckOrder(order);
            setIsVehicleModalOpen(true);
            return;
        }

        try {
            // โหลดแจ้งบอกผู้ใช้ว่ากำลังประมวลผล
            setIsLoading(true);

            // 1. ดึงข้อมูลล่าสุดจาก API
            const response = await axios.get(`/mar/plan-order/data/${sopId}`);
            if (!response.data || !response.data.success) {
                throw new Error('ไม่สามารถดึงข้อมูลสำหรับสร้าง PDF ได้');
            }

            const data = response.data.data;
            const productType = data.productType; // 'cpo', 'palm-kernel', etc.

            // 2. จัดเตรียมข้อมูลสำหรับ PDF Generator
            const pdfData = {
                coa_no: data.coa_no || '-',
                lot_no: data.coa_lot || '-',
                coa_tank: data.coa_tank || '-',
                date: data.coa_date || data.SOPDate || order.orderDate,
                product_name: data.GoodName || order.productName || '-',
                customer_name: data.CustName || order.customerName || '-',
                driver_name: data.DriverName || order.driverName || '-',
                license_plate: data.NumberCar || order.licensePlate || '-',
                quantity: order.netWeight?.toString() || '-',
                po_no: data.SOPID || '-',

                // ผลแลป
                ffa: data.ffa,
                m_i: data.m_i,
                iv: data.iv,
                dobi: data.dobi,
                result_shell: data.result_shell,
                result_kn_moisture: data.result_kn_moisture,

                // สเปก
                spec_ffa: data.spec_ffa,
                spec_moisture: data.spec_moisture,
                spec_iv: data.spec_iv,
                spec_dobi: data.spec_dobi,
                spec_shell: data.spec_shell,
                spec_kn_moisture: data.spec_kn_moisture,

                inspector: data.inspector || '-',
                coa_user_id: data.inspector,
                notes: data.notes || '-',
                created_at: data.SOPDate || order.orderDate,
            };

            // 3. กำหนดประเภทของ PDF
            let docType: any = 'oil';
            if (type === 'generate_car_pdf') {
                docType = 'car';
                // ดึงข้อมูล Inspection
                try {
                    const res = await axios.get(`/mar/vehicle-inspections/${sopId}`);
                    if (res.data.success && res.data.data) {
                        (pdfData as any).vehicle_inspection = res.data.data;
                    }
                } catch (e) {
                    console.error('No vehicle inspection data found', e);
                }
            } else if (productType === 'palm-kernel' || productType === 'kernel') {
                docType = type === 'coa_mun' ? 'seed_mun' : 'seed_isp';
            } else if (type === 'coa_isp' || type === 'coa_mun') {
                docType = type;
            }

            // 4. สร้าง PDF
            const originalCoaNo = pdfData.coa_no;

            if (docType !== 'car') {
                const prefix = type === 'coa_mun' ? 'MUN_' : 'ISP_';
                pdfData.coa_no = (originalCoaNo && originalCoaNo !== '-')
                    ? `${prefix}${originalCoaNo}`
                    : `${prefix}${sopId}`;
            }

            await generateAndDownloadCoa(pdfData as any, docType as any);

            // คืนค่า coa_no ตามเดิม
            if (docType !== 'car') {
                pdfData.coa_no = originalCoaNo;
            }

            showSuccess('สร้างและดาวน์โหลดเอกสาร PDF สำเร็จ');

        } catch (error) {
            console.error('PDF Generation Error:', error);
            showError('เกิดข้อผิดพลาดในการสร้างเอกสาร PDF โปรดลองอีกครั้ง');
        } finally {
            setIsLoading(false);
        }
    }, [setIsLoading]);

    // ============ โหลดข้อมูลเริ่มต้น ============
    useEffect(() => {
        if (soplans && soplans.length > 0) {
            const mapped = soplans.map((s, idx) => convertSOPlanToPlanOrder(s, idx));
            setOrders(mapped);
        } else {
            setOrders(mockOrders);
        }
    }, [soplans]);

    // ============ รับ Flash Messages ============
    useEffect(() => {
        if (props.flash?.success) {
            showSuccess(props.flash.success);
        }
        if (props.flash?.error) {
            showError(props.flash.error);
        }
        if (props.flash?.warning) {
            showWarning(props.flash.warning);
        }
    }, [props.flash]);

    // Filter orders - แก้ไขการกรองสถานะ
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // ค้นหา
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const searchFields = [
                    order.orderNumber,
                    order.customerName,
                    order.productName,
                    order.licensePlate,
                    order.driverName,
                    order.customerCode,
                    order.customerID
                ].map((field: any) => (field ?? '').toString().toLowerCase());

                const matchSearch = searchFields.some(field => field.includes(searchLower));
                if (!matchSearch) return false;
            }

            // กรองตามสถานะ
            if (filters.status && filters.status !== 'all') {
                // filters.status เป็นค่า database ('w','p','f','c')
                // order.status เป็น frontend status ('pending','processing','completed','cancelled')
                // ต้อง map กลับ
                const statusMap: { [key: string]: string } = {
                    'w': 'pending',
                    'p': 'processing',
                    'f': 'completed',
                    'c': 'cancelled',
                };
                const mappedStatus = statusMap[filters.status];
                if (order.status !== mappedStatus) return false;
            }

            // กรองตามประเภทสินค้า
            if (filters.productType && filters.productType !== 'all') {
                if (order.productType !== filters.productType) return false;
            }

            // กรองตามวันที่
            if (filters.dateFrom) {
                const orderDateFormatted = formatDateForComparison(order.orderDate);
                if (orderDateFormatted < filters.dateFrom) return false;
            }
            if (filters.dateTo) {
                const orderDateFormatted = formatDateForComparison(order.orderDate);
                if (orderDateFormatted > filters.dateTo) return false;
            }

            return true;
        });
    }, [orders, filters]);

    const handleSelectOrder = (orderId: number) => {
        setSelectedOrders(prev =>
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    const handleSelectAll = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(order => order.id));
        }
    };

    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleProductSelect = (productType: string | null) => {
        setSelectedProductType(productType);
        setFilters(prev => ({ ...prev, productType: productType || 'all' }));
    };

    // filteredStats - ใช้ frontend status
    const filteredStats = useMemo(() => {
        const total = filteredOrders.length;
        const pending = filteredOrders.filter(o => o.status === 'pending').length;
        const processing = filteredOrders.filter(o => o.status === 'processing').length;
        const completed = filteredOrders.filter(o => o.status === 'completed').length;
        const cancelled = filteredOrders.filter(o => o.status === 'cancelled').length;
        const totalWeight = filteredOrders.reduce((sum, o) => sum + o.netWeight, 0);

        return {
            total,
            pending,
            processing,
            completed,
            cancelled,
            totalWeight,
            // statusCodes สำหรับ PlanOrderFilters ที่ใช้ค่า database
            statusCodes: {
                w: pending,
                p: processing,
                f: completed,
                c: cancelled
            }
        };
    }, [filteredOrders]);

    const productStats = useMemo(() => {
        const stats: { [key: string]: number } = {};
        orders.forEach(order => {
            const type = order.productType || 'other';
            stats[type] = (stats[type] || 0) + 1;
        });
        return Object.entries(stats).map(([type, total]) => ({ type, total }));
    }, [orders]);

    // ============ ข้อมูลสรุปสำหรับ Dropdown ใน Modal ============
    const modalData = useMemo(() => {
        const productsMap = new Map();
        const customersMap = new Map();
        const destinationsSet = new Set<string>();
        const vehiclesMap = new Map();

        orders.forEach(o => {
            // Products
            const gId = o.rawData?.goodId || o.productType;
            if (gId && o.productName) {
                productsMap.set(gId, { goodID: gId, goodName: o.productName });
            }

            // Customers
            if (o.customerID && o.customerName) {
                customersMap.set(o.customerID, {
                    custID: o.customerID,
                    custName: o.customerName,
                    custCode: o.customerCode || ''
                });
            }

            // Destinations
            if (o.destination) destinationsSet.add(o.destination);

            // Vehicles
            if (o.licensePlate && o.licensePlate !== '-') {
                vehiclesMap.set(o.licensePlate, {
                    numberCar: o.licensePlate,
                    driverName: o.driverName !== '-' ? o.driverName : ''
                });
            }
        });

        return {
            products: Array.from(productsMap.values()),
            customers: Array.from(customersMap.values()),
            destinations: Array.from(destinationsSet),
            vehicles: Array.from(vehiclesMap.values())
        };
    }, [orders]);

    // ============ ฟังก์ชันสร้าง - Real-time update ============
    const handleCreatePlanOrder = (data: CreateOrderFormData) => {
        setIsLoading(true);

        router.post('/mar/plan-order', data, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (response) => {
                // รับข้อมูลใหม่จาก response
                const newData = response.props.soplans as SOPlanData[];

                if (newData && newData.length > 0) {
                    // ข้อมูลที่เพิ่มล่าสุดจะอยู่ตำแหน่งแรกสุด เนื่องจาก Query เรียง DESC ไว้
                    const lastItem = newData[0];
                    const newOrder = convertSOPlanToPlanOrder(lastItem);

                    // อัปเดต state ทันที
                    setOrders(prev => {
                        // ตรวจสอบว่ามี id นี้อยู่แล้วหรือไม่
                        const exists = prev.some(o => o.id === newOrder.id);
                        if (exists) {
                            return prev.map(o => o.id === newOrder.id ? newOrder : o);
                        } else {
                            return [...prev, newOrder];
                        }
                    });
                }

                setIsCreateModalOpen(false);
                showSuccess('เพิ่มแผนการขนส่งเรียบร้อย');
            },
            onError: (errors) => {
                console.error('Create error:', errors);
                showError('เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    // ============ ฟังก์ชันแก้ไข - Real-time update ============
    const handleEditClick = (order: PlanOrder) => {
        setEditingOrder(order);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (data: CreateOrderFormData) => {
        setIsLoading(true);

        if (!data.id && editingOrder) {
            data.id = editingOrder.id;
        }

        console.log('📝 Submitting edit:', data);

        router.put(`/mar/plan-order/${data.id}`, data, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (response) => {
                // รับข้อมูลใหม่จาก response
                const newData = response.props.soplans as SOPlanData[];

                if (newData && newData.length > 0) {
                    // หาข้อมูลที่เพิ่งแก้ไข
                    const updated = newData.find(item => parseInt(item.SOPID) === data.id);

                    if (updated) {
                        const updatedOrder = convertSOPlanToPlanOrder(updated);

                        // อัปเดต state ทันที
                        setOrders(prev =>
                            prev.map(order =>
                                order.id === data.id ? updatedOrder : order
                            )
                        );
                    }
                }

                setIsEditModalOpen(false);
                setEditingOrder(null);
                showSuccess('แก้ไขข้อมูลเรียบร้อย');
            },
            onError: (errors) => {
                console.error('Edit error:', errors);
                showError('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    const handleEditClose = () => {
        setIsEditModalOpen(false);
        setEditingOrder(null);
    };

    // ============ ฟังก์ชันลบ - Real-time update ============
    const handleDelete = async (order: PlanOrder) => {
        const confirmed = await showConfirmDelete(order.orderNumber);
        if (confirmed) {
            // optimistic delete - ลบออกจาก state ทันที
            setOrders(prev => prev.filter(o => o.id !== order.id));

            router.delete(`/mar/plan-order/${order.id}`, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    showSuccess('ลบรายการเรียบร้อย');
                },
                onError: (errors) => {
                    console.error('Delete error:', errors);
                    // ถ้าลบไม่สำเร็จ ให้เพิ่มกลับคืน
                    setOrders(prev => [...prev, order]);
                    showError('เกิดข้อผิดพลาดในการลบข้อมูล');
                }
            });
        }
    };

    // ============ ฟังก์ชันเปลี่ยนสถานะ - Real-time update ============
    const handleStatusChange = (order: PlanOrder, newStatus: string) => {
        // optimistic update - อัปเดตสถานะทันที
        const originalStatus = order.status;
        setOrders(prev =>
            prev.map(o =>
                o.id === order.id ? { ...o, status: newStatus as any } : o
            )
        );

        // แปลงสถานะกลับเป็น database status ก่อนส่ง
        const dbStatusMap: { [key: string]: string } = {
            'pending': 'w',
            'processing': 'p',
            'completed': 'f',
            'cancelled': 'c',
        };

        const dbStatus = dbStatusMap[newStatus] || 'w';

        router.put(`/mar/plan-order/${order.id}`, {
            ...order,
            status: dbStatus  // ส่งสถานะแบบ database
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                showSuccess('เปลี่ยนสถานะเรียบร้อย');
            },
            onError: (errors) => {
                console.error('Status change error:', errors);
                // ถ้าเปลี่ยนไม่สำเร็จ ให้เปลี่ยนกลับ
                setOrders(prev =>
                    prev.map(o =>
                        o.id === order.id ? { ...o, status: originalStatus } : o
                    )
                );
                showError('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
            }
        });
    };

    return (
        <AppLayout>
            <Head title="วางแผนการขนส่ง" />

            <div className="py-6 ">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-anuphut">
                    <PlanOrderHeader
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        selectedCount={selectedOrders.length}
                        onCreateClick={() => setIsCreateModalOpen(true)}
                    />

                    <PlanOrderFilters
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        totalCount={filteredOrders.length}
                        stats={filteredStats}
                        orders={orders}
                        productStats={productStats}
                        selectedProduct={selectedProductType}
                        onProductSelect={handleProductSelect}
                        selectedYear={selectedYear}
                        availableYears={availableYears}
                        onYearChange={handleYearChange}
                    />

                    <PlanOrderSummary
                        orders={filteredOrders as unknown as any[]}
                        onProductSelect={handleProductSelect}
                        selectedProduct={selectedProductType}
                    />

                    <div className="mt-6">
                        {viewMode === 'table' ? (
                            <PlanOrderTable
                                orders={filteredOrders as unknown as any[]}
                                selectedOrders={selectedOrders}
                                onSelectOrder={handleSelectOrder}
                                onSelectAll={handleSelectAll}
                                stats={filteredStats}
                                onViewDetails={(order) => console.log('View details:', order)}
                                onEdit={handleEditClick}
                                onDelete={handleDelete as any}
                                onStatusChange={handleStatusChange as any}
                                onGenerateCOA={handleGenerateCOA as any}
                                onGeneratePDF={handleGeneratePDF as any}
                                onCheckVehicle={(order: unknown) => {
                                    setVehicleCheckOrder(order as PlanOrder);
                                    setIsVehicleModalOpen(true);
                                }}
                            />
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center font-anuphut">
                                <div className="flex justify-center mb-4">
                                    <div className="grid grid-cols-5 gap-2">
                                        <div className="bg-amber-50 p-3 rounded-lg">
                                            <Droplets className="h-8 w-8 text-amber-500" />
                                        </div>
                                        <div className="bg-emerald-50 p-3 rounded-lg">
                                            <Flower2 className="h-8 w-8 text-emerald-500" />
                                        </div>
                                        <div className="bg-stone-50 p-3 rounded-lg">
                                            <Package className="h-8 w-8 text-stone-500" />
                                        </div>
                                        <div className="bg-lime-50 p-3 rounded-lg">
                                            <Trees className="h-8 w-8 text-lime-500" />
                                        </div>
                                        <div className="bg-orange-50 p-3 rounded-lg">
                                            <Leaf className="h-8 w-8 text-orange-500" />
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    มุมมองปฏิทิน
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    กำลังอยู่ในระหว่างการพัฒนา
                                </p>
                                <div className="text-sm text-gray-400">
                                    จำนวนสินค้าทั้งหมด: {orders.length} รายการ
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedOrders.length > 0 && (
                        <PlanOrderActions
                            selectedOrders={selectedOrders}
                            onActionComplete={() => {
                                setSelectedOrders([]);
                                showSuccess('ดำเนินการเรียบร้อย');
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Modal สร้าง */}
            <CreatePlanOrderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreatePlanOrder}
                products={modalData.products}
                customers={modalData.customers}
                destinations={modalData.destinations}
                vehicles={modalData.vehicles}
            />

            {/* Modal แก้ไข */}
            <CreatePlanOrderModal
                isOpen={isEditModalOpen}
                onClose={handleEditClose}
                onSave={handleEditSubmit}
                editData={editingOrder}
                products={modalData.products}
                customers={modalData.customers}
                destinations={modalData.destinations}
                vehicles={modalData.vehicles}
            />

            {/* Modal ตรวจเช็คสภาพรถ */}
            <VehicleCheckModal
                isOpen={isVehicleModalOpen}
                onClose={() => setIsVehicleModalOpen(false)}
                order={vehicleCheckOrder}
                onGenerateCAR={(order: PlanOrder) => {
                    // เรียกใช้งาน PDF Generator เมื่อบันทึกสำเร็จ
                    handleGeneratePDF(order, 'generate_car_pdf');
                }}
            />
        </AppLayout>
    );
}