import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
import { 
    Monitor, 
    Calendar, 
    Plus, 
    Search, 
    CheckCircle2, 
    LayoutDashboard, 
    Settings,
    MoreHorizontal,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Computer {
    id: number;
    code_com: string;
    model: string;
    office: number | null;
}

interface InspectionStatus {
    computer_id: number;
    month: number;
    is_inspected: boolean;
    remark?: string | null;
    checked_by?: string | null;
    inspection_date?: string | null;
}

interface PlanStatus {
    id: number;
    computer_id: number;
    month: number;
    year: number;
    status: string;
}

const MONTHS_TH = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.02, delayChildren: 0.1 }
    }
};

const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

const pulseAnimation = {
    animate: {
        scale: [1, 1.05, 1],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
};

export default function InspectionPlan() {
    const [computers, setComputers] = useState<Computer[]>([]);
    const [inspections, setInspections] = useState<InspectionStatus[]>([]);
    const [plans, setPlans] = useState<PlanStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [filterType, setFilterType] = useState<'isp' | 'mun'>('isp');
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, [selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Using relative path to support sub-folder deployments
            const res = await axios.get(`api/plan?year=${selectedYear}`);
            if (res.data.success) {
                setComputers(res.data.computers);
                setInspections(res.data.inspections || []);
                setPlans(res.data.plans || []);
            } else {
                setError(res.data.message || "Failed to load plan data");
            }
        } catch (err: any) {
            console.error("Failed to fetch plan data", err);
            setError(err.response?.data?.message || "Connection error. Please try again.");
            // Fallback for demo/development if needed
            if (!computers.length) {
                setComputers([
                    { id: 1, code_com: "ISP-PC-001", model: "Dell Optiplex 7090", office: 1 },
                    { id: 2, code_com: "ISP-PC-002", model: "HP ProDesk 600 G6", office: 1 },
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredComputers = computers.filter(c => {
        const matchesSearch = (c.code_com || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.model || "").toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesFilter = true;
        const code = (c.code_com || "").toUpperCase();
        if (filterType === 'isp') {
            matchesFilter = code.includes('ISP') || (!code.includes('MUN'));
        } else if (filterType === 'mun') {
            matchesFilter = code.includes('MUN');
        }

        return matchesSearch && matchesFilter;
    });

    const getCellStatus = (computerId: number, month: number) => {
        const currentInspection = inspections.find(i => i.computer_id === computerId && i.month === month);
        const isDone = !!currentInspection;
        const isPlanned = plans.some(p => p.computer_id === computerId && p.month === month && p.year === selectedYear);
        return { isDone, isPlanned, currentInspection };
    };

    const stats = React.useMemo(() => {
        const pcs = filteredComputers;
        const currentMonth = new Date().getMonth() + 1;
        
        let plannedYear = 0;
        let completedYear = 0;
        let plannedMonth = 0;
        let completedMonth = 0;
        
        pcs.forEach(comp => {
            for (let month = 1; month <= 12; month++) {
                const { isDone, isPlanned } = getCellStatus(comp.id, month);
                if (isPlanned) {
                    plannedYear++;
                    if (month === currentMonth) plannedMonth++;
                }
                if (isDone) {
                    completedYear++;
                    if (month === currentMonth) completedMonth++;
                }
            }
        });

        return {
            totalDevices: pcs.length,
            plannedYear,
            completedYear,
            yearPct: plannedYear > 0 ? Math.round((completedYear / plannedYear) * 100) : 0,
            plannedMonth,
            completedMonth,
            monthPct: plannedMonth > 0 ? Math.round((completedMonth / plannedMonth) * 100) : 0,
            branchName: filterType === 'isp' ? 'สำนักงานใหญ่' : 'มั่นสกล'
        };
    }, [filteredComputers, plans, inspections, selectedYear, filterType]);

    const handleTogglePlan = async (computerId: number, month: number) => {
        const key = `${computerId}-${month}`;
        setActionLoading(key);
        try {
            const res = await axios.post('api/toggle-plan', {
                computer_id: computerId,
                month,
                year: selectedYear
            });
            if (res.data.success) {
                // Optimistic Update to local state to keep scroll and feel instant
                setPlans(prev => {
                    const existingIdx = prev.findIndex(p => 
                        p.computer_id === computerId && 
                        p.month === month && 
                        p.year === selectedYear
                    );
                    
                    if (existingIdx > -1) {
                        // Remove existing plan
                        const newPlans = [...prev];
                        newPlans.splice(existingIdx, 1);
                        return newPlans;
                    } else {
                        // Add new plan
                        return [...prev, { 
                            id: Date.now(), // Temporary ID
                            computer_id: computerId, 
                            month, 
                            year: selectedYear, 
                            status: 'planned' 
                        }];
                    }
                });
                
                // Optionally background refresh data without showing the loading spinner
                // await axios.get(`api/plan?year=${selectedYear}`).then(r => {
                //    if (r.data.success) setPlans(r.data.plans);
                // });
            }
        } catch (error: any) {
            console.error("Failed to toggle plan", error);
            setError(error.response?.data?.message || "Failed to update plan");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: "แผนการตรวจสอบ", href: "/computer-inspection/plan" }]}>
            <Head title="Computer Inspection Plan" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-2 md:p-4 font-anuphan">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-blue-100/40 to-indigo-100/20 rounded-full blur-[150px]"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-gradient-to-tr from-emerald-100/30 to-teal-100/20 rounded-full blur-[150px]"></div>
                </div>

                <div className="relative max-w-[1600px] mx-auto">
                    {/* Header Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        {/* Error Alert */}
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-6"
                                >
                                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                                                <X className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-rose-800">เกิดข้อผิดพลาดในการดึงข้อมูล</p>
                                                <p className="text-xs text-rose-600 font-medium">{error}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => fetchData()}
                                            className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
                                        >
                                            ลองใหม่
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                                <div className="relative flex-1 sm:flex-none">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-xl opacity-40"></div>
                                    <div className="relative p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl shadow-blue-500/20">
                                        <LayoutDashboard className="w-7 h-7 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        แผนการตรวจสอบคอมพิวเตอร์
                                    </h1>
                                    <p className="text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                        <span>ประจำปี {selectedYear + 543}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Branch Filter */}
                                <div className="flex bg-white/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/80 shadow-sm">
                                    {[
                                        { id: 'isp', label: 'ISP', color: 'blue' },
                                        { id: 'mun', label: 'MUN', color: 'emerald' }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setFilterType(tab.id as any)}
                                            className={`
                                                relative px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300
                                                ${filterType === tab.id 
                                                    ? `text-${tab.color}-600` 
                                                    : 'text-slate-800 hover:text-slate-700'
                                                }
                                            `}
                                        >
                                            {filterType === tab.id && (
                                                <motion.div 
                                                    layoutId="activeFilter"
                                                    className={`absolute inset-0 bg-${tab.color}-50 border border-${tab.color}-200 rounded-lg shadow-sm`}
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            <span className="relative z-10">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="ค้นหา..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl w-56 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all outline-none shadow-sm text-sm"
                                    />
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Year Selector */}
                                <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl p-1 shadow-sm">
                                    <button 
                                        onClick={() => setSelectedYear(y => y - 1)}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-slate-500" />
                                    </button>
                                    <select 
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="px-2 py-1.5 bg-transparent text-center font-bold text-slate-700 outline-none cursor-pointer text-sm"
                                    >
                                        {[2023, 2024, 2025, 2026, 2027].map(y => (
                                            <option key={y} value={y}>{y + 543}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={() => setSelectedYear(y => y + 1)}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4 text-slate-500" />
                                    </button>
                                </div>

                                {/* Add Button */}
                                {/* <button 
                                    onClick={() => router.visit('/computer-inspection/form')}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-bold hover:from-slate-900 hover:to-black transition-all shadow-lg shadow-slate-300"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>เพิ่มรายการ</span>
                                </button> */}
                            </div>
                        </div>

                        {/* Summary Stats Cards - Context Aware */}
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-2">
                            {/* Card 1: Branch Devices */}
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-3 md:p-4 shadow-xl shadow-slate-200/50 overflow-hidden relative group col-span-2 md:col-span-1"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity hidden sm:block">
                                    <Monitor className="w-20 h-20 rotate-12" />
                                </div>
                                <div className="relative flex items-center gap-3 md:gap-4">
                                    <div className={`p-2.5 md:p-3 rounded-2xl ${filterType === 'isp' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        <Monitor className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest mb-0.5">
                                            {stats.branchName}
                                        </p>
                                        <h3 className="text-lg md:text-2xl font-black text-slate-800">
                                            {stats.totalDevices} <span className="text-[9px] md:text-[10px] font-bold text-slate-700">เครื่อง</span>
                                        </h3>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 2: Yearly Progress */}
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-3 md:p-4 shadow-xl shadow-slate-200/50 group"
                            >
                                <div className="flex justify-between items-start mb-2 md:mb-3">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="p-2 md:p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest truncate">เป้าหมายรายปี</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-base md:text-xl font-black text-slate-800">{stats.completedYear}</span>
                                                <span className="text-[9px] md:text-[10px] font-bold text-slate-500">/ {stats.plannedYear}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-1.5 md:h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.yearPct}%` }}
                                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                                    />
                                </div>
                            </motion.div>

                            {/* Card 3: Monthly Target */}
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-3 md:p-4 shadow-xl shadow-slate-200/50 group"
                            >
                                <div className="flex justify-between items-start mb-2 md:mb-3">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="p-2 md:p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                                            <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest truncate">เป้าเดือนนี้</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-base md:text-xl font-black text-slate-800">{stats.completedMonth}</span>
                                                <span className="text-[9px] md:text-[10px] font-bold text-slate-500">/ {stats.plannedMonth}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-1.5 md:h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.monthPct}%` }}
                                        className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full"
                                    />
                                </div>
                            </motion.div>

                            {/* Card 4: Overall Success */}
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-2xl p-3 md:p-4 shadow-xl shadow-blue-200/40 relative overflow-hidden group col-span-2 lg:col-span-1"
                            >
                                <div className="relative">
                                    <div className="flex justify-between items-start mb-2 md:mb-4">
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black text-blue-200 uppercase tracking-widest opacity-80">ความสำเร็จ</p>
                                            <h3 className="text-xl md:text-3xl font-black text-white mt-1">
                                                {stats.yearPct}%
                                            </h3>
                                        </div>
                                        <div className="p-2 md:p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                                            <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 md:h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stats.yearPct}%` }}
                                                className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Desktop Matrix Table (Visible on lg or md depending on preference) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="hidden lg:block bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden"
                    >
                        <div className="max-h-[calc(100vh-320px)] overflow-auto custom-scrollbar">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="sticky top-0 left-0 z-40 bg-gradient-to-r from-slate-50/95 to-white/95 backdrop-blur-md px-4 py-4 text-left min-w-[320px] border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                    <Monitor className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                                                        อุปกรณ์คอมพิวเตอร์
                                                    </span>
                                                    <span className="text-[10px] text-blue-700 font-bold uppercase">{filteredComputers.length} รายการ</span>
                                                </div>
                                            </div>
                                        </th>
                                        {MONTHS_TH.map((month, idx) => (
                                            <th key={idx} className="sticky top-0 z-30 bg-gradient-to-b from-slate-50/95 to-white/95 backdrop-blur-md px-2 py-6 text-center min-w-[90px] border-b border-slate-100">
                                                <div className="flex flex-col items-center gap-1">
                                                    {/* <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{month === MONTHS_TH[new Date().getMonth()] ? 'NOW' : ''}</span> */}
                                                    <span className="text-sm font-black text-slate-800 tracking-tight">{month}</span>
                                                    <div className={`w-8 h-1 rounded-full ${month === MONTHS_TH[new Date().getMonth()] ? 'bg-blue-500' : 'bg-slate-200/50'}`}></div>
                                                </div>
                                            </th>
                                        ))}
                                        <th className="sticky top-0 z-30 bg-gradient-to-l from-slate-50/95 to-white/95 backdrop-blur-md px-6 py-6 text-center border-b border-slate-100 w-20">
                                            <Settings className="w-4 h-4 text-slate-400 mx-auto animate-spin-slow" />
                                        </th>
                                    </tr>
                                </thead>

                                <AnimatePresence mode="wait">
                                    {loading ? (
                                        <motion.tbody 
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <tr>
                                                <td colSpan={14} className="py-32">
                                                    <div className="flex flex-col items-center justify-center gap-4">
                                                        <motion.div 
                                                            animate={{ rotate: 360 }}
                                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                            className="w-12 h-12 border-3 border-slate-200 border-t-blue-500 rounded-full"
                                                        />
                                                        <p className="text-slate-400 font-medium">กำลังโหลดข้อมูล...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        </motion.tbody>
                                    ) : (
                                        <motion.tbody 
                                            key="content"
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                            className="divide-y divide-slate-50"
                                        >
                                            {filteredComputers.length > 0 ? (
                                                filteredComputers.map((comp) => (
                                                    <motion.tr 
                                                        key={comp.id}
                                                        variants={rowVariants}
                                                        onMouseEnter={() => setHoveredRow(comp.id)}
                                                        onMouseLeave={() => setHoveredRow(null)}
                                                        className={`group transition-all duration-300 ${
                                                            hoveredRow === comp.id ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'
                                                        }`}
                                                    >
                                                        <td className="sticky left-0 z-20 bg-white/80 backdrop-blur-md group-hover:bg-blue-50/50 px-4 py-4 transition-colors duration-300">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`
                                                                    p-2.5 rounded-2xl transition-all duration-300 shadow-sm
                                                                    ${(comp.code_com || '').includes('ISP') 
                                                                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600' 
                                                                        : 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600'
                                                                    }
                                                                    ${hoveredRow === comp.id ? 'scale-110 shadow-md rotate-3' : ''}
                                                                `}>
                                                                    <Monitor className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-bold text-slate-800 truncate">
                                                                        {comp.code_com || `COMP-${comp.id}`}
                                                                    </h4>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                            <motion.div 
                                                                                initial={{ width: 0 }}
                                                                                animate={{ 
                                                                                    width: `${(inspections.filter(i => i.computer_id === comp.id).length / 12) * 100}%` 
                                                                                }}
                                                                                className="h-full bg-blue-500 rounded-full"
                                                                            />
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-slate-400">
                                                                            {Math.round((inspections.filter(i => i.computer_id === comp.id).length / 12) * 100)}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {MONTHS_TH.map((_, mIdx) => {
                                                            const month = mIdx + 1;
                                                            const { isDone, isPlanned, currentInspection } = getCellStatus(comp.id, month);
                                                            const key = `${comp.id}-${month}`;
                                                            const isLoading = actionLoading === key;

                                                            return (
                                                                <td key={mIdx} className="px-2 py-2">
                                                                    <div className="flex items-center justify-center">
                                                                        <motion.button 
                                                                            whileHover={{ scale: isDone ? 1 : 1.1 }}
                                                                            whileTap={{ scale: isDone ? 1 : 0.95 }}
                                                                            disabled={isLoading}
                                                                            onClick={() => {
                                                                                if (isDone) {
                                                                                    // View details
                                                                                } else if (isPlanned) {
                                                                                    router.visit(`/computer-inspection/form/${comp.id}?month=${month}&year=${selectedYear}`);
                                                                                } else {
                                                                                    handleTogglePlan(comp.id, month);
                                                                                }
                                                                            }}
                                                                            className={`
                                                                                relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500
                                                                                ${isDone 
                                                                                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-100 border border-emerald-300' 
                                                                                    : isPlanned
                                                                                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200 border border-blue-400'
                                                                                        : 'bg-slate-50 text-slate-300 hover:bg-white hover:text-blue-500 hover:shadow-xl hover:shadow-slate-200 border border-slate-100 group/cell'
                                                                                }
                                                                                ${isLoading ? 'opacity-50 cursor-wait' : ''}
                                                                            `}
                                                                        >
                                                                            {isDone ? (
                                                                                <motion.div
                                                                                    initial={{ scale: 0, rotate: -45 }}
                                                                                    animate={{ scale: 1, rotate: 0 }}
                                                                                    transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                                                                                    className="group/done relative"
                                                                                >
                                                                                    <CheckCircle2 className="w-6 h-6" />
                                                                                    {/* Tooltip Pattern like CCTV */}
                                                                                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover/done:flex flex-col
                                                                                        rounded-xl bg-slate-900/95 backdrop-blur-md text-white text-xs px-3.5 py-2.5 shadow-2xl whitespace-nowrap min-w-[180px] max-w-[280px] gap-1.5 border border-white/10">
                                                                                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-0.5">
                                                                                            <span className="font-black text-blue-400 uppercase tracking-tighter">{comp.code_com}</span>
                                                                                            <span className="text-[10px] text-slate-400 font-bold">{currentInspection?.inspection_date}</span>
                                                                                        </div>
                                                                                        {currentInspection?.checked_by && (
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className="text-emerald-400">👤</span>
                                                                                                <span className="text-emerald-50 font-bold">{currentInspection.checked_by}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {currentInspection?.remark && (
                                                                                            <div className="mt-0.5 p-2 bg-white/5 rounded-lg border border-white/5">
                                                                                                <p className="text-slate-300 italic break-words whitespace-normal leading-relaxed">
                                                                                                    " {currentInspection.remark} "
                                                                                                </p>
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95" />
                                                                                    </div>
                                                                                </motion.div>
                                                                            ) : isPlanned ? (
                                                                                <div className="relative group/plan">
                                                                                    <Calendar className="w-5 h-5" />
                                                                                    <motion.div 
                                                                                        initial={{ scale: 0 }}
                                                                                        animate={{ scale: 1 }}
                                                                                        className="absolute -top-5 -right-5 w-5 h-5 bg-white text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/plan:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-200 border-2 border-white shadow-md cursor-pointer"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleTogglePlan(comp.id, month);
                                                                                        }}
                                                                                        whileHover={{ scale: 1.1 }}
                                                                                        whileTap={{ scale: 0.9 }}
                                                                                    >
                                                                                        <X className="w-3.5 h-3.5" />
                                                                                    </motion.div>
                                                                                </div>
                                                                            ) : (
                                                                                <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                            )}
                                                                            
                                                                            {isLoading && (
                                                                                <motion.div 
                                                                                    animate={{ rotate: 360 }}
                                                                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                                                    className="absolute inset-0 border-2 border-transparent border-t-white/50 rounded-xl"
                                                                                />
                                                                            )}

                                                                            {!isDone && !isPlanned && !isLoading && hoveredRow === comp.id && (
                                                                                <motion.div 
                                                                                    variants={pulseAnimation}
                                                                                    animate="animate"
                                                                                    className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full"
                                                                                />
                                                                            )}
                                                                        </motion.button>
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}

                                                        <td className="px-4 py-4 text-center">
                                                            <motion.button 
                                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
                                                            >
                                                                <MoreHorizontal className="w-5 h-5" />
                                                            </motion.button>
                                                        </td>
                                                    </motion.tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={14} className="py-16">
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="flex flex-col items-center justify-center gap-3"
                                                        >
                                                            <div className="p-4 bg-slate-100 rounded-2xl">
                                                                <Search className="w-8 h-8 text-slate-300" />
                                                            </div>
                                                            <p className="text-slate-400 font-medium">ไม่พบข้อมูลคอมพิวเตอร์</p>
                                                            {searchQuery && (
                                                                <button 
                                                                    onClick={() => setSearchQuery("")}
                                                                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                                                                >
                                                                    ล้างการค้นหา
                                                                </button>
                                                            )}
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </motion.tbody>
                                    )}
                                </AnimatePresence>
                            </table>
                        </div>
                    </motion.div>

                    {/* Mobile Card List (Visible on mobile/tablet) */}
                    <div className="lg:hidden mt-6 space-y-4">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div 
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="py-20 flex flex-col items-center justify-center gap-4"
                                >
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                        className="w-10 h-10 border-2 border-slate-200 border-t-blue-500 rounded-full"
                                    />
                                    <p className="text-slate-400 text-sm font-medium">โหลดข้อมูล...</p>
                                </motion.div>
                            ) : filteredComputers.length > 0 ? (
                                <motion.div 
                                    key="list"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    {filteredComputers.map((comp) => {
                                        const compInspections = inspections.filter(i => i.computer_id === comp.id);
                                        const progress = Math.round((compInspections.length / 12) * 100);

                                        return (
                                            <motion.div 
                                                key={comp.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white p-4 shadow-lg shadow-slate-200/50 overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2.5 rounded-xl ${(comp.code_com || '').includes('ISP') ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            <Monitor className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-slate-800 leading-tight">
                                                                {comp.code_com || `COMP-${comp.id}`}
                                                            </h4>
                                                            <p className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">
                                                                {comp.model}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                                            {progress}% Done
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* 12-Month Matrix Grid (4x3 for Mobile Optimization) */}
                                                <div className="grid grid-cols-4 gap-2 mb-2">
                                                    {MONTHS_TH.map((monthName, mIdx) => {
                                                        const month = mIdx + 1;
                                                        const { isDone, isPlanned } = getCellStatus(comp.id, month);
                                                        const key = `${comp.id}-${month}`;
                                                        const isLoading = actionLoading === key;

                                                        return (
                                                            <motion.button 
                                                                key={month}
                                                                whileTap={{ scale: 0.9 }}
                                                                type="button"
                                                                disabled={isLoading}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (isDone) {
                                                                        // Future: show info
                                                                    } else if (isPlanned) {
                                                                        router.visit(`/computer-inspection/form/${comp.id}?month=${month}&year=${selectedYear}`);
                                                                    } else {
                                                                        handleTogglePlan(comp.id, month);
                                                                    }
                                                                }}
                                                                className={`
                                                                    relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-all
                                                                    ${isDone 
                                                                        ? 'bg-emerald-500 text-white border-emerald-400' 
                                                                        : isPlanned 
                                                                            ? 'bg-blue-600 text-white border-blue-500' 
                                                                            : 'bg-slate-50 text-slate-400 border-slate-100 italic'
                                                                    }
                                                                    ${isLoading ? 'opacity-50' : ''}
                                                                `}
                                                            >
                                                                <span className="text-[8px] font-black opacity-60 leading-none">{mIdx + 1}</span>
                                                                {isDone ? (
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                ) : isPlanned ? (
                                                                    <Calendar className="w-4 h-4" />
                                                                ) : (
                                                                    <span className="text-[9px] font-bold">{monthName.substring(0, 3)}</span>
                                                                )}
                                                                
                                                                {isLoading && (
                                                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 border border-t-white/50 border-transparent rounded-xl" />
                                                                )}
                                                            </motion.button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="py-20 text-center"
                                >
                                    <p className="text-slate-400 text-sm">ไม่พบข้อมูลที่ค้นหา</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 20px;
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                    background-clip: content-box;
                }
            `}</style>
        </AppLayout>
    );
}