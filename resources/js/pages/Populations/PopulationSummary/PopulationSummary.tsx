import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AppLayout from "@/layouts/app-layout";
import FilterSection from "./Components/FilterSection";
import SummaryTable from "./Components/SummaryTable";
import DetailsView from "./Components/DetailsView";
import ViewSwitch from "./Components/ViewSwitch";
import StatisticCards from "./Components/StatisticCards";

import { Perple } from "./types/Perple";
import { formatNumber } from "./utils/format";
import { calculateTotalSummary } from "./utils/summary";

const PopulationSummary: React.FC = () => {
    const [perples, setPerples] = useState<Perple[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [filterProvince, setFilterProvince] = useState<string | null>(null);
    const [filterAmphoe, setFilterAmphoe] = useState<string | null>(null);
    const [filterTambon, setFilterTambon] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [currentView, setCurrentView] = useState<"summary" | "details">("summary");

    // Fetch perples from server when filter/search changes
    useEffect(() => {
        const fetchPerples = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await axios.get("/summaryJson", {
                    params: {
                        province: filterProvince,
                        amphoe: filterAmphoe,
                        tambon: filterTambon,
                        search: searchTerm
                    },
                    timeout: 10000
                });

                if (res.data && Array.isArray(res.data.items)) {
                    setPerples(res.data.items);
                } else {
                    setError("รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง");
                    setPerples([]);
                }
            } catch (error: any) {
                if (error.response?.status === 500) {
                    setError("เซิร์ฟเวอร์มีปัญหาในขณะนี้ กรุณาลองใหม่ในภายหลัง");
                } else if (error.code === 'ECONNABORTED') {
                    setError("การเชื่อมต่อ Timeout กรุณาลองใหม่");
                } else {
                    setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
                }
                setPerples([]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchPerples, 300); // debounce
        return () => clearTimeout(timeoutId);
    }, [filterProvince, filterAmphoe, filterTambon, searchTerm]);

    const fmt = formatNumber;
    const totalSummary = calculateTotalSummary(perples);

    const resetFilters = () => {
        setFilterProvince(null);
        setFilterAmphoe(null);
        setFilterTambon(null);
        setSearchTerm("");
    };

    // แปลง Perple → SummaryItem สำหรับ SummaryTable
    const summaryItems = useMemo(() => {
        return perples.map(p => ({
            province: p.province,
            amphoe: p.amphoe,
            tambon: p.tambon,
            village_no: p.village_no,
            male: p.gender === "ชาย" ? 1 : 0,
            female: p.gender === "หญิง" ? 1 : 0,
            unspecified: (!p.gender || (p.gender !== "ชาย" && p.gender !== "หญิง")) ? 1 : 0
        }));
    }, [perples]);

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-ANUPHAT">
                <div className="max-w-7xl mx-auto p-4">

                    {/* Filter Section */}
                    <FilterSection
                        filterProvince={filterProvince}
                        setFilterProvince={setFilterProvince}
                        filterAmphoe={filterAmphoe}
                        setFilterAmphoe={setFilterAmphoe}
                        filterTambon={filterTambon}
                        setFilterTambon={setFilterTambon}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        onReset={resetFilters}
                    />

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        {error}
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Switch */}
                    <ViewSwitch
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                        filteredPerplesCount={perples.length}
                        fmt={fmt}
                    />

                    {/* Statistic Cards */}
                    <StatisticCards
                        perples={perples}
                       
                        fmt={fmt}
                    />


                    {/* Content */}
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-lg">กำลังโหลดข้อมูล...</span>
                        </div>
                    ) : currentView === "summary" ? (
                        <SummaryTable filteredSummary={perples} fmt={fmt} />
                    ) : (
                        <DetailsView filteredPerples={perples} searchTerm={searchTerm} fmt={fmt} />
                    )}

                </div>
            </div>
        </AppLayout>
    );
};

export default PopulationSummary;
