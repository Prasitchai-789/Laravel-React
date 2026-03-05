import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    Plus, Pencil, Trash2, FlaskConical, Search,
    Package, Scale, X, Save, RefreshCw
} from 'lucide-react';

interface Chemical {
    id: number;
    name: string;
    unit: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    chemicals: Chemical[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Chemical', href: '/chemical' },
    { title: 'จัดการสารเคมี', href: '/chemical-master' },
];

export default function ChemicalMaster({ chemicals }: Props) {
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; data?: Chemical }>({
        open: false, mode: 'create'
    });
    const [form, setForm] = useState({ name: '', unit: 'กก.' });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; unit?: string }>({});

    const filtered = chemicals.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.unit.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => {
        setForm({ name: '', unit: 'กก.' });
        setErrors({});
        setModal({ open: true, mode: 'create' });
    };

    const openEdit = (c: Chemical) => {
        setForm({ name: c.name, unit: c.unit });
        setErrors({});
        setModal({ open: true, mode: 'edit', data: c });
    };

    const closeModal = () => {
        setModal({ open: false, mode: 'create' });
        setForm({ name: '', unit: 'กก.' });
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            if (modal.mode === 'create') {
                await axios.post('/chemical-master', form);
                Swal.fire({
                    icon: 'success',
                    title: 'เพิ่มสารเคมีสำเร็จ',
                    text: `เพิ่ม "${form.name}" เรียบร้อยแล้ว`,
                    timer: 1500,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end',
                });
            } else {
                await axios.put(`/chemical-master/${modal.data!.id}`, form);
                Swal.fire({
                    icon: 'success',
                    title: 'แก้ไขสำเร็จ',
                    text: `แก้ไข "${form.name}" เรียบร้อยแล้ว`,
                    timer: 1500,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end',
                });
            }
            closeModal();
            router.reload();
        } catch (err: any) {
            if (err.response?.status === 422) {
                const validationErrors = err.response.data.errors || {};
                setErrors({
                    name: validationErrors.name?.[0],
                    unit: validationErrors.unit?.[0],
                });
            } else {
                Swal.fire('เกิดข้อผิดพลาด', err.response?.data?.message || 'ไม่สามารถบันทึกได้', 'error');
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (c: Chemical) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            html: `คุณต้องการลบ <b>"${c.name}"</b> ใช่หรือไม่?<br/><span class="text-sm text-gray-500">การลบจะไม่สามารถกู้คืนได้</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก',
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/chemical-master/${c.id}`);
                Swal.fire({
                    icon: 'success',
                    title: 'ลบสำเร็จ',
                    text: `ลบ "${c.name}" เรียบร้อยแล้ว`,
                    timer: 1500,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end',
                });
                router.reload();
            } catch (err: any) {
                Swal.fire('เกิดข้อผิดพลาด', err.response?.data?.message || 'ไม่สามารถลบได้', 'error');
            }
        }
    };

    const unitOptions = ['กก.', 'ลิตร', 'มล.', 'กรัม', 'ชิ้น', 'แพ็ค', 'ถัง', 'กระสอบ'];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="จัดการสารเคมี" />

            <div className="max-w-5xl mx-auto p-6 font-anuphan">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                            <FlaskConical className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">จัดการสารเคมี</h1>
                            <p className="text-sm text-gray-500">เพิ่ม แก้ไข ลบ รายชื่อสารเคมีในระบบ</p>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-xs text-blue-600 font-medium">สารเคมีทั้งหมด</p>
                                <p className="text-2xl font-bold text-blue-700">{chemicals.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <Scale className="w-5 h-5 text-emerald-600" />
                            <div>
                                <p className="text-xs text-emerald-600 font-medium">หน่วยที่ใช้</p>
                                <p className="text-2xl font-bold text-emerald-700">
                                    {new Set(chemicals.map(c => c.unit)).size}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <Search className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="text-xs text-purple-600 font-medium">ผลการค้นหา</p>
                                <p className="text-2xl font-bold text-purple-700">{filtered.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search + Add */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาสารเคมี..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm transition-all"
                        />
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        เพิ่มสารเคมี
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">#</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ชื่อสารเคมี</th>
                                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">หน่วย</th>
                                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <FlaskConical className="w-12 h-12 text-gray-300" />
                                                <p className="text-gray-500 font-medium">ไม่พบข้อมูลสารเคมี</p>
                                                <p className="text-sm text-gray-400">
                                                    {search ? 'ลองค้นหาด้วยคำอื่น' : 'กดปุ่ม "เพิ่มสารเคมี" เพื่อเริ่มต้น'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((c, idx) => (
                                        <tr key={c.id} className="hover:bg-violet-50/30 transition-colors group">
                                            <td className="px-6 py-3.5 text-sm text-gray-500 font-medium">{idx + 1}</td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-2 h-2 bg-violet-500 rounded-full group-hover:scale-125 transition-transform" />
                                                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                                    {c.unit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEdit(c)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="แก้ไข"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(c)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FlaskConical className="w-5 h-5 text-white" />
                                    <h2 className="text-lg font-semibold text-white">
                                        {modal.mode === 'create' ? 'เพิ่มสารเคมี' : 'แก้ไขสารเคมี'}
                                    </h2>
                                </div>
                                <button onClick={closeModal} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    ชื่อสารเคมี <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 transition-all text-sm ${errors.name
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-violet-500 focus:border-violet-500'
                                        }`}
                                    placeholder="เช่น Soda Ash, Polymer..."
                                    autoFocus
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    หน่วย <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.unit}
                                    onChange={e => setForm({ ...form, unit: e.target.value })}
                                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 transition-all text-sm ${errors.unit
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-violet-500 focus:border-violet-500'
                                        }`}
                                >
                                    {unitOptions.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                                {errors.unit && <p className="mt-1 text-xs text-red-600">{errors.unit}</p>}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                                    disabled={processing}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !form.name.trim()}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {processing ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
