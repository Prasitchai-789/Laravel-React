import Button from '@/components/Buttons/Button';
import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
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

    // ==== Data State ====
    const [categories, setCategories] = useState<Category[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
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

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setForm({ ...form, [name]: files[0] });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        for (let key in form) {
            data.append(key, form[key]);
        }

        try {
            const res = await axios.post('/memo/documents', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert('บันทึกเอกสารเรียบร้อย');
            setForm({
                document_no: '',
                date: '',
                description: '',
                category_id: '',
                amount: '',
                winspeed_ref_id: '',
                attachment: null,
            });
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาด');
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
            <div className="p-6">
                {/* Header Section */}
                <div className="mb-6 flex flex-col gap-4 font-anuphan md:flex-row md:items-center md:justify-between">
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
                documents={documents}
                onEdit={(document) => {
                    setMode('edit');
                    setSelectedDocument(document);
                    setIsModalOpen(true);
                }}
                onDelete={async (document) => {
                    if (confirm('คุณต้องการลบเอกสารนี้ใช่หรือไม่?')) {
                        try {
                            await axios.delete(`/memo/documents/${document.id}`);
                            alert('ลบเอกสารเรียบร้อย');
                            fetchData();
                        } catch (error) {
                            console.error('Error deleting document:', error);
                            alert('เกิดข้อผิดพลาดในการลบเอกสาร');
                        }
                    }
                }}
            />
        </AppLayout>
    );
}
