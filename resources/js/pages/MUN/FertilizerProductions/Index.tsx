import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Inertia } from '@inertiajs/inertia';
import { useState } from 'react';
import Button from '@/components/Buttons/Button';
import { Plus } from 'lucide-react';
import FerProductionForm from './FerProductionForm';

export default function Index({ productions, lines }) {

    const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [selectedProduction, setSelectedProduction] = useState<any>(null);

    function openCreate() {
        setMode('create');
        setSelectedProduction(null);
        setIsProductionModalOpen(true);
    }
    // const handleDelete = (id) => {
    //     if(confirm('Delete this production?')) {
    //         Inertia.delete(route('fertilizer-productions.destroy', id));
    //     }
    // }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Fertilizer Productions', href: '/roles' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6">
                {/* Header Section */}
                <div className="mb-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Fertilizer Productions</h1>
                        <p className="text-sm text-gray-500">จัดการข้อมูลการขายและสินค้าเกษตรของคุณ</p>
                    </div>

                    <div className="flex w-full flex-nowrap items-center justify-end gap-3 py-1 md:w-auto">
                        <Button
                            onClick={openCreate}
                            icon={<Plus className="h-5 w-5" />}
                            iconPosition="left"
                            variant="success"
                            className="flex-shrink-0 whitespace-nowrap"
                        >
                            Create
                        </Button>
                    </div>
                </div>
                <table className="min-w-full border bg-white">
                    <thead>
                        <tr>
                            <th className="border px-4 py-2">Date</th>
                            <th className="border px-4 py-2">Shift</th>
                            <th className="border px-4 py-2">Line</th>
                            <th className="border px-4 py-2">Product Qty</th>
                            <th className="border px-4 py-2">Target Qty</th>
                            <th className="border px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    {/* <tbody>
                        {productions.map((prod) => (
                            <tr key={prod.id}>
                                <td className="border px-4 py-2">{prod.date}</td>
                                <td className="border px-4 py-2">{prod.shift}</td>
                                <td className="border px-4 py-2">{prod.line.name}</td>
                                <td className="border px-4 py-2">{prod.product_qty}</td>
                                <td className="border px-4 py-2">{prod.target_qty}</td>
                                <td className="space-x-2 border px-4 py-2">
                                    <button onClick={() => handleEdit(prod.id)} className="text-red-500">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(prod.id)} className="text-red-500">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody> */}
                </table>
            </div>

            {/* Sale Form Modal */}
            <ModalForm
                isModalOpen={isProductionModalOpen}
                onClose={() => setIsProductionModalOpen(false)}
                title={mode === 'create' ? 'บันทึกข้อมูลการผลิต' : 'แก้ไขข้อมูลการผลิต'}
                description="กรอกข้อมูลการผลิต"
                size="max-w-1xl"
            >
                <FerProductionForm
                    productions={productions}
                    onClose={() => setIsProductionModalOpen(false)}
                    onSuccess={() => setIsProductionModalOpen(false)}
                    mode={mode}
                />
            </ModalForm>
        </AppLayout>
    );
}
