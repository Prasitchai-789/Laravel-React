import GenericTable, { Column } from '@/components/Tables/GenericTable';
import { Pencil, SquarePen, Trash2 } from 'lucide-react';

interface Product {
    id: number;
    sku: string;
    name: string;
    stock: number;
    price: number;
    store_id: number;
    location?: { location_name: string };
}

interface ProductTableProps {
    products: Product[];
    onStockEdit?: (product: Product) => void;
    onEdit?: (product: Product) => void;
    onDelete?: (product: Product) => void;
}

const productsColumns: Column<Product>[] = [
    { key: 'sku', label: 'รหัสสินค้า', sortable: true },
    { key: 'name', label: 'ชื่อสินค้า', sortable: true, align: 'center' },
    {
        key: 'stock',
        label: 'จำนวน',
        sortable: true,
        align: 'center',
        render: (product) => (product.stock !== undefined && product.stock !== null ? product.stock.toLocaleString('th-TH') : '-'),
    },
    { key: 'price', label: 'ราคา (บาท)', sortable: true, align: 'center' },
    {
        key: 'store_id',
        label: 'สถานที่',
        sortable: true,
        align: 'center',
        render: (product: Product) => product.location?.location_name ?? '-',
    },
    { key: 'actions', label: 'การดำเนินการ', align: 'center' },
];

export default function ProductTable({ products, onStockEdit, onEdit, onDelete }: ProductTableProps) {
    const handleStockEdit = (product: Product) => {
        if (onStockEdit) {
            onStockEdit(product);
        }
    };
    const handleEdit = (product: Product) => {
        if (onEdit) {
            onEdit(product);
        }
    };

    const handleDelete = (product: Product) => {
        if (onDelete) {
            onDelete(product);
        }
    };

    return (
        <>
            <GenericTable
                title="รายการสินค้า"
                data={products}
                columns={productsColumns}
                idField="id"
                actions={(row) => (
                    <div className="flex justify-center gap-2">
                        <button
                            onClick={() => handleStockEdit(row)}
                            className="group relative p-1.5 font-anuphan text-blue-600 transition-colors duration-200 hover:scale-110 hover:cursor-pointer"
                        >
                            <SquarePen size={16} />
                            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 transform rounded-md bg-blue-500 px-2 py-1 font-anuphan text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                เพิ่ม/ลด สินค้า
                            </span>
                        </button>
                        <button
                            onClick={() => handleEdit(row)}
                            className="group relative p-1.5 font-anuphan text-yellow-600 transition-colors duration-200 hover:scale-110 hover:cursor-pointer"
                        >
                            <Pencil size={16} />
                            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 transform rounded-md bg-yellow-500 px-2 py-1 font-anuphan text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                แก้ไข
                            </span>
                        </button>

                        <button
                            onClick={() => handleDelete(row)}
                            className="group relative p-1.5 font-anuphan text-red-700 transition-colors duration-200 hover:scale-110 hover:cursor-pointer"
                        >
                            <Trash2 size={16} />
                            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 transform rounded-md bg-red-600 px-2 py-1 font-anuphan text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                ลบข้อมูล
                            </span>
                        </button>
                    </div>
                )}
            />
        </>
    );
}
