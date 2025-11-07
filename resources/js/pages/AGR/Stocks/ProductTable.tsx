import GenericTable, { Column } from '@/components/Tables/GenericTable';
import { Pencil, SquarePen, Trash2, Package, MapPin, Tag } from 'lucide-react';

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
    {
        key: 'sku',
        label: 'รหัสสินค้า',
        sortable: true,
        render: (product) => (
            <div className="flex items-center gap-2 min-w-[120px]">
                <Tag size={14} className="text-blue-600 flex-shrink-0" />
                <span className="font-mono text-sm font-medium text-gray-900 bg-blue-50 px-2 py-1 rounded">
                    {product.sku}
                </span>
            </div>
        )
    },
    {
        key: 'name',
        label: 'ชื่อสินค้า',
        sortable: true,
        align: 'left',
        render: (product) => (
            <div className="min-w-[200px]">
                <div className="font-semibold text-gray-900 line-clamp-2">
                    {product.name}
                </div>
            </div>
        )
    },
    {
        key: 'stock',
        label: 'จำนวน',
        sortable: true,
        align: 'center',
        render: (product) => (
            <div className="flex flex-col items-center min-w-[80px]">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    product.stock > 10
                        ? 'bg-green-100 text-green-800'
                        : product.stock > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    <Package size={14} />
                    {product.stock !== undefined && product.stock !== null
                        ? product.stock.toLocaleString('th-TH')
                        : '-'}
                </div>
            </div>
        ),
    },
    {
        key: 'price',
        label: 'ราคา (บาท)',
        sortable: true,
        align: 'center',
        render: (product) => (
            <div className="min-w-[100px]">
                <div className="text-lg font-bold text-purple-700">
                    ฿{product.price.toLocaleString('th-TH')}
                </div>
            </div>
        )
    },
    {
        key: 'store_id',
        label: 'สถานที่',
        sortable: true,
        align: 'center',
        render: (product: Product) => (
            <div className="flex items-center justify-center gap-2 min-w-[120px]">
                <MapPin size={14} className="text-gray-600 flex-shrink-0" />
                <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                    {product.location?.location_name ?? '-'}
                </span>
            </div>
        ),
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
        <div className="p-4">
            {/* <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Package className="text-blue-600" size={24} />
                            รายการสินค้า
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            ทั้งหมด {products.length} รายการ
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                            <span>มีสต็อก</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                            <span>สต็อกน้อย</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                            <span>ไม่มีสต็อก</span>
                        </div>
                    </div>
                </div>
            </div> */}

            <GenericTable
                data={products}
                columns={productsColumns}
                idField="id"
                emptyMessage={
                    <div className="text-center py-12">
                        <Package size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีข้อมูลสินค้า</h3>
                        <p className="text-gray-500">ยังไม่มีสินค้าในระบบ</p>
                    </div>
                }
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
                rowClassName="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                headerClassName="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200"
                thClassName="px-4 py-3 font-semibold text-gray-700 text-sm uppercase tracking-wide"
                tdClassName="px-4 py-4"
            />
        </div>
    );
}
