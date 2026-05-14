// resources/js/pages/QAC/COA/components/SharedLabModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import {
    X, FlaskConical, Package, Activity, Droplets, Beaker, Thermometer, Gauge,
    TrendingUp, User, FileText, Droplet, Save,
    CheckCircle2, AlertTriangle, Truck, ClipboardList, Zap, ChevronDown
} from 'lucide-react';
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
            }
        } else if (!isOpen) {
            setForm({});
            setTankError('');
        }
    }, [data, data?.id, form.id, isOpen, type]);

    useEffect(() => {
        if (!isOpen || !data) return;

        axios
            .get('/qac/coa/next-number', { params: { type, sopid: data.id } })
            .then((res) => {
                const nextCoaNo = res.data?.coa_number;
                const nextLotNo = res.data?.coa_lot;
                if (!res.data?.success || !nextCoaNo) return;

                setForm((current) => {
                    if (current.id !== data.id) return current;
                    const shouldUpdateCoaNo = !current.coa_no || current.coa_no === '-' || current.coa_no === data.coa_no;
                    const shouldUpdateLotNo = nextLotNo && (!current.lot_no || current.lot_no === '-' || current.lot_no === data.lot_no);

                    if (!shouldUpdateCoaNo && !shouldUpdateLotNo) return current;

                    return {
                        ...current,
                        ...(shouldUpdateCoaNo ? { coa_no: nextCoaNo } : {}),
                        ...(shouldUpdateLotNo ? { lot_no: nextLotNo } : {}),
                    };
                });
            })
            .catch((err) => console.error('Failed to fetch next COA number', err));
    }, [data, data?.id, data?.coa_no, isOpen, type]);

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
            coa_user_id: String(auth?.user?.employee_id || form.coa_user_id || '')
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
            <div
                className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm transition-opacity duration-200"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-200">

                {/* Enhanced Header */}
                <div className={`relative shrink-0 bg-gradient-to-br ${theme.gradient} overflow-hidden`}>
                    {/* Decorative background pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
                        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl" />
                    </div>

                    <div className="relative px-5 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                                    <FlaskConical className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                                            SOPID: {data.id}
                                        </span>
                                        <span className={`px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white`}>
                                            {type.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-red-600 rounded-xl transition-all duration-200 group"
                            >
                                <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    <form id="lab-form" onSubmit={handleSubmit} className="space-y-4">

                        {/* Receiving Info Card */}
                        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl shadow-md">
                                    <Truck className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-800">ข้อมูลการรับสินค้า</h3>
                                    <p className="text-xs text-gray-500">Receiving Information</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {[
                                    { label: 'สินค้า', value: data.product_name, icon: Package, color: 'from-amber-500 to-orange-600' },
                                    { label: 'คู่ค้า', value: data.customer_name || '-', icon: User, color: 'from-blue-500 to-blue-600' },
                                    { label: 'ทะเบียนรถ', value: data.license_plate || '-', icon: Truck, color: 'from-purple-500 to-purple-600' },
                                    { label: 'คนขับ', value: data.driver_name || '-', icon: User, color: 'from-pink-500 to-rose-600' },
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className={`p-1.5 bg-gradient-to-br ${item.color} rounded-lg`}>
                                                <item.icon className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-xs font-medium text-gray-500">{item.label}</span>
                                        </div>
                                        <p className="font-semibold text-gray-900 text-sm truncate" title={item.value}>
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* COA No., Lot No., Tank */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-md">
                                    <ClipboardList className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-800">เอกสารอ้างอิง</h3>
                                    <p className="text-xs text-gray-500">Reference Documents</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        COA No.
                                    </label>
                                    <input
                                        type="text"
                                        value={form.coa_no || ''}
                                        onChange={(e) => setForm({ ...form, coa_no: e.target.value })}
                                        className={`w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl ${theme.inputFocus} transition-all duration-200 text-sm font-medium placeholder:text-gray-400`}
                                        placeholder="COA-2024-0001"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <Package className="w-4 h-4 text-gray-500" />
                                        Lot No.
                                    </label>
                                    <input
                                        type="text"
                                        value={form.lot_no || ''}
                                        onChange={(e) => setForm({ ...form, lot_no: e.target.value })}
                                        className={`w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl ${theme.inputFocus} transition-all duration-200 text-sm font-medium placeholder:text-gray-400`}
                                        placeholder="LOT-2024-001"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <Activity className="w-4 h-4 text-gray-500" />
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
                                            className={`w-full appearance-none bg-gray-50 border-2 ${tankError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : `border-gray-200 ${theme.inputFocus}`} rounded-xl py-2 pl-4 pr-12 transition-all duration-200 text-sm font-medium cursor-pointer`}
                                        >
                                            <option value="">เลือก Tank</option>
                                            <option value="1">Tank 1</option>
                                            <option value="2">Tank 2</option>
                                            <option value="3">Tank 3</option>
                                            <option value="4">Tank 4</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
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
                        <div className={`bg-gradient-to-br ${isOil ? 'from-blue-50 to-indigo-50' : 'from-emerald-50 to-green-50'} rounded-xl p-4 border-2 ${isOil ? 'border-blue-200' : 'border-emerald-200'} shadow-lg`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 bg-gradient-to-br ${isOil ? 'from-blue-600 to-blue-700' : 'from-emerald-600 to-green-700'} rounded-xl shadow-lg`}>
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className={`text-base font-bold ${isOil ? 'text-blue-900' : 'text-emerald-900'}`}>
                                        ผลการวิเคราะห์ (Result)
                                    </h3>
                                    <p className="text-xs text-gray-500">Analysis Results</p>
                                </div>
                            </div>

                            {isOil ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { key: 'ffa', label: '%FFA', icon: Droplets, color: 'blue', spec: '0.00' },
                                        { key: 'm_i', label: '%M&I', icon: Beaker, color: 'green', spec: '0.00' },
                                        { key: 'iv', label: '%IV', icon: Thermometer, color: 'purple', spec: '0.00' },
                                        { key: 'dobi', label: 'Dobi', icon: Gauge, color: 'orange', spec: '0.00' },
                                    ].map((field) => (
                                        <div key={field.key} className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                <div className={`p-1.5 bg-${field.color}-100 rounded-lg`}>
                                                    <field.icon className={`w-4 h-4 text-${field.color}-600`} />
                                                </div>
                                                {field.label}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={form[field.key as keyof SharedCOAData] || ''}
                                                onChange={(e) => setForm({ ...form, [field.key]: parseFloat(e.target.value) || 0 })}
                                                className={`w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl ${theme.inputFocus} transition-all duration-200 text-base font-bold text-gray-900 placeholder:text-gray-400`}
                                                placeholder={field.spec}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                            <div className="p-1.5 bg-purple-100 rounded-lg">
                                                <Package className="w-4 h-4 text-purple-600" />
                                            </div>
                                            Shell (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={form.result_shell || ''}
                                                onChange={(e) => setForm({ ...form, result_shell: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-50 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 text-base font-bold text-gray-900"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">%</span>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                            <div className="p-1.5 bg-cyan-100 rounded-lg">
                                                <Droplet className="w-4 h-4 text-cyan-600" />
                                            </div>
                                            KN Moisture (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={form.result_kn_moisture || ''}
                                                onChange={(e) => setForm({ ...form, result_kn_moisture: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-50 border-2 border-cyan-200 rounded-xl focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-200 text-base font-bold text-gray-900"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Spec Card */}
                        <div className={`bg-gradient-to-br ${isOil ? 'from-indigo-50 to-purple-50' : 'from-blue-50 to-indigo-50'} rounded-xl p-4 border-2 ${isOil ? 'border-indigo-200' : 'border-blue-200'} shadow-lg`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 bg-gradient-to-br ${isOil ? 'from-indigo-600 to-purple-700' : 'from-blue-600 to-indigo-700'} rounded-xl shadow-lg`}>
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className={`text-base font-bold ${isOil ? 'text-indigo-900' : 'text-blue-900'}`}>
                                        ค่า Spec มาตรฐาน
                                    </h3>
                                    <p className="text-xs text-gray-500">Standard Specifications</p>
                                </div>
                            </div>

                            {isOil ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { key: 'spec_ffa', label: 'Spec %FFA', icon: Droplets, color: 'indigo' },
                                        { key: 'spec_moisture', label: 'Spec %M&I', icon: Beaker, color: 'teal' },
                                        { key: 'spec_iv', label: 'Spec %IV', icon: Thermometer, color: 'violet' },
                                        { key: 'spec_dobi', label: 'Spec Dobi', icon: Gauge, color: 'pink' },
                                    ].map((field) => (
                                        <div key={field.key} className="space-y-1.5">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                                                <field.icon className={`w-4 h-4 text-${field.color}-600`} />
                                                {field.label}
                                            </label>
                                            <input
                                                type="text"
                                                value={form[field.key as keyof SharedCOAData] || ''}
                                                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                                className={`w-full px-3 py-2 bg-white border-2 border-${field.color}-200 rounded-xl focus:border-${field.color}-500 focus:ring-${field.color}-500/20 transition-all duration-200 text-sm font-medium`}
                                                placeholder="-"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <Package className="w-4 h-4 text-blue-600" />
                                            Spec Shell
                                        </label>
                                        <input
                                            type="text"
                                            value={form.spec_shell || ''}
                                            onChange={(e) => setForm({ ...form, spec_shell: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 text-sm font-medium"
                                            placeholder="เช่น < 10.00 %"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <Droplet className="w-4 h-4 text-blue-600" />
                                            Spec KN Moisture
                                        </label>
                                        <input
                                            type="text"
                                            value={form.spec_kn_moisture || ''}
                                            onChange={(e) => setForm({ ...form, spec_kn_moisture: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 text-sm font-medium"
                                            placeholder="เช่น < 8.00 %"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Enhanced Footer */}
                <div className="shrink-0 bg-gradient-to-b from-gray-50 to-white px-5 py-3 border-t-2 border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <User className="w-4 h-4 text-gray-500" />
                                ผู้ตรวจสอบ (Inspector)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    readOnly
                                    value={currentUserName || form.inspector || ''}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 font-medium cursor-not-allowed"
                                />
                                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <FileText className="w-4 h-4 text-gray-500" />
                                หมายเหตุ (Notes)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={form.notes || ''}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className={`w-full pl-10 pr-4 py-2 bg-white border-2 border-gray-200 rounded-xl ${theme.inputFocus} transition-all duration-200 text-sm`}
                                    placeholder="บันทึกเพิ่มเติม..."
                                />
                                <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t-2 border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-white border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            form="lab-form"
                            className={`px-5 py-2.5 bg-gradient-to-r ${theme.gradient} text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center gap-2`}
                        >
                            <Save className="w-4 h-4" />
                            บันทึกผล
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
