import Button from '@/components/Buttons/Button';
import DeleteModal from '@/components/DeleteModal';
import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FolderOpen, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import DocumentDetailForm from './DocumentDetailForm';
import DocumentForm from './DocumentForm';
import DocumentTable from './DocumentTable';

// ==== Interfaces ====
interface Category {
    id: number;
    name: string;
}

interface Attachment {
    id: number;
    name: string;
}

interface Document {
    id: number;
    document_no: string;
    date: string;
    description: string;
    category_id: number;
    amount: number;
    winspeed_ref_id: number;
    attachment: string;
    attachments: Attachment[];
    category?: { name: string };
    total_amount?: number; // นี้คือยอดจาก GLHD
    status_label?: string;
    status?: string;
    AppvDocuNo?: string; // เพิ่ม field นี้
}

interface DocumentFormState {
    document_no: string;
    date: string;
    description: string;
    category_id: string | number;
    amount: string | number;
    winspeed_ref_id: string | number;
    attachment: File | null;
}

interface SummaryData {
    totalAmount: number;
    monthlyAmount: number;
    categoryAmount: number;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

interface SummaryResponse {
    yearAmount: number;
    yearCount: number;
    monthAmount: number;
    monthCount: number;
    categoryAmount: number;
    totalCount: number;
}

export default function Index() {
    // ==== UI State ====
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalOpenDetail, setIsModalOpenDetail] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const page = usePage<{ auth: { user?: any; permissions?: string[] } }>();

    const userPermissions: string[] = Array.isArray(page.props.auth?.permissions)
        ? page.props.auth.permissions
        : Array.isArray(page.props.auth?.user?.permissions)
          ? page.props.auth.user.permissions
          : [];

    // ==== Data State ====
    const [categories, setCategories] = useState<Category[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    // ==== Filter & Pagination State ====
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Simplified pagination state
    const [pagination, setPagination] = useState<PaginationData>({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10,
    });

    // ==== Summary State ====
    const [summaryData, setSummaryData] = useState<SummaryResponse>({
        yearAmount: 0,
        yearCount: 0,
        monthAmount: 0,
        monthCount: 0,
        categoryAmount: 0,
        totalCount: 0,
    });

    // ==== Form State ====
    const [form, setForm] = useState<DocumentFormState>({
        document_no: '',
        date: '',
        description: '',
        category_id: '',
        amount: '',
        winspeed_ref_id: '',
        attachment: null,
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // ฟังก์ชันแปลงวันที่ให้เป็นรูปแบบมาตรฐาน YYYY-MM
    const parseDocumentDate = (dateString: string): string => {
        if (!dateString) return '';

        const monthMap: Record<string, string> = {
            Jan: '01',
            Feb: '02',
            Mar: '03',
            Apr: '04',
            May: '05',
            Jun: '06',
            Jul: '07',
            Aug: '08',
            Sep: '09',
            Oct: '10',
            Nov: '11',
            Dec: '12',
        };

        try {
            // รูปแบบ: 'Oct  3 2025 12:00:00:AM'
            const cleanDate = dateString.replace(/\s+/g, ' ').trim();
            const parts = cleanDate.split(' ');

            if (parts.length >= 3) {
                const monthAbbr = parts[0];
                const day = parts[1];
                const year = parts[2];
                const monthNum = monthMap[monthAbbr];

                if (monthNum && year && day) {
                    return `${year}-${monthNum}`;
                }
            }

            // Fallback to Date object
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                return `${year}-${month}`;
            }
        } catch (error) {
            console.error('Error parsing date:', dateString, error);
        }

        return '';
    };

    // 📡 ดึงข้อมูลเอกสารจาก API
    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                search: searchQuery,
                sort: sortField,
                order: sortOrder,
                month: selectedMonth,
                category: selectedCategory,
            };
            const res = await axios.get('/memo/documents/api', { params });
            const { categories: catRes, documents: docRes } = res.data;
            if (catRes) setCategories(catRes);
            if (docRes?.data) {
                setDocuments(docRes.data);
                setPagination((prev) => ({
                    ...prev,
                    current_page: docRes.current_page || 1,
                    last_page: docRes.last_page || 1,
                    total: docRes.total || 0,
                }));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire({
                icon: 'error',
                title: 'โหลดข้อมูลล้มเหลว',
                text: 'กรุณาลองใหม่อีกครั้ง',
                customClass: {
                    popup: 'custom-swal font-anuphan',
                    title: 'font-anuphan text-red-800',
                    htmlContainer: 'font-anuphan text-red-500',
                },
            });
        } finally {
            setLoading(false);
        }
    };

