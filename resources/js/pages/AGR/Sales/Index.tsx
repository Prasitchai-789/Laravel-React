import Button from '@/components/Buttons/Button';
import ModalForm from '@/components/ModalForm';
import ProductSelect from '@/components/ProductSelect';
import { Column } from '@/components/Tables/GenericTable';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Calendar, Download, Filter, Plus, Search } from 'lucide-react';
import { useState } from 'react';
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
}

export default function Index(props) {
    const { sales, summary, filters, products, locations, customers } = props;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [statusFilter, setStatusFilter] = useState('all');

    function openCreate() {
        setMode('create');
        setIsModalOpen(true);
    }

    function handleClose() {
        setIsModalOpen(false);
    }



    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'รายการขายสินค้าเกษตร', href: '/roles' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="รายการขายสินค้าเกษตร" />
            <div className="min-h-screen bg-gray-50 p-4 font-anuphan md:p-6">
                {/* Header Section */}
                <div className="mb-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* <SummaryCard
                        title="ผู้ใช้งานทั้งหมด"
                        value={summary.totalUsers}
                        icon={Users}
                        color="blue"
                        trend={{ value: 12.5, isPositive: true }}
                    /> */}
                    {/* <SummaryCard
                        title="คำสั่งซื้อวันนี้"
                        value={summary.todayOrders}
                        icon={ShoppingCart}
                        color="green"
                        trend={{ value: 8.2, isPositive: true }}
                    />
                    <SummaryCard
                        title="รายได้ (บาท)"
                        value={summary.totalRevenue}
                        icon={DollarSign}
                        color="yellow"
                        trend={{ value: 5.7, isPositive: true }}
                        description="เดือนนี้เพิ่มขึ้น 5.7%"
                    /> */}
                </div>

                {/* Filters and Search Section */}
                <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาลูกค้าหรือสินค้า..."
                                    className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <select
                                    className="rounded-lg border border-gray-200 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">สถานะทั้งหมด</option>
                                    <option value="completed">ชำระเงินแล้ว</option>
                                    <option value="pending">รอดำเนินการ</option>
                                    <option value="cancelled">ยกเลิก</option>
                                </select>

                                <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50">
                                    <Filter size={16} />
                                    <span>ตัวกรองเพิ่มเติม</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                            <ProductSelect
                                products={products}
                                value={selectedProduct}
                                onChange={setSelectedProduct}
                                placeholder="เลือกสินค้าเกษตร"
                                showSearch={true}
                                showClear={true}
                                className="min-w-[200px]"
                            />

                            <button className="flex items-center gap-2 rounded-3xl bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-700">
                                <Download size={16} />
                                <span>ส่งออก</span>
                            </button>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
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
                    </div>

                    {selectedProduct && (
                        <div className="mt-4 flex items-center justify-between rounded-lg bg-green-50 px-4 py-2">
                            <p className="text-sm text-green-800">สินค้าเลือก: {products.find((p) => p.id.toString() === selectedProduct)?.name}</p>
                            <button onClick={() => setSelectedProduct('')} className="text-sm text-green-600 hover:text-green-800">
                                ล้างการเลือก
                            </button>
                        </div>
                    )}
                </div>

                {/* Sales Table Section */}
                <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-sm">
                   <SaleTable
                sales={sales}
                customers={customers}
                products={products}
            />
                </div>

                {/* Sale Form Modal */}
                <ModalForm
                    isModalOpen={isModalOpen}
                    onClose={handleClose}
                    title={mode === 'create' ? 'บันทึกการขายสินค้า' : 'แก้ไขการขายสินค้า'}
                    description="กรอกข้อมูลการขายสินค้า"
                    size="max-w-3xl"
                >
                    <SaleForm customers={props.customers} products={products} locations={locations} onClose={handleClose} />
                </ModalForm>
            </div>
        </AppLayout>
    );
}
