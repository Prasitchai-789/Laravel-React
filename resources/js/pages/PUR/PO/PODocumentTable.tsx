import GenericTable, { Column } from '@/components/Tables/GenericTable';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Data {
    POID: number;
    DocuDate: string;
    DeptName: string;
    POVendorNo: string;
    AppvDocuNo: string;
    status: string;
    status_label: string;
    total_amount: number;
}

interface PODocumentTableProps {
    documents: Data[];
    onDetail?: (document: Data) => void;
}

export default function PODocumentTable({ documents, onDetail }: PODocumentTableProps) {
    const [selectedMonth, setSelectedMonth] = useState('');

    useEffect(() => {}, [selectedMonth]);
    const filterByMonth = (documents: Document[], month: string) => {
        if (!month) return documents; // ถ้าเลือก "ทั้งหมด"
        const [year, monthNum] = month.split('-').map(Number);
        return documents.filter((doc) => {
            const docDate = new Date(doc.DocuDate);
            return docDate.getFullYear() === year && docDate.getMonth() + 1 === monthNum;
        });
    };
    const handleDetail = (document: Document) => {
        if (onDetail) onDetail(document);
    };

    const getCategoryName = (categories: Category[], row: Document) => {
        const category = categories.find((category) => Number(category.id) === Number(row.category_id));
        return category ? category.name : '-';
    };

    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'รอดำเนินการ' },
        approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'อนุมัติแล้ว' },
        rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'ถูกปฏิเสธ' },
    };

    const renderStatus = (status?: string) => {
        const s = statusMap[status || ''] || { bg: 'bg-gray-100', text: 'text-gray-800', label: 'ไม่ระบุ' };
        return <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
    };

    const filteredDocuments = filterByMonth(documents, selectedMonth);

    const documentColumns: Column<Data>[] = [
    {
        key: 'DocuDate',
        label: 'วันที่',
        sortable: true,
        align: 'center',
        render: (document) => dayjs(document.DocuDate).format('DD/MM/YYYY')
    },
    {
        key: 'POID',
        label: 'เลขที่เอกสาร',
        sortable: true,
        align: 'center',
        render: (document) => document.POVendorNo
    },
    {
        key: 'total_amount',
        label: 'ยอดชำระเงิน (บาท)',
        align: 'right',
        render: (document) =>  Number(document.total_amount).toLocaleString('th-TH', { style: 'currency', currency: 'THB' })
    },
    {
        key: 'status',
        label: 'สถานะ',
        align: 'center',
        render: (document) => renderStatus(document.status)
    },
    {
        key: 'actions',
        label: 'การดำเนินการ',
        align: 'center',
        render: (document) => (
            <button onClick={() => handleDetail(document)}>
                <Eye size={18} />
            </button>
        )
    }
];

    return (
        <GenericTable
            title="ข้อมูลเอกสารบันทึกข้อความ"
            columns={documentColumns}
            data={filteredDocuments.sort((a, b) => b.POID - a.POID)}
            idField="POID"
            actions={(row) => (
                <div className="flex justify-center gap-2">
                    <button
                        className="group relative text-blue-600 transition-all duration-300 hover:scale-110 focus:outline-none"
                        onClick={() => handleDetail(row)}
                        aria-label="แก้ไข"
                    >
                        <div className="relative flex items-center justify-center">
                            <div className="rounded-lg bg-blue-50 p-1 transition-colors duration-300 group-hover:bg-blue-100">
                                <Eye size={18} className="text-blue-600" />
                            </div>
                            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100">
                                รายละเอียด
                                <div className="absolute bottom-[-4px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-blue-600"></div>
                            </span>
                        </div>
                    </button>
                </div>
            )}
        />
    );
}
