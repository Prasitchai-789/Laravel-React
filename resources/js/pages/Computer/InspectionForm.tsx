import React, { useState, useEffect, useRef } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, usePage, router } from "@inertiajs/react";
import axios from "axios";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ChevronLeft, Image as ImageIcon, Save, Monitor, 
    UploadCloud, Eye, Trash2, CheckCircle2, AlertCircle, XCircle, PaintBucket,
    Sparkles, TrendingUp, Shield, Clock, Camera, FileCheck, Award, Zap,
    ChevronDown, ChevronUp, Filter, LayoutGrid, List
} from "lucide-react";

interface Topic {
    id: number;
    title: string;
    is_active: boolean;
    order: number;
}

interface ChecklistItem {
    topic_id: number;
    topic_title: string;
    status: 'normal' | 'abnormal' | 'broken' | null;
    cleaning: boolean;
    remark: string;
}

interface Computer {
    id: number;
    code_com: string;
    model: string;
    asset_id: string;
}

export default function ComputerInspectionForm({ computer_id }: { computer_id: string }) {
    const { auth } = usePage().props as any;
    const userName = auth?.user?.name || "Unknown User";

    const [computer, setComputer] = useState<Computer | null>(null);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [checklistData, setChecklistData] = useState<ChecklistItem[]>([]);
    
    // Global Form Data
    const [dvrRemark, setDvrRemark] = useState<string>("");
    const [checkedBy, setCheckedBy] = useState<string>("");
    
    // Images
    const [existingImages, setExistingImages] = useState<{path: string, url: string}[]>([]);
    const [removedImages, setRemovedImages] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'normal' | 'abnormal' | 'broken'>('all');
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date') || format(new Date(), "yyyy-MM-dd");

    useEffect(() => {
        fetchData();
    }, [computer_id, dateParam]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/computer-inspection/api/${computer_id}?date=${dateParam}`);
            if (res.data.success) {
                setComputer(res.data.computer);
                const activeTopics: Topic[] = res.data.topics;
                setTopics(activeTopics);

                const fetchedInsp = res.data.inspection;
                
                if (fetchedInsp?.data) {
                    setChecklistData(fetchedInsp.data);
                } else {
                    setChecklistData(activeTopics.map(t => ({
                        topic_id: t.id,
                        topic_title: t.title,
                        status: 'normal',
                        cleaning: false,
                        remark: ""
                    })));
                }
                
                setDvrRemark(fetchedInsp?.remark || "");
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
                title: "ข้อผิดพลาด",
                text: "ไม่สามารถโหลดข้อมูลได้",
                background: "#fff",
                confirmButtonColor: "#6366f1"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleItemUpdate = (index: number, field: keyof ChecklistItem, value: any) => {
        setChecklistData(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const setAllStatus = (status: 'normal' | 'abnormal' | 'broken') => {
        Swal.fire({
            title: `ตั้งค่าทั้งหมดเป็น ${status === 'normal' ? 'ปกติ' : status === 'abnormal' ? 'ผิดปกติ' : 'ชำรุด'}`,
            text: `คุณต้องการตั้งค่าหัวข้อทั้งหมด ${checklistData.length} รายการ เป็น "${status === 'normal' ? 'ปกติ' : status === 'abnormal' ? 'ผิดปกติ' : 'ชำรุด'}" หรือไม่?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ยกเลิก",
            confirmButtonColor: status === 'normal' ? '#10b981' : status === 'abnormal' ? '#f97316' : '#ef4444',
        }).then((result) => {
            if (result.isConfirmed) {
                setChecklistData(prev => prev.map(item => ({...item, status})));
                Swal.fire({
                    icon: "success",
                    title: "ตั้งค่าสำเร็จ",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 1500,
                });
            }
        });
    };

    const toggleSection = (topicId: number) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(topicId)) {
                newSet.delete(topicId);
            } else {
                newSet.add(topicId);
            }
            return newSet;
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        
        const totalImages = existingImages.filter(img => !removedImages.includes(img.path)).length + selectedFiles.length + files.length;
        if (totalImages > 5) {
            Swal.fire({
                icon: "error",
                title: "จำกัดจำนวนภาพ",
                text: "อัปโหลดได้รวมสูงสุด 5 ภาพ",
                confirmButtonColor: "#ef4444"
            });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
        if (validFiles.length < files.length) {
            Swal.fire({
                icon: "warning",
                title: "ไฟล์ใหญ่เกินไป",
                text: "บางไฟล์มีขนาดเกิน 5MB และถูกตัดออก",
                confirmButtonColor: "#f97316"
            });
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
                icon: 'warning',
                title: 'ไม่พบผู้ตรวจสอบ',
                text: 'กรุณาระบุชื่อผู้ตรวจสอบก่อนบันทึก',
                confirmButtonColor: '#f97316',
            });
            return;
        }

        const incomplete = checklistData.some(c => c.status === null);
        if (incomplete) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบถ้วน',
                text: 'กรุณาเลือกสถานะ (ปกติ/ผิดปกติ/ชำรุด) ให้ครบทุกหัวข้อ',
                confirmButtonColor: '#f97316',
            });
            return;
        }

        setSaving(true);

        try {
            const formData = new FormData();
            formData.append('computer_id', computer_id);
            formData.append('date', dateParam);
            formData.append('data', JSON.stringify(checklistData));
            formData.append('checked_by', checkedBy);
            if (dvrRemark) formData.append('remark', dvrRemark);
            
            if (removedImages.length > 0) formData.append('removed_images', JSON.stringify(removedImages));
            selectedFiles.forEach((file) => {
                formData.append(`images[]`, file);
            });

            const res = await axios.post("/computer-inspection", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                const hasBroken = checklistData.some(c => c.status === 'broken');
                if (hasBroken) {
                    await Swal.fire({
                        icon: 'warning',
                        title: '⚠️ พบอุปกรณ์ชำรุด',
                        text: 'บันทึกสำเร็จ กรุณาดำเนินการแจ้งซ่อมอุปกรณ์ที่ชำรุดต่อไป',
                        confirmButtonColor: '#f97316',
                        confirmButtonText: 'รับทราบ',
                        background: '#fff',
                    });
                } else {
                    await Swal.fire({
                        icon: 'success',
                        title: '✅ บันทึกสำเร็จ!',
                        text: 'ข้อมูลการตรวจสอบถูกบันทึกเรียบร้อย',
                        timer: 2000,
                        showConfirmButton: false,
                        background: '#10b981',
                        color: '#fff'
                    });
                }
                router.visit('/computer-inspection');
            }
        } catch (err: any) {
            console.error(err);
            Swal.fire({
                icon: "error",
                title: "ข้อผิดพลาด",
                text: err.response?.data?.message || "บันทึกข้อมูลไม่สำเร็จ",
                confirmButtonColor: "#ef4444"
            });
        } finally {
            setSaving(false);
        }
    };

    // Statistics
    const stats = React.useMemo(() => {
        const total = checklistData.length;
        const normal = checklistData.filter(c => c.status === 'normal').length;
        const abnormal = checklistData.filter(c => c.status === 'abnormal').length;
        const broken = checklistData.filter(c => c.status === 'broken').length;
        const cleaned = checklistData.filter(c => c.cleaning).length;
        const completionRate = total > 0 ? Math.round(((normal + abnormal + broken) / total) * 100) : 0;
        return { total, normal, abnormal, broken, cleaned, completionRate };
    }, [checklistData]);

    const filteredChecklist = checklistData.filter(item => {
        if (activeStatusFilter === 'all') return true;
        return item.status === activeStatusFilter;
    });

    if (loading) {
        return (
            <AppLayout breadcrumbs={[{ title: "ระบบตรวจสอบคอมพิวเตอร์ประจำวัน", href: "/computer-inspection" }]}>
                <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
                    <div className="flex flex-col items-center justify-center h-screen">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Monitor className="h-6 w-6 text-blue-600 animate-pulse" />
                            </div>
                        </div>
                        <p className="mt-4 text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!computer) {
        return (
            <AppLayout breadcrumbs={[{ title: "ระบบตรวจสอบคอมพิวเตอร์ประจำวัน", href: "/computer-inspection" }]}>
                <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
                    <div className="flex flex-col justify-center items-center h-screen">
                        <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md">
                            <div className="p-4 bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                <Monitor className="h-10 w-10 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่พบรหัสเครื่องคอมพิวเตอร์</h2>
                            <p className="text-gray-500 mb-6">ไม่พบรหัสเครื่องคอมพิวเตอร์ที่ต้องการตรวจสอบ</p>
                            <button 
                                onClick={() => router.visit('/computer-inspection')} 
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                            >
                                <ChevronLeft className="h-5 w-5" />
                                กลับหน้าหลัก
                            </button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const { code_com, model, asset_id } = computer;

    return (
        <AppLayout breadcrumbs={[
            { title: "ระบบตรวจสอบคอมพิวเตอร์ประจำวัน", href: "/computer-inspection" },
            { title: `ตรวจสอบ: ${code_com}`, href: "#" }
        ]}>
            <Head title={`ตรวจสอบคอมพิวเตอร์ ${code_com}`} />

            <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                    {/* Header Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <button 
                                    onClick={() => router.visit('/computer-inspection')} 
                                    className="group flex items-center gap-2 text-gray-600 hover:text-blue-600 font-semibold px-4 py-2 hover:bg-blue-50 rounded-xl transition-all duration-300"
                                >
                                    <ChevronLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                                    ย้อนกลับ
                                </button>

                                <div className="flex items-center gap-3 flex-wrap justify-center">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-semibold text-blue-700">
                                            {format(new Date(dateParam), "dd MMMM yyyy", { locale: th })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
                                        <Sparkles className="h-4 w-4 text-emerald-600" />
                                        <span className="text-sm font-semibold text-emerald-700">
                                            รอบการตรวจสอบ
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Computer Info Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="mb-6"
                    >
                        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-800 rounded-2xl p-0.5 shadow-xl">
                            <div className="bg-white rounded-2xl p-6">
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-800 rounded-2xl shadow-lg">
                                        <Monitor className="h-12 w-12 text-white" />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                            {code_com}
                                        </h1>
                                        <p className="text-gray-600 mt-1">{model}</p>
                                        <div className="flex gap-3 mt-2 justify-center md:justify-start">
                                            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-3 py-1 rounded-full">
                                                <FileCheck className="h-3 w-3" />
                                                รหัสทรัพย์สิน: {asset_id || "-"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                                            <p className="text-xs text-gray-500">รายการ</p>
                                        </div>
                                        <div className="w-px bg-gray-200"></div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-emerald-600">{stats.cleaned}</p>
                                            <p className="text-xs text-gray-500">ทำความสะอาด</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Stats Cards */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"
                    >
                        <div className="bg-white rounded-xl p-4 shadow-md border border-emerald-100 hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                <span className="text-2xl font-bold text-emerald-600">{stats.normal}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">ปกติ</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-md border border-orange-100 hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between">
                                <AlertCircle className="h-8 w-8 text-orange-500" />
                                <span className="text-2xl font-bold text-orange-600">{stats.abnormal}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">ผิดปกติ</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-md border border-red-100 hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between">
                                <XCircle className="h-8 w-8 text-red-500" />
                                <span className="text-2xl font-bold text-red-600">{stats.broken}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">ชำรุด</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100 hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between">
                                <PaintBucket className="h-8 w-8 text-purple-500" />
                                <span className="text-2xl font-bold text-purple-600">{stats.cleaned}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">ทำความสะอาด</p>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500 to-blue-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between">
                                <Award className="h-8 w-8 text-white" />
                                <span className="text-2xl font-bold text-white">{stats.completionRate}%</span>
                            </div>
                            <p className="text-sm text-white/90 mt-2">ความคืบหน้า</p>
                            <div className="mt-2 h-1.5 bg-white/30 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.completionRate}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-white rounded-full"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Form */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden mb-6"
                    >
                        {/* Header with Filters */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 md:px-6 py-4 border-b border-white/50">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-inner shadow-white">
                                        <Monitor className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-lg">รายการตรวจเช็ค</h3>
                                    <span className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full shadow-sm font-medium">
                                        {filteredChecklist.length} รายการ
                                    </span>
                                </div>
                                
                                <div className="flex gap-2 flex-wrap justify-center">
                                    <button 
                                        onClick={() => setActiveStatusFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeStatusFilter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        ทั้งหมด
                                    </button>
                                    <button 
                                        onClick={() => setActiveStatusFilter('normal')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeStatusFilter === 'normal' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />
                                        ปกติ
                                    </button>
                                    <button 
                                        onClick={() => setActiveStatusFilter('abnormal')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeStatusFilter === 'abnormal' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                                        ผิดปกติ
                                    </button>
                                    <button 
                                        onClick={() => setActiveStatusFilter('broken')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeStatusFilter === 'broken' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <XCircle className="h-3.5 w-3.5 inline mr-1" />
                                        ชำรุด
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setAllStatus('normal')}
                                        className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold rounded-lg text-sm transition-all flex items-center gap-1"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        ตั้งค่าทั้งหมด
                                    </button>
                                    <div className="flex gap-1 border-l border-gray-200 pl-2">
                                        <button 
                                            onClick={() => setViewMode('list')}
                                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                                        >
                                            <List className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={() => setViewMode('grid')}
                                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                                        >
                                            <LayoutGrid className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Topics List - Optimized Layout */}
                        <div className={viewMode === 'list' ? "divide-y divide-gray-100/60" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-5 bg-gray-50/30"}>
                            <AnimatePresence>
                                {filteredChecklist.map((item, idx) => {
                                    const originalIndex = checklistData.findIndex(t => t.topic_id === item.topic_id);
                                    const isExpanded = expandedSections.has(item.topic_id);
                                    
                                    return (
                                        <motion.div 
                                            key={item.topic_id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                                            className={`transition-all duration-300 ${item.status === 'broken' ? 'bg-red-50/50' : 'hover:bg-blue-50/30'} ${viewMode === 'grid' ? 'flex flex-col' : ''}`}
                                        >
                                            {viewMode === 'list' ? (
                                                // List View - Optimized for space
                                                <div className="p-4 px-6">
                                                    <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                                                        {/* Topic Title with Expand/Collapse */}
                                                        <div className="lg:w-3/4 flex items-start gap-3">
                                                            {/* <button
                                                                onClick={() => toggleSection(item.topic_id)}
                                                                className="flex-shrink-0 mt-1"
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronUp className="h-4 w-4 text-gray-400" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                                                )}
                                                            </button> */}
                                                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shadow-sm flex-shrink-0 ${
                                                                item.status === 'normal' ? 'bg-emerald-100 text-emerald-700' : 
                                                                item.status === 'abnormal' ? 'bg-orange-100 text-orange-700' :
                                                                item.status === 'broken' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-500'
                                                            }`}>
                                                                {originalIndex + 1}
                                                            </div>
                                                            <span className="font-semibold text-gray-800 text-sm flex-1 break-words">
                                                                {item.topic_title}
                                                            </span>
                                                        </div>

                                                        {/* Controls - Always visible */}
                                                        <div className="lg:w-3/4 flex lg:justify-end">
                                                            <div className="flex flex-wrap lg:flex-nowrap gap-3 items-center w-full lg:w-auto">
                                                                {/* Status Group */}
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => handleItemUpdate(originalIndex, 'status', 'normal')}
                                                                        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                                                                            item.status === 'normal'
                                                                                ? 'bg-emerald-500 text-white shadow-sm'
                                                                                : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700'
                                                                        }`}
                                                                    >
                                                                        <CheckCircle2 className="h-3 w-3" /> 
                                                                        <span className="hidden sm:inline">ปกติ</span>
                                                                    </button>
                                                                    
                                                                    <button
                                                                        onClick={() => handleItemUpdate(originalIndex, 'status', 'abnormal')}
                                                                        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                                                                            item.status === 'abnormal'
                                                                                ? 'bg-orange-500 text-white shadow-sm'
                                                                                : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-orange-100 hover:text-orange-700'
                                                                        }`}
                                                                    >
                                                                        <AlertCircle className="h-3 w-3" /> 
                                                                        <span className="hidden sm:inline">ผิดปกติ</span>
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleItemUpdate(originalIndex, 'status', 'broken')}
                                                                        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                                                                            item.status === 'broken'
                                                                                ? 'bg-red-500 text-white shadow-sm'
                                                                                : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-700'
                                                                        }`}
                                                                    >
                                                                        <XCircle className="h-3 w-3" /> 
                                                                        <span className="hidden sm:inline">ชำรุด</span>
                                                                    </button>
                                                                </div>

                                                                {/* Cleaning Toggle */}
                                                                <button
                                                                    onClick={() => handleItemUpdate(originalIndex, 'cleaning', !item.cleaning)}
                                                                    className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                                                                        item.cleaning
                                                                            ? 'bg-cyan-500 text-white shadow-sm'
                                                                            : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-cyan-100 hover:text-cyan-700'
                                                                    }`}
                                                                >
                                                                    <PaintBucket className="h-3 w-3" /> 
                                                                    <span className="hidden sm:inline">{item.cleaning ? 'ทำความสะอาดแล้ว' : 'ทำความสะอาด'}</span>
                                                                </button>

                                                                {/* Remark Field - Small on desktop */}
                                                                <div className="flex-1 lg:flex-none lg:w-48 min-w-[120px]">
                                                                    <input
                                                                        type="text"
                                                                        value={item.remark}
                                                                        onChange={(e) => handleItemUpdate(originalIndex, 'remark', e.target.value)}
                                                                        placeholder="หมายเหตุ (ถ้ามี)..."
                                                                        className="w-full rounded-xl border-gray-200 bg-white/50 px-3 py-2 text-xs focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Expanded Remark Section */}
                                                            <AnimatePresence>
                                                                {isExpanded && item.remark && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        className="mt-3 pl-8"
                                                                    >
                                                                        <div className="bg-blue-50/50 rounded-lg p-2 text-xs text-gray-600 border-l-2 border-blue-400">
                                                                            <span className="font-semibold">หมายเหตุ:</span> {item.remark}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Grid View - Compact Cards
                                                <div className="h-full group">
                                                    <div className={`h-full flex flex-col rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden ${item.status === 'broken' ? 'border-red-300 bg-red-50/80 shadow-md shadow-red-100' : 'border-gray-200/80 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-200'}`}>
                                                        {item.status === 'broken' && (
                                                            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                                                                <div className="absolute transform rotate-45 bg-red-500 text-white text-[10px] font-bold py-1 right-[-35px] top-[15px] w-[120px] text-center shadow-sm">
                                                                    แจ้งซ่อม
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex items-start justify-between mb-3 gap-2">
                                                            <div className="flex justify-start items-start gap-3">
                                                                <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                                                                    item.status === 'normal' ? 'bg-emerald-100 text-emerald-700' : 
                                                                    item.status === 'abnormal' ? 'bg-orange-100 text-orange-700' :
                                                                    item.status === 'broken' ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                    {originalIndex + 1}
                                                                </div>
                                                                <span className="font-semibold text-gray-800 text-sm line-clamp-2">
                                                                    {item.topic_title}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => toggleSection(item.topic_id)}
                                                                className="text-gray-400"
                                                            >
                                                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="flex flex-wrap gap-1.5 mt-auto pt-4">
                                                            <button
                                                                onClick={() => handleItemUpdate(originalIndex, 'status', 'normal')}
                                                                className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-1 py-1 text-xs font-semibold transition-all ${
                                                                    item.status === 'normal'
                                                                        ? 'bg-emerald-500 text-white'
                                                                        : 'bg-gray-100 text-gray-600 hover:bg-emerald-100'
                                                                }`}
                                                            >
                                                                <CheckCircle2 className="h-2.5 w-2.5" />
                                                                <span className="hidden xs:inline">ปกติ</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleItemUpdate(originalIndex, 'status', 'abnormal')}
                                                                className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-1 py-1 text-xs font-semibold transition-all ${
                                                                    item.status === 'abnormal'
                                                                        ? 'bg-orange-500 text-white'
                                                                        : 'bg-gray-100 text-gray-600 hover:bg-orange-100'
                                                                }`}
                                                            >
                                                                <AlertCircle className="h-2.5 w-2.5" />
                                                                <span className="hidden xs:inline">ผิดปกติ</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleItemUpdate(originalIndex, 'status', 'broken')}
                                                                className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-1 py-1 text-xs font-semibold transition-all ${
                                                                    item.status === 'broken'
                                                                        ? 'bg-red-500 text-white'
                                                                        : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                                                                }`}
                                                            >
                                                                <XCircle className="h-2.5 w-2.5" />
                                                                <span className="hidden xs:inline">ชำรุด</span>
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="flex gap-1.5 mt-1.5">
                                                            <button
                                                                onClick={() => handleItemUpdate(originalIndex, 'cleaning', !item.cleaning)}
                                                                className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all flex-1 ${
                                                                    item.cleaning
                                                                        ? 'bg-cyan-500 text-white'
                                                                        : 'bg-gray-100 text-gray-600 hover:bg-cyan-100'
                                                                }`}
                                                            >
                                                                <PaintBucket className="h-2.5 w-2.5" />
                                                                {item.cleaning ? 'ทำความสะอาดแล้ว' : 'ทำความสะอาด'}
                                                            </button>
                                                        </div>
                                                        
                                                        <input
                                                            type="text"
                                                            value={item.remark}
                                                            onChange={(e) => handleItemUpdate(originalIndex, 'remark', e.target.value)}
                                                            placeholder="เพิ่มหมายเหตุ..."
                                                            className="w-full rounded-xl border-gray-200 bg-gray-50/50 px-3 py-2 text-xs mt-3 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all shadow-inner"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Extra Settings & Evidence Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        
                        {/* Meta Data */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50"
                        >
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                                <div className="p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-inner shadow-white">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">ข้อมูลการตรวจสอบ</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        ผู้ตรวจสอบ <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={checkedBy}
                                            onChange={(e) => setCheckedBy(e.target.value)}
                                            placeholder="ชื่อ-นามสกุล ผู้ตรวจสอบ"
                                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 py-3 px-4 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-gray-900 transition-all"
                                            readOnly={true}
                                        />
                                        <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-500" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">หมายเหตุเพิ่มเติม</label>
                                    <textarea
                                        value={dvrRemark}
                                        onChange={(e) => setDvrRemark(e.target.value)}
                                        rows={3}
                                        placeholder="ระบุข้อควรระวัง หรือปัญหาที่พบเห็นโดยรวม..."
                                        className="block w-full rounded-xl border-gray-200 bg-white py-3 px-4 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm transition-all"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Image Uploader */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50"
                        >
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                                <div className="p-2.5 bg-gradient-to-br from-purple-100 to-fuchsia-100 rounded-xl shadow-inner shadow-white">
                                    <Camera className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">ภาพถ่ายหลักฐาน</h3>
                                    <p className="text-xs text-gray-500 font-medium">(สูงสุด 5 ภาพ, PNG, JPG - ขนาดไม่เกิน 5MB)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {existingImages.filter(img => !removedImages.includes(img.path)).map((img, idx) => (
                                    <div key={`exist-${idx}`} className="relative group rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 aspect-square shadow-md">
                                        <img src={img.url} className="object-cover w-full h-full" alt="evidence"/>
                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                                            <a href={img.url} target="_blank" rel="noreferrer" className="p-2 bg-white/20 rounded-full hover:bg-white/40 text-white backdrop-blur-sm transition-all">
                                                <Eye className="h-4 w-4" />
                                            </a>
                                            <button type="button" onClick={() => handleRemoveExisting(img.path)} className="p-2 bg-red-500/80 rounded-full hover:bg-red-600 text-white backdrop-blur-sm transition-all">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                {imagePreviews.map((preview, idx) => (
                                    <div key={`preview-${idx}`} className="relative group rounded-xl overflow-hidden border-2 border-dashed border-blue-300 bg-blue-50/50 aspect-square shadow-md">
                                        <img src={preview} className="object-cover w-full h-full" alt="preview"/>
                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                            <button type="button" onClick={() => handleRemovePreview(idx)} className="p-2 bg-red-500 rounded-full hover:bg-red-600 text-white transition-all">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                {(existingImages.filter(img => !removedImages.includes(img.path)).length + selectedFiles.length) < 5 && (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col justify-center items-center rounded-xl border-2 border-dashed border-gray-300 aspect-square hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all group p-2"
                                    >
                                        <UploadCloud className="h-8 w-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        <span className="mt-2 text-xs font-medium text-gray-500 group-hover:text-blue-600">เพิ่มภาพ</span>
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
                        </motion.div>
                    </div>

                    {/* Submit Button */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-end pt-4 pb-8"
                    >
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="group relative flex items-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>กำลังบันทึกข้อมูล...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-6 w-6 group-hover:scale-110 transition-transform" />
                                    <span className="text-lg tracking-wide">บันทึกผลการตรวจสอบ</span>
                                    <Zap className="h-5 w-5 group-hover:animate-pulse text-yellow-300 ml-1" />
                                </>
                            )}
                        </button>
                    </motion.div>

                </div>
            </div>
        </AppLayout>
    );
}