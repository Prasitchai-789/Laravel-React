import GenericTable, { Column } from '@/components/Tables/GenericTable';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; // ภาษาไทย
import { Pencil, Trash2, Wallet } from 'lucide-react';

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
    invoice_no: string;
    sale_date: string;
    customer_id: number;
    product_id: number;
    quantity: number;
    price: number;
    total_amount: number;
    deposit: number;
    paid_amount: number;
    payment_status: string;
}

interface SaleTableProps {
    sales: Sale[];
    customers: Customer[];
    products: Product[];
    onPay?: (sale: Sale) => void;
    onEdit?: (sale: Sale) => void;
    onDelete?: (sale: Sale) => void;
    searchTerm?: string;
    statusFilter?: string;
}

export default function SaleTable({
    sales,
    customers = [],
    products = [],
    onPay,
    onEdit,
    onDelete,
    searchTerm = '',
    statusFilter = 'all',
}: SaleTableProps) {
    const getCustomerName = (id: number) => {
        const customer = customers.find((c) => c.id.toString() === id.toString());
        return customer ? customer.name : `#${id}`;
    };

    const getProductName = (id: number) => {
        const product = products.find((p) => p.id.toString() === id.toString());
        return product ? product.name : `#${id}`;
    };

    const handlePay = (sale: Sale) => {
        if (onPay) {
            onPay(sale);
        }
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

    // ฟังก์ชันกรองข้อมูล
    const filteredSales = sales
        .filter((sale) => {
            // กรองตาม statusFilter
            if (statusFilter !== 'all') {
                const paymentStatus = sale.payment_status || 'pending';
                if (paymentStatus !== statusFilter) return false;
            }

            // กรองตาม searchTerm
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const invoiceNo = sale.invoice_no?.toLowerCase() || '';
                const productName = getProductName(sale.product_id).toLowerCase();
                const customerName = getCustomerName(sale.customer_id).toLowerCase();

                return invoiceNo.includes(term) ||
                       productName.includes(term) ||
                       customerName.includes(term);
            }

            return true;
        })
        .sort((a, b) => b.id - a.id);

    const saleColumns: Column<Sale>[] = [
        {
            key: 'sale_date',
            label: 'วันที่ขาย',
            sortable: true,
            render: (sale) => (sale.sale_date ? dayjs(sale.sale_date).format('DD/MM/YYYY') : '-'),
        },
        {
            key: 'invoice_no',
            label: 'เลขที่เอกสาร',
            sortable: true,
            render: (sale) => sale.invoice_no || '-',
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
        {
            key: 'quantity',
            label: 'จำนวน',
            align: 'center',
            render: (sale) => Number(sale.quantity || 0).toLocaleString('th-TH'),
        },
        {
            key: 'price',
            label: 'ราคา (บาท)',
            align: 'center',
            render: (sale) => Number(sale.price || 0).toLocaleString('th-TH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }),
        },
        {
            key: 'total_amount',
            label: 'ยอดเงิน (บาท)',
            align: 'center',
            render: (sale) => Number(sale.total_amount || 0).toLocaleString('th-TH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }),
        },
        {
            key: 'paid_amount',
            label: 'ชำระแล้ว (บาท)',
            align: 'center',
            render: (sale) => (
                <span className="text-md font-anuphan font-bold text-green-600">
                    {sale.paid_amount
                        ? Number(sale.paid_amount).toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                          })
                        : '-'}
                </span>
            ),
        },
        {
            key: 'deposit',
            label: 'ค้างชำระ (บาท)',
            align: 'center',
            render: (sale) => (
                <span className="text-md font-anuphan font-bold text-red-600">
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
            key: 'payment_status',
            label: 'สถานะ',
            align: 'center',
            render: (sale) => {
                const statusMap = {
                    partial: {
                        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                        icon: '⚠️',
                        text: 'ชำระบางส่วน',
                    },
                    completed: {
                        className: 'bg-green-100 text-green-800 border-green-200',
                        icon: '✅',
                        text: 'ชำระแล้ว',
                    },
                    pending: {
                        className: 'bg-red-100 text-red-800 border-red-200',
                        icon: '❌',
                        text: 'ค้างชำระ',
                    },
                };

                const paymentStatus = sale.payment_status || 'pending';
                const status = statusMap[paymentStatus] || {
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
        {
            key: 'actions',
            label: 'การดำเนินการ',
            align: 'center'
        },
    ];

    return (
        <GenericTable
            title="ประวัติการขาย"
            data={filteredSales}
            columns={saleColumns}
            idField="id"
            actions={(row) => (
                <div className="flex justify-center gap-2">
                    <button
                        className="group relative text-blue-600 transition-all duration-300 hover:scale-110 focus:outline-none"
                        onClick={() => handlePay(row)}
                        aria-label="รับเงิน"
                    >
                        <div className="relative flex items-center justify-center">
                            <div className='rounded-lg p-1 transition-colors duration-300 bg-blue-50 group-hover:bg-blue-100'>
                                <Wallet size={18} className='text-blue-600' />
                            </div>
                                <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100">
                                    รับเงิน
                                    <div className="absolute bottom-[-4px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-blue-600"></div>
                                </span>
                        </div>
                    </button>

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
