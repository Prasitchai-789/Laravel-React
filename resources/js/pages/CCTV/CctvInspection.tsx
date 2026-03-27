import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { 
    CameraIcon, ShieldCheck, CheckCircle2, Server, 
    Calendar, RefreshCw, XCircle, Image as ImageIcon,
    AlertCircle
} from "lucide-react";
import Swal from "sweetalert2";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "CCTV - Daily Overview", href: "/cctv-inspection" },
];

interface DVRData {
    id: number;
    name: string;
    camera_count: number;
    is_inspected: boolean;
    broken_count: number;
    no_signal_count: number;
    inspection_image: string | null;
    checked_by: string | null;
}

interface ApiResponse {
    success: boolean;
    total_dvrs: number;
    inspected_count: number;
    completion_percent: number;
    dvrs: DVRData[];
}

export default function CctvInspection() {
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get<ApiResponse>("/cctv-inspection/api", {
                params: { date },
            });
            if (res.data.success) {
                setData(res.data);
            }
        } catch (err: any) {
            console.error(err);
            Swal.fire({
                icon: "error",
                title: "ไม่สามารถโหลดข้อมูลได้",
                text: err.response?.data?.message || err.message,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CCTV - Daily Overview" />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 font-sans">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <div className="space-y-6">
                        
                        {/* Header Section */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 p-8 shadow-xl"
                        >
                            <div className="absolute inset-0 bg-black/10" />
                            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                                        <ShieldCheck className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-white tracking-tight">
                                            CCTV Daily Overview
                                        </h1>
                                        <p className="mt-1 text-sm text-indigo-100">
                                            ระบบบันทึกการตรวจเช็คและบำรุงรักษากล้องวงจรปิดประจำวัน
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 backdrop-blur-sm">
                                        <Calendar className="h-5 w-5 text-white" />
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="bg-transparent text-sm font-medium text-white focus:outline-none [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {loading || !data ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <RefreshCw className="h-10 w-10 animate-spin text-indigo-500" />
                                <p className="mt-4 text-sm font-medium text-gray-500">กำลังโหลดข้อมูลระบบ...</p>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-6"
                            >
                                {/* Stat Cards */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-xl bg-indigo-50 p-3">
                                                <Server className="h-6 w-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">เครื่องบันทึก (DVR)</p>
                                                <p className="text-2xl font-bold text-gray-900">{data.total_dvrs} เครื่อง</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-emerald-100 transition-all hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-xl bg-emerald-50 p-3">
                                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">ตรวจสอบแล้ว</p>
                                                <p className="text-2xl font-bold text-emerald-600">
                                                    {data.inspected_count} <span className="text-lg text-gray-400">/ {data.total_dvrs}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-purple-100 transition-all hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-xl bg-purple-50 p-3">
                                                <RefreshCw className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <div className="w-full">
                                                <p className="text-sm font-medium text-gray-500 mb-2">ความสำเร็จของวันนี้</p>
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-gray-100">
                                                        <div 
                                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                                                            style={{ width: `${data.completion_percent}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xl font-bold text-gray-900">{data.completion_percent}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* DVR Cards Grid */}
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Server className="h-5 w-5 text-gray-400" />
                                        รายการเครื่องบันทึก (DVRs) ประจำวันที่ {date}
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {data.dvrs.map((dvr, index) => (
                                            <motion.button
                                                key={dvr.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                onClick={() => router.get(`/cctv-inspection/form/${dvr.id}?date=${date}`)}
                                                className="group relative flex flex-col items-start overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all text-left h-full"
                                            >
                                                <div className="flex w-full items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`rounded-xl p-3 ${dvr.is_inspected ? 'bg-emerald-50' : 'bg-gray-50'} transition-colors group-hover:bg-indigo-50`}>
                                                            <Server className={`h-6 w-6 ${dvr.is_inspected ? 'text-emerald-500' : 'text-gray-400'} group-hover:text-indigo-600`} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900">{dvr.name}</h3>
                                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                                                <CameraIcon className="h-3.5 w-3.5" />
                                                                {dvr.camera_count} กล้อง
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        {dvr.is_inspected ? (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                ตรวจแล้ว
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                                                                <XCircle className="h-4 w-4" />
                                                                รอตรวจ
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-gray-100 w-full flex items-end justify-between">
                                                    <div className="text-xs text-gray-500 flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            {dvr.checked_by ? (
                                                                <>
                                                                    <span className="font-medium text-gray-700">โดย:</span> {dvr.checked_by}
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-400 italic">ยังไม่มีผู้ตรวจสอบ</span>
                                                            )}
                                                        </div>
                                                        {(dvr.broken_count > 0 || dvr.no_signal_count > 0) && (
                                                            <div className="flex gap-2 mt-1">
                                                                {dvr.broken_count > 0 && (
                                                                    <span className="text-red-500 font-medium flex items-center gap-1">
                                                                        <XCircle className="h-3.5 w-3.5"/> ชำรุด {dvr.broken_count}
                                                                    </span>
                                                                )}
                                                                {dvr.no_signal_count > 0 && (
                                                                    <span className="text-orange-500 font-medium flex items-center gap-1">
                                                                        <AlertCircle className="h-3.5 w-3.5"/> ไม่แสดงภาพ {dvr.no_signal_count}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {dvr.inspection_image && (
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(dvr.inspection_image!, '_blank');
                                                            }}
                                                            className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-indigo-100 hover:scale-105"
                                                        >
                                                            <ImageIcon className="h-4 w-4" />
                                                            ดูรูปแนบ
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                    
                                    {data.dvrs.length === 0 && (
                                        <div className="rounded-2xl bg-white p-12 text-center border border-gray-100 shadow-sm">
                                            <Server className="mx-auto h-12 w-12 text-gray-300" />
                                            <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่มีข้อมูลเครื่องบันทึก</h3>
                                            <p className="mt-2 text-sm text-gray-500">กรุณาไปที่เมนูตั้งค่าเพื่อเพิ่มเครื่องบันทึกเข้าระบบ</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}