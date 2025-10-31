import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import PODocumentShow from './PODocumentShow';
import PODocumentTable from './PODocumentTable';

interface poDocs {
    POID: number;
    DocuDate: string;
    DeptName: string;
    POVendorNo: string;
    AppvDocuNo: string;
    status: string;
    status_label: string;
    total_amount: number;
}

interface Summary {
    year: { count: number; total: number };
    month: { count: number; total: number };
}

// ==== Index Page ====
export default function Index() {
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [data, setData] = useState<poDocs[]>([]);
    const [isModalOpenDetail, setIsModalOpenDetail] = useState(false);
    const [selectedDept, setSelectedDept] = useState<string>('1006');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().toISOString().slice(0, 4));
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [depts, setDepts] = useState<{ DeptID: string; DeptName: string }[]>([]);
    const [summary, setSummary] = useState<Summary>({
        year: { count: 0, total: 0 },
        month: { count: 0, total: 0 },
    });

    // เพิ่ม state สำหรับจัดการ pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Purchase Order', href: '/purchase/po' },
    ];

    useEffect(() => {
        fetchData();
    }, [selectedDept, selectedYear, selectedMonth, currentPage, perPage]); // เพิ่ม currentPage, perPage ใน dependency

    // ใน fetchData function
    const fetchData = async () => {
        setLoading(true);
        setSummaryLoading(true);
        try {
            const res = await axios.get('/purchase/po/api', {
                params: {
                    year: selectedYear,
                    month: selectedMonth || '',
                    dept_id: selectedDept,
                    page: currentPage, // ส่ง page ไป
                    per_page: perPage, // ส่ง per_page ไป
                },
            });

            setData(res.data.poDocs.data || []);
            setDepts(res.data.depts || []);
            setSummary(res.data.summary || {});

            // อัพเดท pagination state จาก response
            setTotalRecords(res.data.poDocs.total || 0);

            // ตรวจสอบว่าหน้าปัจจุบันยัง valid อยู่หรือไม่
            const responseCurrentPage = res.data.poDocs.current_page || 1;
            const responseLastPage = res.data.poDocs.last_page || 1;

            if (currentPage !== responseCurrentPage && responseCurrentPage <= responseLastPage) {
                setCurrentPage(responseCurrentPage);
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถโหลดข้อมูลได้',
                confirmButtonColor: '#3b82f6',
            });
        } finally {
            setLoading(false);
            setSummaryLoading(false);
        }
    };

    const getAvailableYears = () => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => currentYear - i);
    };

    const getAvailableMonths = () => {
        const months = [];
        const currentYear = parseInt(selectedYear);

        for (let m = 1; m <= 12; m++) {
            months.push(`${currentYear}-${String(m).padStart(2, '0')}`);
        }
        return months;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const fetchDataShow = async (document: Document) => {
        if (!document?.POID) {
            console.warn('Missing POID');
            return;
        }

        try {
            const res = await axios.get(`/purchase/po/show/${document.POID}`);
            setSelectedDocument(res.data);
            return res.data;
        } catch (error) {
            console.error('Error fetching:', error);
            Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถโหลดข้อมูลได้',
                text: 'กรุณาลองใหม่อีกครั้ง',
                customClass: {
                    popup: 'custom-swal font-anuphan',
                    title: 'font-anuphan text-red-800',
                    htmlContainer: 'font-anuphan text-red-500',
                },
            });
            throw error;
        }
    };

    const handleDetail = async (document: Document) => {
        setLoading(true);
        try {
            await fetchDataShow(document);
            setIsModalOpenDetail(true);
        } catch (error) {
            console.error('Error in handleDetail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
        // ถ้ามีเดือนที่เลือกอยู่แล้ว แต่เดือนนั้นเป็นของปีอื่น ให้รีเซ็ตเดือน
        if (selectedMonth) {
            const [currentMonthYear] = selectedMonth.split('-');
            if (currentMonthYear !== year) {
                setSelectedMonth('');
            }
        }
        // ไม่ต้อง reset currentPage เพื่อรักษาหน้าปัจจุบัน
    };

    const handleDeptChange = (dept: string) => {
        setSelectedDept(dept);
        // ไม่ต้อง reset currentPage เพื่อรักษาหน้าปัจจุบัน
    };

    const handleMonthChange = (month: string) => {
        setSelectedMonth(month);
        // ไม่ต้อง reset currentPage เพื่อรักษาหน้าปัจจุบัน
    };

    // เพิ่มฟังก์ชันสำหรับจัดการ pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1); // reset ไปหน้าแรกเมื่อเปลี่ยนจำนวนต่อหน้า
    };

    const monthLabel = (() => {
        if (!selectedMonth) return 'ทั้งหมด';
        const [y, m] = selectedMonth.split('-').map(Number);
        const monthNames = [
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
        return `${monthNames[m - 1]} ${y + 543}`;
    })();

    const yearLabel = selectedYear ? `${parseInt(selectedYear) + 543}` : 'ทั้งหมด';

    // if (loading) {
    //     return (
    //         <AppLayout breadcrumbs={breadcrumbs}>
    //             <div className="flex h-64 items-center justify-center">
    //                 <div className="flex flex-col items-center">
    //                     <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
    //                     <p className="mt-4 font-anuphan text-lg font-medium text-gray-600">กำลังโหลดข้อมูล...</p>
    //                 </div>
    //             </div>
    //         </AppLayout>
    //     );
    // }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="px-4 py-6 font-anuphan sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Purchase Orders</h1>
                    <p className="mt-2 text-sm text-gray-600">จัดการข้อมูลใบสั่งซื้อและติดตามสถานะ</p>
                    <a
                        href="/expense-by-dept"
                        className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                    >
                        ดูกราฟค่าใช้จ่ายรายหน่วยงาน
                    </a>
                </div>

                {/* Summary Cards */}
                <div className="mb-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Card 1: ผลรวมทั้งปี */}
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 rounded-lg bg-blue-50 p-3">
                                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="text-sm font-medium text-gray-500">ผลรวมปี {yearLabel}</h3>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        {summaryLoading ? 'กำลังโหลด...' : formatCurrency(summary.year.total)}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">{summary.year.count.toLocaleString()} รายการ</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: ผลรวมเดือนปัจจุบัน */}
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 rounded-lg bg-green-50 p-3">
                                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="text-sm font-medium text-gray-500">
                                        ผลรวมเดือน {selectedMonth ? monthLabel : `ทั้งหมดปี ${yearLabel}`}
                                    </h3>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        {summaryLoading ? 'กำลังโหลด...' : formatCurrency(summary.month.total)}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">{summary.month.count.toLocaleString()} รายการ</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: ข้อมูลเพิ่มเติม */}
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 rounded-lg bg-purple-50 p-3">
                                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="text-sm font-medium text-gray-500">ข้อมูลทั้งหมด</h3>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        {summaryLoading ? 'กำลังโหลด...' : data.length.toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">รายการที่แสดง</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="mb-4 overflow-hidden rounded-xl bg-blue-50 shadow-sm ring-1 ring-gray-200">
                    <div className="p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            {/* Department Filter */}
                            <div className="flex-1">
                                <label htmlFor="dept-filter" className="mb-2 block text-sm font-medium text-gray-700">
                                    หน่วยงาน
                                </label>
                                <div className="relative">
                                    <select
                                        id="dept-filter"
                                        value={selectedDept}
                                        onChange={(e) => handleDeptChange(e.target.value)}
                                        className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
                                    >
                                        {depts.map((d) => (
                                            <option key={d.DeptID} value={d.DeptID}>
                                                {d.DeptName}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg
                                            className="h-5 w-5 text-gray-400"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Year Filter */}
                            <div className="flex-1 md:max-w-xs">
                                <label htmlFor="year-filter" className="mb-2 block text-sm font-medium text-gray-700">
                                    ปี
                                </label>
                                <div className="relative">
                                    <select
                                        id="year-filter"
                                        value={selectedYear}
                                        onChange={(e) => handleYearChange(e.target.value)}
                                        className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
                                    >
                                        {getAvailableYears().map((year) => (
                                            <option key={year} value={year}>
                                                {Number(year) + 543}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg
                                            className="h-5 w-5 text-gray-400"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Month Filter */}
                            <div className="flex-1 md:max-w-xs">
                                <label htmlFor="month-filter" className="mb-2 block text-sm font-medium text-gray-700">
                                    เดือน
                                </label>
                                <div className="relative">
                                    <select
                                        id="month-filter"
                                        value={selectedMonth}
                                        onChange={(e) => handleMonthChange(e.target.value)}
                                        className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
                                    >
                                        <option value="">ทุกเดือน</option>
                                        {getAvailableMonths().map((month) => {
                                            const [year, monthNum] = month.split('-').map(Number);
                                            const monthNames = [
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
                                            const monthName = monthNames[monthNum - 1];
                                            return (
                                                <option key={month} value={month}>
                                                    {monthName} {year + 543}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg
                                            className="h-5 w-5 text-gray-400"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                    {loading ? (
                        <div className="py-12 text-center">
                           <div className="flex flex-col items-center">
                            <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
                            <p className="text-lg font-semibold text-gray-700">กำลังโหลดข้อมูล...</p>
                            <p className="mt-1 text-sm text-gray-500">กรุณารอสักครู่</p>
                        </div>
                        </div>
                    ) : data && data.length > 0 ? (
                        <div className="border-t border-gray-200">
                            <PODocumentTable
                                documents={data}
                                onDetail={handleDetail}
                                currentPage={currentPage}
                                perPage={perPage}
                                totalRecords={totalRecords}
                                onPageChange={handlePageChange}
                                onPerPageChange={handlePerPageChange}
                            />
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-500">
                            <p className="text-lg">ไม่พบข้อมูลในระบบ</p>
                        </div>
                    )}
                </div>

                {/* Document Form Modal */}
                <ModalForm
                    isModalOpen={isModalOpenDetail}
                    onClose={() => setIsModalOpenDetail(false)}
                    title="รายละเอียดเอกสาร"
                    description=" "
                    size="max-w-3xl"
                >
                    <PODocumentShow
                        onClose={() => setIsModalOpenDetail(false)}
                        onSuccess={() => {
                            setIsModalOpenDetail(false);
                            fetchData();
                        }}
                        document={selectedDocument}
                    />
                </ModalForm>
            </div>
        </AppLayout>
    );
}
