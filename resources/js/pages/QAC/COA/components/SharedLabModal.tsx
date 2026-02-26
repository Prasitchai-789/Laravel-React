// resources/js/pages/QAC/COA/components/SharedLabModal.tsx
import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
    X, FlaskConical, Package, Activity, Droplets, Beaker, Thermometer, Gauge,
    TrendingUp, User, FileText, Info, Droplet, FileDown, Loader2
} from 'lucide-react';
import axios from 'axios';
import { generateAndDownloadCoa } from '../PDF/coaPdfGenerator';

export interface SharedCOAData {
    id: number;
    coa_no: string;
    lot_no: string;
    product_name: string;
    customer_name?: string;
    license_plate?: string;
    driver_name?: string;
    status: 'pending' | 'processing' | 'approved' | 'rejected' | 'W' | 'A';
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
    onSave: (data: Partial<SharedCOAData>) => void;
}

export default function SharedLabModal({ isOpen, onClose, data, type, onSave }: SharedLabModalProps) {
    const [form, setForm] = useState<Partial<SharedCOAData>>({});
    const [pdfLoading, setPdfLoading] = useState(false);
    const [employees, setEmployees] = useState<{ EmpID: number, EmpName: string }[]>([]);

    const { auth } = usePage<any>().props;
    const currentUserName = auth?.employee_name || auth?.user?.name || '';

    useEffect(() => {
        if (isOpen && data) {
            // Only initialize form if it's empty or data ID has changed
            if (!form.id || form.id !== data.id) {
                const initialForm = { ...data };
                // We won't auto-fill a string name into a dropdown ID field,
                // but we map existing inspector which might be an ID or Name.
                setForm(initialForm);
            }
        } else if (!isOpen) {
            // Clear form when closed to ensure fresh start next time
            setForm({});
        }
    }, [data?.id, isOpen]); // Depend on ID specifically

    useEffect(() => {
        axios.get('/api/employees')
            .then(res => {
                if (res.data.success) {
                    setEmployees(res.data.data);
                }
            })
            .catch(err => console.error('Failed to fetch employees', err));
    }, []);

    if (!isOpen || !data) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...form,
            status: 'W' as any,
            inspector: currentUserName || form.inspector,
            coa_user_id: auth?.user?.employee_id || form.coa_user_id
        });
        onClose();
    };

    const handleDownloadPdf = async () => {
        setPdfLoading(true);
        try {
            await generateAndDownloadCoa({
                ...form,
                inspector: currentUserName || form.inspector,
                coa_user_id: auth?.user?.employee_id || form.coa_user_id,
            } as any, type);
        } catch (err) {
            console.error('PDF generation error:', err);
        } finally {
            setPdfLoading(false);
        }
    };

    const isOil = type === 'oil';
    const isSeed = type === 'seed';

    const headerColor = isOil ? 'from-blue-600 to-blue-700' : 'from-green-600 to-emerald-600';
    const title = isOil ? 'บันทึกผลการวิเคราะห์ (น้ำมัน)' : 'บันทึกผลการวิเคราะห์ (เมล็ด)';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[98vh] overflow-hidden flex flex-col">
                <div className={`shrink-0 bg-gradient-to-r ${headerColor} px-4 py-3 flex justify-between text-white`}>
                    <div className="flex items-center gap-3">
                        <FlaskConical className="w-5 h-5" />
                        <div>
                            <h2 className="text-base font-semibold">{title}</h2>
                            <p className="text-xs opacity-90">SOPID: {data.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl hover:rotate-90 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    <form id="lab-form" onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                        <Package className="w-4 h-4 text-gray-500" />
                                    </div>
                                    ข้อมูลการรับสินค้า
                                </h3>
                                <div className="grid grid-cols-4 gap-2 text-sm">
                                    <div className="col-span-1"><span className="text-gray-500 block mb-0.5">สินค้า</span><span className="font-semibold text-gray-900 bg-white px-2 py-1.5 rounded-lg border border-gray-100 block truncate" title={data.product_name}>{data.product_name}</span></div>
                                    <div className="col-span-1"><span className="text-gray-500 block mb-0.5">คู่ค้า</span><span className="font-medium text-gray-800 bg-white px-2 py-1.5 rounded-lg border border-gray-100 block truncate" title={data.customer_name || '-'}>{data.customer_name || '-'}</span></div>
                                    <div className="col-span-1"><span className="text-gray-500 block mb-0.5">ทะเบียนรถ</span><span className="font-medium text-gray-800 bg-white px-2 py-1.5 rounded-lg border border-gray-100 block truncate" title={data.license_plate || '-'}>{data.license_plate || '-'}</span></div>
                                    <div className="col-span-1"><span className="text-gray-500 block mb-0.5">คนขับ</span><span className="font-medium text-gray-800 bg-white px-2 py-1.5 rounded-lg border border-gray-100 block truncate" title={data.driver_name || '-'}>{data.driver_name || '-'}</span></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">COA No.</label>
                                    <input type="text" value={form.coa_no || ''} onChange={(e) => setForm({ ...form, coa_no: e.target.value })}
                                        className={`w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-${isOil ? 'blue' : 'green'}-500 text-sm font-medium`} />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Lot No.</label>
                                    <input type="text" value={form.lot_no || ''} onChange={(e) => setForm({ ...form, lot_no: e.target.value })}
                                        className={`w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-${isOil ? 'blue' : 'green'}-500 text-sm font-medium`} />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Tank</label>
                                    <select value={form.coa_tank || ''} onChange={(e) => setForm({ ...form, coa_tank: e.target.value })}
                                        className={`w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-${isOil ? 'blue' : 'green'}-500 text-sm font-medium cursor-pointer`}>
                                        <option value="">เลือก Tank</option>
                                        <option value="1">Tank 1</option>
                                        <option value="2">Tank 2</option>
                                        <option value="3">Tank 3</option>
                                        <option value="4">Tank 4</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className={`bg-gradient-to-br ${isOil ? 'from-blue-50 to-indigo-50/50 border-blue-200' : 'from-green-50 to-emerald-50/50 border-green-200'} rounded-xl p-3 border-2`}>
                                <h3 className={`text-sm font-semibold ${isOil ? 'text-blue-700' : 'text-green-700'} mb-2 flex items-center gap-2`}>
                                    <div className={`p-1 ${isOil ? 'bg-blue-100' : 'bg-green-100'} rounded-md`}>
                                        <Activity className={`w-4 h-4 ${isOil ? 'text-blue-600' : 'text-green-600'}`} />
                                    </div>
                                    ผลการวิเคราะห์ (Result)
                                </h3>

                                {isOil ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-blue-600" />%FFA</label>
                                            <input type="number" step="0.01" value={form.ffa || ''}
                                                onChange={(e) => setForm({ ...form, ffa: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Beaker className="w-3.5 h-3.5 text-green-600" />%M&I</label>
                                            <input type="number" step="0.01" value={form.m_i || ''}
                                                onChange={(e) => setForm({ ...form, m_i: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-purple-600" />%IV</label>
                                            <input type="number" step="0.01" value={form.iv || ''}
                                                onChange={(e) => setForm({ ...form, iv: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-orange-600" />Dobi</label>
                                            <input type="number" step="0.01" value={form.dobi || ''}
                                                onChange={(e) => setForm({ ...form, dobi: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="0.00" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <div className="p-1.5 bg-purple-100 rounded-md">
                                                    <Package className="w-4 h-4 text-purple-600" />
                                                </div>
                                                Shell (%)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={form.result_shell || ''}
                                                    onChange={(e) => setForm({ ...form, result_shell: e.target.value })}
                                                    className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                                                    placeholder="0.00"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <div className="p-1.5 bg-cyan-100 rounded-md">
                                                    <Droplet className="w-4 h-4 text-cyan-600" />
                                                </div>
                                                KN Moisture (%)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={form.result_kn_moisture || ''}
                                                    onChange={(e) => setForm({ ...form, result_kn_moisture: e.target.value })}
                                                    className="w-full px-4 py-2 border-2 border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 text-sm font-medium"
                                                    placeholder="0.00"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className={`bg-gradient-to-br ${isOil ? 'from-indigo-50 to-purple-50/50 border-indigo-200' : 'from-blue-50 to-indigo-50/50 border-blue-200'} rounded-xl p-3 border-2`}>
                                <h3 className={`text-sm font-semibold ${isOil ? 'text-indigo-700' : 'text-blue-700'} mb-2 flex items-center gap-2`}>
                                    <div className={`p-1 ${isOil ? 'bg-indigo-100' : 'bg-blue-100'} rounded-md`}>
                                        <TrendingUp className={`w-4 h-4 ${isOil ? 'text-indigo-600' : 'text-blue-600'}`} />
                                    </div>
                                    ค่า Spec มาตรฐาน
                                </h3>

                                {isOil ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Spec %FFA</label>
                                            <input type="text" value={form.spec_ffa || ''}
                                                onChange={(e) => setForm({ ...form, spec_ffa: e.target.value })}
                                                className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Spec %M&I</label>
                                            <input type="text" value={form.spec_moisture || ''}
                                                onChange={(e) => setForm({ ...form, spec_moisture: e.target.value })}
                                                className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Spec %IV</label>
                                            <input type="text" value={form.spec_iv || ''}
                                                onChange={(e) => setForm({ ...form, spec_iv: e.target.value })}
                                                className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Spec Dobi</label>
                                            <input type="text" value={form.spec_dobi || ''}
                                                onChange={(e) => setForm({ ...form, spec_dobi: e.target.value })}
                                                className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Spec Shell</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={form.spec_shell || ''}
                                                    onChange={(e) => setForm({ ...form, spec_shell: e.target.value })}
                                                    className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                                                    placeholder="เช่น < 10.00 %"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Spec KN Moisture</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={form.spec_kn_moisture || ''}
                                                    onChange={(e) => setForm({ ...form, spec_kn_moisture: e.target.value })}
                                                    className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                                                    placeholder="เช่น < 8.00 %"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer with Inspector/Notes and Submit */}
                <div className="shrink-0 bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ผู้ตรวจสอบ</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    readOnly
                                    value={currentUserName || form.inspector || ''}
                                    className={`w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-600 focus:outline-none focus:ring-0 text-sm`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={form.notes || ''}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className={`w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-${isOil ? 'blue' : 'green'}-500 text-sm`}
                                    placeholder="บันทึกเพิ่มเติม..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 border-2 border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 text-xs font-medium transition-all">
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={pdfLoading}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all text-xs font-medium flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {pdfLoading
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />กำลังสร้าง...</>
                                : <><FileDown className="w-3.5 h-3.5" />ดาวน์โหลด PDF</>
                            }
                        </button>
                        <button type="submit" form="lab-form" className={`px-4 py-2 bg-gradient-to-r ${headerColor} text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all text-xs font-medium`}>
                            บันทึกผล
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
