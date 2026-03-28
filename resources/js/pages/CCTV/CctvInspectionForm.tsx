import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CameraIcon, CheckCircle2, Server, 
    Calendar, RefreshCw, XCircle, ArrowLeft,
    UploadCloud, Save, Eye, Trash2, 
    Sparkles, Shield, Wifi, Mic, Image,
    AlertCircle, ClipboardCheck, User, Clock
} from "lucide-react";
import Swal from "sweetalert2";

interface CameraState {
    camera_no: number;
    status: 'normal' | 'broken' | 'no_signal' | null;
    cleaning: boolean;
    remark: string;
}

interface PageProps {
    dvr_id: number;
}

export default function CctvInspectionForm({ dvr_id }: PageProps) {
    const { auth } = usePage<any>().props;
    const userName = auth?.user?.name || "ไม่ระบุชื่อผู้ใช้";

    const queryParams = new URLSearchParams(window.location.search);
    const initialDate = queryParams.get("date") || new Date().toISOString().split("T")[0];

    const [date, setDate] = useState<string>(initialDate);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    
    const [dvrName, setDvrName] = useState<string>("");
    const [cameraCount, setCameraCount] = useState<number>(0);
    const [cameras, setCameras] = useState<CameraState[]>([]);
    const [dvrRemark, setDvrRemark] = useState<string>("");
    const [checkedBy, setCheckedBy] = useState<string>("");
    
    const [existingImages, setExistingImages] = useState<{path: string, url: string}[]>([]);
    const [removedImages, setRemovedImages] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'cameras' | 'details'>('cameras');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Dashboard", href: "/dashboard" },
        { title: "CCTV Inspection", href: "/cctv-inspection" },
        { title: dvrName || `ตรวจสอบ ${dvr_id}`, href: "#" },
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/cctv-inspection/api/${dvr_id}`, {
                params: { date },
            });
            if (res.data.success) {
                const fetchedDvr = res.data.dvr;
                const fetchedInsp = res.data.inspection;
                
                setDvrName(fetchedDvr.name);
                setCameraCount(fetchedDvr.camera_count);

                const newCameras: CameraState[] = [];
                for (let i = 1; i <= fetchedDvr.camera_count; i++) {
                    const existingCam = fetchedInsp?.camera_data?.find((c: any) => c.camera_no === i);
                    newCameras.push({
                        camera_no: i,
                        status: existingCam ? existingCam.status : null,
                        cleaning: existingCam ? existingCam.cleaning : false,
                        remark: existingCam ? existingCam.remark : "",
                    });
                }
                setCameras(newCameras);
                
                setDvrRemark(fetchedInsp?.dvr_remark || "");
                setCheckedBy(fetchedInsp?.checked_by || userName);
                setExistingImages(fetchedInsp?.images || []);
                setRemovedImages([]);
                setSelectedFiles([]);
                setImagePreviews([]);
            }
        } catch (err: any) {
            console.error(err);
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: err.response?.data?.message || err.message,
                confirmButtonColor: "#6366f1",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date, dvr_id]);

    const handleCameraUpdate = (index: number, field: keyof CameraState, value: any) => {
        const newCameras = [...cameras];
        newCameras[index] = { ...newCameras[index], [field]: value };
        setCameras(newCameras);
    };

    const handleSelectAllNormal = () => {
        setCameras(cameras.map(cam => ({ ...cam, status: "normal" })));
        Swal.fire({
            icon: "success",
            title: "ตั้งค่าทั้งหมด",
            text: "กล้องทั้งหมดถูกตั้งเป็นสถานะปกติ",
            timer: 1500,
            showConfirmButton: false,
            toast: true,
        });
    };

    const handleSelectAllBroken = () => {
        Swal.fire({
            title: "ยืนยันการตั้งค่าทั้งหมด",
            text: "คุณต้องการตั้งค่ากล้องทั้งหมดเป็นชำรุดใช่หรือไม่?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "ใช่, ตั้งค่าทั้งหมด",
            cancelButtonText: "ยกเลิก"
        }).then((result) => {
            if (result.isConfirmed) {
                setCameras(cameras.map(cam => ({ ...cam, status: "broken" })));
                Swal.fire("ตั้งค่าแล้ว", "กล้องทั้งหมดถูกตั้งเป็นสถานะชำรุด", "success");
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        
        const totalImages = existingImages.filter(img => !removedImages.includes(img.path)).length + selectedFiles.length + files.length;
        if (totalImages > 5) {
            Swal.fire("Error", "อัปโหลดได้รวมสูงสุด 5 ภาพ", "error");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
        if (validFiles.length < files.length) {
            Swal.fire("Error", "บางไฟล์มีขนาดเกิน 5MB และถูกตัดออก", "warning");
        }

        setSelectedFiles(prev => [...prev, ...validFiles]);

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
        
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemovePreview = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExisting = (path: string) => {
        setRemovedImages(prev => [...prev, path]);
    };

    const handleSave = async () => {
        if (!checkedBy.trim()) {
            Swal.fire({
                icon: "warning",
                title: "กรุณากรอกข้อมูล",
                text: "โปรดระบุชื่อผู้ตรวจสอบ",
                confirmButtonColor: "#6366f1",
            });
            return;
        }

        const uninspected = cameras.filter(c => c.status === null);
        if (uninspected.length > 0) {
            Swal.fire({
                icon: "warning",
                title: "ข้อมูลไม่ครบถ้วน",
                html: `กรุณาระบุสถานะกล้องให้ครบทุกตัว<br/><span class="text-red-500">ขาด ${uninspected.length} ตัว</span>`,
                confirmButtonColor: "#6366f1",
            });
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('dvr_id', dvr_id.toString());
            formData.append('date', date);
            formData.append('camera_data', JSON.stringify(cameras));
            formData.append('checked_by', checkedBy);
            if (dvrRemark) formData.append('dvr_remark', dvrRemark);
            if (removedImages.length > 0) formData.append('removed_images', JSON.stringify(removedImages));
            selectedFiles.forEach((file) => {
                formData.append(`images[]`, file);
            });

            const res = await axios.post("/cctv-inspection", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                const hasBroken = cameras.some(c => c.status === 'broken');
                if (hasBroken) {
                    await Swal.fire({
                        icon: 'warning',
                        title: 'บันทึกสำเร็จ พบกล้องชำรุด!',
                        text: 'กรุณาดำเนินการแจ้งซ่อมกล้องที่ชำรุดต่อไป',
                        confirmButtonColor: '#f97316',
                        confirmButtonText: 'รับทราบ',
                    });
                } else {
                    await Swal.fire({
                        icon: 'success',
                        title: 'บันทึกสำเร็จ!',
                        text: 'ข้อมูลการตรวจสอบถูกบันทึกเรียบร้อย',
                        timer: 1500,
                        showConfirmButton: false,
                        background: '#fff',
                    });
                }
                router.visit('/cctv-inspection');
            }
        } catch (err: any) {
            console.error(err);
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้',
                confirmButtonColor: "#6366f1",
            });
        } finally {
            setSaving(false);
        }
    };

    const stats = {
        total: cameras.length,
        inspected: cameras.filter(c => c.status !== null).length,
        normal: cameras.filter(c => c.status === 'normal').length,
        broken: cameras.filter(c => c.status === 'broken').length,
        noSignal: cameras.filter(c => c.status === 'no_signal').length,
        cleaned: cameras.filter(c => c.cleaning).length,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`ตรวจเช็ค ${dvrName}`} />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans pb-24">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    
                    {/* Navigation Header */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => router.visit('/cctv-inspection')}
                            className="group inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:text-indigo-600 transition-all border border-gray-200"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            กลับหน้ารวม
                        </motion.button>
                        
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3"
                        >
                            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 border border-gray-200 shadow-sm">
                                <Calendar className="h-5 w-5 text-indigo-500" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                                />
                            </div>
                            <button
                                onClick={fetchData}
                                className="rounded-xl bg-white p-2.5 text-gray-600 shadow-sm hover:bg-gray-50 hover:text-indigo-600 transition-all border border-gray-200"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                        </motion.div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-indigo-200 blur-xl opacity-50 animate-pulse" />
                                <RefreshCw className="relative h-12 w-12 animate-spin text-indigo-600" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <div className="space-y-6">
                                
                                {/* DVR Header Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-indigo-900 to-purple-900 shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-black/20" />
                                    <div className="relative p-6 sm:p-8">
                                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                                                    <Server className="h-8 w-8 text-white" />
                                                </div>
                                                <div>
                                                    <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
                                                        {dvrName}
                                                    </h1>
                                                    <p className="mt-1 flex items-center gap-2 text-sm text-indigo-200">
                                                        <CameraIcon className="h-4 w-4" />
                                                        จำนวนกล้อง {cameraCount} ตัว
                                                        <span className="mx-1">•</span>
                                                        <Wifi className="h-4 w-4" />
                                                        DVR System
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSelectAllNormal}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-emerald-400 transition-all hover:scale-105"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    ปกติทั้งหมด
                                                </button>
                                                <button
                                                    onClick={handleSelectAllBroken}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-red-400 transition-all hover:scale-105"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                    ชำรุดทั้งหมด
                                                </button>
                                            </div>
                                        </div>

                                        {/* Stats Summary */}
                                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                                            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
                                                <p className="text-xs text-indigo-200">ตรวจแล้ว</p>
                                                <p className="text-xl font-bold text-white">{stats.inspected}/{stats.total}</p>
                                            </div>
                                            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
                                                <p className="text-xs text-indigo-200">ปกติ</p>
                                                <p className="text-xl font-bold text-emerald-300">{stats.normal}</p>
                                            </div>
                                            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
                                                <p className="text-xs text-indigo-200">ไม่แสดงภาพ</p>
                                                <p className="text-xl font-bold text-orange-300">{stats.noSignal}</p>
                                            </div>
                                            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
                                                <p className="text-xs text-indigo-200">ชำรุด</p>
                                                <p className="text-xl font-bold text-red-300">{stats.broken}</p>
                                            </div>
                                            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
                                                <p className="text-xs text-indigo-200">ทำความสะอาด</p>
                                                <p className="text-xl font-bold text-cyan-300">{stats.cleaned}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Mobile Tab Navigation */}
                                <div className="block lg:hidden">
                                    <div className="flex gap-2 rounded-xl bg-white p-1 shadow-sm">
                                        <button
                                            onClick={() => setActiveTab('cameras')}
                                            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                                activeTab === 'cameras'
                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <CameraIcon className="inline h-4 w-4 mr-2" />
                                            กล้องทั้งหมด
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('details')}
                                            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                                activeTab === 'details'
                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <Image className="inline h-4 w-4 mr-2" />
                                            หลักฐาน & ข้อมูล
                                        </button>
                                    </div>
                                </div>

                                {/* Main Content Grid */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                    {/* Cameras Section */}
                                    <div className={`lg:col-span-2 ${activeTab === 'details' ? 'hidden lg:block' : 'block'}`}>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden"
                                        >
                                            <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
                                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                    <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                                                    รายการตรวจสอบกล้องวงจรปิด
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    คลิกเลือกสถานะและบันทึกผลการตรวจสอบ
                                                </p>
                                            </div>
                                            
                                            <div className="divide-y divide-gray-100">
                                                {cameras.map((cam, idx) => (
                                                    <motion.div
                                                        key={cam.camera_no}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.02 }}
                                                        className={`p-2.5 transition-all hover:bg-gray-50 ${
                                                            cam.status === 'broken' ? 'bg-red-50/30' : ''
                                                        }`}
                                                    >
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                            {/* Camera Number */}
                                                            <div className="flex items-center gap-3 min-w-[100px]">
                                                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold shadow-sm ${
                                                                    cam.status === 'broken' 
                                                                        ? 'bg-red-100 text-red-700 border border-red-200' 
                                                                        : cam.status === 'no_signal'
                                                                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                                                        : cam.status === 'normal' 
                                                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                                                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                                }`}>
                                                                    {cam.camera_no}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-gray-800">กล้องที่ {cam.camera_no}</p>
                                                                    <p className="text-xs text-gray-500">Camera {cam.camera_no}</p>
                                                                </div>
                                                            </div>

                                                            {/* Status Buttons */}
                                                            <div className="flex flex-wrap gap-2">
                                                                <button
                                                                    onClick={() => handleCameraUpdate(idx, 'status', 'normal')}
                                                                    className={`flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-medium transition-all ${
                                                                        cam.status === 'normal'
                                                                            ? 'bg-emerald-500 text-white shadow-md scale-105'
                                                                            : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700'
                                                                    }`}
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    ปกติ
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCameraUpdate(idx, 'status', 'no_signal')}
                                                                    className={`flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-medium transition-all ${
                                                                        cam.status === 'no_signal'
                                                                            ? 'bg-orange-500 text-white shadow-md scale-105'
                                                                            : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700'
                                                                    }`}
                                                                >
                                                                    <AlertCircle className="h-4 w-4" />
                                                                    ไม่แสดงภาพ
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCameraUpdate(idx, 'status', 'broken')}
                                                                    className={`flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-medium transition-all ${
                                                                        cam.status === 'broken'
                                                                            ? 'bg-red-500 text-white shadow-md scale-105'
                                                                            : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
                                                                    }`}
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                    ชำรุด
                                                                </button>
                                                                
                                                                {/* Cleaning Toggle */}
                                                                <button
                                                                    onClick={() => handleCameraUpdate(idx, 'cleaning', !cam.cleaning)}
                                                                    className={`flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-medium transition-all ${
                                                                        cam.cleaning
                                                                            ? 'bg-cyan-500 text-white'
                                                                            : 'bg-gray-100 text-gray-600 hover:bg-cyan-100 hover:text-cyan-700'
                                                                    }`}
                                                                >
                                                                    <Sparkles className="h-4 w-4" />
                                                                    {cam.cleaning ? 'ทำแล้ว' : 'ทำความสะอาด'}
                                                                </button>
                                                            </div>

                                                            {/* Remark Input */}
                                                            <div className="flex-1 min-w-[200px]">
                                                                <input
                                                                    type="text"
                                                                    value={cam.remark}
                                                                    onChange={(e) => handleCameraUpdate(idx, 'remark', e.target.value)}
                                                                    placeholder="หมายเหตุเพิ่มเติม..."
                                                                    className="w-full rounded-xl border-gray-200 bg-gray-50 px-2 py-1.5 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500 transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Right Panel - Evidence & Submit */}
                                    <div className={`lg:col-span-1 ${activeTab === 'cameras' ? 'hidden lg:block' : 'block'}`}>
                                        <div className="space-y-6">
                                            {/* Image Upload Card */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="rounded-2xl bg-white p-6 shadow-xl border border-gray-100"
                                            >
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <Image className="h-5 w-5 text-indigo-600" />
                                                    ภาพถ่ายหลักฐาน (สูงสุด 5 ภาพ)
                                                </h3>
                                                
                                                <div className="mt-2 text-sm text-gray-500 mb-2 flex items-center gap-2">
                                                    <span>(PNG, JPG - ขนาดไม่เกิน 5MB)</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    {existingImages.filter(img => !removedImages.includes(img.path)).map((img, idx) => (
                                                        <div key={`exist-${idx}`} className="relative group rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 aspect-video">
                                                            <img src={img.url} alt="Proof" className="object-cover w-full h-full" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                <a href={img.url} target="_blank" rel="noreferrer" className="p-2 bg-white/20 rounded-full hover:bg-white/40 text-white backdrop-blur-sm transition-all shadow-sm">
                                                                    <Eye className="h-4 w-4" />
                                                                </a>
                                                                <button type="button" onClick={() => handleRemoveExisting(img.path)} className="p-2 bg-red-500/80 rounded-full hover:bg-red-600 text-white backdrop-blur-sm transition-all shadow-sm">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    
                                                    {imagePreviews.map((preview, idx) => (
                                                        <div key={`preview-${idx}`} className="relative group rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 aspect-video">
                                                            <img src={preview} alt="Preview" className="object-cover w-full h-full" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <button type="button" onClick={() => handleRemovePreview(idx)} className="p-2 bg-red-500 rounded-full hover:bg-red-600 text-white transition-all shadow-sm">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    
                                                    {(existingImages.filter(img => !removedImages.includes(img.path)).length + selectedFiles.length) < 5 && (
                                                        <div 
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="flex flex-col justify-center items-center rounded-xl border-2 border-dashed border-gray-300 aspect-video hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all group p-2"
                                                        >
                                                            <UploadCloud className="h-6 w-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                                            <span className="mt-1 text-xs font-semibold text-indigo-600 text-center">เพิ่มรูปภาพ</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    multiple
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                    accept="image/png, image/jpeg, image/gif"
                                                    className="hidden"
                                                />
                                                
                                                <div className="mt-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        หมายเหตุเพิ่มเติม (DVR)
                                                    </label>
                                                    <textarea
                                                        rows={3}
                                                        value={dvrRemark}
                                                        onChange={(e) => setDvrRemark(e.target.value)}
                                                        placeholder="บันทึกปัญหาหรือข้อสังเกตเพิ่มเติม..."
                                                        className="w-full rounded-xl border-gray-200 bg-gray-50 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500 transition-colors resize-none p-2"
                                                    />
                                                </div>
                                            </motion.div>

                                            {/* Submit Card */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-xl border border-indigo-100"
                                            >
                                                <div className="space-y-5">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                            <User className="h-4 w-4 text-indigo-600" />
                                                            ผู้ตรวจสอบ
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            readOnly
                                                            value={checkedBy}
                                                            className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium text-gray-600 shadow-sm cursor-not-allowed focus:outline-none"
                                                        />
                                                    </div>
                                                    
                                                    <div className="bg-white/50 rounded-xl p-4 space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">วันที่ตรวจสอบ:</span>
                                                            <span className="font-semibold text-gray-800">{date}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">ความคืบหน้า:</span>
                                                            <span className="font-semibold text-indigo-600">
                                                                {Math.round((stats.inspected / stats.total) * 100)}%
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${(stats.inspected / stats.total) * 100}%` }}
                                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <button
                                                        onClick={handleSave}
                                                        disabled={saving}
                                                        className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-all hover:-translate-y-0.5"
                                                    >
                                                        {saving ? (
                                                            <>
                                                                <RefreshCw className="h-5 w-5 animate-spin" />
                                                                กำลังบันทึก...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Save className="h-5 w-5" />
                                                                บันทึกข้อมูลการตรวจสอบ
                                                            </>
                                                        )}
                                                    </button>
                                                    
                                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                                        <Clock className="h-3 w-3" />
                                                        ระบบจะบันทึกข้อมูลอัตโนมัติ
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}