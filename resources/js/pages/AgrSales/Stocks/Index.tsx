import ProductSelect from '@/components/ProductSelect';
import SaleTable from '@/Components/SaleTable';
import SummaryCard from '@/Components/SummaryCard';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Calendar, DollarSign, Download, Filter, Plus, Search, ShoppingCart, Users } from 'lucide-react';
import { useState } from 'react';
import ModalForm from '@/components/ModalForm';



export default function Index(props) {




    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'สต๊อกสินค้า', href: '/stock-agr' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Palm Purchase Dashboard" />

             {/* Header Section */}
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 font-anuphan">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">ระบบการขายสินค้าเกษตร</h1>
                        <p className="text-sm text-gray-500">จัดการข้อมูลการขายและสินค้าเกษตรของคุณ</p>
                    </div>
                    <button
                        onClick={() => openCreate()}
                        className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
                    >
                        <Plus size={18} />
                        <span>สร้างการขายใหม่</span>
                    </button>
                </div>

                {/* <ModalForm isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} mode={mode} /> */}
        </AppLayout>
    );
}
