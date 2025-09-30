import Button from '@/components/Buttons/Button';
import DeleteModal from '@/components/DeleteModal';
import Select from '@/components/Inputs/Select';
import ModalForm from '@/components/ModalForm';
import SummaryCard from '@/components/SummaryCard';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { DollarSign, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import PayForm from './PayForm';
import SaleForm from './SaleForm';
import SaleTable from './SaleTable';
import { can } from '@/lib/can';
import { usePage } from '@inertiajs/react';



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
}

export default function Index(props) {
    const { sales, products, locations, customers, payments } = props;
    const page = usePage<{ auth: { user: any } }>();
    const userPermissions = page.props.auth.permissions;
    const [mode, setMode] = useState<'create' | 'edit' | 'pay'>('create');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

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
        if (userPermissions.includes('Adm1in.edit')) {
            handleEdit(sale); // เรียกฟังก์ชันเดิม
        } else {
            Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถแก้ไขข้อมูลได้',
                customClass: { popup: 'custom-swal' },
            });
        }
    };

    const handleDeleteWithPermission = (id: number) => {
        if (userPermissions.includes('Adm1in.delete')) {
            openDeleteModal(id);
        } else {
            Swal.fire({
                icon: 'error',
                customClass: { popup: 'custom-swal' },
                title: 'ไม่สามารถลบข้อมูลได้',

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
                        title: 'ลบสินค้าเรียบร้อยแล้ว',
                    });
                    closeDeleteModal();
                    router.reload({ only: ['sales'] }); // 👈 ปรับตามชื่อ prop จริงที่ใช้ใน Inertia
                },
                preserveScroll: true,
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'รายการขายสินค้าเกษตร', href: '/roles' },
    ];

    const optionStatus = [
        { value: 'all', label: 'ทั้งหมด' },
        { value: 'reserved', label: 'ค้างชําระเงิน' },
        { value: 'completed', label: 'ชําระเงินแล้ว' },
    ];

    // จำนวนผู้ใช้งานทั้งหมด
    // const totalUsers = customers?.length ?? 0;

    // คำสั่งซื้อวันนี้
    const today = dayjs().format('YYYY-MM-DD');

    const ordersToday = sales.filter((s: Sale) => {
        const saleDate = dayjs(s.sale_date).format('YYYY-MM-DD');
        return saleDate === today;
    }).length;

    // รายได้รวม (บาท)
    const totalRevenue = sales.reduce((sum: number, s: Sale) => sum + Number(s.total_amount ?? 0), 0);

    // ✅ ยอดขายรวมเฉพาะวันนี้
    const revenueToday = sales
        .filter((s: Sale) => dayjs(s.sale_date).format('YYYY-MM-DD') === today)
        .reduce((sum: number, s: Sale) => sum + (s.total_amount ?? 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="รายการขายสินค้าเกษตร" />
            <div className="min-h-screen bg-gray-50 p-4 font-anuphan md:p-6">
                {/* Header Section */}
                <div className="mb-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">ระบบการขายสินค้าเกษตร</h1>
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
                            สร้างรายการขาย
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="mb-1 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <SummaryCard
                        title="คำสั่งซื้อวันนี้"
                        value={ordersToday}
                        icon={ShoppingCart}
                        color="green"
                    // trend={{ value: 8.2, isPositive: true }}
                    />
                    <SummaryCard
                        title="รายได้วันนี้ (บาท)"
                        value={
                            revenueToday ? Number(revenueToday).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
                        }
                        icon={DollarSign}
                        color="yellow"
                    // trend={{ value: 5.7, isPositive: true }}
                    // description="เดือนนี้เพิ่มขึ้น 5.7%"
                    />
                    <SummaryCard
                        title="รายได้รวม (บาท)"
                        value={
                            totalRevenue ? Number(totalRevenue).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
                        }
                        icon={DollarSign}
                        color="green"
                    // trend={{ value: 5.7, isPositive: true }}
                    // description="เดือนนี้เพิ่มขึ้น 5.7%"
                    />
                </div>

                {/* Filters and Search Section */}
                <div className="mb-2">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
                        {/* <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400" />
                                <input
                                    type="date"
                                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">ถึง</span>
                                <input
                                    type="date"
                                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </div>
                            <button
                                className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                                onClick={() => setDateRange({ start: '', end: '' })}
                            >
                                ล้างช่วงวันที่
                            </button>
                        </div> */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex-1">
                                <Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    options={optionStatus}
                                    className="w-64"
                                ></Select>
                            </div>
                        </div>
                    </div>

                    {/* {selectedProduct && (
                        <div className="mt-4 flex items-center justify-between rounded-lg bg-green-50 px-4 py-2">
                            <p className="text-sm text-green-800">สินค้าเลือก: {products.find((p) => p.id.toString() === selectedProduct)?.name}</p>
                            <button onClick={() => setSelectedProduct('')} className="text-sm text-green-600 hover:text-green-800">
                                ล้างการเลือก
                            </button>
                        </div>
                    )} */}
                </div>

                {/* Sales Table Section */}
                <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-sm">
                    <SaleTable
                        sales={sales}
                        customers={customers}
                        products={products}
                        statusFilter={statusFilter}
                        onPay={handlePay}
                        onEdit={handleEditWithPermission}      // ✅ ใช้ฟังก์ชัน wrapper
                        onDelete={handleDeleteWithPermission}
                        searchTerm={searchTerm}
                    />
                </div>

                {/* Sale Form Modal */}
                <ModalForm
                    isModalOpen={isSaleModalOpen}
                    onClose={() => setIsSaleModalOpen(false)}
                    title={mode === 'create' ? 'บันทึกการขายสินค้า' : 'แก้ไขการขายสินค้า'}
                    description="กรอกข้อมูลการขายสินค้า"
                    size="max-w-3xl"
                >
                    <SaleForm
                        customers={props.customers}
                        products={products}
                        locations={locations}
                        onClose={() => setIsSaleModalOpen(false)}
                        onSuccess={() => setIsSaleModalOpen(false)}
                        mode={mode}
                        sale={selectedSale}
                    />
                </ModalForm>

                <ModalForm
                    isModalOpen={isPayModalOpen}
                    onClose={() => setIsPayModalOpen(false)}
                    title={mode === 'create' ? 'บันทึกการขายสินค้า' : 'บันทึกการชำระเงิน'}
                    description="กรอกข้อมูลการชำระเงิน"
                    size="max-w-3xl"
                >
                    <PayForm
                        customers={props.customers}
                        products={products}
                        locations={locations}
                        payments={payments}
                        onClose={() => setIsPayModalOpen(false)}
                        onSuccess={() => setIsPayModalOpen(false)}
                        mode={mode}
                        sale={selectedSale}
                    />
                </ModalForm>

                <DeleteModal
                    isModalOpen={isDeleteModalOpen}
                    onClose={closeDeleteModal}
                    title="ยืนยันการลบ"
                    onConfirm={handleDelete}
                >
                    <p className="font-anuphan text-sm text-gray-500">
                        คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                    </p>
                </DeleteModal>
            </div>
        </AppLayout>
    );
}
