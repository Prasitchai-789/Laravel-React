import React, { useState, useMemo } from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import {
    Filter,
    RotateCcw,
    MapPin,
    Building,
    Home,
    Search,
    X,
    BarChart3,
    Users,
    User,
    UserCheck,
    HelpCircle,
    Table,
    List,
    PieChart
} from "lucide-react";

interface Perple {
    id: number;
    title?: string;
    first_name?: string;
    last_name?: string;
    village_no?: number;
    tambon?: string;
    amphoe?: string;
    province?: string;
}

interface SummaryItemRaw {
    village_no: number;
    total?: number | string;
    male?: number | string;
    female?: number | string;
    unspecified?: number | string;
    tambon?: string;
    amphoe?: string;
    province?: string;
}

const PopulationSummary: React.FC = () => {
    const { perples = [], summary: serverSummary = [] } = usePage().props as {
        perples?: Perple[];
        summary?: SummaryItemRaw[];
    };

    const [filterVillage, setFilterVillage] = useState<number | null>(null);
    const [filterTambon, setFilterTambon] = useState<string | null>(null);
    const [filterAmphoe, setFilterAmphoe] = useState<string | null>(null);
    const [filterProvince, setFilterProvince] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<"summary" | "details">("summary");
    const [searchTerm, setSearchTerm] = useState("");
    const [showUnspecifiedDetails, setShowUnspecifiedDetails] = useState(false);

    // ดึงข้อมูลตำบล อำเภอ จังหวัดทั้งหมด
    const { tambons, amphoes, provinces } = useMemo(() => {
        const tambonSet = new Set<string>();
        const amphoeSet = new Set<string>();
        const provinceSet = new Set<string>();

        perples.forEach(p => {
            if (p.tambon) tambonSet.add(p.tambon);
            if (p.amphoe) amphoeSet.add(p.amphoe);
            if (p.province) provinceSet.add(p.province);
        });

        return {
            tambons: Array.from(tambonSet).sort(),
            amphoes: Array.from(amphoeSet).sort(),
            provinces: Array.from(provinceSet).sort()
        };
    }, [perples]);

    const normalizedSummary = useMemo(() => {
        const src = serverSummary?.length ? serverSummary : [];

        return src
            .map((item) => ({
                village_no: Number(item.village_no ?? 0),
                total: Number(item.total ?? 0) || 0,
                male: Number(item.male ?? 0) || 0,
                female: Number(item.female ?? 0) || 0,
                unspecified: Number(item.unspecified ?? 0) || 0,
                tambon: item.tambon || "",
                amphoe: item.amphoe || "",
                province: item.province || "",
            }))
            .sort((a, b) => a.village_no - b.village_no);
    }, [serverSummary]);

    const computedSummary = useMemo(() => {
        if (normalizedSummary.length > 0) return normalizedSummary;

        const map: Record<
            number,
            {
                total: number;
                male: number;
                female: number;
                unspecified: number;
                tambon: string;
                amphoe: string;
                province: string;
            }
        > = {};

        perples.forEach((p) => {
            const v = Number(p.village_no ?? 0);
            if (!map[v]) map[v] = {
                total: 0,
                male: 0,
                female: 0,
                unspecified: 0,
                tambon: p.tambon || "",
                amphoe: p.amphoe || "",
                province: p.province || ""
            };

            map[v].total += 1;

            if (p.title === "นาย") map[v].male += 1;
            else if (["นาง", "นางสาว", "น.ส."].includes(p.title ?? "")) map[v].female += 1;
            else map[v].unspecified += 1;
        });

        return Object.entries(map)
            .map(([village_no, data]) => ({
                village_no: Number(village_no),
                ...data,
            }))
            .sort((a, b) => a.village_no - b.village_no);
    }, [normalizedSummary, perples]);

    const summary = computedSummary;

    // กรองข้อมูลตามตำบล อำเภอ จังหวัด
    const filteredSummary = useMemo(() => {
        return summary.filter(s => {
            const matchesVillage = !filterVillage || s.village_no === filterVillage;
            const matchesTambon = !filterTambon || s.tambon === filterTambon;
            const matchesAmphoe = !filterAmphoe || s.amphoe === filterAmphoe;
            const matchesProvince = !filterProvince || s.province === filterProvince;

            return matchesVillage && matchesTambon && matchesAmphoe && matchesProvince;
        });
    }, [summary, filterVillage, filterTambon, filterAmphoe, filterProvince]);

    const filteredPerples = useMemo(() => {
        return perples.filter((p) => {
            const matchesVillage = !filterVillage || p.village_no === filterVillage;
            const matchesTambon = !filterTambon || p.tambon === filterTambon;
            const matchesAmphoe = !filterAmphoe || p.amphoe === filterAmphoe;
            const matchesProvince = !filterProvince || p.province === filterProvince;
            const matchesSearch =
                !searchTerm ||
                p.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesVillage && matchesTambon && matchesAmphoe && matchesProvince && matchesSearch;
        });
    }, [perples, filterVillage, filterTambon, filterAmphoe, filterProvince, searchTerm]);

    const totalSummary = useMemo(() => {
        return filteredSummary.reduce(
            (acc, curr) => ({
                total: acc.total + Number(curr.total ?? 0),
                male: acc.male + Number(curr.male ?? 0),
                female: acc.female + Number(curr.female ?? 0),
                unspecified: acc.unspecified + Number(curr.unspecified ?? 0),
            }),
            { total: 0, male: 0, female: 0, unspecified: 0 }
        );
    }, [filteredSummary]);

    const fmt = (n: number) => Number(n || 0).toLocaleString("th-TH");

    // รีเซ็ตฟิลเตอร์ทั้งหมด
    const resetFilters = () => {
        setFilterVillage(null);
        setFilterTambon(null);
        setFilterAmphoe(null);
        setFilterProvince(null);
        setSearchTerm("");
    };

    // ตรวจสอบว่ามีการกรองข้อมูลหรือไม่
    const hasActiveFilters = filterProvince || filterAmphoe || filterTambon || filterVillage || searchTerm;

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-ANUPHAT">
                <div className="max-w-7xl mx-auto p-4">

                    {/* CONTENT */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-800 to-blue-900 p-8 text-white">
                            <div className="flex flex-col md:flex-row justify-between md:items-center">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold">ระบบสรุปข้อมูลประชากร</h1>
                                    <p className="mt-3 text-blue-100 text-lg">ข้อมูลประชากรแยกตามพื้นที่และการแบ่งเพศ</p>
                                </div>
                                <div className="mt-4 md:mt-0 text-sm bg-blue-600 px-4 py-2 rounded-full border border-blue-400 flex items-center gap-2">
                                    <PieChart className="w-4 h-4" />
                                    ข้อมูล ณ วันที่ {new Date().toLocaleDateString("th-TH")}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8">

                            {/* Filter Section */}
                            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                        <Filter className="w-6 h-6 text-blue-600" />
                                        กรองข้อมูล
                                    </h2>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={resetFilters}
                                            className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            ล้างตัวกรอง
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
                                    {/* Filter Province */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-blue-600" />
                                            จังหวัด
                                        </label>
                                        <select
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                                            value={filterProvince ?? ""}
                                            onChange={(e) => setFilterProvince(e.target.value || null)}
                                        >
                                            <option value="">ทั้งหมด</option>
                                            {provinces.map((province) => (
                                                <option key={province} value={province}>
                                                    {province}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filter Amphoe */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <Building className="w-4 h-4 text-green-600" />
                                            อำเภอ
                                        </label>
                                        <select
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                                            value={filterAmphoe ?? ""}
                                            onChange={(e) => setFilterAmphoe(e.target.value || null)}
                                        >
                                            <option value="">ทั้งหมด</option>
                                            {amphoes.map((amphoe) => (
                                                <option key={amphoe} value={amphoe}>
                                                    {amphoe}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filter Tambon */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <Home className="w-4 h-4 text-orange-600" />
                                            ตำบล
                                        </label>
                                        <select
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                                            value={filterTambon ?? ""}
                                            onChange={(e) => setFilterTambon(e.target.value || null)}
                                        >
                                            <option value="">ทั้งหมด</option>
                                            {tambons.map((tambon) => (
                                                <option key={tambon} value={tambon}>
                                                    {tambon}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filter Village */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <Home className="w-4 h-4 text-purple-600" />
                                            หมู่บ้าน
                                        </label>
                                        <select
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                                            value={filterVillage ?? ""}
                                            onChange={(e) => setFilterVillage(e.target.value ? parseInt(e.target.value) : null)}
                                        >
                                            <option value="">ทั้งหมด</option>
                                            {summary.map((s) => (
                                                <option key={s.village_no} value={s.village_no}>
                                                    หมู่ที่ {s.village_no}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Search */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <Search className="w-4 h-4 text-red-600" />
                                            ค้นหาชื่อ
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="กรอกชื่อหรือนามสกุล..."
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 transition-all"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            {searchTerm ? (
                                                <button
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                    onClick={() => setSearchTerm("")}
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <Search className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Active Filters Display */}
                                {hasActiveFilters && (
                                    <div className="flex items-center gap-4 text-sm text-slate-600 bg-white p-3 rounded-lg border">
                                        <span className="font-medium">ตัวกรองปัจจุบัน:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {filterProvince && (
                                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                    จังหวัด: {filterProvince}
                                                    <button onClick={() => setFilterProvince(null)} className="hover:text-blue-900">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            )}
                                            {filterAmphoe && (
                                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                    อำเภอ: {filterAmphoe}
                                                    <button onClick={() => setFilterAmphoe(null)} className="hover:text-green-900">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            )}
                                            {filterTambon && (
                                                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                    ตำบล: {filterTambon}
                                                    <button onClick={() => setFilterTambon(null)} className="hover:text-orange-900">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            )}
                                            {filterVillage && (
                                                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                    หมู่บ้าน: {filterVillage}
                                                    <button onClick={() => setFilterVillage(null)} className="hover:text-purple-900">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            )}
                                            {searchTerm && (
                                                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                    ค้นหา: {searchTerm}
                                                    <button onClick={() => setSearchTerm("")} className="hover:text-red-900">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* View Switch */}
                            <div className="flex bg-slate-100 rounded-2xl p-2 mb-8">
                                <button
                                    className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                                        currentView === "summary"
                                            ? "bg-white text-blue-600 shadow-lg"
                                            : "text-slate-600 hover:text-slate-800"
                                    }`}
                                    onClick={() => setCurrentView("summary")}
                                >
                                    <BarChart3 className="w-5 h-5" />
                                    สรุปภาพรวม
                                </button>
                                <button
                                    className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                                        currentView === "details"
                                            ? "bg-white text-blue-600 shadow-lg"
                                            : "text-slate-600 hover:text-slate-800"
                                    }`}
                                    onClick={() => setCurrentView("details")}
                                >
                                    <List className="w-5 h-5" />
                                    รายชื่อประชากร ({fmt(filteredPerples.length)})
                                </button>
                            </div>

                            {/* Statistic Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {[
                                    { key: "total", label: "รวมทั้งหมด", value: totalSummary.total, icon: Users, color: "from-blue-500 to-blue-600" },
                                    { key: "male", label: "ชาย", value: totalSummary.male, icon: User, color: "from-green-500 to-green-600" },
                                    { key: "female", label: "หญิง", value: totalSummary.female, icon: UserCheck, color: "from-pink-500 to-pink-600" },
                                    { key: "unspecified", label: "ไม่ระบุ", value: totalSummary.unspecified, icon: HelpCircle, color: "from-purple-500 to-purple-600" },
                                ].map((item) => {
                                    const IconComponent = item.icon;
                                    return (
                                        <div
                                            key={item.key}
                                            className={`bg-gradient-to-r ${item.color} rounded-2xl p-6 text-white shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-300`}
                                            onClick={() => item.key === "unspecified" && setShowUnspecifiedDetails(true)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm opacity-90 mb-2">{item.label}</p>
                                                    <p className="text-3xl font-bold mb-2">{fmt(Number(item.value))}</p>
                                                    {item.key !== 'total' && totalSummary.total > 0 && (
                                                        <p className="text-sm opacity-80">
                                                            {((item.value / totalSummary.total) * 100).toFixed(1)}% ของทั้งหมด
                                                        </p>
                                                    )}
                                                </div>
                                                <IconComponent className="text-4xl opacity-90" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Summary Table */}
                            {currentView === "summary" && (
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                            <Table className="w-6 h-6 text-blue-600" />
                                            สรุปข้อมูลประชากรแยกตามพื้นที่
                                        </h2>
                                        <div className="text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
                                            แสดง {filteredSummary.length} หมู่บ้าน
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[800px]">
                                                <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left font-semibold text-slate-700 border-b">พื้นที่</th>
                                                        <th className="px-6 py-4 text-center font-semibold text-slate-700 border-b">ทั้งหมด</th>
                                                        <th className="px-6 py-4 text-center font-semibold text-slate-700 border-b">ชาย</th>
                                                        <th className="px-6 py-4 text-center font-semibold text-slate-700 border-b">หญิง</th>
                                                        <th className="px-6 py-4 text-center font-semibold text-slate-700 border-b">ไม่ระบุ</th>
                                                        <th className="px-6 py-4 text-center font-semibold text-slate-700 border-b">อัตราส่วน</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {filteredSummary.map((s, idx) => {
                                                        const total = s.total;
                                                        const malePct = (s.male / total) * 100 || 0;
                                                        const femalePct = (s.female / total) * 100 || 0;
                                                        const unspecifiedPct = (s.unspecified / total) * 100 || 0;

                                                        return (
                                                            <tr
                                                                key={s.village_no}
                                                                className="hover:bg-blue-50 transition-colors"
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <div className="font-semibold text-slate-800">หมู่ที่ {s.village_no}</div>
                                                                    <div className="text-sm text-slate-600 mt-1">
                                                                        {s.tambon && `ตำบล${s.tambon} `}
                                                                        {s.amphoe && `อำเภอ${s.amphoe} `}
                                                                        {s.province && `จังหวัด${s.province}`}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-center font-semibold text-slate-800">{fmt(total)}</td>
                                                                <td className="px-6 py-4 text-center font-semibold text-green-600">{fmt(s.male)}</td>
                                                                <td className="px-6 py-4 text-center font-semibold text-pink-600">{fmt(s.female)}</td>
                                                                <td className="px-6 py-4 text-center font-semibold text-purple-600">{fmt(s.unspecified)}</td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col items-center space-y-2">
                                                                        <div className="w-full bg-slate-200 rounded-full h-2.5 flex overflow-hidden">
                                                                            <div style={{ width: `${malePct}%` }} className="bg-green-500"></div>
                                                                            <div style={{ width: `${femalePct}%` }} className="bg-pink-500"></div>
                                                                            <div style={{ width: `${unspecifiedPct}%` }} className="bg-purple-500"></div>
                                                                        </div>
                                                                        <div className="text-xs text-slate-500 font-medium">
                                                                            {malePct.toFixed(1)}% : {femalePct.toFixed(1)}%
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Details View */}
                            {currentView === "details" && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                            <Users className="w-6 h-6 text-blue-600" />
                                            รายชื่อประชากร
                                        </h2>
                                        <div className="text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
                                            พบ {fmt(filteredPerples.length)} รายการ
                                            {searchTerm && ` สำหรับ "${searchTerm}"`}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                                        {filteredPerples.length > 0 ? (
                                            <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
                                                {filteredPerples.map((p) => (
                                                    <div key={p.id} className="p-6 flex items-center hover:bg-blue-50 transition-colors">
                                                        <div
                                                            className={`rounded-2xl p-4 mr-4 ${
                                                                p.title === "นาย"
                                                                    ? "bg-green-100 text-green-600"
                                                                    : ["นาง", "นางสาว", "น.ส."].includes(p.title ?? "")
                                                                    ? "bg-pink-100 text-pink-600"
                                                                    : "bg-purple-100 text-purple-600"
                                                            }`}
                                                        >
                                                            {p.title === "นาย" ? (
                                                                <User className="w-6 h-6" />
                                                            ) : ["นาง", "นางสาว", "น.ส."].includes(p.title ?? "") ? (
                                                                <UserCheck className="w-6 h-6" />
                                                            ) : (
                                                                <HelpCircle className="w-6 h-6" />
                                                            )}
                                                        </div>

                                                        <div className="flex-1">
                                                            <p className="font-semibold text-slate-800 text-lg mb-2">
                                                                {p.first_name ?? "-"} {p.last_name ?? "-"}
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm font-medium">
                                                                    หมู่ที่ {p.village_no ?? "-"}
                                                                </span>
                                                                {p.tambon && (
                                                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
                                                                        ต.{p.tambon}
                                                                    </span>
                                                                )}
                                                                {p.amphoe && (
                                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
                                                                        อ.{p.amphoe}
                                                                    </span>
                                                                )}
                                                                {p.province && (
                                                                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm font-medium">
                                                                        จ.{p.province}
                                                                    </span>
                                                                )}
                                                                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                                                    p.title === "นาย"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : ["นาง", "นางสาว", "น.ส."].includes(p.title ?? "")
                                                                        ? "bg-pink-100 text-pink-700"
                                                                        : "bg-purple-100 text-purple-700"
                                                                }`}>
                                                                    {p.title ?? "ไม่ระบุ"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-12 text-center text-slate-500">
                                                <Search className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                                <p className="text-xl font-semibold mb-2">ไม่พบข้อมูลประชากร</p>
                                                <p className="text-slate-600">ลองเปลี่ยนคำค้นหาหรือเงื่อนไขการกรอง</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Modal — รายชื่อไม่ระบุคำนำหน้า */}
                    {showUnspecifiedDetails && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-2xl">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                            <HelpCircle className="w-5 h-5 text-purple-600" />
                                            รายชื่อที่ไม่ระบุคำนำหน้า
                                        </h3>
                                        <button
                                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                            onClick={() => setShowUnspecifiedDetails(false)}
                                        >
                                            <X className="w-5 h-5 text-slate-600" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="grid gap-4">
                                        {perples
                                            .filter((p) => !["นาย", "นาง", "นางสาว", "น.ส."].includes(p.title ?? ""))
                                            .map((p) => (
                                                <div key={p.id} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                                    <div className="font-semibold text-slate-800 text-lg">
                                                        {p.first_name} {p.last_name}
                                                    </div>
                                                    <div className="text-sm text-slate-600 mt-2 flex flex-wrap gap-3">
                                                        <span>หมู่ที่ {p.village_no}</span>
                                                        {p.tambon && <span>ตำบล{p.tambon}</span>}
                                                        {p.amphoe && <span>อำเภอ{p.amphoe}</span>}
                                                        {p.province && <span>จังหวัด{p.province}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                                <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                                    <div className="flex justify-end">
                                        <button
                                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
                                            onClick={() => setShowUnspecifiedDetails(false)}
                                        >
                                            <X className="w-4 h-4" />
                                            ปิดหน้าต่าง
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AppLayout>
    );
};

export default PopulationSummary;
