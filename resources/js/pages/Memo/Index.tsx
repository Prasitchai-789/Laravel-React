import Button from '@/components/Buttons/Button';
import DeleteModal from '@/components/DeleteModal';
import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
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
}

// ==== Form State ====
interface DocumentFormState {
    document_no: string;
    date: string;
    description: string;
    category_id: string | number;
    amount: string | number;
    winspeed_ref_id: string | number;
    attachment: File | null;
}

// ==== Summary Interface ====
interface SummaryData {
    totalAmount: number;
    monthlyAmount: number;
    categoryAmount: number;
}

export default function Index() {
    // ==== UI State ====
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const page = usePage<{ auth: { user: any } }>();
    const userPermissions = page.props.auth.permissions;

    const getCurrentMonth = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());

    // ==== Data State ====
    const [categories, setCategories] = useState<Category[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/memo/documents/api');
            const { categories, documents } = res.data;
            setCategories(categories);
            setDocuments(documents);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching:', error);
            Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถโหลดข้อมูลได้',
                text: 'กรุณาลองใหม่อีกครั้ง',
                customClass: { popup: 'custom-swal' },
            });
        } finally {
            setLoading(false);
        }
    };

    // ==== Filter Functions ====
    const handleCategoryFilter = (categoryId: number | null) => {
        setSelectedCategory(categoryId);
    };

    const handleMonthFilter = (month: string) => {
        setSelectedMonth(month);
    };

    // ==== Filtered Documents ====
    const filteredDocuments = documents.filter((document) => {
        const documentMonth = document.date.slice(0, 7); // YYYY-MM
        const categoryMatch = selectedCategory ? document.category_id === selectedCategory : true;
        const monthMatch = selectedMonth ? documentMonth === selectedMonth : true;
        return categoryMatch && monthMatch;
    });

    // ==== Summary Calculations ====
    const calculateSummary = (): SummaryData => {
        const currentYear = new Date().getFullYear();
        const currentMonth = selectedMonth;

        console.log('🔍 การคำนวณผลรวม:', {
            totalDocuments: documents.length,
            currentYear,
            selectedMonth,
            sampleData: documents.slice(0, 3).map(d => ({
                date: d.date,
                year: d.date.slice(0, 4),
                month: d.date.slice(0, 7),
                amount: d.amount
            }))
        });

        // ผลรวมทั้งปี
        const totalAmount = documents
            .filter((doc) => doc.date.slice(0, 4) === currentYear.toString())
            .reduce((sum, doc) => sum + Number(doc.amount || 0), 0);

        // ผลรวมเดือนที่เลือก
        const monthlyAmount = documents.filter((doc) => doc.date.slice(0, 7) === currentMonth).reduce((sum, doc) => sum + Number(doc.amount || 0), 0);

        // ผลรวมตามหมวดหมู่ที่กรอง (เฉพาะเดือนที่เลือก)
        const categoryAmount = filteredDocuments.reduce((sum, doc) => sum + Number(doc.amount || 0), 0);

        return { totalAmount, monthlyAmount, categoryAmount };
    };

    const summary = calculateSummary();

    // ==== Get Category Name ====
    const getCategoryName = (): string => {
        if (!selectedCategory) return 'ทั้งหมด';
        const category = categories.find((cat) => cat.id === selectedCategory);
        return category ? category.name : 'ทั้งหมด';
    };

    // ==== Get Available Months ====
    const getAvailableMonths = (): string[] => {
        const months = documents.map((doc) => doc.date.slice(0, 7));
        const uniqueMonths = [...new Set(months)].sort().reverse();
        return uniqueMonths;
    };

    const openCreate = () => {
        setMode('create');
        setSelectedDocument(null);
        setIsModalOpen(true);
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

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
                    Toast.fire({
                        icon: 'success',
                        title: 'ลบเอกสารเรียบร้อยแล้ว',
                    });
                    closeDeleteModal();
                    fetchData();
                },
                preserveScroll: true,
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Expense Documents', href: '/memo/documents' },
    ];

    // ==== Format Currency ====
     const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const debugInfo = () => {
        if (documents.length === 0) return 'ไม่มีข้อมูล';

        const currentYearDocs = documents.filter(doc => doc.date.slice(0, 4) === new Date().getFullYear().toString());
        const currentMonthDocs = documents.filter(doc => doc.date.slice(0, 7) === selectedMonth);

        return `ข้อมูล: ${documents.length} รายการ, ปีนี้: ${currentYearDocs.length} รายการ, เดือนนี้: ${currentMonthDocs.length} รายการ`;
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex h-64 items-center justify-center">
                    <p className="text-lg text-gray-600">Loading...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="px-6 pt-2 font-anuphan">
                {/* Header Section */}
                <div className="flex flex-col gap-4 font-anuphan md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Expense Documents</h1>
                        <p className="text-sm text-gray-500">จัดการข้อมูลเอกสารค่าใช้จ่าย</p>
                        <p className="text-xs text-gray-400 mt-1">{debugInfo()}</p>
                    </div>

                    <div className="flex w-full flex-nowrap items-center justify-end gap-3 py-1 md:w-auto">
                        <Button
                            onClick={openCreate}
                            icon={<Plus className="h-4 w-4" />}
                            iconPosition="left"
                            variant="success"
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
                                <h3 className="text-sm font-medium text-gray-500">ผลรวมทั้งปี ({new Date().getFullYear()})</h3>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {documents.filter(doc => doc.date.slice(0, 4) === new Date().getFullYear().toString()).length} รายการ
                                </p>
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
                                <h3 className="text-sm font-medium text-gray-500">
                                    ผลรวมเดือน {new Date(selectedMonth + '-01').toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                                </h3>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.monthlyAmount)}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {documents.filter(doc => doc.date.slice(0, 7) === selectedMonth).length} รายการ
                                </p>
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
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.categoryAmount)}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {filteredDocuments.length} รายการ
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Category Filter */}
                    <div>
                        <h3 className="mb-3 text-sm font-medium text-gray-700">กรองตามหมวดหมู่:</h3>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={() => handleCategoryFilter(null)}
                                variant={selectedCategory === null ? 'primary' : 'success'}
                                size="sm"
                                className="whitespace-nowrap"
                            >
                                ทั้งหมด
                            </Button>
                            {categories.map((category) => {
                                const count = documents.filter((doc) => doc.category_id === category.id).length;
                                return (
                                    <Button
                                        key={category.id}
                                        onClick={() => handleCategoryFilter(category.id)}
                                        variant={selectedCategory === category.id ? 'primary' : 'success'}
                                        size="sm"
                                        className="whitespace-nowrap"
                                    >
                                        {category.name} ({count})
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Month Filter */}
                    <div>
                        <h3 className="mb-3 text-sm font-medium text-gray-700">กรองตามเดือน:</h3>
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={selectedMonth}
                                onChange={(e) => handleMonthFilter(e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">ทั้งหมด</option>
                                {getAvailableMonths().map((month) => (
                                    <option key={month} value={month}>
                                        {new Date(month + '-01').toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                                    </option>
                                ))}
                            </select>
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
            />

            <DeleteModal isModalOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="ยืนยันการลบ" onConfirm={handleDelete}>
                <p className="font-anuphan text-sm text-gray-500">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            </DeleteModal>
        </AppLayout>
    );
}
