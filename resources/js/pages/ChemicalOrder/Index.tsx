import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ModalForm from '@/components/ModalForm';
import UseForm from './UseForm';
import DetailView from './DetailOrder';
import { can } from '@/lib/can';
import Swal from 'sweetalert2';
import { Eye, Pencil, Trash2, Plus, Calendar, FlaskRound } from "lucide-react";

interface OrderItem {
    id: number;
    chemical_name: string;
    quantity: number;
}

interface Order {
    id: number;
    lot_number: string;
    order_date: string;
    items?: OrderItem[];
}

interface Props {
    orders: Order[];
    pagination: any;
    chemicals: { id: number; name: string }[]; // เพิ่มบรรทัดนี้
}


export default function ChemicalOrdersIndex({ orders, pagination, chemicals }: Props) {



    const [isModalOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailOrder, setDetailOrder] = useState<Order | null>(null);

    // const canCreate = can('orders.create');
    // const canEdit = can('orders.edit');
    // const canDelete = can('orders.delete');

    const openCreate = () => {
        setMode('create');
        setSelectedOrder(null);
        setIsOpen(true);
    };

    const handleDelete = (order: Order | null) => {
        if (!order) return;
        Swal.fire({
            title: 'คุณแน่ใจหรือไม่?',
            text: `คุณกำลังจะลบ Order Lot: ${order.lot_number}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ลบ!',
            cancelButtonText: 'ยกเลิก',
        }).then(result => {
            if (result.isConfirmed) {
                router.delete(`/orders/${order.id}`, {
                    onSuccess: () => {
                        router.reload({ only: ['orders', 'pagination'] });
                        Swal.fire('ลบสำเร็จ!', '', 'success');
                    },
                    onError: () => Swal.fire('เกิดข้อผิดพลาด!', '', 'error')
                });
            }
        });
    };

    const handlePagination = (url?: string) => {
        if (url) router.visit(url, { preserveState: true, preserveScroll: true, only: ['orders', 'pagination'] });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: "หน้าหลัก", href: route('dashboard') },
            { title: "Order / Lot สารเคมี", href: route('orders.index') },
        ]}>
            <Head title="Chemical Orders">
                <link href="https://fonts.googleapis.com/css2?family=Anuphan:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="px-4 py-4 sm:px-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg"><FlaskRound className="h-5 w-5 text-blue-600" /></div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Chemical Orders / Lots</h1>
                            <p className="text-xs text-gray-500 mt-1">จัดการ Order และ Lot ของสารเคมี</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* {canCreate && ( */}
                        <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-500 text-white px-3 py-2 rounded-lg">
                            <Plus size={16} /> เพิ่ม Order / Lot
                        </button>
                        {/* )} */}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
                    <table className="w-full text-base">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase">Lot Number</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase">วันที่สั่ง</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 uppercase">จำนวนรายการ</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 uppercase">การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {orders.length > 0 ? orders.map((order, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/30 transition-colors duration-150">
                                    <td className="px-3 py-3 font-medium text-gray-900">{order.lot_number}</td>
                                    <td className="px-3 py-3 text-gray-700">{order.order_date}</td>
                                    <td className="px-2 py-3 text-center">
                                        <button onClick={() => { setDetailOrder(order); setIsDetailOpen(true); }}
                                            className="inline-flex items-center gap-1.5 py-1 px-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 text-xs">
                                            <span className="font-semibold">{order.items?.length ?? 0}</span> รายการ <Eye size={12} className="opacity-80" />
                                        </button>
                                    </td>
                                    <td className="px-2 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {canEdit && <button onClick={() => { setMode("edit"); setSelectedOrder(order); setIsOpen(true); }} className="p-1.5 rounded-lg bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200"><Pencil size={14} /></button>}
                                            {canDelete && <button onClick={() => handleDelete(order)} className="p-1.5 rounded-lg bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"><Trash2 size={14} /></button>}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-3 py-4 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <FlaskRound className="h-8 w-8 mb-1.5 opacity-50" />
                                            <p className="text-xs">ยังไม่มี Order / Lot</p>
                                            <p className="text-[11px] mt-0.5">กรุณาเพิ่มข้อมูลใหม่</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>


                {/* Modal Create/Edit */}
                {isModalOpen && (
                    <ModalForm
                        isModalOpen={isModalOpen}
                        onClose={() => setIsOpen(false)}
                        title={mode === 'create' ? 'เพิ่ม Order / Lot' : 'แก้ไข Order / Lot'}
                        size="max-w-2xl"
                    >
                        <UseForm
                            key={mode + '_' + Date.now()}
                            mode={mode}
                            data={selectedOrder}
                            chemicals={chemicals} // prop chemicals ต้องมาจาก parent
                            onClose={() => setIsOpen(false)}
                            onSuccess={() => {
                                router.reload({ only: ['orders', 'pagination'] });
                                Swal.fire({
                                    position: 'center',
                                    icon: 'success',
                                    title: mode === 'create' ? 'เพิ่มสำเร็จ' : 'แก้ไขสำเร็จ',
                                    showConfirmButton: false,
                                    timer: 1500,
                                });
                            }}
                        />
                    </ModalForm>
                )}
            </div>
        </AppLayout>
    );
}
