import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

const CommunityPage = ({ provinces: initialProvinces }) => {
    const { props } = usePage();
    const [province, setProvince] = useState("");
    const [district, setDistrict] = useState("");
    const [subdistrict, setSubdistrict] = useState("");
    const [villages, setVillages] = useState([]);
    const [filteredDistricts, setFilteredDistricts] = useState([]);
    const [filteredSubdistricts, setFilteredSubdistricts] = useState([]);
    const [provinces, setProvinces] = useState(initialProvinces || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState('');
    const [showDebug, setShowDebug] = useState(false);

    // Filter districts based on selected province
    useEffect(() => {
        const fetchDistricts = async () => {
            if (!province) {
                setFilteredDistricts([]);
                setFilteredSubdistricts([]);
                setDebugInfo('ไม่ได้เลือกจังหวัด');
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const apiUrl = `/api/get-locations?province=${encodeURIComponent(province)}`;
                setDebugInfo(`API URL: ${apiUrl}`);

                const response = await fetch(apiUrl);
                setDebugInfo(`สถานะการตอบกลับ: ${response.status}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Districts data:', data);

                if (data && Array.isArray(data.districts)) {
                    setFilteredDistricts(data.districts);
                    setFilteredSubdistricts(data.subdistricts || []);
                    setDebugInfo(`พบอำเภอ ${data.districts.length} อำเภอ`);
                } else {
                    throw new Error('รูปแบบข้อมูลอำเภอไม่ถูกต้อง');
                }

                setDistrict("");
                setSubdistrict("");
                setVillages([]);
            } catch (err) {
                console.error('Error fetching districts:', err);
                setError(`ไม่สามารถดึงข้อมูลอำเภอได้: ${err.message}`);
                setFilteredDistricts([]);
                setFilteredSubdistricts([]);
            } finally {
                setLoading(false);
            }
        };

        if (province) {
            fetchDistricts();
        }
    }, [province]);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'ข้อมูลชุมชน', href: '/community' },
    ];

    // Filter subdistricts based on selected district
    useEffect(() => {
        const fetchSubdistricts = async () => {
            if (!district || !province) {
                setFilteredSubdistricts([]);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const apiUrl = `/api/get-locations?province=${encodeURIComponent(province)}&district=${encodeURIComponent(district)}`;
                setDebugInfo(`API URL สำหรับตำบล: ${apiUrl}`);

                const response = await fetch(apiUrl);
                setDebugInfo(`สถานะการตอบกลับ: ${response.status}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Subdistricts data:', data);

                if (data && Array.isArray(data.subdistricts)) {
                    setFilteredSubdistricts(data.subdistricts);
                    setDebugInfo(`พบตำบล ${data.subdistricts.length} ตำบล`);
                } else {
                    throw new Error('รูปแบบข้อมูลตำบลไม่ถูกต้อง');
                }

                setSubdistrict("");
                setVillages([]);
            } catch (err) {
                console.error('Error fetching subdistricts:', err);
                setError(`ไม่สามารถดึงข้อมูลตำบลได้: ${err.message}`);
                setFilteredSubdistricts([]);
            } finally {
                setLoading(false);
            }
        };

        if (district && province) {
            fetchSubdistricts();
        }
    }, [district, province]);

    const handleSearch = async () => {
        if (!subdistrict) {
            setError("กรุณาเลือกตำบลก่อนทำการค้นหา");
            setDebugInfo('กรุณาเลือกตำบลก่อนทำการค้นหา');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const apiUrl = `/api/get-villages?subdistrict=${encodeURIComponent(subdistrict)}`;
            setDebugInfo(`API URL สำหรับหมู่บ้าน: ${apiUrl}`);

            const response = await fetch(apiUrl);
            setDebugInfo(`สถานะการตอบกลับ: ${response.status}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Villages data:', data);

            if (Array.isArray(data)) {
                setVillages(data);
                setDebugInfo(`พบ ${data.length} หมู่บ้าน`);
            } else {
                throw new Error('รูปแบบข้อมูลหมู่บ้านไม่ถูกต้อง');
            }
        } catch (err) {
            console.error('Error fetching villages:', err);
            setError(`ไม่สามารถดึงข้อมูลหมู่บ้านได้: ${err.message}`);
            setVillages([]);
            setDebugInfo(`เกิดข้อผิดพลาด: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setProvince("");
        setDistrict("");
        setSubdistrict("");
        setVillages([]);
        setFilteredDistricts([]);
        setFilteredSubdistricts([]);
        setError(null);
        setDebugInfo('รีเซ็ตข้อมูลแล้ว');
    };

    // รวมชายและหญิง
    const totalMale = villages.reduce((sum, v) => sum + (Number(v.male) || 0), 0);
    const totalFemale = villages.reduce((sum, v) => sum + (Number(v.female) || 0), 0);
    const totalPopulation = totalMale + totalFemale;

    const dismissError = () => {
        setError(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 font-anuphan">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent p-2">
                            ข้อมูลชุมชน
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            ระบบจัดการข้อมูลประชากรในชุมชน แสดงข้อมูลประชากรแยกตามเพศและพื้นที่
                        </p>
                        <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mt-4 rounded-full"></div>
                    </div>

                    {/* Debug Information Toggle */}
                    {/* <div className="mb-6 flex justify-end">
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            {showDebug ? 'ซ่อน' : 'แสดง'} ข้อมูล Debug
                        </button>
                    </div> */}

                    {/* Debug Information */}
                    {showDebug && (
                        <div className="mb-6 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden transition-all duration-300">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium text-gray-700">ข้อมูล Debug</span>
                                    </div>
                                    <button onClick={() => setShowDebug(false)} className="text-gray-400 hover:text-gray-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="text-sm font-mono whitespace-pre-wrap bg-white p-3 rounded mb-3">
                                    {debugInfo || 'กำลังรอการดำเนินการ...'}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                    <div className="bg-white p-3 rounded shadow-sm">
                                        <span className="font-medium text-gray-600">จังหวัด:</span>
                                        <span className="ml-2">{province || 'ไม่ได้เลือก'}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded shadow-sm">
                                        <span className="font-medium text-gray-600">อำเภอ:</span>
                                        <span className="ml-2">{district || 'ไม่ได้เลือก'}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded shadow-sm">
                                        <span className="font-medium text-gray-600">ตำบล:</span>
                                        <span className="ml-2">{subdistrict || 'ไม่ได้เลือก'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                                <button
                                    onClick={dismissError}
                                    className="ml-auto pl-3"
                                >
                                    <svg className="h-5 w-5 text-red-500 hover:text-red-700" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Search Section */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                        <div className="flex items-center mb-6">
                            <div className="w-3 h-6 bg-blue-500 rounded-full mr-3"></div>
                            <h2 className="text-2xl font-semibold text-gray-800">ค้นหาข้อมูล</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    จังหวัด
                                </label>
                                <select
                                    value={province}
                                    onChange={(e) => setProvince(e.target.value)}
                                    disabled={loading}
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition duration-200 p-3 border shadow-sm disabled:bg-gray-50 disabled:cursor-not-allowed hover:border-gray-400"
                                >
                                    <option value="">-- เลือกจังหวัด --</option>
                                    {provinces.map((p, index) => (
                                        <option key={index} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                    อำเภอ
                                </label>
                                <select
                                    value={district}
                                    onChange={(e) => setDistrict(e.target.value)}
                                    disabled={!province || loading}
                                    className="w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:ring-opacity-50 transition duration-200 p-3 border shadow-sm disabled:bg-gray-50 disabled:cursor-not-allowed hover:border-gray-400"
                                >
                                    <option value="">-- เลือกอำเภอ --</option>
                                    {filteredDistricts.map((d, index) => (
                                        <option key={index} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    ตำบล
                                </label>
                                <select
                                    value={subdistrict}
                                    onChange={(e) => setSubdistrict(e.target.value)}
                                    disabled={!district || loading}
                                    className="w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:ring-opacity-50 transition duration-200 p-3 border shadow-sm disabled:bg-gray-50 disabled:cursor-not-allowed hover:border-gray-400"
                                >
                                    <option value="">-- เลือกตำบล --</option>
                                    {filteredSubdistricts.map((s, index) => (
                                        <option key={index} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end space-x-2">
                                <button
                                    onClick={handleSearch}
                                    disabled={!subdistrict || loading}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            กำลังโหลด...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            ค้นหา
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleReset}
                                    disabled={loading}
                                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-8 border border-gray-100">
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative mb-4">
                                    <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                                <span className="text-gray-600 text-lg">กำลังโหลดข้อมูล...</span>
                                <p className="text-gray-500 text-sm mt-2">กรุณารอสักครู่</p>
                            </div>
                        </div>
                    )}


                    {/* Population Summary Card */}
                    {!loading && villages.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Male Card */}
                            <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl">
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-300"></div>

                                <div className="relative z-10 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                                            {Math.round((totalMale / totalPopulation) * 100)}%
                                        </div>
                                    </div>

                                    <span className="text-lg font-semibold text-blue-100">ประชากรชาย</span>
                                    <span className="text-3xl font-bold mt-2">{totalMale.toLocaleString()}</span>
                                    <span className="text-sm text-blue-200/90 mt-1">จาก {villages.length} หมู่บ้าน</span>

                                    <div className="mt-4 pt-2 border-t border-white/20">
                                        <div className="flex justify-between text-xs">
                                            <span>เฉลี่ยต่อหมู่บ้าน</span>
                                            <span className="font-medium">{(totalMale / villages.length).toFixed(0)} คน</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Female Card */}
                            <div className="relative bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700 text-white p-6 rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl">
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-pink-300"></div>

                                <div className="relative z-10 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                                            {Math.round((totalFemale / totalPopulation) * 100)}%
                                        </div>
                                    </div>

                                    <span className="text-lg font-semibold text-pink-100">ประชากรหญิง</span>
                                    <span className="text-3xl font-bold mt-2">{totalFemale.toLocaleString()}</span>
                                    <span className="text-sm text-pink-200/90 mt-1">จาก {villages.length} หมู่บ้าน</span>

                                    <div className="mt-4 pt-2 border-t border-white/20">
                                        <div className="flex justify-between text-xs">
                                            <span>เฉลี่ยต่อหมู่บ้าน</span>
                                            <span className="font-medium">{(totalFemale / villages.length).toFixed(0)} คน</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Card */}
                            <div className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white p-6 rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl">
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-300"></div>

                                <div className="relative z-10 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                                            100%
                                        </div>
                                    </div>

                                    <span className="text-lg font-semibold text-purple-100">ประชากรทั้งหมด</span>
                                    <span className="text-3xl font-bold mt-2">{totalPopulation.toLocaleString()}</span>
                                    <span className="text-sm text-purple-200/90 mt-1">จาก {villages.length} หมู่บ้าน</span>

                                    <div className="mt-4 pt-2 border-t border-white/20">
                                        <div className="flex justify-between text-xs">
                                            <span>เฉลี่ยต่อหมู่บ้าน</span>
                                            <span className="font-medium">{(totalPopulation / villages.length).toFixed(0)} คน</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Result Section */}
                    {!loading && villages.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-xl">
                            {/* Header Section - ปรับปรุงให้เด่นขึ้น */}
                            <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 border-b border-indigo-400">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="bg-white/20 p-3 rounded-lg mr-4 backdrop-blur-sm">
                                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">ข้อมูลประชากร {subdistrict}</h2>
                                            <p className="text-blue-100 mt-1 text-sm bg-white/10 px-2 py-1 rounded-full inline-block">แสดงข้อมูลประชากรแยกตามหมู่บ้าน</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/20 px-4 py-2 rounded-full shadow-sm mt-3 sm:mt-0 flex items-center backdrop-blur-sm border border-white/30">
                                        <span className="h-2 w-2 bg-white rounded-full mr-2 animate-pulse"></span>
                                        <span className="text-sm font-medium text-white">{villages.length} หมู่บ้าน</span>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-blue-100 to-indigo-100">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">ลำดับ</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">หมู่บ้าน</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider border-b border-gray-200">ชาย</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-pink-700 uppercase tracking-wider border-b border-gray-200">หญิง</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-green-700 uppercase tracking-wider border-b border-gray-200">รวม</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {villages.map((v, index) => {
                                            const male = Number(v.male) || 0;
                                            const female = Number(v.female) || 0;
                                            const total = male + female;
                                            return (
                                                <tr key={index} className="hover:bg-blue-50 transition duration-150 group">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{index + 1}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        <div className="flex items-center">
                                                            <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 group-hover:bg-blue-600 transition-colors"></div>
                                                            {v.village_name || 'ไม่ระบุ'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-blue-600 font-medium">{male.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right text-pink-600 font-medium">{female.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right text-green-700 font-medium">{total.toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-semibold bg-blue-50">
                                            <td colSpan="2" className="px-6 py-4 text-right text-sm text-gray-700 border-t border-gray-200">รวมทั้งหมด</td>
                                            <td className="px-6 py-4 text-right text-blue-700 border-t border-gray-200">{totalMale.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-pink-700 border-t border-gray-200">{totalFemale.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-green-700 border-t border-gray-200">{totalPopulation.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-t border-gray-200">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="flex items-center">
                                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-600">ประชากรชายทั้งหมด</p>
                                            <p className="text-xl font-bold text-blue-800">{totalMale.toLocaleString()} คน</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                                    <div className="flex items-center">
                                        <div className="bg-pink-100 p-2 rounded-lg mr-3">
                                            <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-pink-600">ประชากรหญิงทั้งหมด</p>
                                            <p className="text-xl font-bold text-pink-800">{totalFemale.toLocaleString()} คน</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <div className="flex items-center">
                                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-green-600">ประชากรทั้งหมด</p>
                                            <p className="text-xl font-bold text-green-800">{totalPopulation.toLocaleString()} คน</p>
                                        </div>
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

export default CommunityPage;