    // 📡 ดึงข้อมูลสรุปจาก API
    const fetchSummaryData = async () => {
        setSummaryLoading(true);
        try {
            const params = {
                summary: true,
                year: new Date().getFullYear(),
                month: selectedMonth,
                category: selectedCategory,
            };

            const res = await axios.get(route('memo.documents.api'), { params });
            if (res.data.summary) {
                setSummaryData(res.data.summary);
            } else {
                // Fallback: คำนวณจากข้อมูลที่โหลดมา
                calculateSummaryFromDocuments();
            }
        } catch (error) {
            console.error('Error fetching summary data:', error);
            // Fallback: คำนวณจากข้อมูลที่โหลดมา
            calculateSummaryFromDocuments();
        } finally {
            setSummaryLoading(false);
        }
    };

    // Fallback: คำนวณสรุปจากข้อมูลเอกสาร
    const calculateSummaryFromDocuments = () => {
        const currentYear = new Date().getFullYear().toString();

        // เอกสารปีปัจจุบัน
        const yearDocs = documents.filter((doc) => {
            const parsedDate = parseDocumentDate(doc.date);
            return parsedDate.startsWith(currentYear);
        });

        const yearAmount = yearDocs.reduce((sum, doc) => sum + Number(doc.amount || 0), 0);
        const yearCount = yearDocs.length;

        // เอกสารเดือนที่เลือก
        const monthDocs = selectedMonth
            ? documents.filter((doc) => {
                  const parsedDate = parseDocumentDate(doc.date);
                  return parsedDate === selectedMonth;
              })
            : documents;

        const monthAmount = monthDocs.reduce((sum, doc) => sum + Number(doc.amount || 0), 0);
        const monthCount = monthDocs.length;
        // เอกสารตามหมวดหมู่ที่กรอง
        const categoryDocs = documents.filter((doc) => {
            const parsedDate = parseDocumentDate(doc.date);
            const monthMatch = selectedMonth ? parsedDate === selectedMonth : true;
            const categoryMatch = selectedCategory ? doc.category_id === selectedCategory : true;
            return monthMatch && categoryMatch;
        });

        const categoryAmount = categoryDocs.reduce((sum, doc) => sum + Number(doc.amount || 0), 0);

        setSummaryData({
            yearAmount,
            yearCount,
            monthAmount,
            monthCount,
            categoryAmount,
            totalCount: categoryDocs.length,
        });
    };

    // Fetch data when dependencies change
    useEffect(() => {
        fetchData();
    }, [pagination.current_page, pagination.per_page, searchQuery, sortField, sortOrder, selectedMonth, selectedCategory]);

    // Fetch summary data when filters change
    useEffect(() => {
        fetchSummaryData();
    }, [selectedMonth, selectedCategory]);

