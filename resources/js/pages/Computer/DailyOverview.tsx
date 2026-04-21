import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, Server, CheckCircle2, XCircle, AlertCircle, ImageIcon, Search, Monitor, TrendingUp, Award, Sparkles, ChevronRight, Camera, User, BarChart3, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ComputerData {
    id: number;
    code_com: string;
    model: string;
    office: number | null;
    is_inspected: boolean;
    is_planned: boolean;
    broken_count: number;
    abnormal_count: number;
    inspection_images: string[];
    checked_by: string | null;
}

interface SummaryData {
    total: number;
    inspected_count: number;
    planned_month_count: number;
    completion_percent: number;
    computers: ComputerData[];
}

export default function ComputerDailyOverview() {
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterType, setFilterType] = useState<'isp' | 'mun'>('isp');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    useEffect(() => {
        fetchData(selectedDate);
    }, [selectedDate]);

    const fetchData = async (date: string) => {
        setLoading(true);
        try {
            const res = await axios.get(`/computer-inspection/api?date=${date}`);
            if (res.data.success) {
                setSummary(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch computer data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value);
    };

    const ispComputers = summary?.computers.filter(c => 
        (c.code_com?.toUpperCase().includes('ISP') || (!c.code_com?.toUpperCase().includes('MUN'))) &&
        (c.code_com?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         c.model?.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

    const munComputers = summary?.computers.filter(c => 
        c.code_com?.toUpperCase().includes('MUN') &&
        (c.code_com?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         c.model?.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

    const stats = React.useMemo(() => {
        let targetComputers = filterType === 'isp' ? ispComputers : munComputers;

        const total = targetComputers.length;
        const inspected = targetComputers.filter(c => c.is_inspected).length;
        const planned = targetComputers.filter(c => c.is_planned).length;
        const percent = planned > 0 ? Math.round((inspected / planned) * 100) : 0;

        return { total, inspected, planned, percent };
    }, [summary, filterType, ispComputers, munComputers]);

    const handleComputerClick = (id: number) => {
        router.visit(`/computer-inspection/form/${id}?date=${selectedDate}`);
    };

    // Calculate completion rate for gradient
    const completionRate = stats.percent;

    return (
        <AppLayout breadcrumbs={[{ title: "ระบบตรวจสอบคอมพิวเตอร์", href: "/computer-inspection" }]}>
            <Head title="Computer Inspection Dashboard" />

            <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    
                    {/* Header with Gradient */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-2 text-center"
                    >
                        {/* <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm mb-4">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Smart Inspection System
                            </span>
                        </div> */}
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                            ระบบตรวจสอบคอมพิวเตอร์
                        </h1>
                        <p className="text-gray-600">บริหารจัดการและติดตามผลการตรวจสอบอุปกรณ์คอมพิวเตอร์</p>
                    </motion.div>

                    {/* Control Panel */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 mb-8"
                    >
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                                        <CalendarIcon className="inline h-3 w-3 mr-1" />
                                        วันที่ตรวจสอบ
                                    </label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={handleDateChange}
                                            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 w-full sm:w-56"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                                        สาขา
                                    </label>
                                    <select
                                        value={filterType}
                                        onChange={e => setFilterType(e.target.value as 'isp' | 'mun')}
                                        className="px-2 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 w-full sm:w-48"
                                    >
                                        <option value="isp">สำนักงานใหญ่ (ISP)</option>
                                        <option value="mun">มั่นสกลการเกษตร (MUN)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="w-full lg:w-auto flex gap-3">
                                <div className="relative flex-1 lg:w-80">
                                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-200 ${isSearchFocused ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาด้วยรหัสคอมพิวเตอร์ หรือรุ่น..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setIsSearchFocused(false)}
                                        className="pl-10 pr-4 py-2.5 w-full rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                    />
                                </div>
                                <button 
                                    onClick={() => router.visit('/computer-inspection/plan')}
                                    className="group px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                                    <span>แผนรายปี</span>
                                </button>
                                <button 
                                    onClick={() => router.visit('/computer-checklists')}
                                    className="group px-5 py-2.5 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    <span>ตั้งค่าหัวข้อ</span>
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Cards */}
                    {!loading && summary && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                icon={Monitor}
                                label="คอมพิวเตอร์ทั้งหมด"
                                value={stats.total}
                                subValue={`${stats.planned} แผนงานเดือนนี้`}
                                gradient="from-blue-500 to-blue-600"
                                bgGradient="from-blue-50 to-blue-100"
                                delay={0}
                            />
                            <StatCard
                                icon={CheckCircle2}
                                label="ตรวจสอบวันนี้"
                                value={stats.inspected}
                                subValue={`เป้าหมาย: ${stats.planned}`}
                                gradient="from-emerald-500 to-emerald-600"
                                bgGradient="from-emerald-50 to-emerald-100"
                                delay={0.05}
                            />
                            <StatCard
                                icon={CalendarIcon}
                                label="รอการตรวจสอบ (ตามแผน)"
                                value={Math.max(0, stats.planned - stats.inspected)}
                                subValue="เฉพาะเครื่องที่มีแผน"
                                gradient="from-orange-500 to-orange-600"
                                bgGradient="from-orange-50 to-orange-100"
                                delay={0.1}
                            />
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-600">ความคืบหน้า</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.percent}%</p>
                                    </div>
                                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                                        <TrendingUp className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stats.percent}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 relative"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                        </motion.div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    อัพเดทล่าสุด: {format(new Date(), "HH:mm น.", { locale: th })}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Monitor className="h-6 w-6 text-blue-600 animate-pulse" />
                                </div>
                            </div>
                            <p className="mt-4 text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
                        </div>
                    )}

                    {/* Computer Lists */}
                    {!loading && (
                        <AnimatePresence mode="wait">
                            {(filterType === 'all' && ispComputers.length === 0 && munComputers.length === 0) ||
                             (filterType === 'isp' && ispComputers.length === 0) ||
                             (filterType === 'mun' && munComputers.length === 0) ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl"
                                >
                                    <div className="relative">
                                        <Monitor className="h-24 w-24 text-gray-300" />
                                        <Search className="h-8 w-8 text-gray-400 absolute -bottom-2 -right-2" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-700 mt-4">ไม่พบข้อมูล</h3>
                                    <p className="text-gray-500 mt-2">ไม่พบคอมพิวเตอร์ที่ตรงกับเงื่อนไขการค้นหา</p>
                                </motion.div>
                            ) : (
                                <div className="space-y-12">
                                    {filterType === 'isp' && ispComputers.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-10 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                                                <h2 className="text-2xl font-bold text-gray-800">สำนักงานใหญ่</h2>
                                                <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                                                    {ispComputers.length} เครื่อง
                                                </span>
                                                <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">ISP</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {ispComputers.map((comp, idx) => (
                                                    <ComputerCard 
                                                        key={comp.id} 
                                                        comp={comp} 
                                                        idx={idx} 
                                                        onClick={() => handleComputerClick(comp.id)}
                                                        type="isp"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {filterType === 'all' && ispComputers.length > 0 && munComputers.length > 0 && (
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-200"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="bg-white px-4 py-1 rounded-full text-sm text-gray-500">✦</span>
                                            </div>
                                        </div>
                                    )}

                                    {filterType === 'mun' && munComputers.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-10 w-1 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                                                <h2 className="text-2xl font-bold text-gray-800">สาขามะนัง</h2>
                                                <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                                                    {munComputers.length} เครื่อง
                                                </span>
                                                <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">MUN</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {munComputers.map((comp, idx) => (
                                                    <ComputerCard 
                                                        key={comp.id} 
                                                        comp={comp} 
                                                        idx={idx} 
                                                        onClick={() => handleComputerClick(comp.id)}
                                                        type="mun"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, subValue, gradient, bgGradient, delay }: any) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="group bg-white rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                        {value} <span className="text-xs font-medium text-slate-400">/ {subValue || ''}</span>
                    </p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${bgGradient} rounded-xl group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`} style={{ color: 'currentColor' }} />
                </div>
            </div>
        </motion.div>
    );
}

// Computer Card Component
function ComputerCard({ comp, idx, onClick, type }: { comp: ComputerData, idx: number, onClick: () => void, type: 'isp' | 'mun' }) {
    const gradientColor = type === 'isp' ? 'from-blue-500 to-indigo-600' : 'from-emerald-500 to-teal-600';
    const badgeColor = type === 'isp' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700';
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.05, 0.5) }}
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="group cursor-pointer"
        >
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Gradient Border on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${gradientColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} style={{ padding: '2px', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)' }} />
                
                <div className="relative bg-white rounded-2xl p-5">
                    {/* Status Indicator */}
                    {comp.is_inspected && (
                        <div className="absolute top-4 right-4">
                            <div className="relative">
                                <div className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75"></div>
                                <div className="relative rounded-full bg-emerald-500 p-1">
                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Icon and Code */}
                    <div className="flex items-start gap-3 mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${type === 'isp' ? 'from-blue-50 to-indigo-50' : 'from-emerald-50 to-teal-50'} group-hover:scale-110 transition-transform`}>
                            <Monitor className={`h-6 w-6 ${comp.is_inspected ? 'text-emerald-500' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:bg-clip-text transition-all">
                                {comp.code_com || `COMP-${comp.id}`}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{comp.model}</p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {comp.is_inspected ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-tight">
                                <CheckCircle2 className="h-3 w-3" />
                                CHECKED
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-tight">
                                <AlertCircle className="h-3 w-3" />
                                PENDING
                            </span>
                        )}

                        {comp.is_planned && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-tight">
                                <CalendarIcon className="h-3 w-3" />
                                SCHEDULED
                            </span>
                        )}
                    </div>

                    {/* Additional Info */}
                    <div className="border-t border-gray-100 pt-4 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            {comp.checked_by ? (
                                <span className="flex items-center gap-1 text-gray-600">
                                    <User className="h-3 w-3" />
                                    <span className="font-medium">{comp.checked_by}</span>
                                </span>
                            ) : (
                                <span className="text-gray-400 italic">ยังไม่มีผู้ตรวจสอบ</span>
                            )}
                            
                            {(comp.broken_count > 0 || comp.abnormal_count > 0) && (
                                <div className="flex gap-2">
                                    {comp.broken_count > 0 && (
                                        <span className="text-red-500 font-bold text-xs" title="จำนวนที่ชำรุด">
                                            🔴 {comp.broken_count}
                                        </span>
                                    )}
                                    {comp.abnormal_count > 0 && (
                                        <span className="text-orange-500 font-bold text-xs" title="จำนวนที่ผิดปกติ">
                                            🟠 {comp.abnormal_count}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Images Preview */}
                        {comp.inspection_images && comp.inspection_images.length > 0 && (
                            <div className="flex gap-2 pt-1">
                                {comp.inspection_images.slice(0, 2).map((imgUrl, i) => (
                                    <button 
                                        key={i}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(imgUrl, '_blank');
                                        }}
                                        className="flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                                    >
                                        <Camera className="h-3 w-3" />
                                        รูป {i + 1}
                                    </button>
                                ))}
                                {comp.inspection_images.length > 2 && (
                                    <span className="text-[10px] text-gray-500 self-center">
                                        +{comp.inspection_images.length - 2}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Hover Action Hint */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}