import GenericTable, { Column } from '@/components/Tables/GenericTable';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; // ภาษาไทย
import { Pencil, Trash2 } from 'lucide-react';

interface Customer {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
}

interface Sale {
    id: number;
    sale_date: string;
    customer_id: number;
    product_id: number;
    quantity: number;
    price: number;
    total_amount: number;
    deposit: number;
    paid_amount: number;
    status: string;
}

interface SaleTableProps {
    sales: Sale[];
    customers: Customer[];
    products: Product[];
    onEdit?: (sale: Sale) => void;
    onDelete?: (sale: Sale) => void;
}

export default function SaleTable({ sales, customers = [], products = [], onEdit, onDelete }: SaleTableProps) {
    // ฟังก์ชันช่วยหาชื่อลูกค้า
    const getCustomerName = (id: number) => {
        const customer = customers.find((c) => c.id === id);
        return customer ? customer.name : `#${id}`;
    };

    // ฟังก์ชันช่วยหาชื่อสินค้า
    const getProductName = (id: number) => {
        const product = products.find((p) => p.id === id);
        return product ? product.name : `#${id}`;
    };

    const handleEdit = (sale: Sale) => {
        if (onEdit) {
            onEdit(sale);
        }
    };

    const handleDelete = (sale: Sale) => {
        if (onDelete) {
            onDelete(sale);
        }
    };

    const saleColumns: Column<Sale>[] = [
        {
            key: 'sale_date',
            label: 'วันที่ขาย',
            sortable: true,
            render: (sale) => (sale.sale_date ? dayjs(sale.sale_date).format('DD/MM/YYYY') : '-'),
        },
        {
            key: 'customer_id',
            label: 'ลูกค้า',
            sortable: true,
            render: (sale) => getCustomerName(sale.customer_id),
        },
        {
            key: 'product_id',
            label: 'สินค้า',
            sortable: true,
            render: (sale) => getProductName(sale.product_id),
        },
        { key: 'quantity', label: 'จำนวน', align: 'center' },
        {
            key: 'price',
            label: 'ราคา (บาท)',
            align: 'center',
            render: (sale) => Number(sale.price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        },
        {
            key: 'total_amount',
            label: 'ยอดเงิน (บาท)',
            align: 'center',
            render: (sale) => Number(sale.total_amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        },
        {
            key: 'deposit',
            label: 'ค้างชำระ (บาท)',
            align: 'center',
            render: (sale) => (
                <span className="font-anuphan text-md font-bold text-red-600">
                    {sale.deposit
                        ? Number(sale.deposit).toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                          })
                        : '-'}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'สถานะ',
            align: 'center',
            render: (sale) => {
                const statusMap = {
                    reserved: {
                        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                        icon: '⏰',
                        text: 'จอง',
                    },
                    completed: {
                        className: 'bg-green-100 text-green-800 border-green-200',
                        icon: '✅',
                        text: 'รับแล้ว',
                    },
                    cancelled: {
                        className: 'bg-red-100 text-red-800 border-red-200',
                        icon: '❌',
                        text: 'ยกเลิก',
                    },
                    pending: {
                        className: 'bg-blue-100 text-blue-800 border-blue-200',
                        icon: '⏳',
                        text: 'รอดำเนินการ',
                    },
                };

                const status = statusMap[sale.status] || {
                    className: 'bg-gray-100 text-gray-800 border-gray-200',
                    icon: '❓',
                    text: 'ไม่ระบุ',
                };

                return (
                    <div className="flex justify-center">
                        <span
                            className={`inline-flex min-w-[90px] items-center justify-center rounded-full border px-3 py-0.5 text-sm font-medium ${status.className}`}
                        >
                            <span className="mr-1.5">{status.icon}</span>
                            {status.text}
                        </span>
                    </div>
                );
            },
        },
        { key: 'actions', label: 'การดำเนินการ', align: 'center' },
    ];

    return (
        <GenericTable
            title="ประวัติการขาย"
            data={sales}
            columns={saleColumns}
            idField="id"
            actions={(row) => (
                <div className="flex justify-center gap-2">
                    <button className="group relative p-1.5 text-yellow-600 transition duration-200 hover:scale-110" onClick={() => handleEdit(row)}>
                        <Pencil size={16} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-yellow-500 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                            แก้ไข
                        </span>
                    </button>

                    <button className="group relative p-1.5 text-red-700 transition duration-200 hover:scale-110" onClick={() => handleDelete(row)}>
                        <Trash2 size={16} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-red-600 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                            ลบ
                        </span>
                    </button>
                </div>
            )}
        />
    );
}
