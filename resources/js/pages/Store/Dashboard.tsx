import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import RightSide from './ComponentStore/RightSide';
import MiddleSide from './ComponentStore/MiddleSide';
import BottomSide from './ComponentStore/BottomSide';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/DashboardStore',
    },
];

// ประเภทของช่วงเวลา
type TimeRange = 'month' | 'quarter' | 'year' | 'all' | 'custom';

export default function Dashboard() {
    const [timeRange, setTimeRange] = useState<TimeRange>('month');
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [dateMode, setDateMode] = useState<'single' | 'range'>('single');
    const [withdrawalData, setWithdrawalData] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
    });
    const [loading, setLoading] = useState(true);

    // 🔥 เพิ่มฟังก์ชัน normalizeDate ที่ขาดไป
    const normalizeDate = (date: Date | string | null): string | null => {
        if (!date) return null;

        try {
            const dateObj = date instanceof Date ? date : new Date(date);

            if (isNaN(dateObj.getTime())) {
                console.error('❌ Invalid date:', date);
                return null;
            }

            // แปลงเป็นรูปแบบ YYYY-MM-DD
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('❌ Error normalizing date:', error);
            return null;
        }
    };

    // ฟังก์ชันดึงข้อมูลตามช่วงเวลา
    const fetchWithdrawalData = async (
        range: TimeRange,
        customDate?: Date | string | [Date | string | null, Date | string | null]
    ) => {
        const startTime = performance.now();
        try {
            setLoading(true);

            let url = `/StoreOrder/Withdrawal?range=${range}`;

            if (range === 'custom' && customDate) {
                if (dateMode === 'single') {
                    const normalized = normalizeDate(
                        customDate instanceof Date ? customDate : (customDate as string)
                    );
                    if (normalized) {
                        url += `&date=${normalized}`;
                        console.log('📅 Single date selected:', normalized);
                    }
                } else if (dateMode === 'range' && Array.isArray(customDate)) {
                    const [start, end] = customDate;
                    const startStr = normalizeDate(start ?? null);
                    const endStr = normalizeDate(end ?? null);
                    if (startStr && endStr) {
                        url += `&startDate=${startStr}&endDate=${endStr}`;
                        console.log('📅 Date range selected:', startStr, 'to', endStr);
                    }
                }
            }

            console.log('🔄 Fetching withdrawal data from:', url);

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            console.log('📊 API Response:', data);

            if (data.success) {
                setWithdrawalData({
                    pending: Number(data.pending) || 0,
                    approved: Number(data.approved) || 0,
                    rejected: Number(data.rejected) || 0,
                });
                console.log('✅ Withdrawal data updated:', {
                    pending: data.pending,
                    approved: data.approved,
                    rejected: data.rejected,
                    total: data.total,
                });
            } else {
                throw new Error(data.message || 'API returned error');
            }
        } catch (error) {
            console.error('❌ Error fetching withdrawal data:', error);
            setWithdrawalData({ pending: 0, approved: 0, rejected: 0 });
        } finally {
            setLoading(false);
            const endTime = performance.now();
            console.log(`⏱ Fetch took ${(endTime - startTime).toFixed(2)} ms`);
        }
    };

    // ดึงข้อมูลคำขอเบิกเมื่อ component โหลดหรือช่วงเวลาเปลี่ยน
    useEffect(() => {
        console.log('🎯 useEffect triggered - timeRange:', timeRange, 'dateMode:', dateMode);
        fetchWithdrawalData(timeRange);
    }, [timeRange, dateMode]);

    // ฟังก์ชันจัดการการเลือกวันที่เดียว
    const handleDateChange = (date: Date | null) => {
        console.log('🗓️ Single date changed:', date?.toLocaleDateString('th-TH'));
        setSelectedDate(date);
        setTimeRange('custom');
        if (date) {
            fetchWithdrawalData('custom', date);
        } else {
            // ถ้าเคลียร์วันที่ ให้กลับไปใช้เดือนนี้
            setTimeRange('month');
            fetchWithdrawalData('month');
        }
    };

    // ฟังก์ชันจัดการการเลือกช่วงวันที่
    const handleRangeChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        console.log('🗓️ Date range changed (raw):',
            start?.toLocaleDateString('th-TH'),
            'to',
            end?.toLocaleDateString('th-TH')
        );
        setDateRange([start, end]);

        if (start && end) {
            setTimeRange('custom');

            // ใช้ end date เดิมแต่ตั้งเวลาเป็น 23:59:59
            const endOfDay = new Date(end);
            endOfDay.setHours(23, 59, 59, 999);

            console.log('🗓️ Date range for API:',
                start.toISOString().split('T')[0],
                'to',
                endOfDay.toISOString().split('T')[0]
            );

            fetchWithdrawalData('custom', [start, endOfDay]);
        } else if (!start && !end) {
            // ถ้าเคลียร์ช่วงวันที่ ให้กลับไปใช้เดือนนี้
            setTimeRange('month');
            fetchWithdrawalData('month');
        }
    };

    // ฟังก์ชันจัดการการเปลี่ยนช่วงเวลาล่วงหน้า
    const handlePresetRangeChange = (range: TimeRange) => {
        console.log('🎯 Changing to preset range:', range);

        // รีเซ็ตวันที่เมื่อเลือกช่วงเวลาล่วงหน้า
        setSelectedDate(null);
        setDateRange([null, null]);
        setDateMode('single');
        setTimeRange(range);

        console.log('✅ Preset range changed to:', range);
    };

    // ฟังก์ชันจัดการการเปลี่ยนโหมดวันที่
    const handleDateModeChange = (mode: 'single' | 'range') => {
        console.log('🔄 Changing date mode to:', mode);
        setDateMode(mode);

        // รีเซ็ตวันที่เมื่อเปลี่ยนโหมด
        if (mode === 'single') {
            setDateRange([null, null]);
            setSelectedDate(new Date());
        } else {
            setSelectedDate(null);
            const today = new Date();
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(today.getDate() - 7);
            setDateRange([oneWeekAgo, today]);
        }

        // เปลี่ยนเป็นโหมด custom เมื่อเลือกโหมดวันที่
        setTimeRange('custom');
    };

    // Sample data for internal order system - อัพเดทด้วยข้อมูลจริงจาก API
    const internalOrderData = {
        totalRequests: withdrawalData.pending + withdrawalData.approved + withdrawalData.rejected,
        pendingApproval: withdrawalData.pending,
        approvedThisMonth: withdrawalData.approved,
        rejectedThisMonth: withdrawalData.rejected,
        totalItemsIssued: 2450,
        avgProcessingTime: '2.3 วัน',
        costSavings: 125000
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard ระบบเบิกสินค้าภายใน" />
                <div className="flex h-full flex-1 flex-col gap-8 p-8 overflow-x-auto bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/5 font-anuphan">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard ระบบเบิกสินค้าภายใน" />
            <div className="flex h-full flex-1 flex-col gap-8 p-8 overflow-x-auto bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/5 font-anuphan">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent dark:from-blue-300 dark:to-cyan-200">
                            ระบบเบิกสินค้าภายในบริษัท
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            จัดการการขอเบิกสินค้าและวัสดุภายในองค์กร
                        </p>
                    </div>
                    <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                        <div className="flex items-center space-x-2">
                            {/* ปุ่มเลือกช่วงเวลาล่วงหน้า */}
                            <div className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-1">
                                <button
                                    onClick={() => handlePresetRangeChange('month')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${timeRange === 'month' && dateMode === 'single'
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    เดือนนี้
                                </button>
                                <button
                                    onClick={() => handlePresetRangeChange('quarter')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${timeRange === 'quarter'
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    ไตรมาสนี้
                                </button>
                                <button
                                    onClick={() => handlePresetRangeChange('year')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${timeRange === 'year'
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    ปีนี้
                                </button>
                                <button
                                    onClick={() => handlePresetRangeChange('all')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${timeRange === 'all'
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    ทั้งหมด
                                </button>
                            </div>

                            {/* ปุ่มเลือกโหมดวันที่ */}
                            <div className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-1">
                                <button
                                    onClick={() => handleDateModeChange('single')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${dateMode === 'single'
                                        ? 'bg-green-500 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    วันเดียว
                                </button>
                                <button
                                    onClick={() => handleDateModeChange('range')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${dateMode === 'range'
                                        ? 'bg-green-500 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    ช่วงวันที่
                                </button>
                            </div>
                        </div>

                        {/* Date Picker */}
                        <div className="relative group">
                            {dateMode === 'single' ? (
                                <DatePicker
                                    selected={selectedDate}
                                    onChange={handleDateChange}
                                    dateFormat="dd/MM/yyyy"
                                    className="appearance-none bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-3 pr-10 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:bg-white dark:hover:bg-gray-800 w-48 font-anuphan"
                                    placeholderText="เลือกวันที่"
                                    isClearable
                                    clearButtonClassName="text-gray-500 hover:text-red-500"
                                />
                            ) : (
                                <DatePicker
                                    selectsRange
                                    startDate={dateRange[0]}
                                    endDate={dateRange[1]}
                                    onChange={handleRangeChange}
                                    dateFormat="dd/MM/yyyy"
                                    className="appearance-none bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-3 pr-10 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:bg-white dark:hover:bg-gray-800 w-64 font-anuphan"
                                    placeholderText="เลือกช่วงวันที่"
                                    isClearable
                                    clearButtonClassName="text-gray-500 hover:text-red-500"
                                />
                            )}
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid - แสดงข้อมูลตาม API Withdrawal() */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            title: 'คำขอเบิกทั้งหมด',
                            value: internalOrderData.totalRequests,
                            change: '+15.2%',
                            icon: (
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            ),
                            gradient: 'from-blue-500 to-blue-600',
                            textGradient: 'from-blue-700 to-cyan-600'
                        },
                        {
                            title: 'รอการอนุมัติ',
                            value: internalOrderData.pendingApproval,
                            change: 'ต้องตรวจสอบ',
                            icon: (
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ),
                            gradient: 'from-amber-500 to-amber-600',
                            textGradient: 'from-amber-700 to-orange-600'
                        },
                        {
                            title: 'อนุมัติแล้ว',
                            value: internalOrderData.approvedThisMonth,
                            change: '+8.7%',
                            icon: (
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ),
                            gradient: 'from-green-500 to-green-600',
                            textGradient: 'from-green-700 to-emerald-600'
                        },
                        {
                            title: 'คำขอถูกปฏิเสธ',
                            value: internalOrderData.rejectedThisMonth,
                            change: '-5.2%',
                            icon: (
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ),
                            gradient: 'from-red-500 to-red-600',
                            textGradient: 'from-red-700 to-pink-600'
                        }
                    ].map((stat, index) => (
                        <div key={index} className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            {/* Hover Background Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient}/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="space-y-3">
                                    {/* Title */}
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {stat.title}
                                    </p>

                                    {/* Value with Gradient Text */}
                                    <p className={`text-3xl font-bold bg-gradient-to-r ${stat.textGradient} bg-clip-text text-transparent`}>
                                        {stat.value}
                                    </p>

                                    {/* Change Badge */}
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stat.change.includes('+')
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : stat.change.includes('-')
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                : stat.change.includes('ต้อง')
                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                            }`}>
                                            {stat.change.includes('+') && (
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M7 14l5-5 5 5z" />
                                                </svg>
                                            )}
                                            {stat.change.includes('-') && (
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M7 10l5 5 5-5z" />
                                                </svg>
                                            )}
                                            {stat.change}
                                        </span>

                                        {/* Optional Text */}
                                        {(stat.change.includes('+') || stat.change.includes('-')) && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">จากเดือนที่แล้ว</span>
                                        )}
                                    </div>
                                </div>

                                {/* Icon */}
                                <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column - Product Usage & Analytics */}
                    <div className="xl:col-span-2 space-y-8">
                        <MiddleSide
                            timeRange={timeRange}
                            selectedDate={selectedDate}
                            dateRange={dateRange}
                            dateMode={dateMode}
                        />
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-8">
                        <RightSide
                            timeRange={timeRange}
                            selectedDate={selectedDate}
                            dateRange={dateRange}
                            dateMode={dateMode}
                        />
                    </div>
                </div>

                {/* Department Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <BottomSide
                        timeRange={timeRange}
                        selectedDate={selectedDate}
                        dateRange={dateRange}
                        dateMode={dateMode}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
