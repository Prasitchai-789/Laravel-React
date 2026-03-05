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
    items?: {
        id?: number;
        product_id: number;
        quantity: number;
        unit_price: number;
    }[];
}

interface SaleItemRow extends Sale {
    item_index: number;
    item_product_id: number;
    item_quantity: number;
    item_unit_price: number;
    item_line_total: number;
    item_paid_amount: number;
    item_payment_status: string;
    parentSale: Sale;
}

interface SaleTableProps {
    sales: Sale[];
    customers: Customer[];
    products: Product[];
    onPay?: (sale: Sale) => void;
    onEdit?: (sale: Sale, itemIndex?: number) => void;
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

    const handleEdit = (sale: Sale, itemIndex?: number) => {
        if (onEdit) {
            onEdit(sale, itemIndex);
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

    // 2. Flatten sales into items
    const flattenedItems: SaleItemRow[] = filteredSales.flatMap(sale => {
        if (!sale.items || sale.items.length === 0) {
            return [{
                ...sale,
                id: sale.id * 1000,
                item_index: 0,
                item_product_id: sale.product_id,
                item_quantity: sale.quantity,
                item_unit_price: sale.price,
                item_line_total: (sale.quantity || 0) * (sale.price || 0),
                item_paid_amount: 0,
                item_payment_status: sale.payment_status || 'pending',
                parentSale: sale
            }];
        }
        return sale.items.map((item: any, index: number) => ({
            ...sale,
            id: sale.id * 1000 + (item.id || index),
            item_index: index,
            item_product_id: item.product_id,
            item_quantity: item.quantity,
            item_unit_price: item.unit_price,
            item_line_total: Number(item.line_total || 0),
            item_paid_amount: Number(item.paid_amount || 0),
            item_payment_status: item.payment_status || 'pending',
            parentSale: sale
        }));
    });

    const saleColumns: Column<SaleItemRow>[] = [
        {
            key: 'sale_date',
            label: 'วันที่ขาย',
            sortable: true,
            render: (row) => (row.sale_date ? dayjs(row.sale_date).format('DD/MM/YYYY') : '-'),
        },
        {
            key: 'invoice_no',
            label: 'เลขที่เอกสาร',
            sortable: true,
            render: (row) => row.invoice_no || '-',
        },
        {
            key: 'customer_id',
            label: 'ลูกค้า',
            sortable: true,
            render: (row) => getCustomerName(row.customer_id),
        },
        {
            key: 'item_product_id',
            label: 'สินค้า',
            sortable: true,
            render: (row) => getProductName(row.item_product_id),
        },
        {
            key: 'item_quantity',
            label: 'จำนวน',
            align: 'center',
            render: (row) => Number(row.item_quantity || 0).toLocaleString('th-TH'),
        },
        {
            key: 'item_unit_price',
            label: 'ราคา (ต่อหน่วย)',
            align: 'center',
            render: (row) => Number(row.item_unit_price || 0).toLocaleString('th-TH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }),
        },
        {
            key: 'item_line_total',
            label: 'ยอดสินค้า (บาท)',
            align: 'center',
            render: (row) => Number(row.item_line_total || 0).toLocaleString('th-TH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }),
        },
        {
            key: 'item_paid_amount',
            label: 'ชำระแล้ว (บาท)',
            align: 'center',
            render: (row) => (
                <span className={`text-md font-anuphan font-bold ${row.item_paid_amount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {row.item_paid_amount > 0
                        ? Number(row.item_paid_amount).toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })
                        : '-'}
                </span>
            ),
        },
        {
            key: 'item_payment_status',
            label: 'สถานะชำระ',
            align: 'center',
            render: (row) => {
                const statusMap: Record<string, { className: string, icon: string, text: string }> = {
                    partial: {
                        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                        icon: '⚠️',
                        text: 'บางส่วน',
                    },
                    completed: {
                        className: 'bg-green-100 text-green-800 border-green-200',
                        icon: '✅',
                        text: 'ครบแล้ว',
                    },
                    pending: {
                        className: 'bg-red-100 text-red-800 border-red-200',
                        icon: '❌',
                        text: 'ค้างชำระ',
                    },
                };

                const status = statusMap[row.item_payment_status] || {
                    className: 'bg-gray-100 text-gray-800 border-gray-200',
                    icon: '❓',
                    text: 'ไม่ระบุ',
                };

                return (
                    <div className="flex justify-center">
                        <span
                            className={`inline-flex min-w-[80px] items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                        >
                            <span className="mr-1">{status.icon}</span>
                            {status.text}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'actions',
            label: 'จัดการ',
            align: 'center',
        },
    ];

    return (
        <GenericTable
            title="ประวัติการขาย (แยกตามรายการ)"
            data={flattenedItems}
            columns={saleColumns}
            idField="id"
            actions={(row) => (
                <div className="flex justify-center gap-2">
                    <button
                        className="group relative text-blue-600 transition-all duration-300 hover:scale-110 focus:outline-none"
                        onClick={() => handlePay(row.parentSale)}
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
                        onClick={() => handleEdit(row.parentSale, row.item_index)}
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
                        onClick={() => handleDelete(row.parentSale)}
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
