import Button from '@/components/Buttons/Button';
import DeleteModal from '@/components/DeleteModal';
import Select from '@/components/Inputs/Select';
import ModalForm from '@/components/ModalForm';
import SummaryCard from '@/components/SummaryCard';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import dayjs from 'dayjs';
import { DollarSign, Plus, ShoppingCart, Search, Filter, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import PayForm from './PayForm';
import SaleForm from './SaleForm';
import SaleTable from './SaleTable';

interface Sale {
    id: number;
    date: string;
    customer: string;
    product: string;
    quantity: number;
    price: number;
    status: string;
    total_amount: number;
    deposit: number;
    paid_amount: number;
    sale_date: string;
    payment_status: string;
    customer_id: number;
    product_id: number;
    invoice_no: string;
}

interface Product {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
}

interface Payment {
    id: number;
    // เพิ่ม properties อื่นๆ ตามต้องการ
}

interface IndexProps {
    sales: Sale[];
    products: Product[];
    locations: any[];
    customers: Customer[];
    payments: Payment[];
}

export default function Index(props: IndexProps) {
    const { sales, products, locations, customers, payments } = props;
    const page = usePage<{ auth: { user: any; permissions: string[] } }>();
    const userPermissions = page.props.auth.permissions || [];
    const [mode, setMode] = useState<'create' | 'edit' | 'pay'>('create');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [productsAPI, setProductsAPI] = useState<string[]>([]);

    function openCreate() {
        setMode('create');
        setSelectedSale(null);
        setIsSaleModalOpen(true);
    }

    const handlePay = (sale: Sale) => {
        setMode('pay');
        setSelectedSale(sale);
        setIsPayModalOpen(true);
    };

    const handleEdit = (sale: Sale) => {
        setMode('edit');
        setSelectedSale(sale);
        setIsSaleModalOpen(true);
    };

    const handleEditWithPermission = (sale: Sale) => {
        if (userPermissions.includes('Admin.edit')) {
            handleEdit(sale);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถแก้ไขข้อมูลได้',
                text: 'คุณไม่มีสิทธิ์ในการแก้ไขข้อมูล',
                customClass: { popup: 'custom-swal' },
            });
        }
    };

    const handleDeleteWithPermission = (sale: Sale) => {
        if (userPermissions.includes('Admin.delete')) {
            openDeleteModal(sale.id);
        } else {
            Swal.fire({
                icon: 'error',
                customClass: { popup: 'custom-swal' },
                title: 'ไม่สามารถลบข้อมูลได้',
                text: 'คุณไม่มีสิทธิ์ในการลบข้อมูล',
            });
        }
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);

    const openDeleteModal = (id: number) => {
        setSelectedSaleId(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedSaleId(null);
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
        if (selectedSaleId) {
            router.delete(route('sales.destroy', selectedSaleId), {
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'ลบรายการขายเรียบร้อยแล้ว',
                    });
                    closeDeleteModal();
                },
                onError: () => {
                    Toast.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาดในการลบรายการขาย',
                    });
                },
                preserveScroll: true,
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'รายการขายสินค้าเกษตร', href: '/sales' },
    ];

    const optionStatus = [
        { value: 'all', label: 'ทั้งหมด' },
        { value: 'pending', label: 'ค้างชําระเงิน' },
        { value: 'partial', label: 'ชําระเงินบางส่วน' },
        { value: 'completed', label: 'ชําระเงินแล้ว' },
    ];

    // จำนวนผู้ใช้งานทั้งหมด
    const totalCustomers = customers?.length ?? 0;

    // คำสั่งซื้อวันนี้
    const today = dayjs().format('YYYY-MM-DD');
    const ordersToday = sales.filter((s: Sale) => {
        const saleDate = dayjs(s.sale_date).format('YYYY-MM-DD');
        return saleDate === today;
    }).length;

    // รายได้รวม (บาท)
    const totalRevenue = sales.reduce((sum: number, s: Sale) => sum + Number(s.total_amount ?? 0), 0);
    const totalDeposit = sales.reduce((sum: number, s: Sale) => sum + Number(s.deposit ?? 0), 0);

    // ✅ ยอดขายรวมเฉพาะวันนี้
    const revenueToday = sales
        .filter((s: Sale) => dayjs(s.sale_date).format('YYYY-MM-DD') === today)
        .reduce((sum: number, s: Sale) => sum + (s.total_amount ?? 0), 0);

    // ✅ จำนวนรวมเฉพาะวันนี้
    const QtyToday = sales
        .filter((s: Sale) => dayjs(s.sale_date).format('YYYY-MM-DD') === today)
        .reduce((sum: number, s: Sale) => sum + (s.quantity ?? 0), 0);

    // คำนวณยอดค้างชำระ
    const pendingPaymentsCount = sales.filter((s: Sale) => {
        const paymentStatus = s.payment_status || 'pending';
        return paymentStatus === 'pending' || paymentStatus === 'partial';
    }).length;

    // คำนวณสถิติตาม payment_status
    const paymentStats = {
        completed: sales.filter(s => s.payment_status === 'completed').length,
        partial: sales.filter(s => s.payment_status === 'partial').length,
        pending: sales.filter(s => s.payment_status === 'pending').length,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="รายการขายสินค้าเกษตร" />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 p-4 font-anuphan md:p-6">
                {/* Header Section */}
                <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                <ShoppingCart className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 lg:text-3xl">ระบบการขายสินค้าเกษตร</h1>
                                <p className="mt-1 text-gray-600">จัดการข้อมูลการขายและสินค้าเกษตรของคุณอย่างมีประสิทธิภาพ</p>
                                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                        <span>ทั้งหมด {sales.length} รายการ</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4 text-blue-500" />
                                        <span>{totalCustomers} ลูกค้า</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={openCreate}
                            icon={<Plus className="h-5 w-5" />}
                            iconPosition="left"
                            variant="success"
                            className="flex-shrink-0 whitespace-nowrap shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                        >
                            สร้างรายการขาย
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        title="จำนวนการขายวันนี้"
                        value={QtyToday ? Number(QtyToday).toLocaleString('th-TH') : '0'}
                        icon={ShoppingCart}
                        color="blue"
                        description="เทียบกับวันก่อน"
                        className="bg-gradient-to-br from-blue-50 to-blue-100"
                    />
                    <SummaryCard
                        title="รายได้วันนี้"
                        value={
                            revenueToday ? Number(revenueToday).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'
                        }
                        icon={DollarSign}
                        color="green"
                        description="บาท"
                        className="bg-gradient-to-br from-green-50 to-emerald-100"
                    />
                    <SummaryCard
                        title="รายได้รวม"
                        value={
                            totalRevenue ? Number(totalRevenue).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'
                        }
                        icon={DollarSign}
                        color="purple"
                        description="บาท"
                        className="bg-gradient-to-br from-purple-50 to-violet-100"
                    />
                    <SummaryCard
                        title="ยอดค้างชำระ"
                        value={
                            totalDeposit ? Number(totalDeposit).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'
                        }
                        icon={DollarSign}
                        color="red"
                        description="บาท"
                        className="bg-gradient-to-br from-orange-50 to-amber-100"
                    />
                </div>

                {/* Filters and Search Section */}
                <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Search Section (สามารถเปิดใช้งานได้เมื่อต้องการ) */}
                        {/*
                        <div className="flex-1">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาลูกค้า, สินค้า, หรือรหัสคำสั่งซื้อ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                />
                            </div>
                        </div>
                        */}

                        {/* <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                                <Filter className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">สถานะ:</span>
                                <Select
                                    value={statusFilter}
                                    onChange={(value) => setStatusFilter(value)}
                                    options={optionStatus}
                                    className="min-w-[180px]"
                                />
                            </div>
                        </div> */}
                    </div>

                    {/* Quick Stats */}
                    <div className=" flex flex-wrap gap-4">
                        <div className="rounded-lg bg-blue-50 px-3 py-1">
                            <span className="text-sm font-medium text-blue-700">ทั้งหมด: {sales.length}</span>
                        </div>
                        <div className="rounded-lg bg-green-50 px-3 py-1">
                            <span className="text-sm font-medium text-green-700">ชำระแล้ว: {paymentStats.completed}</span>
                        </div>
                        <div className="rounded-lg bg-yellow-50 px-3 py-1">
                            <span className="text-sm font-medium text-yellow-700">ชำระบางส่วน: {paymentStats.partial}</span>
                        </div>
                        <div className="rounded-lg bg-red-50 px-3 py-1">
                            <span className="text-sm font-medium text-red-700">ค้างชำระ: {paymentStats.pending}</span>
                        </div>
                    </div>
                </div>

                {/* Sales Table Section */}
                <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
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

                {/* Sale Form Modal */}
                <ModalForm
                    isModalOpen={isSaleModalOpen}
                    onClose={() => setIsSaleModalOpen(false)}
                    title={mode === 'create' ? 'บันทึกการขายสินค้า' : 'แก้ไขการขายสินค้า'}
                    description="กรุณากรอกข้อมูลรายการขายให้ครบถ้วน"
                    size="max-w-5xl"
                >
                    <SaleForm
                        customers={customers}
                        products={products}
                        locations={locations}
                        onClose={() => setIsSaleModalOpen(false)}
                        onSuccess={() => setIsSaleModalOpen(false)}
                        mode={mode}
                        sale={selectedSale}
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
                        products={products}
                        locations={locations}
                        payments={payments}
                        onClose={() => setIsPayModalOpen(false)}
                        onSuccess={() => setIsPayModalOpen(false)}
                        mode={mode}
                        sale={selectedSale}
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
