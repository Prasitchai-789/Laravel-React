import Button from '@/components/Buttons/Button';
import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import CustomerForm from './CustomerForm';
import CustomerTable from './CustomerTable';
import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';

interface Customer {
    id: number;
    name: string;
    address?: string;
    subdistrict?: string;
    district?: string;
    province?: string;
    phone?: string;
    notes?: string;

    cityProvince?: { ProvinceID: number; ProvinceName: string };
    cityDistrict?: { DistrictID: number; DistrictName: string };
    citySubdistrict?: { SubDistrictID: number; SubDistrictName: string };
}

export default function Index({ customers = [], cities = [] }: { customers: Customer[]; cities: any[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'ทะเบียนลูกค้า', href: '/customers' },
    ];

    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const openCustomerModal = () => {
        setMode('create');
        setSelectedCustomer(null);
        setIsCustomerModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setMode('edit');
        setSelectedCustomer(customer);
        setIsCustomerModalOpen(true);
    };

    const handleDelete = (customer: Customer) => {
        Swal.fire({
    title: 'ยืนยันการลบ',
    text: `คุณต้องการลบลูกค้า "${customer.name}" ใช่หรือไม่?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก',
    customClass: {
        popup: 'font-anuphan',
        title: 'font-anuphan',
        htmlContainer: 'font-anuphan',
        confirmButton: 'font-anuphan',
        cancelButton: 'font-anuphan'
    }
}).then((result) => {
    if (result.isConfirmed) {
        router.delete(route('customers.destroy', customer.id), {
            onSuccess: () => {
                Swal.fire({
                    title: 'ลบแล้ว!',
                    text: 'ลูกค้าถูกลบเรียบร้อยแล้ว',
                    icon: 'success',
                    customClass: {
                        popup: 'font-anuphan',
                        title: 'font-anuphan',
                        htmlContainer: 'font-anuphan',
                        confirmButton: 'font-anuphan'
                    },
                    timer: 2000
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'ผิดพลาด!',
                    text: 'เกิดข้อผิดพลาดในการลบลูกค้า',
                    icon: 'error',
                    customClass: {
                        popup: 'font-anuphan',
                        title: 'font-anuphan',
                        htmlContainer: 'font-anuphan',
                        confirmButton: 'font-anuphan'
                    },
                    timer: 2000
                });
            }
        });
    }
});
    };

    // แยกจังหวัด อำเภอ ตำบล
    const provinces = [...new Map(cities.map((c) => [c.ProvinceID, { ProvinceID: c.ProvinceID, ProvinceName: c.ProvinceName }])).values()];
    const districts = cities.map((c) => ({
        DistrictID: c.DistrictID,
        DistrictName: c.DistrictName,
        ProvinceID: c.ProvinceID,
    }));
    const subdistricts = cities.map((c) => ({
        SubDistrictID: c.SubDistrictID,
        SubDistrictName: c.SubDistrictName,
        DistrictID: c.DistrictID,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ทะเบียนลูกค้า" />

            {/* Header */}
            <div className="flex flex-col gap-4 p-4 pb-0 font-anuphan md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-bold text-gray-800">ทะเบียนลูกค้า</h1>
                    <p className="truncate text-sm text-gray-500">จัดการข้อมูลลูกค้าเกษตร</p>
                </div>
                <div className="flex w-full flex-nowrap items-center justify-end gap-3 py-1 md:w-auto">
                    <Button
                        onClick={openCustomerModal}
                        icon={<Plus className="h-5 w-5" />}
                        iconPosition="left"
                        className="flex-shrink-0 whitespace-nowrap"
                    >
                        เพิ่มลูกค้าใหม่
                    </Button>
                </div>
            </div>

            <CustomerTable customers={customers} onEdit={handleEdit} onDelete={handleDelete} cities={cities} />

            <ModalForm
                isModalOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                title={mode === 'create' ? 'เพิ่มลูกค้าใหม่' : 'แก้ไขข้อมูลลูกค้า'}
                description="กรอกข้อมูลลูกค้า"
                size="max-w-2xl"
            >
                <CustomerForm
                    onClose={() => setIsCustomerModalOpen(false)}
                    onSuccess={() => setIsCustomerModalOpen(false)}
                    provinces={provinces}
                    cities={cities}
                    districts={districts}
                    subdistricts={subdistricts}
                    customer={selectedCustomer} // สำหรับ edit
                    mode={mode}
                />
            </ModalForm>
        </AppLayout>
    );
}
