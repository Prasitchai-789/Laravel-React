import GenericTable, { Column } from '@/components/Tables/GenericTable';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { Pencil, Trash2 } from 'lucide-react';

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
interface Category {
    id: number;
    name: string;
}
interface DocumentTableProps {
    documents: Document[];
    categories: Category[];
    onEdit?: (document: Document) => void;
    onDelete?: (document: Document) => void;
}

export default function DocumentTable({ documents, categories, onEdit, onDelete }: DocumentTableProps) {
    const handleEdit = (document: Document) => {
        if (onEdit) {
            onEdit(document);
        }
    };

    const handleDelete = (document: Document) => {
        if (onDelete) {
            onDelete(document);
        }
    };
    const getCategoryName = (categories: Category[], row: Document) => {
        const category = categories.find((category) => Number(category.id) === Number(row.category_id));
        return category ? category.name : '';
};


    const documentColumns: Column<Document>[] = [
        {
            key: 'date',
            label: 'วันที่',
            sortable: true,
            align: 'center',
            render: (document) => {
                const createdAt = dayjs(document.date);
                return (
                    <div className="flex flex-col items-center">
                        <div className="text-sm font-medium text-gray-900">{createdAt.isValid() ? createdAt.format('DD/MM/YYYY') : '-'}</div>
                        {/* <div className="text-xs text-gray-500">
                            {createdAt.isValid() ? createdAt.locale('th').format('dddd') : ''}
                        </div> */}
                    </div>
                );
            },
        },
        {
            key: 'document_no',
            label: 'เลขที่เอกสาร',
            sortable: true,
            align: 'center',
            render: (document) => (
                <div className="flex flex-col items-center">
                    <div className="text-sm font-medium text-gray-900">{document.document_no || '-'}</div>
                </div>
            ),
        },

        {
            key: 'description',
            label: 'รายละเอียด',
            sortable: true,
            align: 'center',
            render: (document) => (
                <div className="flex flex-col items-center">
                    <div className="inline-flex items-center px-3 py-1 text-sm">{document.description || '-'}</div>
                </div>
            ),
        },
        {
            key: 'category_id',
            label: 'หมวดค่าใช้จ่าย',
            sortable: true,
            align: 'center',
            render: (row) => (
                <div className="text-center">
                    <div className="inline-flex w-[150px] items-center justify-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                        {getCategoryName(categories, row)}
                    </div>
                </div>
            ),
        },
        {
            key: 'amount',
            label: 'จำนวนเงิน',
            sortable: true,
            align: 'center',
            render: (document) => {
                return (
                    <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                            {document.amount ? Number(document.amount).toLocaleString('th-TH', { style: 'currency', currency: 'THB' }) : '-'}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: 'สถานะ',
            render: (document) => {
                let statusColor = 'gray';
                let statusText = 'ไม่ระบุ';

                switch (document.status) {
                    case 'pending':
                        statusColor = 'yellow';
                        statusText = 'รอดำเนินการ';
                        break;
                    case 'approved':
                        statusColor = 'green';
                        statusText = 'อนุมัติแล้ว';
                        break;
                    case 'rejected':
                        statusColor = 'red';
                        statusText = 'ถูกปฏิเสธ';
                        break;
                    default:
                        statusColor = 'gray';
                        statusText = 'ไม่ระบุ';
                }

                return (
                    <span
                        className={`inline-flex items-center rounded-full bg-${statusColor}-100 px-3 py-1 text-sm font-medium text-${statusColor}-800`}
                    >
                        {statusText}
                    </span>
                );
            },
            align: 'center',
        },
        {
            key: 'attachment_path',
            label: 'เอกสารแนบ',
            render: (document) => (
                <div className="flex flex-col items-center">
                    <div className="text-sm font-medium text-blue-900 hover:underline">
                        {document.attachment_path ? (
                            <a href={'/storage/' + document.attachment_path + '?download'} target="_blank" rel="noopener noreferrer">
                                ดูเอกสาร
                            </a>
                        ) : (
                            '-'
                        )}
                    </div>
                </div>
            ),
            align: 'center',
        },
        {
            key: 'actions',
            label: 'การดำเนินการ',
            align: 'center',
        },
    ];

    return (
        <GenericTable
            title="ข้อมูลเอกสารบันทึกข้อความ"
            data={documents}
            columns={documentColumns}
            idField="id"
            actions={(row) => (
                <div className="flex justify-center gap-2">
                    <button
                        className="group relative text-yellow-600 transition-all duration-300 hover:scale-110 focus:outline-none"
                        onClick={() => handleEdit(row)}
                        aria-label="แก้ไข"
                    >
                        <div className="relative flex items-center justify-center">
                            <div className="rounded-lg bg-yellow-50 p-1 transition-colors duration-300 group-hover:bg-yellow-100">
                                <Pencil size={18} className="text-yellow-600" />
                            </div>

                            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-yellow-600 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100">
                                แก้ไข
                                <div className="absolute bottom-[-4px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-yellow-600"></div>
                            </span>
                        </div>
                    </button>

                    <button
                        className="group relative text-red-700 transition-all duration-300 hover:scale-110 focus:outline-none"
                        onClick={() => handleDelete(row)}
                        aria-label="ลบ"
                    >
                        <div className="relative flex items-center justify-center">
                            <div className="rounded-lg bg-red-50 p-1 transition-colors duration-300 group-hover:bg-red-100">
                                <Trash2 size={18} className="text-red-700" />
                            </div>

                            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100">
                                ลบ
                                <div className="absolute bottom-[-4px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-red-600"></div>
                            </span>
                        </div>
                    </button>
                </div>
            )}
        />
    );
}
