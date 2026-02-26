// resources/js/pages/QAC/COA/Seed_COA/Seed_COA.tsx
import AppLayout from '@/layouts/app-layout';
import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

import {
    Search, Filter, RefreshCw, Plus, Eye, Pencil, Trash2,
    CheckCircle, XCircle, Clock, Calendar, User,
    Activity, Gauge, Droplets, Beaker, Thermometer,
    MoreVertical, History, AlertCircle, X, TrendingUp, TrendingDown, Minus,
    ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Printer, FileDown, Sprout, FileText,
    FlaskRound as Flask, Scale, Weight, Wind, Sun, Moon,
    Factory, Building2, TruckIcon, Fuel, ThermometerSun, Droplet, GanttChartSquare,
    CheckSquare, Square, AlertTriangle, Info, MoreHorizontal, Leaf, Package, Hash, Truck
} from 'lucide-react';
import Swal from 'sweetalert2';

import SharedLabModal, { SharedCOAData } from '../components/SharedLabModal';
import VehicleCheckModal from '../../../MAR/PlanOrder/components/VehicleCheckModal';
import { generateAndDownloadCoa, COAFields } from '../PDF/coaPdfGenerator';

interface SeedCOAData {
    id: number;
    coa_no: string;
    lot_no: string;
    product_name: string;
    customer_name?: string;
    license_plate?: string;
    driver_name?: string;
    ffa?: number | string;
    m_i?: number | string;
    iv?: number | string;
    dobi?: number | string;
    result_shell?: number | string;
    result_kn_moisture?: number | string;
    spec_shell?: string;
    spec_kn_moisture?: string;
    status: 'pending' | 'processing' | 'approved' | 'rejected' | 'W' | 'A';
    notes?: string;
    created_at: string;
    inspector?: string;
    coa_tank?: string;
    coa_user?: string; // เพิ่มฟิลด์ coa_user
    coa_mgr?: string;  // เพิ่มฟิลด์ coa_mgr
}

const STATUS_CONFIG = {
    pending: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: Clock,
        label: 'รอตรวจสอบ',
        gradient: 'from-amber-500 to-orange-500'
    },
    processing: {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        text: 'text-sky-700',
        icon: RefreshCw,
        label: 'กำลังดำเนินการ',
        gradient: 'from-sky-500 to-blue-500'
    },
    approved: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: CheckCircle,
        label: 'อนุมัติ',
        gradient: 'from-emerald-500 to-green-500'
    },
    rejected: {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        icon: XCircle,
        label: 'ปฏิเสธ',
        gradient: 'from-rose-500 to-red-500'
    },
    W: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: Clock,
        label: 'รออนุมัติ',
        gradient: 'from-amber-500 to-orange-500'
    },
    A: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: CheckCircle,
        label: 'อนุมัติแล้ว',
        gradient: 'from-emerald-500 to-green-500'
    },
    C: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-700',
        icon: Minus,
        label: 'ยกเลิก',
        gradient: 'from-slate-500 to-gray-500'
    }
};

const THRESHOLDS = {
    ffa: { good: 2, warning: 3, bad: 5 },
    m_i: { good: 0.1, warning: 0.2, bad: 0.3 },
    iv: { good: 50, warning: 100, bad: 150 },
    dobi: { good: 1, warning: 1.5, bad: 2 },
    result_shell: { good: 5, warning: 8, bad: 10 },
    result_kn_moisture: { good: 4, warning: 6, bad: 8 }
};

const TREND_THRESHOLDS = {
    ffa: { good: 2, warning: 3 },
    m_i: { good: 0.1, warning: 0.2 },
    iv: { good: 50, warning: 100 },
    dobi: { good: 1, warning: 1.5 },
    result_shell: { good: 5, warning: 8 },
    result_kn_moisture: { good: 4, warning: 6 }
};

const STATS_CARDS = [
    { label: 'ทั้งหมด', color: 'blue', icon: Package, filter: null },
    { label: 'รอตรวจสอบ', color: 'amber', icon: Clock, filter: 'pending' },
    { label: 'กำลังดำเนินการ', color: 'sky', icon: RefreshCw, filter: 'processing' },
    { label: 'อนุมัติ', color: 'emerald', icon: CheckCircle, filter: 'approved' },
    { label: 'ปฏิเสธ', color: 'rose', icon: XCircle, filter: 'rejected' }
];

