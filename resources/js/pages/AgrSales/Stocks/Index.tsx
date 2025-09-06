import Button from '@/components/Buttons/Button';
import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import LocationForm from './LocationForm';
import ProductForm from './ProductForm';
import ProductTable from './ProductTable';

export default function Index({ locations = [] ,products = [] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'สต๊อกสินค้า', href: '/stock-agr' },
    ];
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState('create');
    // เพิ่ม state แยกสำหรับแต่ละ modal
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    // ฟังก์ชันเปิด modal
    const openProductModal = () => {
        setMode('create');
        setIsProductModalOpen(true);
    };

    const openLocationModal = () => {
        setMode('create');
        setIsLocationModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Palm Purchase Dashboard" />

            {/* Header Section */}
            <div className="flex flex-col gap-4 p-4 font-anuphan md:flex-row md:items-center md:justify-between pb-0">
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-bold text-gray-800">ระบบการขายสินค้าเกษตร</h1>
                    <p className="truncate text-sm text-gray-500">จัดการข้อมูลการขายและสินค้าเกษตรของคุณ</p>
                </div>

                <div className="flex w-full flex-nowrap items-center justify-end gap-3 py-1 md:w-auto">
                    <Button onClick={() => openLocationModal()} variant="success" className="flex-shrink-0 whitespace-nowrap px-6">
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

            <ProductTable products={products}/>

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
                    onClose={() => setIsProductModalOpen(false)}
                    onSuccess={() => {
                        setIsProductModalOpen(false);
                    }}
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
        </AppLayout>
    );
}
