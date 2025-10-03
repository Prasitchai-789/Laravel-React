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

export default function Index() {
    // ==== UI State ====
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const page = usePage<{ auth: { user: any } }>();
    const userPermissions = page.props.auth.permissions;

    // ==== Data State ====
    const [categories, setCategories] = useState<Category[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);


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

    // const ExpenseWithDetail: ExpenseDocumentWithCategory[] = [];

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
        } finally {
            setLoading(false);
        }
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
            handleEdit(document); // เรียกฟังก์ชันเดิม
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
            <div className="px-6 pt-2">
                {/* Header Section */}
                <div className="flex flex-col gap-4 font-anuphan md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Expense Documents</h1>
                        <p className="text-sm text-gray-500">จัดการข้อมูลเอกสารค่าใช้จ่าย</p>
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
                documents={documents}
                onEdit={handleEditWithPermission} // ✅ ใช้ฟังก์ชัน wrapper
                onDelete={handleDeleteWithPermission}
            />

            <DeleteModal isModalOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="ยืนยันการลบ" onConfirm={handleDelete}>
                <p className="font-anuphan text-sm text-gray-500">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            </DeleteModal>
        </AppLayout>
    );
}