const parseDateString = (dateStr: string) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    const datePart = dateStr.split(' ')[0];
    if (datePart.includes('/')) {
        const [day, month, year] = datePart.split('/');
        let y = parseInt(year);
        if (y > 2500) y -= 543;
        return `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    if (datePart.includes('-')) {
        const parts = datePart.split('-');
        if (parts[0].length === 4) return datePart; // YYYY-MM-DD
        let y = parseInt(parts[2]);
        if (y > 2500) y -= 543;
        return `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return datePart.substring(0, 10);
};

const Seed_COA: React.FC = () => {
    const [data, setData] = useState<SeedCOAData[]>([]);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [currentPageBottom, setCurrentPageBottom] = useState(1);
    const [labModal, setLabModal] = useState<{ open: boolean; data: SeedCOAData | null }>({ open: false, data: null });
    const [truckModal, setTruckModal] = useState<{ open: boolean; data: SeedCOAData | null }>({ open: false, data: null });
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const { auth } = usePage<any>().props;
    const currentUserName = auth?.employee_name || auth?.user?.name || '';

    // Authorization logic
    const userRoles: string[] = Array.isArray(auth?.roles) ? auth.roles : [];
    const isDeveloper = userRoles.some((r: string) => r.toLowerCase() === 'developer') || currentUserName === 'ประภาพร เชื่อพระซอง';

    const canEditRow = (row: SeedCOAData) => {
        if (row.status !== 'A') return true; // If not approved, anyone can edit
        return isDeveloper; // If approved, only developer or Prapaporn can edit
    };

    const handleApprove = async (row: SeedCOAData) => {
        // ตรวจสอบความครบถ้วนของข้อมูล
        const requiredFields = [
            { key: 'coa_no', label: 'เลขที่ COA' },
            { key: 'lot_no', label: 'Lot No.' },
            { key: 'coa_tank', label: 'Tank' },
            { key: 'result_shell', label: '%Shell' },
            { key: 'result_kn_moisture', label: '%KN Moisture' }
        ];

        const missingFields = requiredFields.filter(f => {
            const val = row[f.key as keyof SeedCOAData];
            return val === undefined || val === null || val === '' || val === '-' || (typeof val === 'number' && val === 0);
        });

        if (missingFields.length > 0) {
            Swal.fire({
                title: 'ข้อมูลไม่ครบถ้วน',
                html: `ไม่สามารถอนุมัติได้เนื่องจากขาดข้อมูล:<br/><ul class="text-left mt-2 list-disc list-inside">${missingFields.map(f => `<li>${f.label}</li>`).join('')}</ul>`,
                icon: 'warning',
                confirmButtonColor: '#10b981'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'ยืนยันการอนุมัติ?',
            text: `คุณต้องการอนุมัติรายการ ${row.coa_no} ใช่หรือไม่`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const response = await axios.post('/qac/coa/approve', {
                    SOPID: row.id,
                    coa_mgr: 'ประภาพร เชื่อพระซอง' // บังคับใช้ชื่อนี้เสมอ
                });
                if (response.data.success) {
                    fetchData();
                    Swal.fire({
                        icon: 'success',
                        title: 'อนุมัติสำเร็จ',
                        timer: 1500,
                        showConfirmButton: false,
                        position: 'top-end',
                        toast: true
                    });
                }
            } catch (error) {
                console.error('Approve error:', error);
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอนุมัติได้', 'error');
            }
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'ต้องการลบข้อมูลนี้?',
            text: "ข้อมูลนี้จะถูกลบอย่างถาวรและไม่สามารถกู้คืนได้!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/qac/coa/seed/${id}`);
                fetchData();
                Swal.fire({
                    icon: 'success',
                    title: 'ลบข้อมูลสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false,
                    position: 'top-end',
                    toast: true
                });
            } catch (error) {
                console.error('Delete error:', error);
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
            }
        }
    };

    const handleGenerateCAR = async (order: any) => {
        try {
            const sopId = order.id || order.rawData?.sopId || order.orderNumber;
            const pdfData: COAFields = {
                po_no: sopId,
                date: new Date().toLocaleDateString('th-TH'),
                license_plate: order.license_plate || order.licensePlate || '-',
                driver_name: order.driver_name || order.driverName || '-',
                inspector: currentUserName || '-',
                coa_user_id: auth?.user?.employee_id || '-',
            };

            // ดึงข้อมูล Inspection
            try {
                const res = await axios.get(`/mar/vehicle-inspections/${sopId}`);
                if (res.data.success && res.data.data) {
                    pdfData.vehicle_inspection = res.data.data;
                }
            } catch (e) { console.error('No vehicle inspection data found', e) }

            await generateAndDownloadCoa(pdfData, 'car');
            Swal.fire({
                icon: 'success',
                title: 'สร้าง CAR PDF สำเร็จ',
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } catch (error) {
            console.error('PDF Generation Error:', error);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถสร้าง PDF ได้', 'error');
        }
    };

    const handleGenerateCOA = async (row: SeedCOAData, type: 'isp' | 'mun' = 'isp') => {
        try {
            const pdfData: COAFields = {
                coa_no: row.coa_no,
                lot_no: row.lot_no,
                product_name: row.product_name,
                customer_name: row.customer_name,
                license_plate: row.license_plate,
                driver_name: row.driver_name,
                coa_tank: row.coa_tank || '-',
                date: row.created_at,
                created_at: row.created_at,
                result_shell: row.result_shell,
                result_kn_moisture: row.result_kn_moisture,
                spec_shell: row.spec_shell,
                spec_kn_moisture: row.spec_kn_moisture,
                inspector: currentUserName || row.coa_user || row.inspector,
                coa_user_id: auth?.user?.employee_id || row.inspector,
                notes: row.notes,
            };
            await generateAndDownloadCoa(pdfData, type === 'mun' ? 'seed_mun' : 'seed_isp');
            Swal.fire({
                icon: 'success',
                title: 'สร้าง PDF สำเร็จ',
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } catch (error) {
            console.error('PDF Generation Error:', error);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถสร้าง PDF ได้', 'error');
        }
    };

    const [expanded, setExpanded] = useState({ processing: true, others: true });
    const itemsPerPage = 10;

    const fetchData = () => {
        fetch('/mar/plan-order/pending-coa?type=palm-kernel')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    const mapped: SeedCOAData[] = res.data.map((s: any) => ({
                        id: s.SOPID,
                        coa_no: s.coa_no || '-',
                        lot_no: s.coa_lot || '-',
                        product_name: s.GoodName || 'เมล็ดปาล์ม',
                        customer_name: s.CustName || '',
                        license_plate: s.NumberCar || '',
                        driver_name: s.DriverName || '',
                        ffa: s.ffa,
                        m_i: s.m_i,
                        iv: s.iv,
                        dobi: s.dobi,
                        result_shell: s.result_shell,
                        result_kn_moisture: s.result_kn_moisture,
                        spec_shell: s.spec_shell,
                        spec_kn_moisture: s.spec_kn_moisture,
                        coa_tank: s.coa_tank,
                        notes: s.notes,
                        inspector: s.coa_user_id || s.inspector,
                        coa_user: s.inspector, // ดึงข้อมูล coa_user
                        coa_mgr: s.coa_mgr,   // ดึงข้อมูล coa_mgr
                        status: s.Status_coa || (s.Status === 'p' ? 'processing' : 'pending'),
                        created_at: parseDateString(s.coa_date || s.SOPDate),
                    }));
                    setData(mapped);
                }
            })
            .catch(err => console.error('Fetch error:', err));
    };

    useEffect(() => {
        fetchData();

        const params = new URLSearchParams(window.location.search);
        const sopid = params.get('sopid');
        if (sopid) {
            fetch(`/mar/plan-order/data/${sopid}`)
                .then(res => res.json())
                .then(res => {
                    if (res.success && res.data) {
                        const d = res.data;
                        const newData: SeedCOAData = {
                            id: d.SOPID,
                            coa_no: d.coa_no || '-',
                            lot_no: d.coa_lot || '-',
                            product_name: d.GoodName || 'เมล็ดปาล์ม',
                            license_plate: d.NumberCar || '',
                            driver_name: d.DriverName || '',
                            ffa: d.ffa,
                            m_i: d.m_i,
                            iv: d.iv,
                            dobi: d.dobi,
                            result_shell: d.result_shell,
                            result_kn_moisture: d.result_kn_moisture,
                            spec_shell: d.spec_shell,
                            spec_kn_moisture: d.spec_kn_moisture,
                            coa_tank: d.coa_tank,
                            notes: d.notes,
                            inspector: d.coa_user_id || d.inspector,
                            coa_user: d.inspector, // ดึงข้อมูล coa_user
                            coa_mgr: d.coa_mgr,   // ดึงข้อมูล coa_mgr
                            status: d.Status_coa || 'processing',
                            created_at: d.coa_date ? parseDateString(d.coa_date) : new Date().toISOString().split('T')[0],
                        };
                        setLabModal({ open: true, data: newData });
                    }
                })
                .catch(err => console.error('Fetch error:', err));
        }
    }, []);

    const handleAddNew = () => {
        const newData: SeedCOAData = {
            id: Date.now(),
            coa_no: '-',
            lot_no: '-',
            product_name: 'เมล็ดปาล์ม',
            status: 'pending',
            created_at: new Date().toISOString().split('T')[0],
        };
        setLabModal({ open: true, data: newData });
    };

    // ฟังก์ชันบันทึกข้อมูลจาก Modal - แก้ไขให้ส่ง coa_tank, coa_user, coa_mgr ครบถ้วน
    const handleSaveLab = async (formData: Partial<SharedCOAData>) => {
        if (!labModal.data) return;

        Swal.fire({
            title: 'กำลังบันทึก...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            console.log('📤 Sending Seed COA data:', {
                SOPID: labModal.data.id,
                result_shell: formData.result_shell,
                result_kn_moisture: formData.result_kn_moisture,
                tank: formData.coa_tank, // เปลี่ยนเป็น tank ตามที่ backend คาดหวัง
                coa_mgr: 'ประภาพร เชื่อพระซอง' // บังคับใช้ชื่อนี้เสมอ
            });

            const response = await axios.post('/qac/coa/store', {
                SOPID: labModal.data.id,
                result_shell: formData.result_shell,
                result_kn_moisture: formData.result_kn_moisture,
                spec_shell: formData.spec_shell,
                spec_kn_moisture: formData.spec_kn_moisture,
                tank: formData.coa_tank, // backend คาดหวังฟิลด์ชื่อ tank (ไม่ใช่ coa_tank)
                coa_number: formData.coa_no,
                coa_lot: formData.lot_no,
                inspector: formData.inspector,
                coa_user_id: auth?.user?.employee_id || formData.coa_user_id,
                notes: formData.notes,
                coa_mgr: 'ประภาพร เชื่อพระซอง' // บังคับใช้ชื่อนี้เสมอ
            });

            const res = response.data;
            if (res.success) {
                await fetchData();
                setLabModal({ open: false, data: null });
                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกข้อมูลสำเร็จ',
                    text: `เลขอ้างอิง: ${res.coa_number || formData.coa_no}`,
                    timer: 2000,
                    showConfirmButton: false,
                    position: 'top-end',
                    toast: true,
                    background: '#ecfdf5',
                    color: '#065f46',
                    iconColor: '#10b981'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: res.message || 'ไม่สามารถบันทึกข้อมูลได้',
                    confirmButtonColor: '#ef4444'
                });
            }
        } catch (err: any) {
            console.error('Save error:', err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
                text: err.response?.data?.message || err.message,
                confirmButtonColor: '#ef4444'
            });
        }
    };

    const handleCancel = async (id: number) => {
        const result = await Swal.fire({
            title: 'ยืนยันการยกเลิก?',
            text: "คุณต้องการยกเลิกใบ COA นี้ใช่หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ใช่, ยกเลิก!',
            cancelButtonText: 'กลับ'
        });

        if (result.isConfirmed) {
            try {
                await axios.post('/qac/coa/cancel', { SOPID: id });
                fetchData();
                Swal.fire({
                    icon: 'success',
                    title: 'ยกเลิกข้อมูลสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false,
                    position: 'top-end',
                    toast: true
                });
            } catch (error) {
                console.error('Cancel error:', error);
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถยกเลิกข้อมูลได้', 'error');
            }
        }
    };

    const filteredData = data.filter(item =>
        (!filter || [item.coa_no, item.lot_no, item.product_name, item.driver_name, item.license_plate].join(' ').toLowerCase().includes(filter.toLowerCase())) &&
        (statusFilter === 'all' || item.status === statusFilter) &&
        (!dateFilter || item.created_at === dateFilter)
    );

    const pendingData = filteredData.filter(item => ['pending', 'processing'].includes(item.status));
    const processedData = filteredData.filter(item => !['pending', 'processing'].includes(item.status));

    const getPaginatedData = (data: SeedCOAData[], page: number) =>
        data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const getResultValue = (value: number | string | undefined, unit: string = '') => {
        if (value === undefined || value === null || value === '' || Number(value) === 0) return '-';
        const numValue = Number(value);
        if (isNaN(numValue)) return `${value}${unit}`;
        return `${numValue.toFixed(2)}${unit}`;
    };

    const getStatusBadge = (status: SeedCOAData['status'], onClick?: () => void) => {
        const config = STATUS_CONFIG[status];
        const Icon = config.icon;
        return (
            <button
                onClick={onClick}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm ${config.bg} ${config.border} ${config.text} hover:scale-105 transition-all ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
            >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {config.label}
            </button>
        );
    };

    const getResultColor = (type: string, value: number | string | undefined) => {
        if (value === undefined || value === null || value === '') return 'bg-gray-50 text-gray-400 border-gray-200';

        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numericValue)) return 'bg-gray-50 text-gray-700 border-gray-200';

        const t = THRESHOLDS[type as keyof typeof THRESHOLDS];
        if (!t) return 'bg-gray-50 text-gray-700 border-gray-200';
        if (numericValue <= t.good) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (numericValue <= t.warning) return 'bg-amber-50 text-amber-700 border-amber-200';
        if (numericValue <= t.bad) return 'bg-orange-50 text-orange-700 border-orange-200';
        return 'bg-rose-50 text-rose-700 border-rose-200';
    };

    const getTrendIcon = (value?: number | string, type?: string) => {
        if (value === undefined || value === null || value === '' || !type) return null;

        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numericValue)) return null;

        const t = TREND_THRESHOLDS[type as keyof typeof TREND_THRESHOLDS];
        if (!t) return null;
        if (numericValue <= t.good) return <TrendingDown className="w-3 h-3 text-emerald-500" />;
        if (numericValue <= t.warning) return <Minus className="w-3 h-3 text-amber-500" />;
        return <TrendingUp className="w-3 h-3 text-rose-500" />;
    };

    const ResultIcon = ({ type }: { type: string }) => {
        const icons: Record<string, any> = {
            ffa: Droplets,
            m_i: Beaker,
            iv: Thermometer,
            dobi: Gauge,
            result_shell: Package,
            result_kn_moisture: Droplet
        };
        const colors: Record<string, string> = {
            ffa: 'text-blue-500',
            m_i: 'text-green-500',
            iv: 'text-purple-500',
            dobi: 'text-orange-500',
            result_shell: 'text-gray-500',
            result_kn_moisture: 'text-cyan-500'
        };
        const Icon = icons[type];
        return Icon ? <Icon className={`w-3 h-3 mr-1 ${colors[type]}`} /> : null;
    };

    const handleSelectAll = (data: SeedCOAData[]) => {
        if (selectAll) {
            setSelectedRows([]);
        } else {
            setSelectedRows(data.map(item => item.id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectRow = (id: number) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
            setSelectAll(false);
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const handleBulkApprove = async () => {
        if (selectedRows.length === 0) return;

        const result = await Swal.fire({
            title: `ยืนยันการอนุมัติ ${selectedRows.length} รายการ?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await Promise.all(selectedRows.map(id =>
                    axios.post('/qac/coa/approve', {
                        SOPID: id,
                        coa_mgr: 'ประภาพร เชื่อพระซอง' // บังคับใช้ชื่อนี้เสมอ
                    })
                ));
                fetchData();
                setSelectedRows([]);
                setSelectAll(false);
                Swal.fire({
                    icon: 'success',
                    title: 'อนุมัติสำเร็จ',
                    text: `อนุมัติ ${selectedRows.length} รายการเรียบร้อยแล้ว`,
                    timer: 1500,
                    showConfirmButton: false,
                    position: 'top-end',
                    toast: true
                });
            } catch (error) {
                console.error('Bulk approve error:', error);
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอนุมัติตามที่เลือกได้', 'error');
            }
        }
    };

    const getStatsCardClass = (color: string) =>
        `group relative overflow-hidden rounded-xl p-4 transition-all hover:scale-105 hover:shadow-xl bg-gradient-to-br from-${color}-50 to-${color}-100 border border-${color}-200 cursor-pointer`;

    const TableRow = ({ row, index, page, color, showResults = true }: { row: SeedCOAData; index: number; page: number; color: string; showResults: boolean }) => (
        <tr className={`transition-all group hover:scale-[1.01] hover:shadow-lg hover:bg-gray-50`}>
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{(page - 1) * itemsPerPage + index + 1}</td>
            <td className={`px-4 py-3 text-sm font-semibold text-${color}-600`}>{row.coa_no}</td>
            <td className="px-4 py-3 text-sm text-gray-900 font-bold">{row.coa_tank || '-'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{row.lot_no}</td>
            <td className="px-4 py-3 text-sm text-gray-900">{row.product_name}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{row.license_plate || '-'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{row.driver_name || '-'}</td>

            {showResults && ['result_shell', 'result_kn_moisture'].map((type) => (
                <td key={type} className="px-2 py-3 text-center">
                    <div className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium border-2 hover:scale-105 transition-all ${getResultColor(type, row[type as keyof SeedCOAData] as number)}`}>
                        <ResultIcon type={type} />
                        {getResultValue(row[type as keyof SeedCOAData] as number, '%')}
                        {getTrendIcon(row[type as keyof SeedCOAData] as number, type)}
                    </div>
                </td>
            ))}
            <td className="px-4 py-3">
                <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px]" title={row.coa_user || row.inspector || '-'}>{row.coa_user || row.inspector || '-'}</span>
                    </div>
                    {row.status === 'A' && (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[120px]" title={row.coa_mgr || '-'}>{row.coa_mgr || '-'}</span>
                        </div>
                    )}
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                    {getStatusBadge(row.status, canEditRow(row) ? () => setLabModal({ open: true, data: row }) : undefined)}
                    {row.status === 'W' && (
                        <button
                            onClick={() => handleApprove(row)}
                            className="px-2 py-1 text-[10px] bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all hover:scale-105 font-bold"
                        >
                            ยืนยัน
                        </button>
                    )}
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setTruckModal({ open: true, data: row })}
                        className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-all font-bold group relative"
                        title="ตรวจสอบสภาพรถ"
                    >
                        <Truck className="w-4 h-4" />
                        {/* Optional un-checked indicator dot */}
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => router.get(`/qac/coa/seed/${row.id}`)}>
                                <Eye className="h-4 w-4 text-blue-500" />
                                <span>ดูรายละเอียด</span>
                            </DropdownMenuItem>
                            {canEditRow(row) && (
                                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => setLabModal({ open: true, data: row })}>
                                    <Pencil className="h-4 w-4 text-green-500" />
                                    <span>แก้ไข</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => router.get(`/qac/coa/seed/${row.id}/history`)}>
                                <History className="h-4 w-4 text-purple-500" />
                                <span>ประวัติ</span>
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="flex items-center gap-2">
                                    <FileDown className="h-4 w-4 text-emerald-600" />
                                    <span>ดาวน์โหลด COA</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleGenerateCOA(row, 'isp')}>
                                        ใบรายงานผล (ISP)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleGenerateCOA(row, 'mun')}>
                                        ใบรายงานผล (MUN)
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => window.open(`/qac/coa/seed/${row.id}/print`, '_blank')}>
                                <Printer className="h-4 w-4 text-gray-500" />
                                <span>พิมพ์ (หลังบ้าน)</span>
                            </DropdownMenuItem>
                            {canEditRow(row) && (
                                <>
                                    <div className="h-px bg-gray-100 my-1 mx-2" />
                                    <DropdownMenuItem
                                        className="flex items-center gap-2 text-orange-600 cursor-pointer focus:text-orange-600 focus:bg-orange-50"
                                        onClick={() => handleCancel(row.id)}
                                    >
                                        <XCircle className="h-4 w-4" />
                                        <span>ยกเลิก</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="flex items-center gap-2 text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                                        onClick={() => handleDelete(row.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span>ลบข้อมูล</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </td>
        </tr>
    );

    const GridCard = ({ row }: { row: SeedCOAData }) => {
        const config = STATUS_CONFIG[row.status];
        const Icon = config.icon;

        return (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:shadow-xl transition-all hover:scale-105 group">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <span className="text-xs text-gray-500">COA No.</span>
                        <div className="font-bold text-gray-900">{row.coa_no}</div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${config.bg} ${config.text} flex items-center gap-1`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Fuel className="w-4 h-4 text-gray-400" />
                        <span>Tank: <span className="font-medium">{row.coa_tank || '-'}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span>Lot: <span className="font-medium">{row.lot_no}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Leaf className="w-4 h-4 text-gray-400" />
                        <span>{row.product_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span>{row.license_plate || '-'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className={`p-2 rounded-lg text-center ${getResultColor('result_shell', row.result_shell)}`}>
                        <div className="text-xs">Shell</div>
                        <div className="font-bold">{getResultValue(row.result_shell, '%')}</div>
                    </div>
                    <div className={`p-2 rounded-lg text-center ${getResultColor('result_kn_moisture', row.result_kn_moisture)}`}>
                        <div className="text-xs">KN Moisture</div>
                        <div className="font-bold">{getResultValue(row.result_kn_moisture, '%')}</div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <User className="w-3.5 h-3.5" />
                        <span className="font-medium text-gray-900 truncate flex-1">
                            {row.coa_user || row.inspector || '-'}
                        </span>
                    </div>
                    {row.status === 'A' && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="font-medium truncate flex-1">
                                {row.coa_mgr || '-'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    {canEditRow(row) && (
                        <button
                            onClick={() => setLabModal({ open: true, data: row })}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => window.open(`/qac/coa/seed/${row.id}/print`, '_blank')}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    const renderTable = (data: SeedCOAData[], pageData: SeedCOAData[], page: number, title: string, icon: React.ReactNode, color: string, showResults: boolean = true) => (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${color}-100 rounded-xl`}>
                        {icon}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                        {title}
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-700`}>
                        {data.length} รายการ
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1 border-2 border-gray-200 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}
                        >
                            <GanttChartSquare className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}
                        >
                            <Package className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setExpanded(prev => ({ ...prev, [title === 'รายการรอตรวจสอบ' ? 'processing' : 'others']: !prev[title === 'รายการรอตรวจสอบ' ? 'processing' : 'others'] }))}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-all"
                    >
                        {expanded[title === 'รายการรอตรวจสอบ' ? 'processing' : 'others'] ?
                            <ArrowUp className="w-5 h-5" /> :
                            <ArrowDown className="w-5 h-5" />
                        }
                    </button>
                </div>
            </div>

            {expanded[title === 'รายการรอตรวจสอบ' ? 'processing' : 'others'] && (
                <div className="bg-white/80 rounded-2xl shadow-xl border border-gray-200 animate-slideDown">
                    {viewMode === 'table' ? (
                        <div className="w-full">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className={`bg-gradient-to-r from-${color}-50 to-${color}-100`}>
                                    <tr>
                                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">ลำดับ</th>
                                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">COA No.</th>
                                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">Tank</th>
                                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">LOT No.</th>
                                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">สินค้า</th>
                                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">ทะเบียนรถ</th>
                                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">คนขับ</th>
                                        {showResults && <th colSpan={2} className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase bg-gradient-to-r from-blue-500/10 to-purple-500/10">Result</th>}
                                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">ผู้ตรวจสอบ / ผู้อนุมัติ</th>
                                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">ดำเนินการ</th>
                                    </tr>
                                    <tr>
                                        {showResults && (
                                            <>
                                                <th className="px-2 py-2 text-center text-xs font-medium border-l text-orange-600">%Shell</th>
                                                <th className="px-2 py-2 text-center text-xs font-medium border-r text-sky-600">%KN Moisture</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pageData.length > 0 ? (
                                        pageData.map((row, i) => <TableRow key={row.id} row={row} index={i} page={page} color={color} showResults={showResults} />)
                                    ) : (
                                        <tr>
                                            <td colSpan={showResults ? 11 : 9} className="px-4 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="p-4 rounded-xl mb-3 bg-gray-100">
                                                        <FileDown className="w-12 h-12 text-gray-400" />
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-500">ไม่มีข้อมูล</p>
                                                    <p className="text-xs text-gray-400 mt-1">กรุณาตรวจสอบการค้นหาหรือตัวกรอง</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pageData.map(row => <GridCard key={row.id} row={row} />)}
                            </div>
                        </div>
                    )}

                    {data.length > itemsPerPage && (
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/50">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                    แสดง {Math.min(pageData.length, itemsPerPage)} จาก {data.length} รายการ
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => title === 'รายการรอตรวจสอบ' ? setCurrentPage(p => Math.max(1, p - 1)) : setCurrentPageBottom(p => Math.max(1, p - 1))}
                                        disabled={title === 'รายการรอตรวจสอบ' ? currentPage === 1 : currentPageBottom === 1}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 text-gray-600 transition-all hover:scale-110"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm px-3 py-2 bg-white rounded-lg border border-gray-200 text-gray-700">
                                        {title === 'รายการรอตรวจสอบ' ? currentPage : currentPageBottom} / {Math.ceil(data.length / itemsPerPage)}
                                    </span>
                                    <button
                                        onClick={() => title === 'รายการรอตรวจสอบ' ? setCurrentPage(p => Math.min(p + 1, Math.ceil(data.length / itemsPerPage))) : setCurrentPageBottom(p => Math.min(p + 1, Math.ceil(data.length / itemsPerPage)))}
                                        disabled={title === 'รายการรอตรวจสอบ' ? currentPage === Math.ceil(data.length / itemsPerPage) : currentPageBottom === Math.ceil(data.length / itemsPerPage)}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 text-gray-600 transition-all hover:scale-110"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/80 border-b border-gray-200 backdrop-blur-xl shadow-lg">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl shadow-xl animate-pulse">
                                    <Sprout className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                                        Seed COA Management
                                    </h1>
                                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        ระบบควบคุมคุณภาพและตรวจสอบ Certificate of Analysis (เมล็ดปาล์ม)
                                    </p>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            {/* <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => router.get('/qac/coa/seed/history')}
                                        className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                                    >
                                        <History className="w-4 h-4" />
                                        <span>ประวัติ</span>
                                    </button>
                                    <button
                                        onClick={handleAddNew}
                                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold group"
                                    >
                                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                        <span>บันทึกใหม่</span>
                                    </button>
                                </div> */}

                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-5 gap-4 mt-6">
                            {STATS_CARDS.map(({ label, color, icon: Icon, filter }) => {
                                const count = filter ? data.filter(d => d.status === filter).length : data.length;
                                return (
                                    <div
                                        key={label}
                                        onClick={() => filter && setStatusFilter(filter)}
                                        className={`group relative overflow-hidden rounded-xl p-4 transition-all hover:scale-105 hover:shadow-xl bg-gradient-to-br from-${color}-50 to-${color}-100 border-2 border-${color}-200 cursor-pointer ${statusFilter === filter ? `ring-2 ring-${color}-500` : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className={`text-sm font-medium text-${color}-600`}>{label}</div>
                                                <div className={`text-2xl font-bold mt-1 text-${color}-700`}>{count}</div>
                                            </div>
                                            <div className={`p-3 bg-${color}-100 rounded-xl`}>
                                                <Icon className={`w-6 h-6 text-${color}-600`} />
                                            </div>
                                        </div>
                                        <div className={`absolute -bottom-2 -right-2 w-20 h-20 rounded-full opacity-10 group-hover:scale-150 transition-transform bg-${color}-400`} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-6">
                    {/* Filters */}
                    <div className="bg-white/80 rounded-2xl shadow-xl border border-gray-200 p-5 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหา COA No., LOT No., ทะเบียนรถ..."
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none cursor-pointer bg-white"
                                >
                                    <option value="all">ทั้งหมด</option>
                                    <option value="pending">รอรับผลตรวจ</option>
                                    <option value="processing">กำลังตรวจ</option>
                                    <option value="W">รออนุมัติ</option>
                                    <option value="A">อนุมัติแล้ว</option>
                                    <option value="rejected">ไม่ผ่าน</option>
                                </select>
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={e => setDateFilter(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                />
                            </div>
                            <button
                                onClick={() => { setFilter(''); setStatusFilter('all'); setDateFilter(''); }}
                                className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 group transition-all hover:scale-105"
                            >
                                <RefreshCw className="w-5 h-5 text-gray-500 group-hover:rotate-180 transition-transform duration-500" />
                                <span className="font-medium">ล้างตัวกรอง</span>
                            </button>
                        </div>
                    </div>

                    {/* Tables */}
                    {renderTable(
                        pendingData,
                        getPaginatedData(pendingData, currentPage),
                        currentPage,
                        'รายการรอตรวจสอบ',
                        <RefreshCw className="w-5 h-5 text-sky-600" />,
                        'sky',
                        false
                    )}

                    {renderTable(
                        processedData,
                        getPaginatedData(processedData, currentPageBottom),
                        currentPageBottom,
                        'รายการที่ดำเนินการแล้ว',
                        <CheckCircle className="w-5 h-5 text-blue-600" />,
                        'blue',
                        true
                    )}
                </div>
            </div>

            <SharedLabModal
                isOpen={labModal.open}
                onClose={() => setLabModal({ open: false, data: null })}
                data={labModal.data as any}
                type="seed"
                onSave={handleSaveLab}
            />

            <VehicleCheckModal
                isOpen={truckModal.open}
                onClose={() => setTruckModal({ open: false, data: null })}
                order={truckModal.data}
                onGenerateCAR={handleGenerateCAR}
                autoDownload={false}
            />

            {/* Global Styles */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
            `}</style>
        </AppLayout>
    );
};

export default Seed_COA;