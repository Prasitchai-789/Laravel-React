import ChemicalUsageChart from '@/components/ChemicalUsageChart';
import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { BarChart2, BarChart3, Calendar, ChevronLeft, ChevronRight, Download, Eye, FileText, PieChart } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import MonthlyDetail from './MonthlyDetail';
import { debounce } from 'lodash';

// เปลี่ยน props เพื่อรับข้อมูลเดือนและปีปัจจุบันจาก backend
export default function MonthlyChemicals({
    records = [],
    filters,
    months,
    years,
    currentMonth,
    currentYear
}) {
    const [selectedMonth, setSelectedMonth] = useState(filters?.month || currentMonth);
    const [selectedYear, setSelectedYear] = useState(filters?.year || currentYear);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isModalOpen, setIsOpen] = useState(false);
    const [selectedDateRecords, setSelectedDateRecords] = useState([]);
    const [activeTab, setActiveTab] = useState('table');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const chemicalNames = ['ดินขาว', 'Fogon 3000', 'Hexon 4000', 'Sumalchlor 50', 'PROXITANE', 'Polymer', 'Soda Ash', 'Salt'];
    const monthOrder = [
        "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"
    ];

    const orderedMonths = monthOrder;

    // กำหนดสีสำหรับแต่ละสารเคมี
    const chemicalColors = {
        ดินขาว: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', chart: 'rgba(245, 158, 11, 0.7)' },
        'Fogon 3000': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', chart: 'rgba(59, 130, 246, 0.7)' },
        'Hexon 4000': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', chart: 'rgba(99, 102, 241, 0.7)' },
        'Sumalchlor 50': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', chart: 'rgba(34, 197, 94, 0.7)' },
        PROXITANE: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', chart: 'rgba(239, 68, 68, 0.7)' },
        Polymer: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', chart: 'rgba(236, 72, 153, 0.7)' },
        'Soda Ash': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', chart: 'rgba(6, 182, 212, 0.7)' },
        Salt: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', chart: 'rgba(13, 148, 136, 0.7)' },
    };

    // ✅ ฟังก์ชันจัดรูปแบบตัวเลขแสดงทศนิยม 2 ตำแหน่ง
    const formatNumber = (num: number) => {
        if (num === 0) return '0';
        return Number(num).toFixed(2);
    };

    // ฟังก์ชันแสดงไอคอนสำหรับแต่ละสารเคมี
    const getChemicalIcon = (chemicalName: string) => {
        const icons = {
            ดินขาว: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-amber-600">
                    <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                    <path
                        fillRule="evenodd"
                        d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
            'Fogon 3000': (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-blue-600">
                    <path d="M5.507 4.048A3 3 0 017.785 3h8.43a3 3 0 012.278 1.048l1.722 2.008A4.533 4.533 0 0019.5 6h-15c-.243 0-.482.02-.715.056l1.722-2.008z" />
                    <path
                        fillRule="evenodd"
                        d="M1.5 10.5a3 3 0 013-3h15a3 3 0 110 6h-15a3 3 0 01-3-3zm15 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm2.25.75a.75.75 0 100-1.5.75.75 0 000 1.5zM4.5 15a3 3 0 100 6h15a3 3 0 100-6h-15zm11.25 3.75a.75.75 0 100-1.5.75.75 0 000 1.5zM19.5 18a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
            'Hexon 4000': (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-indigo-600">
                    <path
                        fillRule="evenodd"
                        d="M10.5 3.798v5.02a3 3 0 01-.879 2.121l-2.377 2.377a9.845 9.845 0 015.091 1.013 8.315 8.315 0 005.713.636l.285-.071-3.954-3.955a3 3 0 01-.879-2.121v-5.02a23.614 23.614 0 00-3 0zm4.5.138a.75.75 0 00.093-1.495A24.837 24.837 0 0012 2.25a25.048 25.048 0 00-3.093.191A.75.75 0 009 3.936v4.882a1.5 1.5 0 01-.44 1.06l-6.293 6.294c-1.62 1.621-.903 4.475 1.471 4.88 2.686.46 5.447.698 8.262.698 2.816 0 5.576-.239 8.262-.697 2.373-.406 3.092-3.26 1.47-4.88L15.44 9.879A1.5 1.5 0 0115 8.818V4.064z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
            'Sumalchlor 50': (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-green-600">
                    <path
                        fillRule="evenodd"
                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 00-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 01-.189-.866c0-.298.059-.605.189-.866zm-4.34 7.964a.75.75 0 01-1.061-1.06 5.236 5.236 0 013.73-1.538 5.236 5.236 0 013.695 1.538.75.75 0 11-1.061 1.06 3.736 3.736 0 00-2.639-1.098 3.736 3.736 0 00-2.664 1.098z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
            PROXITANE: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-red-600">
                    <path
                        fillRule="evenodd"
                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-3 10.5a3 3 0 116 0 3 3 0 01-6 0z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
            Polymer: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-pink-600">
                    <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 019.75 8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
                </svg>
            ),
            'Soda Ash': (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-cyan-600">
                    <path
                        fillRule="evenodd"
                        d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
            Salt: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-teal-600">
                    <path
                        fillRule="evenodd"
                        d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5zm8.25-3.75a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
        };

        return icons[chemicalName] || <BarChart3 className="h-4 w-4" />;
    };

    // ฟังก์ชันดึงเดือนและปีจากวันที่
    const getMonthYearFromDate = (dateString: string) => {
        if (!dateString) return { month: '', year: '' };
        
        // ตรวจสอบรูปแบบวันที่
        if (dateString.includes('/')) {
            // รูปแบบ DD/MM/YYYY
            const [day, month, year] = dateString.split('/');
            return { month, year };
        } else if (dateString.includes('-')) {
            // รูปแบบ YYYY-MM-DD
            const [year, month, day] = dateString.split('-');
            return { month, year };
        }
        return { month: '', year: '' };
    };

    const paddedMonth = String(selectedMonth).padStart(2, "0");

    // แก้ไขการกรองข้อมูลให้ถูกต้อง
    const filteredRecords = records.filter((r) => {
        if (!r.date) return false;
        const { month, year } = getMonthYearFromDate(r.date);
        return month === paddedMonth && year === selectedYear;
    });

    // ฟังก์ชันเปลี่ยนเดือน/ปี - ใช้ Inertia router
    const updateFilters = useCallback(
        debounce(() => {
            router.get('/monthly', { month: selectedMonth, year: selectedYear }, {
                preserveState: true,
                replace: true,
                only: ['records', 'filters']
            });
        }, 300),
        [selectedMonth, selectedYear]
    );

    // อัปเดตข้อมูลเมื่อเดือนหรือปีเปลี่ยนแปลง
    useEffect(() => {
        updateFilters();
        return () => updateFilters.cancel();
    }, [selectedMonth, selectedYear, updateFilters]);

    const handleView = (date: string) => {
        const dayRecords = filteredRecords
            .filter((r) => r.date === date)
            .flatMap((r) =>
                r.records.map((item) => ({
                    ...item,
                    shift: r.shift,
                    date: r.date,
                })),
            );

        setSelectedDate(date);
        setSelectedDateRecords(dayRecords);
        setIsOpen(true);
    };

    // ฟังก์ชันสำหรับ Export Excel - เพิ่มปี
    const exportToExcel = () => {
        window.open(`/monthly/export-excel?month=${selectedMonth}&year=${selectedYear}`, '_blank');
    };

    // ฟังก์ชันสำหรับ Export PDF - เพิ่มปี
    const exportToPdf = () => {
        window.open(`/monthly/export-pdf?month=${selectedMonth}&year=${selectedYear}`, '_blank');
    };

    const dailyTotals = filteredRecords.reduce(
        (acc, group) => {
            if (!group.date) return acc;

            if (!acc[group.date]) {
                acc[group.date] = chemicalNames.reduce(
                    (o, name) => {
                        o[name] = 0;
                        return o;
                    },
                    {} as Record<string, number>,
                );
            }

            group.records.forEach((r) => {
                if (acc[group.date][r.chemical_name] !== undefined) {
                    acc[group.date][r.chemical_name] += r.quantity ?? 0;
                }
            });

            return acc;
        },
        {} as Record<string, Record<string, number>>,
    );

    const dailyArray = Object.entries(dailyTotals).map(([date, totals]) => ({
        date,
        totals,
    }));

    const getDayFromDate = (dateString: string) => {
        if (!dateString) return '';

        // กรณี 2025-08-23
        if (dateString.includes('-')) {
            return dateString.split('-')[2];
        }

        // กรณี 23/08/2025
        if (dateString.includes('/')) {
            return dateString.split('/')[0];
        }

        return dateString;
    };

    // คำนวณข้อมูลสำหรับกราฟ
    const chartData = useMemo(() => {
        // กราฟแท่ง: สรุปการใช้สารเคมีรายวัน
        const barChartData = {
            labels: dailyArray.map((item) => getDayFromDate(item.date)),
            datasets: chemicalNames.map((name) => ({
                label: name,
                data: dailyArray.map((item) => item.totals[name] || 0),
                backgroundColor: chemicalColors[name].chart,
                borderColor: chemicalColors[name].chart.replace('0.7', '1'),
                borderWidth: 1,
            })),
        };

        // กราฟวงกลม: สัดส่วนการใช้สารเคมีทั้งหมดในเดือน
        const monthlyTotals = chemicalNames.reduce(
            (acc, name) => {
                acc[name] = dailyArray.reduce((sum, day) => sum + (day.totals[name] || 0), 0);
                return acc;
            },
            {} as Record<string, number>,
        );

        const doughnutChartData = {
            labels: chemicalNames,
            datasets: [
                {
                    data: chemicalNames.map((name) => monthlyTotals[name]),
                    backgroundColor: chemicalNames.map((name) => chemicalColors[name].chart),
                    borderColor: chemicalNames.map((name) => chemicalColors[name].chart.replace('0.7', '1')),
                    borderWidth: 1,
                },
            ],
        };

        // กราฟเส้น: แสดงแนวโน้มการใช้สารเคมีรายวัน
        const lineChartData = {
            labels: dailyArray.map((item) => getDayFromDate(item.date)),
            datasets: chemicalNames.map((name) => ({
                label: name,
                data: dailyArray.map((item) => item.totals[name] || 0),
                borderColor: chemicalColors[name].chart,
                backgroundColor: chemicalColors[name].chart.replace('0.7', '0.1'),
                tension: 0.3,
                fill: true,
            })),
        };

        return { barChartData, doughnutChartData, lineChartData, monthlyTotals };
    }, [dailyArray, chemicalNames]);

    // ฟังก์ชันแปลงเดือนเป็นภาษาไทย
    const getMonthName = (month: string) => {
        const months = [
            'มกราคม',
            'กุมภาพันธ์',
            'มีนาคม',
            'เมษายน',
            'พฤษภาคม',
            'มิถุนายน',
            'กรกฎาคม',
            'สิงหาคม',
            'กันยายน',
            'ตุลาคม',
            'พฤศจิกายน',
            'ธันวาคม',
        ];
        return months[parseInt(month) - 1] || month;
    };

    // Pagination logic
    const totalPages = Math.ceil(dailyArray.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = dailyArray.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber: number) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // Reset to first page when month or year changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedMonth, selectedYear]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'หน้าหลัก', href: route('dashboard') },
                { title: 'รายงานการใช้สารเคมีรายวัน', href: '/chemical' },
                { title: 'รายงานการใช้สารเคมีรายเดือน', href: '/monthly' },
            ]}
        >
            <Head title="Monthly Chemicals Report" />

            {/* กำหนดฟอนต์ Anuphon ใน style tag */}
            <style>{`
        @font-face {
          font-family: 'Anuphon';
          src: url('/fonts/anuphon/Anuphon-Regular.woff2') format('woff2'),
               url('/fonts/anuphon/Anuphon-Regular.woff') format('woff');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Anuphon';
          src: url('/fonts/anuphon/Anuphon-Bold.woff2') format('woff2'),
               url('/fonts/anuphon/Anuphon-Bold.woff') format('woff');
          font-weight: bold;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Anuphon';
          src: url('/fonts/anuphon/Anuphon-Italic.woff2') format('woff2'),
               url('/fonts/anuphon/Anuphon-Italic.woff') format('woff');
          font-weight: normal;
          font-style: italic;
          font-display: swap;
        }

        .font-anuphon {
          font-family: 'Anuphon', 'Sukhumvit Set', 'Kanit', sans-serif;
        }
      `}</style>

            <div className="font-anuphon rounded-xl bg-white p-6">
                <div className="mb-6">
                    <Link
                        href={route('chemical.index')}
                        className="inline-flex items-center justify-center rounded-lg bg-gray-400 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:scale-105 hover:from-green-600 hover:to-green-700"
                    >
                        กลับไปหน้าแรก
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-2">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">รายงานการใช้สารเคมีรายเดือน</h2>
                            <p className="mt-1 text-sm text-gray-500">ข้อมูลสรุปการใช้สารเคมีแยกตามวันและประเภท</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-stretch gap-4 md:flex-row">
                        {/* ส่วนเลือกเดือนและปี */}
                        <div className="flex flex-grow items-center gap-3">
                            <div className="flex flex-grow items-center space-x-2 rounded-lg border border-blue-200 bg-blue-50 p-1.5 px-2">
                                <Calendar className="h-3 w-3 flex-shrink-0 text-blue-600" />
                                <select
                                    value={selectedMonth.padStart(2, "0")}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="h-full w-full rounded-md border-0 bg-transparent px-3 text-base font-medium text-blue-700"
                                >
                                    {orderedMonths.map((value) => (
                                        <option key={value} value={value}>
                                            {months[value]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-grow items-center space-x-2 rounded-lg border border-blue-200 bg-blue-50 p-1.5 px-2">
                                <Calendar className="h-3 w-3 flex-shrink-0 text-blue-600" />
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="h-full w-full rounded-md border-0 bg-transparent px-3 text-base font-medium text-blue-700"
                                >
                                    {(years || []).map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* ปุ่ม Export */}
                        <div className="flex items-stretch gap-3">
                            <button
                                onClick={exportToExcel}
                                className="flex flex-grow items-center justify-center gap-2 rounded-lg bg-green-600 px-5 text-base font-medium text-white shadow-sm transition-all hover:scale-105 hover:cursor-pointer hover:bg-green-700 hover:shadow-md md:flex-grow-0"
                            >
                                <Download className="h-3 w-3" />
                                <span>Excel</span>
                            </button>

                            <button
                                onClick={exportToPdf}
                                className="flex flex-grow items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-base font-medium text-white shadow-sm transition-all hover:scale-105 hover:cursor-pointer hover:bg-red-700 hover:shadow-md md:flex-grow-0"
                            >
                                <FileText className="h-3 w-3" />
                                <span>PDF</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="mb-6 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                            <span className="text-sm font-medium text-gray-700">เดือน:</span>
                            <span className="text-sm font-semibold text-blue-700">{getMonthName(selectedMonth)} {selectedYear}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <span className="text-sm font-medium text-gray-700">จำนวนวันที่มีข้อมูล:</span>
                            <span className="text-sm font-semibold text-green-700">{dailyArray.length} วัน</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                            <span className="text-sm font-medium text-gray-700">สารเคมีการใช้มากที่สุด:</span>
                            <span className="text-sm font-semibold text-purple-700">
                                {Object.entries(chartData.monthlyTotals).reduce((max, [name, value]) => (value > max.value ? { name, value } : max), {
                                    name: '',
                                    value: 0,
                                }).name || 'ไม่มีข้อมูล'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs for switching between table and charts */}
                <div className="mb-6 flex border-b border-gray-200">
                    <button
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium hover:scale-105 hover:cursor-pointer ${activeTab === 'table' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('table')}
                    >
                        <BarChart2 className="h-4 w-4" />
                        ดูแบบตาราง
                    </button>
                    <button
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium hover:scale-105 hover:cursor-pointer ${activeTab === 'charts' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('charts')}
                    >
                        <PieChart className="h-4 w-4" />
                        ดูแบบกราฟ
                    </button>
                </div>

                {/* Conditional rendering based on active tab */}
                {activeTab === 'table' ? (
                    /* Table View */
                    <div>
                        <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 shadow-xs">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="w-32 px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                                            <div className="flex flex-col items-center justify-center">
                                                <Calendar className="h-5 w-5" />
                                                <span className="mt-2.5 text-xs">วันที่</span>
                                                <span className="mt-2 text-xs"></span>
                                            </div>
                                        </th>
                                        {chemicalNames.map((name, i) => (
                                            <th
                                                key={i}
                                                className="w-24 px-4 py-4 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase"
                                            >
                                                <div className="flex flex-col items-center justify-center">
                                                    <div
                                                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${chemicalColors[name].bg} ${chemicalColors[name].border} mb-1`}
                                                    >
                                                        {getChemicalIcon(name)}
                                                    </div>
                                                    <span className="text-xs">{name}</span>
                                                    <span className="mt-1 text-[10px] text-gray-400">(กก.)</span>
                                                </div>
                                            </th>
                                        ))}
                                        <th className="w-20 px-4 py-4 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase">
                                            <div className="flex flex-col items-center justify-center">
                                                <Eye className="h-5 w-5" />
                                                <span className="mt-2.5 text-xs">การดำเนินการ</span>
                                                <span className="mt-2 text-xs"></span>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {currentItems.length > 0 ? (
                                        currentItems.map((group, idx) => (
                                            <tr key={idx} className="transition-colors duration-150 hover:bg-blue-50/30">
                                                <td className="px-6 py-4 text-sm font-semibold whitespace-nowrap text-gray-900">{group.date}</td>
                                                {chemicalNames.map((name, i) => {
                                                    const quantity = group.totals[name] || 0;
                                                    const colorClass = chemicalColors[name];
                                                    return (
                                                        <td key={i} className="px-4 py-4 text-center text-sm whitespace-nowrap">
                                                            <span
                                                                className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-lg border px-2 py-1 text-xs font-medium ${colorClass.bg} ${colorClass.text} ${colorClass.border} ${quantity > 0 ? 'opacity-100' : 'opacity-50'}`}
                                                            >
                                                                {quantity > 0 ? formatNumber(quantity) : '-'}
                                                            </span>
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-4 text-sm whitespace-nowrap">
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={() => handleView(group.date)}
                                                            className="flex items-center gap-1.5 rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors duration-200 hover:scale-105 hover:cursor-pointer hover:bg-blue-200"
                                                        >
                                                            <Eye size={14} />
                                                            ดูรายละเอียด
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={chemicalNames.length + 2} className="px-4 py-8 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <Calendar className="mb-2 h-12 w-12 opacity-50" />
                                                    <p className="text-sm">ไม่มีข้อมูลสำหรับเดือน {getMonthName(selectedMonth)} {selectedYear}</p>
                                                    <p className="mt-1 text-xs">กรุณาเลือกเดือนอื่นหรือเพิ่มข้อมูลใหม่</p>
                                                    {/* แสดงข้อมูลที่มีอยู่เพื่อ debug */}
                                                    <div className="mt-2 text-xs">
                                                        <p>เดือนที่มีข้อมูล: {[...new Set(records.map(r => {
                                                            if (!r.date) return '';
                                                            const { month, year } = getMonthYearFromDate(r.date);
                                                            return `${getMonthName(month)} ${year}`;
                                                        }).filter(Boolean))].join(', ')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {dailyArray.length > 0 && (
                            <div className="flex flex-col items-center justify-between rounded-lg border-t border-gray-200 bg-white px-4 py-3 shadow-xs sm:flex-row">
                                <div className="mb-4 flex items-center sm:mb-0">
                                    <span className="mr-2 text-sm text-gray-700">แสดง</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="rounded-md border border-gray-300 px-2 py-1 text-sm hover:cursor-pointer"
                                    >
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                    </select>
                                    <span className="ml-2 text-sm text-gray-700">รายการต่อหน้า</span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-700">
                                        หน้า {currentPage} จาก {totalPages}
                                    </span>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => paginate(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`rounded-md px-1 py-1 text-sm ${currentPage === 1 ? 'cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => paginate(page)}
                                                className={`rounded-md px-3 py-1 text-sm ${currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => paginate(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`rounded-md px-1 py-1 text-sm ${currentPage === totalPages ? 'cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Charts View */
                    <div className="space-y-6">
                        {/* ส่วนสรุปข้อมูล */}
                        <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-800">
                                <BarChart3 className="h-5 w-5" />
                                สรุปข้อมูลการใช้สารเคมีเดือน {getMonthName(selectedMonth)} {selectedYear}
                            </h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="text-sm text-gray-500">จำนวนวันที่บันทึกข้อมูล</div>
                                    <div className="mt-1 text-2xl font-bold text-blue-600">{dailyArray.length} วัน</div>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="text-sm text-gray-500">สารเคมีการใช้มากที่สุด</div>
                                    <div className="mt-1 text-xl font-bold text-purple-600">
                                        {
                                            Object.entries(chartData.monthlyTotals).reduce(
                                                (max, [name, value]) => (value > max.value ? { name, value } : max),
                                                { name: 'ไม่มีข้อมูล', value: 0 },
                                            ).name
                                        }
                                    </div>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="text-sm text-gray-500">ปริมาณการใช้ทั้งหมด</div>
                                    <div className="mt-1 text-2xl font-bold text-green-600">
                                        {formatNumber(Object.values(chartData.monthlyTotals).reduce((sum, val) => sum + val, 0))} กก.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="rounded-lg bg-white p-4 shadow-md">
                                <ChemicalUsageChart
                                    data={chartData.barChartData}
                                    type="bar"
                                    title={`การใช้สารเคมีรายวัน - ${getMonthName(selectedMonth)} ${selectedYear}`}
                                />
                                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                                    <p className="mb-2 font-medium">คำอธิบายกราฟแท่ง:</p>
                                    <ul className="list-inside list-disc space-y-1">
                                        <li>แสดงปริมาณการใช้สารเคมีแต่ละประเภทแยกตามวัน</li>
                                        <li>แกน X: วันที่ของเดือน</li>
                                        <li>แกน Y: ปริมาณการใช้ (กิโลกรัม)</li>
                                        <li>สีของแต่ละแท่งแทนสารเคมีประเภทต่าง ๆ</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="rounded-lg bg-white p-4 shadow-md">
                                <ChemicalUsageChart
                                    data={chartData.doughnutChartData}
                                    type="doughnut"
                                    title={`สัดส่วนการใช้สารเคมี - ${getMonthName(selectedMonth)} ${selectedYear}`}
                                />
                                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                                    <p className="mb-2 font-medium">คำอธิบายกราฟวงกลม:</p>
                                    <ul className="list-inside list-disc space-y-1">
                                        <li>แสดงสัดส่วนการใช้งานของสารเคมีแต่ละประเภท</li>
                                        <li>ขนาดของแต่ละส่วนแสดงปริมาณการใช้สัมพัทธ์</li>
                                        <li>ช่วยระบุสารเคมีที่ใช้มากที่สุดในภาพรวม</li>
                                        <li>ข้อมูลเป็นเปอร์เซ็นต์โดยประมาณจากการคำนวณ</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg bg-white p-4 shadow-md">
                            <ChemicalUsageChart
                                data={chartData.lineChartData}
                                type="line"
                                title={`แนวโน้มการใช้สารเคมีรายวัน - ${getMonthName(selectedMonth)} ${selectedYear}`}
                            />
                            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                                <p className="mb-2 font-medium">คำอธิบายกราฟเส้น:</p>
                                <ul className="list-inside list-disc space-y-1">
                                    <li>แสดงแนวโน้มการใช้งานสารเคมีแต่ละประเภทตลอดทั้งเดือน</li>
                                    <li>แกน X: วันที่ของเดือน</li>
                                    <li>แกน Y: ปริมาณการใช้ (กิโลกรัม)</li>
                                    <li>เส้นแต่ละสีแทนสารเคมีประเภทต่าง ๆ</li>
                                    <li>ช่วยในการวิเคราะห์รูปแบบและแนวโน้มการใช้งาน</li>
                                </ul>
                            </div>
                        </div>

                        {/* Chemical Usage Summary */}
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-800">
                                <FileText className="h-5 w-5" />
                                รายงานสรุปการใช้สารเคมีรายเดือน
                            </h3>

                            <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                                <h4 className="mb-3 text-lg font-semibold text-gray-700">ข้อมูลสรุป</h4>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    {chemicalNames.map((name) => (
                                        <div
                                            key={name}
                                            className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-xs"
                                        >
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className={`rounded-full p-1 ${chemicalColors[name].bg}`}>{getChemicalIcon(name)}</div>
                                                <div className="text-sm font-medium text-gray-700">{name}</div>
                                            </div>
                                            <div
                                                className="mt-1 text-center text-2xl font-bold"
                                                style={{ color: chemicalColors[name].chart.replace('0.7', '1') }}
                                            >
                                                {formatNumber(chartData.monthlyTotals[name])}
                                            </div>
                                            <div className="mt-1 text-center text-xs text-gray-500">กิโลกรัม</div>

                                            {/* เปอร์เซ็นต์การใช้งาน */}
                                            {Object.values(chartData.monthlyTotals).reduce((sum, val) => sum + val, 0) > 0 && (
                                                <div className="mt-2">
                                                    <div className="h-1.5 w-full rounded-full bg-gray-200">
                                                        <div
                                                            className={`h-1.5 rounded-full`}
                                                            style={{
                                                                width: `${(chartData.monthlyTotals[name] / Object.values(chartData.monthlyTotals).reduce((sum, val) => sum + val, 0)) * 100}%`,
                                                                backgroundColor: chemicalColors[name].chart.replace('0.7', '1'),
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className="mt-1 text-right text-xs text-gray-500">
                                                        {(
                                                            (chartData.monthlyTotals[name] /
                                                                Object.values(chartData.monthlyTotals).reduce((sum, val) => sum + val, 0)) *
                                                            100
                                                        ).toFixed(1)}
                                                        %
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-lg bg-white p-4 shadow-sm">
                                <h4 className="mb-3 text-lg font-semibold text-gray-700">การวิเคราะห์ข้อมูล</h4>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <p>
                                        • สารเคมีการใช้มากที่สุด:{' '}
                                        <span className="font-medium text-purple-600">
                                            {
                                                Object.entries(chartData.monthlyTotals).reduce(
                                                    (max, [name, value]) => (value > max.value ? { name, value } : max),
                                                    { name: 'ไม่มีข้อมูล', value: 0 },
                                                ).name
                                            }
                                        </span>
                                    </p>
                                    <p>
                                        • สารเคมีการใช้น้อยที่สุด:{' '}
                                        <span className="font-medium text-blue-600">
                                            {
                                                Object.entries(chartData.monthlyTotals).reduce(
                                                    (min, [name, value]) => (value < min.value && value > 0 ? { name, value } : min),
                                                    { name: 'ไม่มีข้อมูล', value: Infinity },
                                                ).name
                                            }
                                        </span>
                                    </p>
                                    <p>
                                        • ปริมาณการใช้เฉลี่ยต่อวัน:{' '}
                                        <span className="font-medium text-green-600">
                                            {formatNumber(
                                                Object.values(chartData.monthlyTotals).reduce((sum, val) => sum + val, 0) /
                                                Math.max(dailyArray.length, 1),
                                            )}{' '}
                                            กก./วัน
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ✅ ModalForm แสดง MonthlyDetail */}
            {isModalOpen && selectedDate && (
                <ModalForm
                    isModalOpen={isModalOpen}
                    month={selectedMonth}
                    onClose={() => setIsOpen(false)}
                    title={`รายละเอียดสารเคมีวันที่ ${selectedDate}`}
                    className="rounded-xl shadow-lg"
                    size="w-full max-w-4xl h-auto mx-auto flex flex-col"
                >
                    {/* เนื้อหา */}
                    <div className="w-full flex-1 overflow-auto bg-white py-4">
                        <MonthlyDetail month={selectedMonth} records={selectedDateRecords} />
                    </div>

                    {/* Footer */}
                    <div className="flex w-full justify-center border-t pt-4">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-md bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
                        >
                            ปิด
                        </button>
                    </div>
                </ModalForm>
            )}
        </AppLayout>
    );
}