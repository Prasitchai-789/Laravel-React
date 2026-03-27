import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Server, Settings2, Plus, Edit2, Trash2, Camera } from "lucide-react";
import Swal from "sweetalert2";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "จัดการเครื่องบันทึก DVR", href: "/dvrs" },
];

interface DVR {
    id: number;
    name: string;
    camera_count: number;
}

export default function DvrManagement() {
    const [dvrs, setDvrs] = useState<DVR[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form
    const [editId, setEditId] = useState<number | null>(null);
    const [name, setName] = useState("");
    const [cameraCount, setCameraCount] = useState<number | string>("");

    const fetchDvrs = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/dvrs/api");
            if (res.data.success) {
                setDvrs(res.data.dvrs);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDvrs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name,
                camera_count: Number(cameraCount)
            };

            if (editId) {
                await axios.put(`/dvrs/${editId}`, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'อัปเดตสำเร็จ',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                await axios.post("/dvrs", payload);
                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
            // Reset form
            setEditId(null);
            setName("");
            setCameraCount("");
            fetchDvrs();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'เกิดข้อผิดพลาด';
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: msg,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (dvr: DVR) => {
        setEditId(dvr.id);
        setName(dvr.name);
        setCameraCount(dvr.camera_count);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "หากลบแล้วข้อมูลการตรวจสอบทั้งหมดของเครื่องนี้จะหายไปด้วย!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ลบข้อมูล'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/dvrs/${id}`);
                Swal.fire('ลบสำเร็จ!', '', 'success');
                fetchDvrs();
            } catch (err) {
                Swal.fire('เกิดข้อผิดพลาด', '', 'error');
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CCTV - จัดการเครื่องบันทึก" />
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-8 shadow-xl mb-8"
                >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <div className="relative flex items-center gap-4">
                        <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                            <Settings2 className="h-8 w-8 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">ตั้งค่าเครื่องบันทึก (DVR)</h1>
                            <p className="mt-1 text-sm text-slate-300">
                                จัดการรายชื่อเครื่องบันทึกกล้องวงจรปิดและจำนวนกล้องสูงสุดของแต่ละเครื่อง
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Form Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="md:col-span-1"
                    >
                        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                {editId ? <Edit2 className="h-5 w-5 text-indigo-500"/> : <Plus className="h-5 w-5 text-indigo-500"/>}
                                {editId ? "แก้ไขเครื่องบันทึก" : "เพิ่มเครื่องบันทึกใหม่"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ชื่อเครื่องบันทึก (เช่น DVR 1)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500 uppercase transition-colors"
                                        placeholder="DVR NAME"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        จำนวนกล้องทั้งหมดในเครื่องนี้
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={cameraCount}
                                        onChange={(e) => setCameraCount(e.target.value)}
                                        className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500 transition-colors"
                                        placeholder="e.g. 16"
                                    />
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                                    >
                                        {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                                    </button>
                                    {editId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditId(null);
                                                setName("");
                                                setCameraCount("");
                                            }}
                                            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            ยกเลิก
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </motion.div>

                    {/* Table Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="md:col-span-2"
                    >
                        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Server className="h-5 w-5 text-gray-400" />
                                    รายการเครื่องบันทึกทั้งหมด
                                </h2>
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700">
                                    {dvrs.length} เครื่อง
                                </span>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold text-gray-600">ชื่อเครื่องบันทึก</th>
                                            <th className="px-6 py-3 font-semibold text-gray-600 text-center">จำนวนกล้อง</th>
                                            <th className="px-6 py-3 font-semibold text-gray-600 text-right">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                    กำลังโหลดข้อมูล...
                                                </td>
                                            </tr>
                                        ) : dvrs.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                    ยังไม่มีข้อมูลเครื่องบันทึก
                                                </td>
                                            </tr>
                                        ) : (
                                            dvrs.map((dvr) => (
                                                <tr key={dvr.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        <div className="flex items-center gap-2">
                                                            <Server className="h-4 w-4 text-gray-400" />
                                                            {dvr.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1 font-medium text-gray-700">
                                                            <Camera className="h-3.5 w-3.5" />
                                                            {dvr.camera_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEdit(dvr)}
                                                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(dvr.id)}
                                                                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
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
                    </motion.div>

                </div>
            </div>
        </AppLayout>
    );
}
