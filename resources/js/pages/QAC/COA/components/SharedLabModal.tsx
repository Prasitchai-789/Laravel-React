// resources/js/pages/QAC/COA/components/SharedLabModal.tsx
import { usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    Beaker,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Droplet,
    Droplets,
    FileText,
    FlaskConical,
    Gauge,
    Package,
    Save,
    Thermometer,
    TrendingUp,
    Truck,
    User,
    X,
    Zap,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export interface SharedCOAData {
    id: number;
    coa_no: string;
    lot_no: string;
    product_name: string;
    customer_name?: string;
    destination_name?: string;
    license_plate?: string;
    driver_name?: string;
    status: 'pending' | 'processing' | 'approved' | 'rejected' | 'W' | 'A' | 'C';
    notes?: string;
    created_at?: string;
    inspector?: string;
    coa_tank?: string;
    // Oil fields
    ffa?: number | string;
    m_i?: number | string;
    iv?: number | string;
    dobi?: number | string;
    spec_ffa?: string;
    spec_moisture?: string;
    spec_iv?: string;
    spec_dobi?: string;
    // Seed fields
    result_shell?: number | string;
    result_kn_moisture?: number | string;
    spec_shell?: string;
    spec_kn_moisture?: string;
    coa_user?: string;
    coa_user_id?: string;
    coa_mgr?: string;
}

interface SharedLabModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: SharedCOAData | null;
    type: 'oil' | 'seed';
    onSave: (data: Partial<SharedCOAData>) => void | Promise<void>;
}

interface SharedLabPageProps {
    auth?: {
        user?: {
            name?: string;
            employee_id?: string | number;
        };
        employee_name?: string;
    };
}

