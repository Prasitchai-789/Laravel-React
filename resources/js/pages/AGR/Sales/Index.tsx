import Button from '@/components/Buttons/Button';
import DeleteModal from '@/components/DeleteModal';
import Select from '@/components/Inputs/Select';
import ModalForm from '@/components/ModalForm';
import SummaryCard from '@/components/SummaryCard';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { DollarSign, Plus, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import PayForm from './PayForm';
import SaleForm from './SaleForm';
import SaleTable from './SaleTable';
import { useSalesData } from './hooks/useSalesData';

interface Sale {
    id: number;
    sale_date: string;
    customer_id: number;
    product_id: number;
    quantity: number;
    price: number;
    total_amount: number;
    deposit: number;
    paid_amount: number;
    payment_status: string;
    invoice_no: string;
    custom_product_id?: string;
    items?: any[];
}

interface Product {
    id: number;
    name: string;
    store_id?: string | number;
}

interface Customer {
    id: number;
    name: string;
}

interface Payment {
    id: number;
    paid_at?: string;
    method?: string;
    amount?: number;
    new_payment?: number;
}

interface IndexProps {
    sales: Sale[];
    products: Product[];
    locations: any[];
    customers: Customer[];
    payments: Payment[];
    next_reference: string;
}

export default function Index(props: IndexProps) {
    const { sales, products, locations, customers, payments, next_reference } = props;
    const page = usePage<{ auth: { user: any; permissions: string[] }, flash: { success?: string, error?: string } }>();
    const userPermissions = page.props.auth.permissions || [];

    useEffect(() => {
        if (page.props.flash?.error) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: page.props.flash.error,
                customClass: { popup: 'custom-swal font-anuphan' }
            });
        }
        if (page.props.flash?.success) {
            Swal.fire({
                icon: 'success',
                title: 'สำเร็จ',
                text: page.props.flash.success,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                customClass: { popup: 'custom-swal font-anuphan' }
            });
        }
    }, [page.props.flash]);

    const {
        mode,
        searchTerm,
        statusFilter,
        isCreateModalOpen,
        isEditModalOpen,
        isPayModalOpen,
        isDeleteModalOpen,
        selectedSale,
        selectedSaleId,
        setMode,
        setSearchTerm,
        setStatusFilter,
        setIsCreateModalOpen,
        setIsEditModalOpen,
        setIsPayModalOpen,
        setIsDeleteModalOpen,
        setSelectedSale,
        setSelectedSaleId,
        openCreate,
        handlePay,
        handleEdit,
        handleEditWithPermission,
        selectedItemIndex,
        handleDeleteWithPermission,
        openDeleteModal,
        closeDeleteModal,
        handleDelete,
        stats
    } = useSalesData({ sales, customers, userPermissions });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'รายการขายสินค้าเกษตร', href: '/sales' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="รายการขายสินค้าเกษตร" />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 p-4 font-anuphan md:p-6">
                {/* Header Section */}
                <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                <ShoppingCart className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 lg:text-3xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    ระบบการขายสินค้าเกษตร
                                </h1>
                                <p className="mt-1 text-gray-600">จัดการข้อมูลการขายและสินค้าเกษตรของคุณอย่างมีประสิทธิภาพ</p>
                                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                        <span>ทั้งหมด {stats.totalOrders} รายการ</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4 text-blue-500" />
                                        <span>{stats.totalCustomers} ลูกค้า</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={openCreate}
                            icon={<Plus className="h-5 w-5" />}
                            iconPosition="left"
                            variant="success"
                            className="flex-shrink-0 whitespace-nowrap shadow-lg transition-all hover:scale-105 hover:shadow-xl bg-gradient-to-r from-green-500 to-emerald-600 border-0"
                        >
                            สร้างรายการขาย
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        title="จำนวนการขายวันนี้"
                        value={stats.qtyToday.toLocaleString('th-TH')}
                        icon={ShoppingCart}
                        color="blue"
                        description="รายการ"
                        trend={{ isPositive: true, value: 0 }}
                    />
                    <SummaryCard
                        title="รายได้วันนี้"
                        value={stats.revenueToday.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        icon={DollarSign}
                        color="green"
                        description="บาท"
                        trend={{ isPositive: true, value: 0 }}
                    />
                    <SummaryCard
                        title="รายได้รวม"
                        value={stats.totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        icon={DollarSign}
                        color="purple"
                        description="บาท"
                        trend={{ isPositive: true, value: 0 }}
                    />
                    <SummaryCard
                        title="รายได้รวมที่ยังค้าง"
                        value={stats.totalDeposit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        icon={DollarSign}
                        color="red"
                        description="บาท"
                        trend={{ isPositive: false, value: 0 }}
                    />
                </div>

                {/* Filters and Search Section */}
                <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                    {/* <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">สถานะ:</span>
                                <Select
                                    value={statusFilter}
                                    onChange={(value) => setStatusFilter(value)}
                                    options={[
                                        { value: 'all', label: 'ทั้งหมด' },
                                        { value: 'pending', label: 'ค้างชําระเงิน' },
                                        { value: 'partial', label: 'ชําระเงินบางส่วน' },
                                        { value: 'completed', label: 'ชําระเงินแล้ว' },
                                    ]}
                                    className="min-w-[180px]"
                                />
                            </div>
                        </div>
                    </div> */}

                    {/* Quick Stats */}
                    <div className=" flex flex-wrap gap-4">
                        <div className="rounded-lg bg-blue-50 px-3 py-2 border border-blue-200">
                            <span className="text-sm font-medium text-blue-700">ทั้งหมด: {stats.totalOrders}</span>
                        </div>
                        <div className="rounded-lg bg-green-50 px-3 py-2 border border-green-200">
                            <span className="text-sm font-medium text-green-700">ชำระแล้ว: {stats.paymentStats.completed}</span>
                        </div>
                        <div className="rounded-lg bg-yellow-50 px-3 py-2 border border-yellow-200">
                            <span className="text-sm font-medium text-yellow-700">ชำระบางส่วน: {stats.paymentStats.partial}</span>
                        </div>
                        <div className="rounded-lg bg-red-50 px-3 py-2 border border-red-200">
                            <span className="text-sm font-medium text-red-700">ค้างชำระ: {stats.paymentStats.pending}</span>
                        </div>
                    </div>
                </div>

                {/* Sales Table Section */}
                <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
                    <SaleTable
                        sales={sales}
                        customers={customers}
                        products={products}
                        statusFilter={statusFilter}
                        onPay={handlePay}
                        onEdit={handleEditWithPermission}
                        onDelete={handleDeleteWithPermission}
                        searchTerm={searchTerm}
                    />
                </div>

                {/* Create Sale Modal */}
                <ModalForm
                    isModalOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="สร้างรายการขายสินค้า"
                    description="กรุณากรอกข้อมูลรายการขายใหม่ให้ครบถ้วน"
                    size="max-w-5xl"
                >
                    <SaleForm
                        customers={customers}
                        products={products}
                        locations={locations}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={() => setIsCreateModalOpen(false)}
                        mode="create"
                        sale={null}
                        next_reference={next_reference}
                    />
                </ModalForm>

                {/* Edit Sale Modal */}
                <ModalForm
                    isModalOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="แก้ไขการขายสินค้า"
                    description="จัดการข้อมูลการขายที่เลือก"
                    size="max-w-5xl"
                >
                    <SaleForm
                        customers={customers}
                        products={products}
                        locations={locations}
                        onClose={() => setIsEditModalOpen(false)}
                        onSuccess={() => setIsEditModalOpen(false)}
                        mode="edit"
                        sale={selectedSale}
                        next_reference={next_reference}
                        itemIndex={selectedItemIndex}
                    />
                </ModalForm>

                {/* Pay Form Modal */}
                <ModalForm
                    isModalOpen={isPayModalOpen}
                    onClose={() => setIsPayModalOpen(false)}
                    title="บันทึกการชำระเงิน"
                    description="กรอกข้อมูลการชำระเงิน"
                    size="max-w-3xl"
                >
                    <PayForm
                        customers={customers}
                        products={products as any}
                        locations={locations}
                        payments={payments as any}
                        onClose={() => setIsPayModalOpen(false)}
                        mode={mode as any}
                        sale={selectedSale as any}
                    />
                </ModalForm>

                {/* Delete Confirmation Modal */}
                <DeleteModal
                    isModalOpen={isDeleteModalOpen}
                    onClose={closeDeleteModal}
                    title="ยืนยันการลบรายการขาย"
                    onConfirm={handleDelete}
                >
                    <div className="text-center font-anuphan">
                        <h3 className="mb-2 text-lg font-semibold text-gray-800">คุณแน่ใจหรือไม่?</h3>
                        <p className="text-gray-600">การลบรายการขายนี้ไม่สามารถย้อนกลับได้</p>
                    </div>
                </DeleteModal>
            </div>
        </AppLayout>
    );
}
