import React, { useState, useMemo, useEffect } from "react";
import AppLayout from '@/layouts/app-layout';

export default function StoreMovementPage({ title, movements }) {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("ทั้งหมด");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const itemsPerPage = 15;


    // reset page เมื่อ filter/search เปลี่ยน
    useEffect(() => {
        setCurrentPage(1);

        // console.log("จำนวนรายการทั้งหมด:", movements.length);
        // console.log("จำนวนรายการที่ผ่าน filter:", filteredMovements.length);
        // console.log("ข้อมูลหลัง filter + approved:", filteredMovements.length);

        // console.log("ข้อมูลทั้งหมดจาก backend:", movements.length); // ตัวนี้ต้องตรงกับจำนวนข้อมูลที่ดึงมา

    }, [search, filterType]);




    // ฟังก์ชันเรียงลำดับ
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Filter และเรียงลำดับ
    const filteredMovements = useMemo(() => {
        return movements.filter(m => {
            const matchesSearch =
                (m.goodName || '').toLowerCase().includes(search.toLowerCase()) ||
                (m.goodCode || '').toLowerCase().includes(search.toLowerCase());

            let matchesType = false;
            if (filterType === "ทั้งหมด") matchesType = true;
            else if (filterType === "add") matchesType = m.type === "add" || m.movement_type === "adjustment";
            else if (filterType === "subtract") matchesType = m.type === "subtract";
            else if (filterType === "return") matchesType = m.movement_type === "return";

            // 🆕 กรอง issue ที่คืนครบแล้วออก
            const notFullyReturned = !(m.movement_type === "issue" && m.remaining_qty === 0);

            return matchesSearch && matchesType && notFullyReturned;
        });
    }, [search, filterType, movements]);





    const sortedMovements = useMemo(() => {
        if (!sortConfig.key) return filteredMovements;

        const sorted = [...filteredMovements].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // แปลง string เป็น lowercase เพื่อให้ sort ไม่ case-sensitive
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredMovements, sortConfig]);

    const currentMovements = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedMovements.slice(start, start + itemsPerPage);
    }, [sortedMovements, currentPage]);


    const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);


    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // แปลง type เป็นภาษาไทย + สี + hover color
    const getTypeLabel = (movement_type, type, category) => {
        if (movement_type === "issue") {
            return {
                label: "เบิกออก",
                color: "bg-red-100 text-red-800 border border-red-200",
                hoverColor: "hover:bg-red-200",
                icon: "-"
            };
        }
        if (movement_type === "return") {
            return {
                label: "คืนสินค้า",
                color: "bg-blue-100 text-blue-800 border border-blue-200",
                hoverColor: "hover:bg-blue-200",
                icon: "+"
            };
        }
        if (movement_type === "reserve") {
            return {
                label: "จองสินค้า",
                color: "bg-purple-100 text-purple-800 border border-purple-200",
                hoverColor: "hover:bg-purple-200",
                icon: "-"
            };
        }
        if (movement_type === "adjustment") {
            // แยกเพิ่ม/ลด stock ตาม type
            if (type === "add" && category === "stock") {
                return {
                    label: "เพิ่มสินค้า",
                    color: "bg-green-100 text-green-800 border border-green-200",
                    hoverColor: "hover:bg-green-200",
                    icon: "+"
                };
            }
            if (type === "subtract" && category === "stock") {
                return {
                    label: "ลดสต็อก",
                    color: "bg-red-100 text-red-800 border border-red-200",
                    hoverColor: "hover:bg-red-200",
                    icon: "-"
                };
            }
            // safety หรือ adjustment อื่น ๆ
            return type === "add" ?
                {
                    label: "เพิ่มสต็อก",
                    color: "bg-green-100 text-green-800 border border-green-200",
                    hoverColor: "hover:bg-green-200",
                    icon: "+"
                } :
                {
                    label: "ลดสต็อก",
                    color: "bg-red-100 text-red-800 border border-red-200",
                    hoverColor: "hover:bg-red-200",
                    icon: "-"
                };
        }
        return {
            label: "-",
            color: "bg-gray-100 text-gray-800 border border-gray-200",
            hoverColor: "hover:bg-gray-200",
            icon: ""
        };
    };

    // ฟังก์ชันสำหรับแสดงปุ่ม pagination
    const renderPaginationButtons = () => {
        const buttons = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // ปุ่มก่อนหน้า
        buttons.push(
            <button
                key="prev"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 flex items-center transition-all duration-200 text-blue-700 hover:shadow-sm text-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                ก่อนหน้า
            </button>
        );

        // ปุ่มหน้าแรก
        if (startPage > 1) {
            buttons.push(
                <button
                    key={1}
                    onClick={() => goToPage(1)}
                    className="px-3 py-2 rounded-lg transition-all duration-200 hover:shadow-sm bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 text-sm"
                >
                    1
                </button>
            );
            if (startPage > 2) {
                buttons.push(
                    <span key="ellipsis1" className="px-2 py-2 text-blue-700 flex items-center">
                        ...
                    </span>
                );
            }
        }

        // ปุ่มหน้าต่างๆ
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`px-3 py-2 rounded-lg transition-all duration-200 hover:shadow-sm text-sm ${currentPage === i ? "bg-blue-600 text-white shadow-md" : "bg-white border border-blue-200 hover:bg-blue-50 text-blue-700"}`}
                >
                    {i}
                </button>
            );
        }

        // ปุ่มหน้าสุดท้าย
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                buttons.push(
                    <span key="ellipsis2" className="px-2 py-2 text-blue-700 flex items-center">
                        ...
                    </span>
                );
            }
            buttons.push(
                <button
                    key={totalPages}
                    onClick={() => goToPage(totalPages)}
                    className="px-3 p-2 rounded-lg transition-all duration-200 hover:shadow-sm bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 text-sm"
                >
                    {totalPages}
                </button>
            );
        }

        // ปุ่มถัดไป
        buttons.push(
            <button
                key="next"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 flex items-center transition-all duration-200 text-blue-700 hover:shadow-sm text-sm"
            >
                ถัดไป
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
            </button>
        );

        return buttons;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: "หน้าหลัก", href: route('dashboard') },
            { title: "การเคลื่อนไหวของสินค้า", href: route('storemovement.indexPage') },
        ]}>
            <div className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen  font-anuphan">
                {/* Header */}
                <div className="mb-6 md:mb-8 text-center">
                    <h1 className="text-2xl md:text-4xl font-bold text-blue-800 drop-shadow-sm">{title || "การเคลื่อนไหวของสินค้า"}</h1>
                    <p className="text-blue-600 mt-2 text-sm md:text-lg">ดูประวัติการเคลื่อนไหวสินค้าในคลังสินค้า</p>
                    <div className="w-16 md:w-24 h-1 bg-blue-500 mx-auto mt-3 md:mt-4 rounded-full"></div>
                </div>

                {/* Search + Filter Card */}
                <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border border-blue-100 mb-6 md:mb-8 transition-all duration-300 hover:shadow-xl">
                    <h2 className="text-lg md:text-xl font-semibold text-blue-900 mb-3 md:mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        ค้นหาและกรองข้อมูล
                    </h2>
                    <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 md:h-5 md:w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="ค้นหาด้วยชื่อหรือรหัสสินค้า..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 md:pl-10 pr-4 py-2 md:py-3 border border-blue-200 rounded-lg md:rounded-xl shadow-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm md:text-base"
                            />
                        </div>

                        <div className="relative md:w-48">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 md:h-5 md:w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="pl-9 md:pl-10 pr-8 md:pr-10 py-2 md:py-3 border border-blue-200 rounded-lg md:rounded-xl shadow-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none transition-all duration-300 text-sm md:text-base"
                            >
                                <option value="ทั้งหมด">ทั้งหมด</option>
                                <option value="add">เข้า</option>
                                <option value="subtract">ออก</option>
                                <option value="return">คืนสินค้า</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-500">
                                <svg className="h-4 w-4" xmlns="http极://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white shadow-lg overflow-hidden mb-6 md:mb-8 transition-all duration-300 hover:shadow-xl rounded-xl">
                    <div className="p-3 md:p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-base md:text-lg font-semibold">รายการเคลื่อนไหวสินค้า</span>
                        <span className="ml-auto bg-blue-500 text-xs font-medium px-2 py-0.5 rounded-full">
                            {filteredMovements.length} รายการ
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                                <tr>
                                    <th
                                        className="px-3 md:px-6 py-3 md:py-4 font-semibold text-left cursor-pointer hover:bg-blue-700 transition-colors text-xs md:text-sm"
                                        onClick={() => requestSort('goodCodeStore')}
                                    >
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                                            </svg>
                                            รหัสสินค้า
                                        </div>
                                    </th>
                                    <th
                                        className="px-3 md:px-6 py-3 md:py-4 font-semibold text-left cursor-pointer hover:bg-blue-700 transition-colors text-xs md:text-sm"
                                        onClick={() => requestSort('goodName')}
                                    >
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            ชื่อสินค้า
                                        </div>
                                    </th>
                                    <th className="px-3 md:px-6 py-3 md:py-4 font-semibold text-center text-xs md:text-sm">
                                        <div className="flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                                            </svg>
                                            ประเภท
                                        </div>
                                    </th>
                                    <th
                                        className="px-3 md:px-6 py-3 md:py-4 font-semibold text-center cursor-pointer hover:bg-blue-700 transition-colors text-xs md:text-sm"
                                        onClick={() => requestSort('stockQty')}
                                    >
                                        <div className="flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                            </svg>
                                            จำนวน
                                        </div>
                                    </th>
                                    <th
                                        className="px-3 md:px-6 py-3 md:py-4 font-semibold text-left cursor-pointer hover:bg-blue-700 transition-colors text-xs md:text-sm"
                                        onClick={() => requestSort('date')}
                                    >
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 极 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                            </svg>
                                            วันที่
                                        </div>
                                    </th>
                                    <th className="px-3 md:px-6 py-3 md:py-4 font-semibold text-left text-xs md:text-sm">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                            ผู้ทำรายการ
                                        </div>
                                    </th>
                                    <th className="px-3 md:px-6 py-3 md:py-4 font-semibold text-center text-xs md:text-sm">
                                        <div className="flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            หมายเหตุ
                                        </div>
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-blue-100">
                                {currentMovements.length > 0 ? currentMovements.map((m) => {
                                    const typeInfo = getTypeLabel(m.movement_type, m.type, m.category);
                                    return (
                                        <tr key={m.id} className={`transition-all duration-200 group ${typeInfo.hoverColor}`}>
                                            <td className="px-3 md:px-6 py-2 md:py-2 font-medium text-blue-900 text-sm">
                                                <div className="flex items-center">

                                                    <span className="font-mono bg-blue-50 px-2 py-1 rounded-md text-xs md:text-sm">{m.goodCodeStore}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 md:px-6 py-2 md:py-2  font-medium text-gray-800 text-sm">
                                                <div className="max-w-[120px] md:max-w-xs truncate" title={m.goodName}>
                                                    {m.goodName}
                                                </div>
                                            </td>

                                            <td className="px-3 md:px-6 py-2 md:py-2  text-center">
                                                <span className={`inline-flex items-center justify-center px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-semibold ${typeInfo.color} transition-all duration-200 hover:scale-105`}>
                                                    {typeInfo.icon}
                                                    <span className="ml-1">{typeInfo.label}</span>
                                                </span>
                                            </td>

                                            <td className="px-3 md:px-6 py-2 md:py-2  text-center font-medium text-sm">
                                                <div className="flex justify-center items-center">
                                                    {typeInfo.label.includes("ออก") || typeInfo.label === "ลดสต็อก" ? (
                                                        <span className="text-red-600 bg-red-50 px-2 py-1 md:px-3 md:py-1.5 rounded-lg flex items-center transition-all duration-200 hover:bg-red-100 border border-red-200 text-xs md:text-sm">
                                                            {typeInfo.icon}
                                                            <span className="ml-1">{m.stockQty}</span>
                                                        </span>
                                                    ) : typeInfo.label === "คืนสินค้า" ? (
                                                        <span className="text-blue-600 bg-blue-50 py-2 md:py-2  md:px-3 md:py-1.5 rounded-lg flex items-center transition-all duration-200 hover:bg-blue-100 border border-blue-200 text-xs md:text-sm">
                                                            {typeInfo.icon}
                                                            <span className="ml-1">{m.stockQty}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-green-600 bg-green-50 py-2 md:py-2  md:px-3 md:py-1.5 rounded-lg flex items-center transition-all duration-200 hover:bg-green-100 border border-green-200 text-xs md:text-sm">
                                                            {typeInfo.icon}
                                                            <span className="ml-1">{m.stockQty}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-3 md:px-6 py-2 md:py-2  text-blue-800 text-sm">
                                                <div className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                    </svg>
                                                    {m.date}
                                                </div>
                                            </td>
                                            <td className="px-3 md:px-6 py-2 md:py-2  text-sm">
                                                <div className="flex items-center">
                                                    <div className={`rounded-full p-1 md:p-1.5 mr-2 transition-colors bg-blue-100`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-blue-900">{m.user}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 md:px-6 py-2 md:py-2  text-sm">
                                                {m.note && (
                                                    <div className="flex items-center justify-center">
                                                        <div className="relative group">
                                                            {/* ปุ่มแสดงหมายเหตุ (แสดงบางส่วน) */}
                                                            <button className="bg-blue-100 hover:bg-blue-200 rounded-lg p-2 max-w-[120px] transition-colors duration-200">
                                                                <div className="flex items-start">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 mt-0.5 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span className="text-blue-800 text-xs truncate">
                                                                        {m.note.length > 20 ? `${m.note.substring(0, 20)}...` : m.note}
                                                                    </span>
                                                                </div>
                                                            </button>

                                                            {/* Popup แสดงข้อความเต็ม (เมื่อ hover) */}
                                                            {m.note.length > 20 && (
                                                                <div className="absolute z-10 left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block">
                                                                    <div className="bg-white border border-blue-200 rounded-lg shadow-lg p-3 max-w-xs">
                                                                        <div className="flex items-start">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                                            </svg>
                                                                            <span className="text-blue-800 text-sm">{m.note}</span>
                                                                        </div>
                                                                     
                                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 md:px-5 py-8 md:py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-blue-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 md:h-16 md:w-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-lg md:text-xl text-blue-600">ไม่พบข้อมูลการเคลื่อนไหว</p>
                                                <p className="text-xs md:text-sm mt-1 text-blue-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-wrap justify-between items-center gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg border border-blue-100 transition-all duration-300 hover:shadow-xl">
                        <div className="text-xs md:text-sm text-blue-700">
                            แสดง <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> -
                            <span className="font-medium"> {(currentPage - 1) * itemsPerPage + currentMovements.length}</span> จาก
                            <span className="font-medium"> {filteredMovements.length}</span> รายการ
                        </div>
                        <div className="flex gap-1 flex-wrap justify-center">
                            {renderPaginationButtons()}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}