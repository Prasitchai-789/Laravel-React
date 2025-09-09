import GenericTable, { Column } from '@/components/Tables/GenericTable';
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
    status: string;
}

export default function SaleTable({
    sales,
    customers = [],
    products = [],
}: {
    sales: Sale[];
    customers: Customer[];
    products: Product[];
}) {
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

    const saleColumns: Column<Sale>[] = [
        { key: 'sale_date', label: 'วันที่ขาย', sortable: true },
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
        { key: 'price', label: 'ราคา (บาท)', align: 'center' },
        { key: 'status', label: 'สถานะ', align: 'center' },
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
                    <button
                        className="group relative p-1.5 text-yellow-600 transition duration-200 hover:scale-110"
                        onClick={() => console.log('แก้ไข', row)}
                    >
                        <Pencil size={16} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-yellow-500 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                            แก้ไข
                        </span>
                    </button>

                    <button
                        className="group relative p-1.5 text-red-700 transition duration-200 hover:scale-110"
                        onClick={() => console.log('ลบ', row)}
                    >
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
