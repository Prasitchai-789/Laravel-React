import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapPin, Building, Home, Search, X, RotateCcw } from "lucide-react";

interface FilterSectionProps {
    filterProvince: string | null;
    setFilterProvince: (value: string | null) => void;
    filterAmphoe: string | null;
    setFilterAmphoe: (value: string | null) => void;
    filterTambon: string | null;
    setFilterTambon: (value: string | null) => void;
    searchTerm: string;
    setSearchTerm: (value: string) => void;
}

interface LocationItem {
    ProvinceName: string;
    DistrictName: string;
    SubDistrictName: string;
}

const FilterSection: React.FC<FilterSectionProps> = ({
    filterProvince,
    setFilterProvince,
    filterAmphoe,
    setFilterAmphoe,
    filterTambon,
    setFilterTambon,
    searchTerm,
    setSearchTerm
}) => {
    const [locations, setLocations] = useState<LocationItem[]>([]);
    const [provinces, setProvinces] = useState<string[]>([]);
    const [amphoes, setAmphoes] = useState<string[]>([]);
    const [tambons, setTambons] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // ตรวจสอบว่ามีการกรองข้อมูลหรือไม่
    const hasActiveFilters = filterProvince || filterAmphoe || filterTambon || searchTerm;

    // รีเซ็ตฟิลเตอร์ทั้งหมด
    const resetFilters = () => {
        setFilterProvince(null);
        setFilterAmphoe(null);
        setFilterTambon(null);
        setSearchTerm("");
    };

    // โหลดข้อมูลจาก API
    useEffect(() => {
        setLoading(true);
        axios.get("/getLocationSakon")
            .then(res => {
                const data: LocationItem[] = res.data;
                setLocations(data);

                // Province list
                const provinceSet = new Set(data.map(d => d.ProvinceName));
                setProvinces(Array.from(provinceSet).sort());
            })
            .catch(error => {
                console.error("Error loading locations:", error);
            })
            .finally(() => setLoading(false));
    }, []);

    // Cascade filter: Province → Amphoe
    useEffect(() => {
        if (!filterProvince) {
            setAmphoes([]);
            setTambons([]);
            setFilterAmphoe(null);
            setFilterTambon(null);
            return;
        }

        const filteredAmphoes = Array.from(
            new Set(
                locations
                    .filter(d => d.ProvinceName === filterProvince)
                    .map(d => d.DistrictName)
            )
        ).sort();

        setAmphoes(filteredAmphoes);
        setFilterAmphoe(null);
        setTambons([]);
        setFilterTambon(null);
    }, [filterProvince, locations]);

    // Cascade filter: Amphoe → Tambon
    useEffect(() => {
        if (!filterAmphoe) {
            setTambons([]);
            setFilterTambon(null);
            return;
        }

        const filteredTambons = Array.from(
            new Set(
                locations
                    .filter(d => d.ProvinceName === filterProvince && d.DistrictName === filterAmphoe)
                    .map(d => d.SubDistrictName)
            )
        ).sort();

        setTambons(filteredTambons);
        setFilterTambon(null);
    }, [filterAmphoe, filterProvince, locations]);

    if (loading) return (
        <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-slate-600">กำลังโหลดข้อมูลพื้นที่...</span>
        </div>
    );

    return (
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">กรองข้อมูล</h2>
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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                {/* Province */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" /> จังหวัด
                    </label>
                    <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                        value={filterProvince ?? ""}
                        onChange={(e) => setFilterProvince(e.target.value || null)}
                    >
                        <option value="">ทั้งหมด</option>
                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                {/* Amphoe */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Building className="w-4 h-4 text-green-600" /> อำเภอ
                    </label>
                    <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                        value={filterAmphoe ?? ""}
                        onChange={(e) => setFilterAmphoe(e.target.value || null)}
                        disabled={!filterProvince}
                    >
                        <option value="">ทั้งหมด</option>
                        {amphoes.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>

                {/* Tambon */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Home className="w-4 h-4 text-orange-600" /> ตำบล
                    </label>
                    <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                        value={filterTambon ?? ""}
                        onChange={(e) => setFilterTambon(e.target.value || null)}
                        disabled={!filterAmphoe}
                    >
                        <option value="">ทั้งหมด</option>
                        {tambons.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Search */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Search className="w-4 h-4 text-red-600" /> ค้นหาชื่อ
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="กรอกชื่อหรือนามสกุล..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                onClick={() => setSearchTerm("")}
                            >
                                <X className="w-5 h-5" />
                            </button>
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
    );
};

export default FilterSection;
