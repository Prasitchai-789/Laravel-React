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
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import {
    Search, Filter, RefreshCw, Plus, Eye, Pencil, Trash2,
    CheckCircle, XCircle, Clock, Calendar, User,
    Activity, Gauge, Droplets, Beaker, Thermometer,
    MoreVertical, History, AlertCircle, X, TrendingUp, TrendingDown, Minus,
    ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Printer, FileDown, Sprout, FileText,
    FlaskRound as Flask, Scale, Weight, Wind, Sun, Moon,
    Factory, Building2, TruckIcon, Fuel, ThermometerSun, Droplet, GanttChartSquare,
    CheckSquare, Square, AlertTriangle, Info, MoreHorizontal, Leaf, Package, Hash, Truck, ClipboardCheck, UserCheck, MapPin, Ban
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
    destination_name?: string; // เพิ่มฟิลด์ destination_name
    sop_status?: string; // เพิ่มฟิลด์ sop_status
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

const SECTION_STYLES: Record<string, { icon: string; badge: string; header: string }> = {
    sky: { icon: 'bg-sky-100 text-sky-700', badge: 'bg-sky-50 text-sky-700', header: 'bg-sky-50' },
    blue: { icon: 'bg-blue-100 text-blue-700', badge: 'bg-blue-50 text-blue-700', header: 'bg-blue-50' },
    emerald: { icon: 'bg-emerald-100 text-emerald-700', badge: 'bg-emerald-50 text-emerald-700', header: 'bg-emerald-50' },
    amber: { icon: 'bg-amber-100 text-amber-700', badge: 'bg-amber-50 text-amber-700', header: 'bg-amber-50' },
};

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

const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '-';
    // dateStr is expected to be YYYY-MM-DD from parseDateString
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
};

const _getSignaturePath = (identity?: string | number) => {
    const id = identity ? identity.toString().trim() : '';
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    if (id === '1149' || id.includes('ประสิทธิ์ชัย')) return `${base}/images/signature/prasitchai.png`;
    if (id === '1143' || id.includes('ประภาพร'))     return `${base}/images/signature/prapaporn.png`;
    if (id === '1177' || id.includes('ยุพา'))         return `${base}/images/signature/yapha.png`;
    if (id === '1183' || id.includes('สุกัญญา'))      return `${base}/images/signature/sukanya.png`;
    if (id === '1434' || id.includes('ธัญ'))          return `${base}/images/signature/than.png`;
    if (id === '1476' || id.includes('วีระยุทธ'))     return `${base}/images/signature/veerayut.png`;
    return `${base}/images/signature/sukanya.png`;
};

const _fmtNum = (v?: number | string) => {
    if (v === undefined || v === null || v === '' || v === '-') return '-';
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(n as number) ? String(v) : (n as number).toFixed(2);
};

const _formatThaiDate = (dateStr?: string) => {
    const date = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(date.getTime())) return '-';
    const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
};

const parseResultNumber = (value: number | string | undefined) => {
    if (value === undefined || value === null || value === '') return null;
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return Number.isNaN(numericValue) ? null : numericValue;
};

const isResultWithinSpec = (type: string, value: number | string | undefined, spec?: string) => {
    const numericValue = parseResultNumber(value);
    if (numericValue === null || !spec) return null;

    const normalizedSpec = spec.replace(/,/g, '').trim().toLowerCase();
    const numbers = normalizedSpec.match(/\d+(?:\.\d+)?|\.\d+/g)?.map(Number) || [];
    if (numbers.length === 0) return null;

    const hasRange = numbers.length >= 2 && /(?:\d|\.)\s*(?:-|–|—|to|ถึง)\s*(?:\d|\.)/i.test(normalizedSpec);
    if (hasRange) {
        const [min, max] = [Math.min(numbers[0], numbers[1]), Math.max(numbers[0], numbers[1])];
        return numericValue >= min && numericValue <= max;
    }

    const limit = numbers[0];
    if (/(>=|≥|>|มากกว่า|ไม่น้อยกว่า|min|minimum)/i.test(normalizedSpec)) return numericValue >= limit;
    if (/(<=|≤|<|น้อยกว่า|ไม่เกิน|ไม่มากกว่า|max|maximum)/i.test(normalizedSpec)) return numericValue <= limit;

    // Default for Seed parameters (Shell, Moisture) is to be <= limit
    return numericValue <= limit;
};

// ─── COADetailModal (Certificate of Analysis view) ──────────────────────────
interface COADetailModalProps {
    open: boolean;
    data: SeedCOAData | null;
    canApprove: boolean;
    canEdit: boolean;
    onClose: () => void;
    onApprove: (row: SeedCOAData) => void;
    onEdit: (row: SeedCOAData) => void;
    onVehicleCheck: (row: SeedCOAData) => void;
}