    // ==== Event Handlers ====
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.last_page) {
            setPagination((prev) => ({ ...prev, current_page: page }));
        }
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPagination((prev) => ({
            ...prev,
            per_page: newPerPage,
            current_page: 1,
        }));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleCategoryFilter = (categoryId: number | null) => {
        setSelectedCategory(categoryId);
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleMonthFilter = (month: string) => {
        setSelectedMonth(month);
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    // ==== Counts by category ====
    const countsByCategory = useMemo(() => {
        const map: Record<number, number> = {};
        const docsToCount = selectedMonth
            ? documents.filter((d) => {
                  const parsedDate = parseDocumentDate(d.date);
                  return parsedDate === selectedMonth;
              })
            : documents;

        docsToCount.forEach((d) => {
            map[d.category_id] = (map[d.category_id] || 0) + 1;
        });
        return map;
    }, [documents, selectedMonth]);

    // ==== Filtered Documents for table ====
    const filteredDocuments = documents;

    // ==== Helper Functions ====
    const getCategoryName = (): string => {
        if (!selectedCategory) return 'ทั้งหมด';
        const category = categories.find((cat) => cat.id === selectedCategory);
        return category ? category.name : 'ทั้งหมด';
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

    const openCreate = () => {
        setMode('create');
        setSelectedDocument(null);
        setIsModalOpen(true);
    };

    const openDeleteModal = (id: number) => {
        setSelectedId(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedId(null);
    };

    const handleEditWithPermission = (document: Document) => {
        if (userPermissions.includes('users.edit')) {
            handleEdit(document);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'ไม่มีสิทธิ์ในการแก้ไขข้อมูล',
                customClass: { popup: 'custom-swal' },
            });
        }
    };

    const fetchDataShow = async (document: Document) => {
        if (!document?.winspeed_ref_id) {
            console.warn('Missing winspeed_ref_id');
            return;
        }

        try {
            const res = await axios.get(`/memo/documents/show/${document.winspeed_ref_id}`);
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
        setMode('edit');
        setLoading(true);
        try {
            const data = await fetchDataShow(document);
            setSelectedDocument(data);
            setIsModalOpenDetail(true);
        } catch (error) {
            console.error('Error in handleDetail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (document: Document) => {
        setMode('edit');
        setSelectedDocument(document);
        setIsModalOpen(true);
    };

    const handleDeleteWithPermission = (id: number) => {
        if (userPermissions.includes('users.delete')) {
            openDeleteModal(id);
        } else {
            Swal.fire({
                icon: 'error',
                customClass: { popup: 'custom-swal' },
                title: 'ไม่มีสิทธิ์ในการลบข้อมูล',
            });
        }
    };

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: { popup: 'custom-swal' },
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        },
    });

    const handleDelete = () => {
        if (selectedId) {
            router.delete(route('memo.documents.destroy', selectedId), {
                onSuccess: () => {
                    Toast.fire({ icon: 'success', title: 'ลบเอกสารเรียบร้อยแล้ว' });
                    closeDeleteModal();
                    fetchData();
                    fetchSummaryData(); // รีเฟรชข้อมูลสรุปด้วย
                },
                preserveScroll: true,
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Expense Documents', href: '/memo/documents' },
    ];

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const monthLabel = (() => {
        if (!selectedMonth) return 'ทั้งหมด';
        const [y, m] = selectedMonth.split('-').map(Number);
        if (Number.isNaN(y) || Number.isNaN(m)) return selectedMonth;
        return new Date(y, m - 1, 1).toLocaleDateString('th-TH', {
            month: 'long',
            year: 'numeric',
        });
    })();

    // if (loading) {
    //     return (
    //         <AppLayout breadcrumbs={breadcrumbs}>
    //             <div className="flex h-64 items-center justify-center">
    //                 <p className="text-lg text-gray-600">Loading...</p>
    //             </div>
    //         </AppLayout>
    //     );
    // }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="px-6 pt-2 font-anuphan">
                {/* Header Section */}
                <div className="flex flex-col gap-4 font-anuphan md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Expense Documents</h1>
                        <p className="text-sm text-gray-500">จัดการข้อมูลเอกสารค่าใช้จ่าย</p>
                        <p className="mt-1 text-xs text-gray-400">
                            ข้อมูล: {pagination.total} รายการ, หน้า {pagination.current_page} จาก {pagination.last_page}
                        </p>
                    </div>

                    <div className="flex w-full flex-nowrap items-center justify-end gap-3 py-1 md:w-auto">
                        <Button
                            onClick={openCreate}
                            icon={<Plus className="h-4 w-4" />}
                            iconPosition="left"
                            variant="primary"
                            className="flex-shrink-0 font-anuphan whitespace-nowrap"
                        >
                            Create
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Card 1: ผลรวมทั้งปี */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center">
                            <div className="rounded-full bg-blue-100 p-3">
                                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">ผลรวมทั้งปี ({new Date().getFullYear()+543})</h3>
                                <p className="text-2xl font-bold text-gray-900">
                                    {summaryLoading ? 'กำลังโหลด...' : formatCurrency(summaryData.yearAmount)}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">{summaryData.yearCount} รายการ</p>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: ผลรวมเดือนปัจจุบัน */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center">
                            <div className="rounded-full bg-green-100 p-3">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">ผลรวมเดือน {monthLabel}</h3>
                                <p className="text-2xl font-bold text-gray-900">
                                    {summaryLoading ? 'กำลังโหลด...' : formatCurrency(summaryData.monthAmount)}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">{summaryData.monthCount} รายการ</p>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: ผลรวมตามหมวดหมู่ที่กรอง */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center">
                            <div className="rounded-full bg-purple-100 p-3">
                                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">ผลรวม {getCategoryName()} (เดือนปัจจุบัน)</h3>
                                <p className="text-2xl font-bold text-gray-900">
                                    {summaryLoading ? 'กำลังโหลด...' : formatCurrency(summaryData.categoryAmount)}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">{summaryData.totalCount} รายการ</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        {/* Category Filter */}
                        <div className="flex-1">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    onClick={() => handleCategoryFilter(null)}
                                    variant={selectedCategory === null ? 'primary' : 'success'}
                                    size="sm"
                                    className="px-4 py-2 whitespace-nowrap"
                                >
                                    <FolderOpen className="mr-2 h-4 w-4" />
                                    ทั้งหมด
                                </Button>
                                {categories.map((category) => {
                                    const count = countsByCategory[category.id] || 0;
                                    return (
                                        <Button
                                            key={category.id}
                                            onClick={() => handleCategoryFilter(category.id)}
                                            variant={selectedCategory === category.id ? 'primary' : 'success'}
                                            size="sm"
                                            className="px-4 py-2 whitespace-nowrap"
                                        >
                                            {category.name}
                                            {/* <span className="bg-opacity-20 ml-1 px-1.5 py-0.5 text-xs">({count})</span> */}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Month Filter */}
                        <div className="w-full md:w-72">
                            <div className="group relative">
                                <select
                                    id="month-filter"
                                    value={selectedMonth}
                                    onChange={(e) => handleMonthFilter(e.target.value)}
                                    className="w-full appearance-none rounded-xl border-2 border-gray-300 bg-white px-4 py-1.5 pr-12 pl-4 font-anuphan text-gray-900 shadow-sm transition-all duration-300 group-hover:border-blue-400 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none"
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
                                        const monthName = monthNames[monthNum - 1];
                                        return (
                                            <option key={month} value={month} className="text-gray-900">
                                                {monthName} {year + 543}
                                            </option>
                                        );
                                    })}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                    <svg
                                        className="h-5 w-5 text-gray-500 transition-transform duration-300 group-focus-within:text-blue-500 group-hover:text-blue-500"
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

            {/* Document Form Modal */}
            <ModalForm
                isModalOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={mode === 'create' ? 'บันทึกข้อมูลเอกสาร' : 'แก้ไขข้อมูลเอกสาร'}
                description=" "
                size="max-w-2xl"
            >
                <DocumentForm
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchData();
                        fetchSummaryData(); // รีเฟรชข้อมูลสรุปด้วย
                    }}
                    categories={categories}
                    mode={mode}
                    document={selectedDocument}
                />
            </ModalForm>

            {/* Document Detail Modal */}
            <ModalForm
                isModalOpen={isModalOpenDetail}
                onClose={() => setIsModalOpenDetail(false)}
                title={mode === 'edit' ? 'รายละเอียดเอกสาร' : 'แก้ไขข้อมูลเอกสาร'}
                description=" "
                size="max-w-3xl"
            >
                <DocumentDetailForm
                    onClose={() => setIsModalOpenDetail(false)}
                    onSuccess={() => {
                        setIsModalOpenDetail(false);
                        fetchData();
                        fetchSummaryData(); // รีเฟรชข้อมูลสรุปด้วย
                    }}
                    categories={categories}
                    mode={mode}
                    document={selectedDocument}
                />
            </ModalForm>

            {/* Document Table */}
            <DocumentTable
                categories={categories}
                documents={filteredDocuments}
                onEdit={handleEditWithPermission}
                onDelete={handleDeleteWithPermission}
                onDetail={handleDetail}
                // Pagination props
                currentPage={pagination.current_page}
                perPage={pagination.per_page}
                totalRecords={pagination.total}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                // Sorting props
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                // Search props
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
            />

            <DeleteModal isModalOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="ยืนยันการลบ" onConfirm={handleDelete}>
                <p className="font-anuphan text-sm text-gray-500">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            </DeleteModal>
        </AppLayout>
    );
}
