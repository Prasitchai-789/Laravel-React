import GenericTable, { Column } from '@/components/Tables/GenericTable';
import { Edit, Eye, Pencil, Trash2 } from 'lucide-react';

const productsColumns: Column<product>[] = [
    { key: 'sku', label: 'รหัสสินค้า', sortable: true },
    { key: 'name', label: 'ชื่อสินค้า', sortable: true, align: 'center' },
    { key: 'stock', label: 'จำนวน', sortable: true, align: 'center' },
    { key: 'price', label: 'ราคา (บาท)', sortable: true, align: 'center' },
    { key: 'store', label: 'สถานที่', sortable: true, align: 'center', render: (product: Product) => product.location?.location_name ?? '-' },
    { key: 'actions', label: 'การดำเนินการ', align: 'center' },
];

export default function ProductTable({ products }: { products: product[] }) {
    return (
        <GenericTable
            title="รายการสินค้า"
            data={products}
            columns={productsColumns}
            idField="id"
            actions={(row) => (
                <div className="flex justify-center gap-2">
                    <button
                        className="group relative   p-1.5 font-anuphan text-yellow-600 transition-colors duration-200 hover:cursor-pointer hover:scale-110"
                        title=""
                    >
                        <Pencil size={16} />
                        <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 transform rounded-md bg-yellow-500 px-2 py-1 font-anuphan text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:scale-105 hover:cursor-pointer">
                            แก้ไข
                        </span>
                    </button>
                    <button
                        className="group relative  p-1.5 font-anuphan text-red-700 transition-colors duration-200hover:cursor-pointer hover:scale-110"
                        title=""
                    >
                        <Trash2 size={16} />
                        <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 transform rounded-md bg-red-600 px-2 py-1 font-anuphan text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:scale-105 hover:cursor-pointer">
                            ลบข้อมูล
                        </span>
                    </button>
                </div>
            )}
        />
    );
}