const COADetailModal: React.FC<COADetailModalProps> = ({ open, data, canApprove, canEdit, onClose, onApprove, onEdit, onVehicleCheck }) => {
    const [docType, setDocType] = React.useState<'isp' | 'mun'>('isp');
    const [confirmed, setConfirmed] = React.useState(false);
    React.useEffect(() => { if (open) { setDocType('isp'); setConfirmed(false); } }, [open, data?.id]);

    if (!open || !data) return null;

    const isWaiting  = data.status === 'W';
    const isApproved = data.status === 'A';
    const thaiDate   = _formatThaiDate(data.created_at);
    const inspSig    = _getSignaturePath(data.inspector || data.coa_user);
    const mgrSig     = `${window.location.origin}/images/signature/prapaporn.png`;

    const results = [
        { key: 'result_shell',  label: '%Shell',                     unit: '%', value: data.result_shell,  spec: data.spec_shell || '< 5.00 %' },
        { key: 'result_kn_moisture',  label: '%KN Moisture',  unit: '%', value: data.result_kn_moisture,  spec: data.spec_kn_moisture || '< 6.00 %' },
    ];

    const headerBg = isApproved ? '#059669' : isWaiting ? '#d97706' : '#475569';
    const statusLabel = isApproved ? 'อนุมัติแล้ว' : isWaiting ? 'รออนุมัติ' : 'ยังไม่อนุมัติ';

    const tdS: React.CSSProperties = { padding: '5px 10px', border: '1px solid #cbd5e1', verticalAlign: 'middle', fontSize: '13px' };
    const thS: React.CSSProperties = { padding: '6px 10px', border: '1px solid #10b981', fontWeight: 700, fontSize: '12px', color: '#fff' };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative flex h-full max-h-[95vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">

                {/* ── Header Bar ── */}
                <div style={{ background: headerBg }} className="flex items-center justify-between px-6 py-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <ClipboardCheck className="w-5 h-5 text-white" />
                        <div>
                            <div className="text-base font-bold text-white">CERTIFICATE OF ANALYSIS</div>
                            <div className="text-xs text-white/80">{statusLabel} — {data.coa_no}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Print preview */}
                        <button onClick={() => window.open(`/qac/coa/seed/${data.id}/print`, '_blank')} className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400 transition-colors">
                            <Printer className="w-3.5 h-3.5" /> พิมพ์เอกสาร A4
                        </button>
                        <button onClick={onClose} className="rounded-full bg-red-400 p-1.5 text-white hover:bg-red-600 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ fontFamily: "'THSarabunNew','Sarabun',sans-serif", fontSize: '14px' }}>

                    {/* Doc Info */}
                    <div className="grid grid-cols-3 gap-2">
                        {[['COA No.', data.coa_no, true], ['Lot No.', data.lot_no, false], ['วันที่', _formatThaiDate(data.created_at), false]].map(([l, v, h]) => (
                            <div key={String(l)} className="rounded-lg bg-slate-50 px-3 py-2">
                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{String(l)}</div>
                                <div className={`font-bold text-sm ${h ? 'text-emerald-700' : 'text-slate-800'}`}>{String(v)}</div>
                            </div>
                        ))}
                    </div>

                    {/* Customer/Product Info */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                            {[['ลูกค้า', data.customer_name], ['สินค้า', data.product_name], ['ถัง Tank', data.coa_tank], ['ทะเบียน', data.license_plate], ['ปลายทาง', data.destination_name], ['คนขับ', data.driver_name]].map(([l, v]) => (
                                <div key={String(l)} className="flex items-baseline gap-2">
                                    <span className="text-slate-400 text-xs shrink-0 w-20">{String(l)}:</span>
                                    <span className="font-semibold text-slate-800">{String(v) || '-'}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Test Results */}
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <Sprout className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-700">ผลการวิเคราะห์ / Test Results</span>
                            <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">{docType.toUpperCase()}</span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: '#059669' }}>
                                    <th style={thS}>รายการ / Parameter</th>
                                    {docType === 'isp' && <th style={thS}>ข้อกำหนด / Specification</th>}
                                    <th style={thS}>ผลทดสอบ / Result</th>
                                    <th style={{ ...thS, width: '60px', textAlign: 'center' }}>ผ่าน</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map(({ key, label, unit, value, spec }, i) => {
                                    const ok = isResultWithinSpec(key, value, spec);
                                    return (
                                        <tr key={key} style={{ background: i % 2 === 0 ? '#ecfdf5' : '#fff' }}>
                                            <td style={tdS}>{label}</td>
                                            {docType === 'isp' && <td style={{ ...tdS, color: '#64748b' }}>{spec}</td>}
                                            <td style={{ ...tdS, fontWeight: 700, color: ok === false ? '#dc2626' : ok === true ? '#059669' : '#111' }}>
                                                {_fmtNum(value)}{unit}
                                            </td>
                                            <td style={{ ...tdS, textAlign: 'center' }}>
                                                {ok === true  && <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />}
                                                {ok === false && <XCircle    className="w-4 h-4 text-rose-500 mx-auto" />}
                                                {ok === null  && <Minus       className="w-4 h-4 text-slate-300 mx-auto" />}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Notes */}
                    {data.notes && (
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                            <span className="font-semibold">หมายเหตุ:</span> {data.notes}
                        </div>
                    )}

                    {/* Signatures */}
                    <div className="flex justify-around pt-2">
                        {[{ title: 'ผู้ตรวจสอบ / Inspector', name: data.coa_user || data.inspector || '-', sig: inspSig },
                          { title: 'ผู้อนุมัติ / Approved By',  name: data.coa_mgr || 'ประภาพร เชื่อพระซอง', sig: mgrSig }]
                          .map(({ title, name, sig }) => (
                            <div key={title} className="flex flex-col items-center gap-1" style={{ width: '160px' }}>
                                <div className="h-14 flex items-end justify-center">
                                    <img src={sig} alt="sig" className="max-h-12 max-w-[130px] object-contain"
                                         onError={e => (e.currentTarget.style.visibility='hidden')} />
                                </div>
                                <div className="w-full border-t border-slate-400 pt-1 text-center">
                                    <div className="text-xs font-bold text-slate-700">{name}</div>
                                    <div className="text-[11px] text-slate-500">{title}</div>
                                    <div className="text-[11px] text-slate-400">{thaiDate}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Approval Checkbox — approvers only, status W */}
                    {canApprove && isWaiting && (
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-4 hover:bg-amber-100 transition-colors">
                            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                                   className="mt-0.5 h-4 w-4 accent-emerald-600 cursor-pointer" />
                            <span className="text-sm font-medium text-amber-800 leading-snug select-none">
                                ข้าพเจ้าได้อ่านและตรวจสอบข้อมูลข้างต้นครบถ้วนแล้ว และยืนยันความถูกต้องของข้อมูลทั้งหมด
                            </span>
                        </label>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-6 py-3 flex justify-end gap-3">
                    {canApprove && canEdit && isApproved && (
                        <button onClick={() => { onEdit(data); onClose(); }}
                                className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                            <Pencil className="w-4 h-4" /> แก้ไข (QAC Admin)
                        </button>
                    )}
                    {canApprove && isWaiting && (
                        <button disabled={!confirmed} onClick={() => { onApprove(data); onClose(); }}
                                className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold text-white transition-all ${ confirmed ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md' : 'bg-slate-300 cursor-not-allowed' }`}>
                            <ClipboardCheck className="w-4 h-4" /> อนุมัติ
                        </button>
                    )}
                    <button onClick={() => { onVehicleCheck(data); onClose(); }}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        <Truck className="w-4 h-4" /> เช็ครถ
                    </button>
                    <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">ปิด</button>
                </div>
            </div>
        </div>
    );
};

const Seed_COA: React.FC = () => {
    const [data, setData] = useState<SeedCOAData[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentPageBottom, setCurrentPageBottom] = useState(1);
    const [labModal, setLabModal] = useState<{ open: boolean; data: SeedCOAData | null }>({ open: false, data: null });
    const [truckModal, setTruckModal] = useState<{ open: boolean; data: SeedCOAData | null }>({ open: false, data: null });
    const [coaDetailModal, setCoaDetailModal] = useState<{ open: boolean; data: SeedCOAData | null }>({ open: false, data: null });
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const { auth } = usePage<any>().props;
    const currentUserName = auth?.employee_name || auth?.user?.name || '';

    // Authorization logic
    const userRoles: string[] = Array.isArray(auth?.roles) ? auth.roles : [];
    const isDeveloper = userRoles.some((r: string) => r.toLowerCase() === 'developer') || currentUserName === 'ประภาพร เชื่อพระซอง';
    const isQACAdmin = isDeveloper || userRoles.some((r: string) => ['qac.admin', 'qac_admin'].includes(r.toLowerCase()));
    const canApprove = isQACAdmin;

    const canEditRow = (row: SeedCOAData) => {
        if (row.status !== 'A') return true; // If not approved, anyone can edit
        return isQACAdmin; // If approved, only developer or QAC Admin can edit
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

            // ดึงข้อมูล
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
            const isMun = type === 'mun';
            const pdfData: COAFields = {
                coa_no: row.coa_no,
                lot_no: row.lot_no,
                product_name: row.product_name,
                customer_name: isMun ? (row.destination_name || row.customer_name) : row.customer_name,
                license_plate: row.license_plate,
                driver_name: row.driver_name,
                coa_tank: row.coa_tank || '-',
                date: row.created_at,
                created_at: row.created_at,
                result_shell: row.result_shell,
                result_kn_moisture: row.result_kn_moisture,
                spec_shell: row.spec_shell,
                spec_kn_moisture: row.spec_kn_moisture,
                inspector:     isMun ? 'MUN_FAN'   : (currentUserName || row.coa_user || row.inspector),
                coa_user:      row.coa_user || row.inspector,
                coa_user_id:   isMun ? 'MUN_FAN'   : (row.inspector || row.coa_user || auth?.user?.employee_id),
                coa_mgr:       isMun ? 'MUN_PEACH' : undefined,
                notes: row.notes,
            };
            await generateAndDownloadCoa(pdfData, isMun ? 'seed_mun' : 'seed_isp');
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

    const fetchData = async (date = '', keyword = '') => {
        try {
            setLoading(true);
            const response = await axios.get(`/mar/plan-order/pending-coa?type=palm-kernel${date ? `&date=${date}` : ''}${keyword ? `&q=${keyword}` : ''}`);
            if (response.data.success && response.data.data) {
                const mapped: SeedCOAData[] = response.data.data.map((s: any) => ({
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
                    destination_name: s.Recipient || '', // ดึงข้อมูลปลายทาง
                    status: s.Status_coa || (s.Status === 'p' ? 'processing' : 'pending'),
                    sop_status: s.Status,
                    created_at: parseDateString(s.coa_date || s.SOPDate),
                }));
                setData(mapped);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData(dateFilter, filter);
        }, 500);
        return () => clearTimeout(timer);
    }, [dateFilter, filter]);

    useEffect(() => {
        // ตรวจสอบ SOPID จาก URL เพื่อดึงข้อมูลอัตโนมัติ
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
                type: 'seed',
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
                await fetchData(dateFilter);
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
                fetchData(dateFilter);
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
        (!filter || [item.coa_no, item.lot_no, item.product_name, item.driver_name, item.license_plate, item.customer_name, item.id?.toString() || ''].join(' ').toLowerCase().includes(filter.toLowerCase())) &&
        (statusFilter === 'all' || item.status === statusFilter) &&
        item.sop_status !== 'C'
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
                fetchData(dateFilter);
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

    const TableRow = ({ row, index, page, color, showResults = true, showActions = true }: { row: SeedCOAData; index: number; page: number; color: string; showResults: boolean; showActions?: boolean }) => (
        <tr className="group border-b border-slate-100 transition-colors hover:bg-slate-50/80">
            <td className="w-[56px] px-3 py-3 text-center align-middle">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                    {(page - 1) * itemsPerPage + index + 1}
                </span>
            </td>
            <td className="px-2 py-2 align-middle">
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="w-fit rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700">
                        {row.coa_no}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDisplayDate(row.created_at)}
                    </span>
                </div>
            </td>
            <td className="px-2 py-2 align-middle">
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm font-semibold text-slate-900">{row.lot_no}</span>
                    <span className="flex max-w-[220px] items-center gap-1.5 truncate text-xs font-medium text-slate-500">
                        <Sprout className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        {row.product_name}
                    </span>
                </div>
            </td>
            <td className="px-2 py-2 align-middle">
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex max-w-[240px] items-center gap-1.5 truncate text-sm font-semibold text-slate-800">
                        <UserCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {row.customer_name || '-'}
                    </span>
                    <span className="flex max-w-[240px] items-center gap-1.5 truncate text-xs font-medium text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {row.destination_name || '-'}
                    </span>
                </div>
            </td>
            <td className="px-2 py-2 align-middle">
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <Truck className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {row.license_plate || '-'}
                    </span>
                    <span className="flex max-w-[180px] items-center gap-1.5 truncate text-xs text-slate-500">
                        <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {row.driver_name || '-'}
                    </span>
                </div>
            </td>
            {showResults && (
                <td className="px-2 py-2 align-middle">
                    <div className="grid min-w-[180px] grid-cols-2 gap-1.5">
                        {[
                            { key: 'result_shell', label: '%Shell', unit: '%' },
                            { key: 'result_kn_moisture', label: '%KN Moisture', unit: '%' },
                        ].map(({ key, label, unit }) => (
                            <div key={key} className={`rounded-lg border px-2 py-1.5 text-center ${getResultColor(key, row[key as keyof SeedCOAData] as number)}`}>
                                <div className="text-[10px] font-semibold leading-none opacity-80">{label}</div>
                                <div className="mt-1 flex items-center justify-center gap-1 text-xs font-bold">
                                    {getResultValue(row[key as keyof SeedCOAData] as number, unit)}
                                    {getTrendIcon(row[key as keyof SeedCOAData] as number, key)}
                                </div>
                            </div>
                        ))}
                    </div>
                </td>
            )}
            <td className="px-3 py-2 align-middle">
                <div className="flex min-w-[128px] flex-col items-start gap-1.5">
                    {showResults
                        ? getStatusBadge(
                            row.status,
                            () => setCoaDetailModal({ open: true, data: row as SeedCOAData })
                          )
                        : getStatusBadge(
                            row.status,
                            canEditRow(row as SeedCOAData) ? () => setLabModal({ open: true, data: row }) : undefined
                          )
                    }
                </div>
            </td>
            {showActions && (
            <td className="w-[76px] px-3 py-2 align-middle">
                <div className="flex justify-center">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-9 w-9 rounded-full border border-slate-200 bg-white p-0 text-slate-600 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-200"
                                aria-label="เปิดเมนูจัดการ"
                            >
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            sideOffset={0}
                            disableAnimation
                            hideUntilPlaced
                            className="w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
                        >
                            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                จัดการรายการ
                            </DropdownMenuLabel>

                            {/* ดูรายละเอียด — เปิด COADetailModal แบบ COA format */}
                            <DropdownMenuItem
                                className="group flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700"
                                onClick={() => setCoaDetailModal({ open: true, data: row as SeedCOAData })}
                            >
                                <div className="rounded-md bg-emerald-100 p-1.5">
                                    <Eye className="h-4 w-4 text-emerald-600" />
                                </div>
                                <span className="font-medium">ดูรายละเอียด</span>
                            </DropdownMenuItem>

                            {/* แก้ไขข้อมูล */}
                            {canEditRow(row as SeedCOAData) && (
                                <DropdownMenuItem
                                    className="group flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700"
                                    onClick={() => setLabModal({ open: true, data: row as SeedCOAData })}
                                >
                                    <div className="rounded-md bg-amber-100 p-1.5">
                                        <Pencil className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <span className="font-medium">แก้ไขข้อมูล</span>
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                การตรวจสอบ
                            </DropdownMenuLabel>


                            <DropdownMenuItem
                                className="group flex items-center gap-1 rounded-lg px-3 py-1 text-sm cursor-pointer text-slate-700 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                                onClick={() => window.open(`/qac/coa/seed/${(row as SeedCOAData).id}/vehicle-print`, '_blank')}
                            >
                                <div className="rounded-md p-1.5 bg-blue-100">
                                    <Printer className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">แบบฟอร์มตรวจรถ</span>
                                    <span className="text-xs text-slate-400">FM-QAC-67-0029</span>
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                ดาวน์โหลดเอกสาร
                            </DropdownMenuLabel>

                            {/* ดาวน์โหลด COA ISP — เทาถ้ายังไม่อนุมัติ */}
                            <DropdownMenuItem
                                disabled={(row as SeedCOAData).status !== 'A'}
                                className={`group flex items-center gap-1 rounded-lg px-3 py-1 text-sm ${(row as SeedCOAData).status === 'A' ? 'cursor-pointer text-slate-700 hover:bg-sky-50 hover:text-sky-700 focus:bg-sky-50 focus:text-sky-700' : 'cursor-not-allowed opacity-40 text-slate-400'}`}
                                onClick={() => (row as SeedCOAData).status === 'A' && handleGenerateCOA(row as SeedCOAData, 'isp')}
                            >
                                <div className={`rounded-md p-1.5 ${(row as SeedCOAData).status === 'A' ? 'bg-sky-100' : 'bg-slate-100'}`}>
                                    <FileDown className={`h-4 w-4 ${(row as SeedCOAData).status === 'A' ? 'text-sky-600' : 'text-slate-400'}`} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">COA ISP</span>
                                    <span className="text-xs text-slate-400">{(row as SeedCOAData).status === 'A' ? 'มาตรฐาน ISP' : 'ต้องอนุมัติก่อน'}</span>
                                </div>
                            </DropdownMenuItem>

                            {/* ดาวน์โหลด COA MUN — เทาถ้ายังไม่อนุมัติ */}
                            <DropdownMenuItem
                                disabled={(row as SeedCOAData).status !== 'A'}
                                className={`group flex items-center gap-1 rounded-lg px-3 py-1 text-sm ${(row as SeedCOAData).status === 'A' ? 'cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700' : 'cursor-not-allowed opacity-40 text-slate-400'}`}
                                onClick={() => (row as SeedCOAData).status === 'A' && handleGenerateCOA(row as SeedCOAData, 'mun')}
                            >
                                <div className={`rounded-md p-1.5 ${(row as SeedCOAData).status === 'A' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                    <FileDown className={`h-4 w-4 ${(row as SeedCOAData).status === 'A' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">COA MUN</span>
                                    <span className="text-xs text-slate-400">{(row as SeedCOAData).status === 'A' ? 'มาตรฐาน MUN' : 'ต้องอนุมัติก่อน'}</span>
                                </div>
                            </DropdownMenuItem>

                            {/* พิมพ์เอกสาร — เทาถ้ายังไม่อนุมัติ */}
                            <DropdownMenuItem
                                disabled={(row as SeedCOAData).status !== 'A'}
                                className={`group flex items-center gap-1 rounded-lg px-3 py-1 text-sm ${(row as SeedCOAData).status === 'A' ? 'cursor-pointer text-slate-700 hover:bg-slate-50 hover:text-slate-800 focus:bg-slate-50 focus:text-slate-800' : 'cursor-not-allowed opacity-40 text-slate-400'}`}
                                onClick={() => (row as SeedCOAData).status === 'A' && window.open(`/qac/coa/seed/${row.id}/print`, '_blank')}
                            >
                                <div className={`rounded-md p-1.5 ${(row as SeedCOAData).status === 'A' ? 'bg-slate-100' : 'bg-slate-100'}`}>
                                    <Printer className={`h-4 w-4 ${(row as SeedCOAData).status === 'A' ? 'text-slate-600' : 'text-slate-400'}`} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">พิมพ์เอกสาร</span>
                                    <span className="text-xs text-slate-400">{(row as SeedCOAData).status === 'A' ? 'แสดง A4 Preview ก่อนพิมพ์' : 'ต้องอนุมัติก่อน'}</span>
                                </div>
                            </DropdownMenuItem>

                            {canEditRow(row as SeedCOAData) && (
                                <>
                                    <DropdownMenuSeparator className="my-2" />
                                    <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-rose-500 uppercase tracking-wider">
                                        การดำเนินการพิเศษ
                                    </DropdownMenuLabel>

                                    <DropdownMenuItem
                                        className="group flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700"
                                        onClick={() => handleCancel(row.id)}
                                    >
                                        <div className="rounded-md bg-orange-100 p-1.5">
                                            <Ban className="h-4 w-4 text-orange-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium">ยกเลิกรายการ</span>
                                            <span className="text-xs text-slate-500">เปลี่ยนสถานะเป็นยกเลิก</span>
                                        </div>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        className="group flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
                                        onClick={() => handleDelete(row.id)}
                                    >
                                        <div className="rounded-md bg-red-100 p-1.5">
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium">ลบข้อมูล</span>
                                            <span className="text-xs text-slate-500">ลบถาวรไม่สามารถกู้คืน</span>
                                        </div>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </td>
            )}
        </tr>
    );

    const GridCard = ({ row }: { row: SeedCOAData }) => {
        const config = STATUS_CONFIG[row.status];
        const Icon = config.icon;
        const actionMenuRef = React.useRef<HTMLDivElement>(null);
        const [actionMenuOpen, setActionMenuOpen] = React.useState(false);

        React.useEffect(() => {
            if (!actionMenuOpen) return;
            const handleClickOutside = (event: MouseEvent) => {
                if (!actionMenuRef.current?.contains(event.target as Node)) {
                    setActionMenuOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [actionMenuOpen]);

        const runAction = (action: () => void) => {
            setActionMenuOpen(false);
            action();
        };

        return (
            <div className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
                {/* Status Badge - Top Right */}
                <div className="absolute top-4 right-4">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${STATUS_BADGE_WIDTH_CLASS} ${config.bg} ${config.border} ${config.text}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {config.label}
                    </div>
                </div>

                {/* Header Section */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-500">{formatDisplayDate(row.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                            {row.coa_no}
                        </h3>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                        <Hash className="w-4 h-4 text-slate-500" />
                        <div className="text-sm">
                            <span className="text-slate-500">Lot:</span>
                            <span className="ml-1 font-semibold text-slate-800">{row.lot_no}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                        <Fuel className="w-4 h-4 text-slate-500" />
                        <div className="text-sm">
                            <span className="text-slate-500">Tank:</span>
                            <span className="ml-1 font-semibold text-slate-800">{row.coa_tank || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-slate-50">
                        <Sprout className="w-4 h-4 text-emerald-600" />
                        <span className="text-slate-700">{row.product_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-slate-50">
                        <Truck className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-700">{row.license_plate || '-'}</span>
                    </div>
                </div>

                {row.status !== 'processing' && row.status !== 'pending' && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {['result_shell', 'result_kn_moisture'].map((type) => (
                            <div key={type} className={`rounded-lg p-3 text-center ${getResultColor(type, row[type as keyof SeedCOAData] as number)}`}>
                                <div className="flex items-center justify-center gap-1 text-xs font-medium mb-1 uppercase">
                                    <ResultIcon type={type} />
                                    {type === 'result_shell' ? 'SHELL' : 'KN MOISTURE'}
                                </div>
                                <div className="font-bold text-sm">
                                    {getResultValue(row[type as keyof SeedCOAData] as number, '%')}
                                </div>
                                <div className="flex justify-center mt-1">
                                    {getTrendIcon(row[type as keyof SeedCOAData] as number, type)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end pt-2">
                    <div ref={actionMenuRef} className="relative inline-block text-left">
                        <button
                            type="button"
                            onClick={() => setActionMenuOpen(open => !open)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                            aria-expanded={actionMenuOpen}
                            aria-haspopup="menu"
                            aria-label="เปิดเมนูจัดการ"
                        >
                            <MoreHorizontal className="h-5 w-5" />
                        </button>

                        {actionMenuOpen && (
                            <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                                <div className="py-1">
                                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        จัดการรายการ
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => runAction(() => setCoaDetailModal({ open: true, data: row as SeedCOAData }))}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700 focus:outline-none"
                                    >
                                        <span className="rounded-md bg-emerald-100 p-1.5">
                                            <Eye className="h-4 w-4 text-emerald-600" />
                                        </span>
                                        <span className="font-medium">ดูรายละเอียด</span>
                                    </button>
                                    {canEditRow(row as SeedCOAData) && (
                                        <button
                                            type="button"
                                            onClick={() => runAction(() => setLabModal({ open: true, data: row as SeedCOAData }))}
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700 focus:outline-none"
                                        >
                                            <span className="rounded-md bg-amber-100 p-1.5">
                                                <Pencil className="h-4 w-4 text-amber-600" />
                                            </span>
                                            <span className="font-medium">แก้ไขข้อมูล</span>
                                        </button>
                                    )}
                                </div>

                                <div className="py-1">
                                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        ดาวน์โหลดเอกสาร
                                    </div>
                                    <button
                                        type="button"
                                        disabled={(row as SeedCOAData).status !== 'A'}
                                        onClick={() => runAction(() => handleGenerateCOA(row as SeedCOAData, 'isp'))}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${(row as SeedCOAData).status === 'A' ? 'text-slate-700 hover:bg-sky-50 hover:text-sky-700 focus:bg-sky-50 focus:text-sky-700' : 'cursor-not-allowed opacity-40 text-slate-400'} focus:outline-none`}
                                    >
                                        <span className={`rounded-md p-1.5 ${(row as SeedCOAData).status === 'A' ? 'bg-sky-100' : 'bg-slate-100'}`}>
                                            <FileDown className={`h-4 w-4 ${(row as SeedCOAData).status === 'A' ? 'text-sky-600' : 'text-slate-400'}`} />
                                        </span>
                                        <span className="font-medium">COA ISP</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={(row as SeedCOAData).status !== 'A'}
                                        onClick={() => runAction(() => handleGenerateCOA(row as SeedCOAData, 'mun'))}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${(row as SeedCOAData).status === 'A' ? 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700' : 'cursor-not-allowed opacity-40 text-slate-400'} focus:outline-none`}
                                    >
                                        <span className={`rounded-md p-1.5 ${(row as SeedCOAData).status === 'A' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                            <FileDown className={`h-4 w-4 ${(row as SeedCOAData).status === 'A' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                        </span>
                                        <span className="font-medium">COA MUN</span>
                                    </button>
                                </div>

                                {canEditRow(row as SeedCOAData) && (
                                    <div className="py-1">
                                        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-rose-500">
                                            การดำเนินการพิเศษ
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => runAction(() => handleCancel(row.id))}
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-orange-600 hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700 focus:outline-none"
                                        >
                                            <span className="rounded-md bg-orange-100 p-1.5">
                                                <Ban className="h-4 w-4 text-orange-600" />
                                            </span>
                                            <span className="font-medium">ยกเลิกรายการ</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => runAction(() => handleDelete(row.id))}
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 focus:outline-none"
                                        >
                                            <span className="rounded-md bg-red-100 p-1.5">
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </span>
                                            <span className="font-medium">ลบข้อมูล</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderTable = (data: SeedCOAData[], pageData: SeedCOAData[], page: number, title: string, icon: React.ReactNode, color: string, showResults: boolean = true) => {
        const sectionStyle = SECTION_STYLES[color] || SECTION_STYLES.blue;

        return (
        <div className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${sectionStyle.icon}`}>
                        {icon}
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">
                        {title}
                    </h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sectionStyle.badge}`}>
                        {data.length} รายการ
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                        <button
                            title="มุมมองตาราง"
                            onClick={() => setViewMode('table')}
                            className={`rounded-md p-2 transition-colors ${viewMode === 'table' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <GanttChartSquare className="w-4 h-4" />
                        </button>
                        <button
                            title="มุมมองการ์ด"
                            onClick={() => setViewMode('grid')}
                            className={`rounded-md p-2 transition-colors ${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Package className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        title="ย่อ/ขยาย"
                        onClick={() => setExpanded(prev => ({ ...prev, [title === 'รายการรอตรวจสอบ' ? 'processing' : 'others']: !prev[title === 'รายการรอตรวจสอบ' ? 'processing' : 'others'] }))}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-colors hover:bg-slate-50"
                    >
                        {expanded[title === 'รายการรอตรวจสอบ' ? 'processing' : 'others'] ? <ArrowUp className="w-5 h-5 text-gray-500" /> : <ArrowDown className="w-5 h-5 text-gray-500" />}
                    </button>
                </div>
            </div>

            {expanded[title === 'รายการรอตรวจสอบ' ? 'processing' : 'others'] && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    {viewMode === 'table' ? (
                        <div className="w-full overflow-visible">
                            <table className="w-full min-w-[1080px] table-fixed divide-y divide-slate-200">
                                <thead className={`${sectionStyle.header} sticky top-0 z-[1]`}>
                                    <tr>
                                        <th className="w-[56px] px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">#</th>
                                        <th className="w-[140px] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">COA / วันที่</th>
                                        <th className="w-[180px] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Lot / สินค้า</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">ลูกค้า / ปลายทาง</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">รถ / คนขับ</th>
                                        {showResults && <th className="w-[200px] border-x border-emerald-100 bg-emerald-100/40 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-600">ผลตรวจ</th>}
                                        <th className="w-[140px] px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">สถานะ</th>
                                        {showResults && <th className="w-[76px] px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">จัดการ</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {pageData.length > 0 ? (
                                        pageData.map((row, i) => <TableRow key={row.id} row={row} index={i} page={page} color={color} showResults={showResults} showActions={showResults} />)
                                    ) : (
                                        <tr>
                                            <td colSpan={showResults ? 8 : 6} className="px-4 py-8 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="p-3 rounded-xl mb-2 bg-gray-100">
                                                        <FileDown className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-sm text-gray-500">ไม่มีข้อมูล</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6">
                            {pageData.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {pageData.map((row) => (
                                        <GridCard key={row.id} row={row} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="p-4 rounded-full bg-gray-50 mb-4">
                                        <Package className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">ไม่พบข้อมูล</h3>
                                    <p className="text-gray-500">ยังไม่มีรายการในสถานะนี้</p>
                                </div>
                            )}
                        </div>
                    )}

                    {data.length > itemsPerPage && (
                        <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">แสดง {Math.min(pageData.length, itemsPerPage)} จาก {data.length} รายการ</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => title === 'รายการรอตรวจสอบ' ? setCurrentPage(p => Math.max(1, p - 1)) : setCurrentPageBottom(p => Math.max(1, p - 1))}
                                        disabled={title === 'รายการรอตรวจสอบ' ? currentPage === 1 : currentPageBottom === 1}
                                        className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm px-2 text-gray-700">
                                        {title === 'รายการรอตรวจสอบ' ? currentPage : currentPageBottom} / {Math.ceil(data.length / itemsPerPage)}
                                    </span>
                                    <button
                                        onClick={() => title === 'รายการรอตรวจสอบ' ? setCurrentPage(p => Math.min(p + 1, Math.ceil(data.length / itemsPerPage))) : setCurrentPageBottom(p => Math.min(p + 1, Math.ceil(data.length / itemsPerPage)))}
                                        disabled={title === 'รายการรอตรวจสอบ' ? currentPage === Math.ceil(data.length / itemsPerPage) : currentPageBottom === Math.ceil(data.length / itemsPerPage)}
                                        className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
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
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                {/* Header */}
                <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 shadow-2xl">
                    {/* Decorative Background Elements */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
                        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                    </div>

                    <div className="relative px-4 py-5 sm:px-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            {/* Title Section */}
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20 ring-1 ring-white/10">
                                    <Sprout className="h-7 w-7 text-white drop-shadow-md" />
                                </div>
                                <div>
                                    <h1 className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-2xl font-black tracking-tight text-transparent drop-shadow-sm">
                                        Seed COA Management
                                    </h1>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                        <p className="text-sm font-medium tracking-wide text-slate-400">
                                            Certificate of Analysis • <span className="text-slate-300">ควบคุมคุณภาพเมล็ดในปาล์ม</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:w-[750px]">
                                {STATS_CARDS.map(({ label, color, filter, icon: Icon }) => {
                                    const isActive = statusFilter === (filter || 'all');
                                    const count = filter ? data.filter(d => d.status === filter).length : data.length;
                                    
                                    // Map original colors to dark theme equivalents
                                    const c: Record<string, { b: string, bg: string, t: string, g: string }> = {
                                        blue: { b: 'border-blue-500/50', bg: 'bg-blue-500/10', t: 'text-blue-400', g: 'from-blue-500 to-cyan-400' },
                                        amber: { b: 'border-amber-500/50', bg: 'bg-amber-500/10', t: 'text-amber-400', g: 'from-amber-500 to-yellow-400' },
                                        sky: { b: 'border-sky-500/50', bg: 'bg-sky-500/10', t: 'text-sky-400', g: 'from-sky-500 to-blue-400' },
                                        rose: { b: 'border-rose-500/50', bg: 'bg-rose-500/10', t: 'text-rose-400', g: 'from-rose-500 to-red-400' },
                                        emerald: { b: 'border-emerald-500/50', bg: 'bg-emerald-500/10', t: 'text-emerald-400', g: 'from-emerald-500 to-green-400' },
                                        slate: { b: 'border-slate-500/50', bg: 'bg-slate-500/10', t: 'text-slate-300', g: 'from-slate-400 to-slate-300' },
                                    };
                                    const theme = c[color] || c.blue;

                                    return (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() => setStatusFilter(filter || 'all')}
                                            className={`group relative flex flex-col items-start justify-between overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                                                isActive 
                                                    ? `${theme.b} ${theme.bg} shadow-black/40` 
                                                    : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/80 shadow-black/20'
                                            }`}
                                        >
                                            <div className="flex w-full items-center justify-between">
                                                <span className={`text-[11px] font-bold tracking-wider ${isActive ? theme.t : 'text-slate-400 group-hover:text-slate-300'}`}>
                                                    {label}
                                                </span>
                                                <div className={`rounded-lg p-1 ${isActive ? theme.bg : 'bg-slate-800/50 group-hover:bg-slate-700/50'} transition-colors`}>
                                                    <Icon className={`h-4 w-4 ${isActive ? theme.t : 'text-slate-500 group-hover:text-slate-400'}`} />
                                                </div>
                                            </div>
                                            <div className={`mt-2.5 text-2xl font-black tracking-tight ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white transition-colors'}`}>
                                                {count}
                                            </div>
                                            
                                            {/* Active Glow Line */}
                                            {isActive && (
                                                <div className={`absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r ${theme.g}`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-6">
                    {/* Recent Records Info Label */}
                    {!dateFilter && !filter && (
                        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50/50 px-3 py-2 rounded-xl border border-green-100 w-fit animate-pulse">
                            <Info className="w-3.5 h-3.5" />
                            แสดงรายการย้อนหลัง 60 วัน (ระบุวันที่หรือค้นหาเพื่อดูข้อมูลเก่ากว่า)
                        </div>
                    )}
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

            <COADetailModal
                open={coaDetailModal.open}
                data={coaDetailModal.data}
                canApprove={canApprove}
                canEdit={isQACAdmin}
                onClose={() => setCoaDetailModal({ open: false, data: null })}
                onApprove={handleApprove}
                onEdit={(row) => setLabModal({ open: true, data: row })}
                onVehicleCheck={(row) => setTruckModal({ open: true, data: row })}
            />

            <VehicleCheckModal
                isOpen={truckModal.open}
                onClose={() => setTruckModal({ open: false, data: null })}
                order={truckModal.data}
                onGenerateCAR={handleGenerateCAR}
                autoDownload={false}
                customLabels={[
                    { id: 'is_clean', label: '1. พื้นกะบะสะอาด / ไม่ชื้น' },
                    { id: 'is_covered', label: '2. ไม่มีการปนเปื้อนยางรวมในกะบะบรรทุกสินค้า' },
                    { id: 'is_no_smell', label: '3. ไม่มีการปนเปื้อนนายิสในกะบะบรรทุกสินค้า' },
                    { id: 'is_doc_valid', label: '4. ไม่มีสิ่งอื่นใดในท้ายกะบะบรรทุกสินค้า' },
                ]}
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
