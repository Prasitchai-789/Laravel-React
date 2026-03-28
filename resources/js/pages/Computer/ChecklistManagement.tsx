import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import axios from "axios";
import Swal from "sweetalert2";
import { 
    Plus, Edit2, Trash2, ArrowUp, ArrowDown, Save, X, Monitor, 
    CheckCircle, Circle, Settings, Sparkles, TrendingUp, 
    FolderTree, ListChecks, Activity, Zap, Trophy, Crown
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";

interface Topic {
    id: number;
    title: string;
    is_active: boolean;
    order: number;
}

export default function ChecklistManagement() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [newTitle, setNewTitle] = useState("");
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 });

    const fetchTopics = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/computer-checklists/api");
            if (res.data.success) {
                setTopics(res.data.topics);
                const active = res.data.topics.filter((t: Topic) => t.is_active).length;
                const total = res.data.topics.length;
                setStats({
                    active,
                    inactive: total - active,
                    total
                });
            }
        } catch (err) {
            Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        try {
            const res = await axios.post("/computer-checklists", {
                title: newTitle,
                is_active: true,
            });
            if (res.data.success) {
                setNewTitle("");
                fetchTopics();
                Swal.fire({
                    icon: "success",
                    title: "เพิ่มสำเร็จ",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 1500,
                    background: "#10b981",
                    color: "#fff",
                });
            }
        } catch (err) {
            Swal.fire("ข้อผิดพลาด", "ไม่สามารถเพิ่มข้อมูลได้", "error");
        }
    };

    const handleUpdate = async (id: number, isActive?: boolean) => {
        const topic = topics.find(t => t.id === id);
        if (!topic) return;

        try {
            const data = {
                title: isEditing === id ? editTitle : topic.title,
                is_active: isActive !== undefined ? isActive : topic.is_active,
                order: topic.order,
            };

            const res = await axios.put(`/computer-checklists/${id}`, data);
            if (res.data.success) {
                setIsEditing(null);
                fetchTopics();
                if (isActive !== undefined) {
                    Swal.fire({
                        icon: "success",
                        title: isActive ? "เปิดใช้งานสำเร็จ" : "ปิดใช้งานสำเร็จ",
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 1500,
                    });
                }
            }
        } catch (err) {
            Swal.fire("ข้อผิดพลาด", "ไม่สามารถอัปเดตข้อมูลได้", "error");
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "ยืนยันการลบ?",
            text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "ลบข้อมูล",
            cancelButtonText: "ยกเลิก",
            background: "#fff",
            customClass: {
                popup: "rounded-2xl",
                confirmButton: "bg-red-500 hover:bg-red-600",
                cancelButton: "bg-gray-500 hover:bg-gray-600"
            }
        });

        if (result.isConfirmed) {
            try {
                const res = await axios.delete(`/computer-checklists/${id}`);
                if (res.data.success) {
                    fetchTopics();
                    Swal.fire({
                        icon: "success",
                        title: "ลบสำเร็จ!",
                        text: "ลบหัวข้อตรวจเช็คแล้ว",
                        timer: 2000,
                        showConfirmButton: false,
                        background: "#10b981",
                        color: "#fff"
                    });
                }
            } catch (err) {
                Swal.fire("ข้อผิดพลาด", "ไม่สามารถลบข้อมูลได้", "error");
            }
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) || 
            (direction === 'down' && index === topics.length - 1)
        ) return;

        const newTopics = [...topics];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        const tempOrder = newTopics[index].order;
        newTopics[index].order = newTopics[targetIndex].order;
        newTopics[targetIndex].order = tempOrder;

        newTopics.sort((a, b) => a.order - b.order);
        setTopics(newTopics);

        try {
            await axios.post('/computer-checklists/reorder', { topics: newTopics });
            Swal.fire({
                icon: "success",
                title: "จัดลำดับสำเร็จ",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 1000,
            });
        } catch (err) {
            Swal.fire("ข้อผิดพลาด", "ไม่สามารถจัดลำดับได้", "error");
            fetchTopics();
        }
    };

    const getCompletionPercentage = () => {
        if (stats.total === 0) return 0;
        return Math.round((stats.active / stats.total) * 100);
    };

    return (
        <AppLayout breadcrumbs={[{ title: "จัดการหัวข้อตรวจเช็คคอมพิวเตอร์", href: "/computer-checklists" }]}>
            <Head title="Computer Checklist Management" />
            
            <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                    
                    {/* Header Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-0 text-center"
                    >
                        {/* <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm mb-4">
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                            <span className="text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Checklist Management System
                            </span>
                        </div> */}
                        {/* <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-3">
                            จัดการหัวข้อตรวจเช็ค
                        </h1>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            กำหนดและจัดการรายการตรวจสอบคอมพิวเตอร์ เพื่อความสะดวกในการทำงานประจำวัน
                        </p> */}
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="bg-white rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <ListChecks className="h-8 w-8 text-indigo-500" />
                                <div className="p-2 bg-indigo-50 rounded-xl group-hover:scale-110 transition-transform">
                                    <FolderTree className="h-4 w-4 text-indigo-600" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-sm text-gray-600 mt-1">หัวข้อทั้งหมด</p>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <CheckCircle className="h-8 w-8 text-emerald-500" />
                                <div className="p-2 bg-emerald-50 rounded-xl group-hover:scale-110 transition-transform">
                                    <Activity className="h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                            <p className="text-sm text-gray-600 mt-1">กำลังใช้งาน</p>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-white rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <Circle className="h-8 w-8 text-gray-400" />
                                <div className="p-2 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">
                                    <Zap className="h-4 w-4 text-gray-500" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.inactive}</p>
                            <p className="text-sm text-gray-600 mt-1">ระงับการใช้งาน</p>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <Trophy className="h-8 w-8 text-white" />
                                <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                                    <TrendingUp className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-white">{getCompletionPercentage()}%</p>
                            <p className="text-sm text-white/90 mt-1">อัตราการใช้งาน</p>
                            <div className="mt-2 h-1.5 bg-white/30 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getCompletionPercentage()}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-white rounded-full"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Add Form Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="mb-8"
                    >
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
                            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        เพิ่มหัวข้อตรวจเช็คใหม่
                                    </label>
                                    <input 
                                        type="text"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        placeholder="เช่น สภาพหน้าจอ, ระบบปฏิบัติการ, เมาส์/คีย์บอร์ด..."
                                        className="w-full rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 py-3 px-4"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        type="submit"
                                        disabled={!newTitle.trim()}
                                        className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-3 font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                                        เพิ่มหัวข้อ
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>

                    {/* Topic List Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-white/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-xl">
                                    <ListChecks className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">รายการหัวข้อตรวจเช็ค</h3>
                                    <p className="text-sm text-gray-600">สามารถจัดเรียงลำดับโดยการลากหรือใช้ปุ่มลูกศร</p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="relative">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Monitor className="h-5 w-5 text-indigo-600 animate-pulse" />
                                    </div>
                                </div>
                                <p className="mt-4 text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
                            </div>
                        ) : topics.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="p-4 bg-gray-100 rounded-full mb-4">
                                    <ListChecks className="h-12 w-12 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">ยังไม่มีหัวข้อตรวจเช็ค</h3>
                                <p className="text-gray-500">เริ่มต้นเพิ่มหัวข้อตรวจเช็คแรกของคุณ</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                <AnimatePresence>
                                    {topics.map((topic, idx) => (
                                        <motion.li 
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ delay: idx * 0.03 }}
                                            key={topic.id} 
                                            className="group relative"
                                            onMouseEnter={() => setHoveredId(topic.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                        >
                                            <div className="flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-transparent transition-all duration-300">
                                                <div className="flex items-center gap-4 flex-1">
                                                    {/* Reorder Buttons */}
                                                    <div className={`flex flex-col gap-1 transition-all duration-300 ${hoveredId === topic.id ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>
                                                        <button 
                                                            onClick={() => handleMove(idx, 'up')}
                                                            disabled={idx === 0}
                                                            className="p-1.5 hover:bg-indigo-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent text-gray-500 hover:text-indigo-600 transition-all"
                                                        >
                                                            <ArrowUp className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleMove(idx, 'down')}
                                                            disabled={idx === topics.length - 1}
                                                            className="p-1.5 hover:bg-indigo-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent text-gray-500 hover:text-indigo-600 transition-all"
                                                        >
                                                            <ArrowDown className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>

                                                    {/* Order Number */}
                                                    <div className="w-8 text-center">
                                                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                                            {idx + 1}
                                                        </span>
                                                    </div>

                                                    {/* Content */}
                                                    {isEditing === topic.id ? (
                                                        <div className="flex-1 flex items-center gap-2">
                                                            <input 
                                                                type="text"
                                                                value={editTitle}
                                                                onChange={(e) => setEditTitle(e.target.value)}
                                                                className="flex-1 max-w-md rounded-xl border-indigo-300 bg-indigo-50/50 py-2 px-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleUpdate(topic.id);
                                                                    if (e.key === 'Escape') setIsEditing(null);
                                                                }}
                                                            />
                                                            <button 
                                                                onClick={() => handleUpdate(topic.id)} 
                                                                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"
                                                            >
                                                                <Save className="h-4 w-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => setIsEditing(null)} 
                                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1">
                                                            <span className={`text-base font-medium ${topic.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                                                                {topic.title}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 ml-4">
                                                    {/* Status Toggle */}
                                                    <button 
                                                        onClick={() => handleUpdate(topic.id, !topic.is_active)}
                                                        className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                                                            topic.is_active 
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {topic.is_active ? (
                                                            <>
                                                                <CheckCircle className="h-3.5 w-3.5" />
                                                                ใช้งาน
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Circle className="h-3.5 w-3.5" />
                                                                ปิดใช้งาน
                                                            </>
                                                        )}
                                                    </button>

                                                    {isEditing !== topic.id && (
                                                        <>
                                                            <button 
                                                                onClick={() => {
                                                                    setIsEditing(topic.id);
                                                                    setEditTitle(topic.title);
                                                                }} 
                                                                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all duration-300"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(topic.id)} 
                                                                className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-all duration-300"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Animated Border on Hover */}
                                            {hoveredId === topic.id && (
                                                <motion.div 
                                                    layoutId={`border-${topic.id}`}
                                                    className="absolute left-0 right-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: 1 }}
                                                    exit={{ scaleX: 0 }}
                                                />
                                            )}
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
                            </ul>
                        )}
                    </motion.div>

                    {/* Footer Note */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 text-center"
                    >
                        <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                            <Settings className="h-3 w-3" />
                            สามารถจัดเรียงลำดับหัวข้อได้ตามต้องการ
                            <span className="text-gray-300">•</span>
                            หัวข้อที่ปิดใช้งานจะไม่แสดงในแบบฟอร์มตรวจสอบ
                        </p>
                    </motion.div>

                </div>
            </div>
        </AppLayout>
    );
}