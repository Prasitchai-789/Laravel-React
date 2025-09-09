import DeleteModal from '@/components/DeleteModal';
import GenericTable, { Column } from '@/components/Tables/GenericTable';
import { router } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';

interface Product {
    id: number;
    sku: string;
    name: string;
    stock: number;
    price: number;
    location?: { location_name: string };
}

const productsColumns: Column<Product>[] = [
    { key: 'sku', label: 'รหัสสินค้า', sortable: true },
    { key: 'name', label: 'ชื่อสินค้า', sortable: true, align: 'center' },
    { key: 'stock', label: 'จำนวน', sortable: true, align: 'center' },
    { key: 'price', label: 'ราคา (บาท)', sortable: true, align: 'center' },
    {
        key: 'store',
        label: 'สถานที่',
        sortable: true,
        align: 'center',
        render: (product: Product) => product.location?.location_name ?? '-'
    },
    { key: 'actions', label: 'การดำเนินการ', align: 'center' },
];

export default function ProductTable({ products }: { products: Product[] }) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

    const openDeleteModal = (id: number) => {
        setSelectedProductId(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedProductId(null);
    };

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: { popup: 'custom-swal' },
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        },
    });

    const handleDelete = () => {
        if (selectedProductId) {
            router.delete(route('stock.agr.destroy', selectedProductId), {
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'ลบสินค้าเรียบร้อยแล้ว',
                    });
                    closeDeleteModal();
                    router.reload({ only: ['products'] }); // 👈 ปรับตามชื่อ prop จริงที่ใช้ใน Inertia
                },
                preserveScroll: true,
            });
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
                            className="group relative p-1.5 font-anuphan text-yellow-600 transition-colors duration-200 hover:scale-110 hover:cursor-pointer"
                        >
                            <Pencil size={16} />
                            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 transform rounded-md bg-yellow-500 px-2 py-1 font-anuphan text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                แก้ไข
                            </span>
                        </button>

                        <button
                            onClick={() => openDeleteModal(row.id)}
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

            <DeleteModal
                isModalOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                title="Delete Product"
                onConfirm={handleDelete}
            >
                <p className="text-sm text-gray-500 font-anuphan">
                    คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
            </DeleteModal>
        </>
    );
}
