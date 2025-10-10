import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import PODocumentShow from './PODocumentShow';
import PODocumentTable from './PODocumentTable';
import PODocumentChart from "./PODocumentChart";

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
    const [data, setData] = useState<poDocs[]>([]);
    const [isModalOpenDetail, setIsModalOpenDetail] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [depts, setDepts] = useState<{ DeptID: string; DeptName: string }[]>([]);
    const [selectedDept, setSelectedDept] = useState<string>('1006');
    const [summary, setSummary] = useState<Summary>({
        year: { count: 0, total: 0 },
        month: { count: 0, total: 0 },
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Purchase Order', href: '/purchase/po' },
    ];

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedDept]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/purchase/po/api', {
                params: {
                    year: selectedMonth ? selectedMonth.split('-')[0] : new Date().getFullYear(),
                    month: selectedMonth || '', // ถ้าไม่เลือก = ดึงทั้งปี
                    dept_id: selectedDept,
                },
            });

            setData(res.data.poDocs.data || []);
            setDepts(res.data.depts || []);
            setSummary(res.data.summary || {});
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
        }
    };

    const getAvailableMonths = () => {
        const now = new Date();
        const months: string[] = [];
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            months.push(`${y}-${m}`);
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

    const salesByMonth = [
        { month: 'ม.ค.', total_sales: 95000, total_qty: 3200, total_cost: 65000 },
        { month: 'ก.พ.', total_sales: 120000, total_qty: 3500, total_cost: 78000 },
        { month: 'มี.ค.', total_sales: 180000, total_qty: 5000, total_cost: 120000 },
        { month: 'เม.ย.', total_sales: 150000, total_qty: 4200, total_cost: 105000 },
        { month: 'พ.ค.', total_sales: 200000, total_qty: 6000, total_cost: 140000 },
        { month: 'มิ.ย.', total_sales: 250000, total_qty: 7200, total_cost: 180000 },
    ];

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex h-64 items-center justify-center">
                    <div className="flex flex-col items-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                        <p className="mt-4 font-anuphan text-lg font-medium text-gray-600">กำลังโหลดข้อมูล...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="px-4 py-6 font-anuphan sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Purchase Orders</h1>
                    <p className="mt-2 text-sm text-gray-600">จัดการข้อมูลใบสั่งซื้อและติดตามสถานะ</p>
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
                                    <h3 className="text-sm font-medium text-gray-500">ผลรวมทั้งปี</h3>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(summary.year.total)}</p>
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
                                    <h3 className="text-sm font-medium text-gray-500">ผลรวมเดือน {monthLabel}</h3>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(summary.month.total)}</p>
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
                                    <p className="mt-1 text-2xl font-bold text-gray-900">{data.length.toLocaleString()}</p>
                                    <p className="mt-1 text-xs text-gray-500">รายการที่แสดง</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="mb-4 overflow-hidden rounded-xl bg-blue-100 shadow-sm ring-1 ring-gray-200">
                    <div className="p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            {/* Department Filter */}
                            <div className="flex-1">
                                <label htmlFor="dept-filter" className="mb-2 block text-sm font-medium text-gray-700">
                                    หน่วยงาน
                                </label>
                                <select
                                    id="dept-filter"
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
                                >
                                    {depts.map((d) => (
                                        <option key={d.DeptID} value={d.DeptID}>
                                            {d.DeptName}
                                        </option>
                                    ))}
                                </select>
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
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
                                    >
                                        <option value="" className="text-gray-500">
                                            ทุกเดือน
                                        </option>
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
                                            const monthName = monthNames[monthNum - 1] || monthNum;

                                            return (
                                                <option key={month} value={month} className="text-gray-900">
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
                    <div className="border-t border-gray-200">
                        <PODocumentTable documents={data} onDetail={handleDetail} />
                    </div>
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
            {/* <PODocumentChart data={salesByMonth} /> */}
        </AppLayout>
    );
}
