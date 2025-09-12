import Button from '@/components/Buttons/Button';
import DeleteModal from '@/components/DeleteModal';
import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import LocationForm from './LocationForm';
import ProductForm from './ProductForm';
import ProductTable from './ProductTable';

export default function Index({ locations = [], products = [] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'สต๊อกสินค้า', href: '/stock-agr' },
    ];

    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // ฟังก์ชันเปิด modal
     const openLocationModal = () => {
        setMode('create');
        setIsLocationModalOpen(true);
    };
    const openProductModal = () => {
        setMode('create');
        setSelectedProduct(null);
        setIsProductModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setMode('edit');
        setSelectedProduct(product);
        setIsProductModalOpen(true);
    };

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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Palm Purchase Dashboard" />

            {/* Header Section */}
            <div className="flex flex-col gap-4 p-4 pb-0 font-anuphan md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-bold text-gray-800">ระบบการขายสินค้าเกษตร</h1>
                    <p className="truncate text-sm text-gray-500">จัดการข้อมูลการขายและสินค้าเกษตรของคุณ</p>
                </div>

                <div className="flex w-full flex-nowrap items-center justify-end gap-3 py-1 md:w-auto">
                    <Button onClick={() => openLocationModal()} variant="success" className="flex-shrink-0 px-6 whitespace-nowrap">
                        <span>สร้างสถานที่สินค้า</span>
                    </Button>
                    <Button
                        onClick={() => openProductModal()}
                        icon={<Plus className="h-5 w-5" />}
                        iconPosition="left"
                        className="flex-shrink-0 whitespace-nowrap"
                    >
                        สร้างรายการสินค้าใหม่
                    </Button>
                </div>
            </div>

            <ProductTable products={products} onEdit={handleEdit} onDelete={openDeleteModal} />

            {/* Product Form Modal */}
            <ModalForm
                isModalOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                title={mode === 'create' ? 'สร้างสินค้าใหม่' : 'แก้ไขสินค้า'}
                description="กรอกข้อมูลสินค้าเกษตร"
                size="max-w-lg"
            >
                <ProductForm
                    locations={locations}
                    products={products}
                    onClose={() => setIsProductModalOpen(false)}
                    onSuccess={() => setIsProductModalOpen(false)}
                    product={selectedProduct}
                    mode={mode}
                />
            </ModalForm>

            {/* Location Form Modal */}
            <ModalForm
                isModalOpen={isLocationModalOpen}
                onClose={() => setIsLocationModalOpen(false)}
                title={mode === 'create' ? 'สร้างสถานที่ใหม่' : 'แก้ไขสถานที่'}
                description="กรอกข้อมูลสถานที่ขายสินค้า"
                size="max-w-lg"
            >
                <LocationForm onClose={() => setIsLocationModalOpen(false)} onSuccess={() => setIsLocationModalOpen(false)} />
            </ModalForm>

            <DeleteModal isModalOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Delete Product" onConfirm={handleDelete}>
                <p className="font-anuphan text-sm text-gray-500">คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            </DeleteModal>
        </AppLayout>
    );
}