export default function SharedLabModal({ isOpen, onClose, data, type, onSave }: SharedLabModalProps) {
    const [form, setForm] = useState<Partial<SharedCOAData>>({});
    const [tankError, setTankError] = useState('');
    const tankSelectRef = useRef<HTMLSelectElement>(null);

    const { auth } = usePage().props as unknown as SharedLabPageProps;
    const currentUserName = auth?.employee_name || auth?.user?.name || '';

    useEffect(() => {
        if (isOpen && data) {
            if (!form.id || form.id !== data.id) {
                const formData = { ...data };

                if (formData.coa_no === '-') formData.coa_no = '';
                if (formData.lot_no === '-') formData.lot_no = '';

                // ตั้งค่าเริ่มต้นของ Spec มาตรฐาน เพื่อลดการกรอก
                if (type === 'seed') {
                    if (!formData.spec_shell) formData.spec_shell = '< 10.00 %';
                    if (!formData.spec_kn_moisture) formData.spec_kn_moisture = '< 8.00 %';
                } else if (type === 'oil') {
                    if (!formData.spec_ffa) formData.spec_ffa = 'Max 5.00 %';
                    if (!formData.spec_moisture) formData.spec_moisture = 'Max 0.25 %';
                    if (!formData.spec_iv) formData.spec_iv = 'Min 50.00';
                    if (!formData.spec_dobi) formData.spec_dobi = 'Min 2.00';
                }

                setForm(formData);
                setTankError('');

                // ดึงข้อมูลเลข COA และ Lot อัตโนมัติถ้ายังไม่มี
                if (!formData.coa_no || !formData.lot_no) {
                    axios.get(`/qac/coa/next-number?sopid=${data.id}&type=${type}`)
                        .then(response => {
                            if (response.data.success) {
                                setForm(prev => ({
                                    ...prev,
                                    coa_no: prev.coa_no || response.data.coa_number || '',
                                    lot_no: prev.lot_no || response.data.coa_lot || '',
                                }));
                            }
                        })
                        .catch(err => {
                            console.error('Error fetching next COA/Lot number:', err);
                        });
                }
            }
        } else if (!isOpen) {
            setForm({});
            setTankError('');
        }
    }, [data, data?.id, form.id, isOpen, type]);

    if (!isOpen || !data) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!String(form.coa_tank || '').trim()) {
            setTankError('กรุณาเลือก Tank ก่อนบันทึก COA');
            tankSelectRef.current?.focus();
            return;
        }

        await onSave({
            ...form,
            status: 'W',
            inspector: currentUserName || form.inspector,
            coa_user_id: String(auth?.user?.employee_id || form.coa_user_id || ''),
        });
        onClose();
    };

    const isOil = type === 'oil';

    const theme = {
        primary: isOil ? 'blue' : 'emerald',
        gradient: isOil ? 'from-blue-600 via-blue-700 to-indigo-800' : 'from-emerald-600 via-green-700 to-teal-800',
        accent: isOil ? 'blue' : 'emerald',
        light: isOil ? 'blue' : 'emerald',
        ring: isOil ? 'ring-blue-500/20' : 'ring-emerald-500/20',
        inputFocus: isOil ? 'focus:border-blue-500 focus:ring-blue-500/20' : 'focus:border-emerald-500 focus:ring-emerald-500/20',
    };

    const title = isOil ? 'บันทึกผลการวิเคราะห์ (น้ำมัน)' : 'บันทึกผลการวิเคราะห์ (เมล็ด)';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm transition-opacity duration-200" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-200 animate-in zoom-in-95">
                {/* Enhanced Header */}
                <div className={`relative shrink-0 bg-gradient-to-br ${theme.gradient} overflow-hidden`}>
                    {/* Decorative background pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white blur-3xl" />
                        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white blur-3xl" />
                    </div>

                    <div className="relative px-5 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/20 p-2 shadow-lg backdrop-blur-sm">
                                    <FlaskConical className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-white">{title}</h2>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                                            SOPID: {data.id}
                                        </span>
                                        <span className={`rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm`}>
                                            {type.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="group rounded-xl p-2 transition-all duration-200 hover:bg-red-600">
                                <X className="h-5 w-5 text-white transition-transform duration-200 group-hover:rotate-90" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    <form id="lab-form" onSubmit={handleSubmit} className="space-y-4">
                        {/* Receiving Info Card */}
                        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-slate-50 to-gray-50 p-4 shadow-sm">
                            <div className="mb-2 flex items-center gap-3">
                                <div className="rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 p-2 shadow-md">
                                    <Truck className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-800">ข้อมูลการรับสินค้า</h3>
                                    <p className="text-xs text-gray-500">Receiving Information</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                {[
                                    { label: 'สินค้า', value: data.product_name, icon: Package, color: 'from-amber-500 to-orange-600' },
                                    { label: 'คู่ค้า', value: data.customer_name || '-', icon: User, color: 'from-blue-500 to-blue-600' },
                                    { label: 'ทะเบียนรถ', value: data.license_plate || '-', icon: Truck, color: 'from-purple-500 to-purple-600' },
                                    { label: 'คนขับ', value: data.driver_name || '-', icon: User, color: 'from-pink-500 to-rose-600' },
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        <div className="mb-1.5 flex items-center gap-2">
                                            <div className={`bg-gradient-to-br p-1.5 ${item.color} rounded-lg`}>
                                                <item.icon className="h-3 w-3 text-white" />
                                            </div>
                                            <span className="text-xs font-medium text-gray-500">{item.label}</span>
                                        </div>
                                        <p className="truncate text-sm font-semibold text-gray-900" title={item.value}>
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* COA No., Lot No., Tank */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="mb-2 flex items-center gap-3">
                                <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-2 shadow-md">
                                    <ClipboardList className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-800">เอกสารอ้างอิง</h3>
                                    <p className="text-xs text-gray-500">Reference Documents</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <FileText className="h-4 w-4 text-gray-500" />
                                        COA No.
                                    </label>
                                    <input
                                        type="text"
                                        value={form.coa_no || ''}
                                        onChange={(e) => setForm({ ...form, coa_no: e.target.value })}
                                        className={`w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium placeholder:text-gray-400 ${theme.inputFocus} transition-all duration-200`}
                                        placeholder="ระบบจะสร้างอัตโนมัติ"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <Package className="h-4 w-4 text-gray-500" />
                                        Lot No.
                                    </label>
                                    <input
                                        type="text"
                                        value={form.lot_no || ''}
                                        onChange={(e) => setForm({ ...form, lot_no: e.target.value })}
                                        className={`w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium placeholder:text-gray-400 ${theme.inputFocus} transition-all duration-200`}
                                        placeholder="QAC6905"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <Activity className="h-4 w-4 text-gray-500" />
                                        Tank
                                    </label>
                                    <div className="relative">
                                        <select
                                            ref={tankSelectRef}
                                            required
                                            value={form.coa_tank || ''}
                                            onChange={(e) => {
                                                setForm({ ...form, coa_tank: e.target.value });
                                                if (e.target.value) setTankError('');
                                            }}
                                            aria-invalid={Boolean(tankError)}
                                            className={`w-full appearance-none border-2 bg-gray-50 ${tankError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : `border-gray-200 ${theme.inputFocus}`} cursor-pointer rounded-xl py-2 pr-12 pl-4 text-sm font-medium transition-all duration-200`}
                                        >
                                            <option value="">เลือก Tank</option>
                                            <option value="1">Tank 1</option>
                                            <option value="2">Tank 2</option>
                                            <option value="3">Tank 3</option>
                                            <option value="4">Tank 4</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                    </div>
                                    {tankError && (
                                        <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            {tankError}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Results Card */}
                        <div
                            className={`bg-gradient-to-br ${isOil ? 'from-blue-50 to-indigo-50' : 'from-emerald-50 to-green-50'} rounded-xl border-2 p-4 ${isOil ? 'border-blue-200' : 'border-emerald-200'} shadow-lg`}
                        >
                            <div className="mb-2 flex items-center gap-3">
                                <div
                                    className={`bg-gradient-to-br p-2 ${isOil ? 'from-blue-600 to-blue-700' : 'from-emerald-600 to-green-700'} rounded-xl shadow-lg`}
                                >
                                    <Zap className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className={`text-base font-bold ${isOil ? 'text-blue-900' : 'text-emerald-900'}`}>ผลการวิเคราะห์ (Result)</h3>
                                    <p className="text-xs text-gray-500">Analysis Results</p>
                                </div>
                            </div>

                            {isOil ? (
                                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                    {[
                                        { key: 'ffa', label: '%FFA', icon: Droplets, color: 'blue', spec: '0.00' },
                                        { key: 'm_i', label: '%M&I', icon: Beaker, color: 'green', spec: '0.00' },
                                        { key: 'iv', label: '%IV', icon: Thermometer, color: 'purple', spec: '0.00' },
                                        { key: 'dobi', label: 'Dobi', icon: Gauge, color: 'orange', spec: '0.00' },
                                    ].map((field) => (
                                        <div
                                            key={field.key}
                                            className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                                        >
                                            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                <div className={`p-1.5 bg-${field.color}-100 rounded-lg`}>
                                                    <field.icon className={`h-4 w-4 text-${field.color}-600`} />
                                                </div>
                                                {field.label}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={form[field.key as keyof SharedCOAData] || ''}
                                                onChange={(e) => setForm({ ...form, [field.key]: parseFloat(e.target.value) || 0 })}
                                                className={`w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2 ${theme.inputFocus} text-base font-bold text-gray-900 transition-all duration-200 placeholder:text-gray-400`}
                                                placeholder={field.spec}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                                        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <div className="rounded-lg bg-purple-100 p-1.5">
                                                <Package className="h-4 w-4 text-purple-600" />
                                            </div>
                                            Shell (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={form.result_shell || ''}
                                                onChange={(e) => setForm({ ...form, result_shell: e.target.value })}
                                                className="w-full rounded-xl border-2 border-purple-200 bg-gray-50 px-4 py-2 text-base font-bold text-gray-900 transition-all duration-200 focus:border-purple-500 focus:ring-purple-500/20"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute top-1/2 right-4 -translate-y-1/2 font-semibold text-gray-400">%</span>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                                        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <div className="rounded-lg bg-cyan-100 p-1.5">
                                                <Droplet className="h-4 w-4 text-cyan-600" />
                                            </div>
                                            KN Moisture (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={form.result_kn_moisture || ''}
                                                onChange={(e) => setForm({ ...form, result_kn_moisture: e.target.value })}
                                                className="w-full rounded-xl border-2 border-cyan-200 bg-gray-50 px-4 py-2 text-base font-bold text-gray-900 transition-all duration-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute top-1/2 right-4 -translate-y-1/2 font-semibold text-gray-400">%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Spec Card */}
                        <div
                            className={`bg-gradient-to-br ${isOil ? 'from-indigo-50 to-purple-50' : 'from-blue-50 to-indigo-50'} rounded-xl border-2 p-4 ${isOil ? 'border-indigo-200' : 'border-blue-200'} shadow-lg`}
                        >
                            <div className="mb-2 flex items-center gap-3">
                                <div
                                    className={`bg-gradient-to-br p-2 ${isOil ? 'from-indigo-600 to-purple-700' : 'from-blue-600 to-indigo-700'} rounded-xl shadow-lg`}
                                >
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className={`text-base font-bold ${isOil ? 'text-indigo-900' : 'text-blue-900'}`}>ค่า Spec มาตรฐาน</h3>
                                    <p className="text-xs text-gray-500">Standard Specifications</p>
                                </div>
                            </div>

                            {isOil ? (
                                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                    {[
                                        { key: 'spec_ffa', label: 'Spec %FFA', icon: Droplets, color: 'indigo' },
                                        { key: 'spec_moisture', label: 'Spec %M&I', icon: Beaker, color: 'teal' },
                                        { key: 'spec_iv', label: 'Spec %IV', icon: Thermometer, color: 'violet' },
                                        { key: 'spec_dobi', label: 'Spec Dobi', icon: Gauge, color: 'pink' },
                                    ].map((field) => (
                                        <div key={field.key} className="space-y-1.5">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                                                <field.icon className={`h-4 w-4 text-${field.color}-600`} />
                                                {field.label}
                                            </label>
                                            <input
                                                type="text"
                                                value={form[field.key as keyof SharedCOAData] || ''}
                                                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                                className={`w-full border-2 bg-white px-3 py-2 border-${field.color}-200 rounded-xl focus:border-${field.color}-500 focus:ring-${field.color}-500/20 text-sm font-medium transition-all duration-200`}
                                                placeholder="-"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <Package className="h-4 w-4 text-blue-600" />
                                            Spec Shell
                                        </label>
                                        <input
                                            type="text"
                                            value={form.spec_shell || ''}
                                            onChange={(e) => setForm({ ...form, spec_shell: e.target.value })}
                                            className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-2 text-sm font-medium transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20"
                                            placeholder="เช่น < 10.00 %"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <Droplet className="h-4 w-4 text-blue-600" />
                                            Spec KN Moisture
                                        </label>
                                        <input
                                            type="text"
                                            value={form.spec_kn_moisture || ''}
                                            onChange={(e) => setForm({ ...form, spec_kn_moisture: e.target.value })}
                                            className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-2 text-sm font-medium transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20"
                                            placeholder="เช่น < 8.00 %"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Enhanced Footer */}
                <div className="shrink-0 border-t-2 border-gray-200 bg-gradient-to-b from-gray-50 to-white px-5 py-3">
                    <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <User className="h-4 w-4 text-gray-500" />
                                ผู้ตรวจสอบ (Inspector)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    readOnly
                                    value={currentUserName || form.inspector || ''}
                                    className="w-full cursor-not-allowed rounded-xl border-2 border-gray-200 bg-gray-100 py-2 pr-4 pl-10 font-medium text-gray-700"
                                />
                                <CheckCircle2 className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-green-500" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <FileText className="h-4 w-4 text-gray-500" />
                                หมายเหตุ (Notes)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={form.notes || ''}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className={`w-full rounded-xl border-2 border-gray-200 bg-white py-2 pr-4 pl-10 ${theme.inputFocus} text-sm transition-all duration-200`}
                                    placeholder="บันทึกเพิ่มเติม..."
                                />
                                <AlertTriangle className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-amber-400" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-end gap-3 border-t-2 border-gray-200 pt-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-100"
                        >
                            <X className="h-4 w-4" />
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            form="lab-form"
                            className={`bg-gradient-to-r px-5 py-2.5 ${theme.gradient} flex transform items-center justify-center gap-2 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl`}
                        >
                            <Save className="h-4 w-4" />
                            บันทึกผล
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
