import ProductSelect from '@/components/ProductSelect';
import SaleTable from '@/Components/SaleTable';
import SummaryCard from '@/Components/SummaryCard';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Calendar, DollarSign, Download, Filter, Plus, Search, ShoppingCart, Users } from 'lucide-react';
import { useState } from 'react';
import SaleForm from './SaleForm';
import ModalForm from '@/components/ModalForm';

const products = [
    { id: 1, name: 'ปาล์มน้ำมัน', category: 'น้ำมัน', price: 1200, stock: 150 },
    { id: 2, name: 'น้ำมันดิบ', category: 'น้ำมัน', price: 950, stock: 200 },
    { id: 3, name: 'ผลไม้ปาล์ม', category: 'ผลไม้', price: 850, stock: 75 },
    { id: 4, name: 'น้ำมันปาล์มสกัด', category: 'น้ำมัน', price: 1500, stock: 50 },
];

const salesData = [
    { id: 1, date: '2025-08-01', customer: 'บริษัท A', product: 'น้ำมันปาล์ม', quantity: 10, price: 1200, status: 'completed' },
    { id: 2, date: '2025-08-02', customer: 'หจก. B', product: 'ผลปาล์มสด', quantity: 5, price: 850, status: 'completed' },
    { id: 3, date: '2025-08-03', customer: 'ร้านค้า C', product: 'น้ำมันดิบ', quantity: 8, price: 950, status: 'pending' },
    { id: 4, date: '2025-08-04', customer: 'ฟาร์ม D', product: 'น้ำมันปาล์มสกัด', quantity: 3, price: 1500, status: 'completed' },
];

export default function Index(props) {
    const { sales, summary, filters } = props;
    const [isOpen, setIsOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [statusFilter, setStatusFilter] = useState('all');

    // กรองข้อมูลการขายตาม search term และ product ที่เลือก
    const filteredSales = salesData.filter((sale) => {
        const matchesSearch =
            searchTerm === '' ||
            sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.product.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesProduct = selectedProduct === '' || sale.product === products.find((p) => p.id.toString() === selectedProduct)?.name;

        const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;

        return matchesSearch && matchesProduct && matchesStatus;
    });


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState('create');
    function openCreate() {
        setMode('create');
        setIsModalOpen(true);
    }
    // ข้อมูลสรุปสำหรับ SummaryCard
    const summaryData = {
        totalUsers: '1,250',
        todayOrders: '320',
        totalRevenue: '฿ 45,000',
        monthlyGrowth: '12.5%',
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Palm Purchase Dashboard', href: '/roles' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Palm Purchase Dashboard" />
            <div className="min-h-screen bg-gray-50 p-4 font-anuphan md:p-6">
                {/* Header Section */}
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <SummaryCard
                        title="ผู้ใช้งานทั้งหมด"
                        value={summaryData.totalUsers}
                        icon={Users}
                        color="blue"
                        trend={{ value: 12.5, isPositive: true }}
                    />
                    <SummaryCard
                        title="คำสั่งซื้อวันนี้"
                        value={summaryData.todayOrders}
                        icon={ShoppingCart}
                        color="green"
                        trend={{ value: 8.2, isPositive: true }}
                    />
                    <SummaryCard
                        title="รายได้ (บาท)"
                        value={summaryData.totalRevenue}
                        icon={DollarSign}
                        color="yellow"
                        trend={{ value: 5.7, isPositive: true }}
                        description="เดือนนี้เพิ่มขึ้น 5.7%"
                    />
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

                            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-700">
                                <Download size={16} />
                                <span>ส่งออก</span>
                            </button>
                        </div>
                    </div>

                    {/* Date Range Filter (แสดงเมื่อคลิกตัวกรองเพิ่มเติม) */}
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="date"
                                placeholder="วันที่เริ่มต้น"
                                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">ถึง</span>
                            <input
                                type="date"
                                placeholder="วันที่สิ้นสุด"
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
                    <div className="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">ประวัติการขาย</h2>
                        </div>
                    </div>
                    <SaleTable sales={filteredSales} />
                </div>

                {/* Sale Form Modal */}
                <ModalForm
                    isModalOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={mode === 'create' ? 'Create Project' : 'Edit Project'}
                    description="บันทึกข้อมูลโครงการ"
                    size="max-w-3xl"
                >
                    <SaleForm  onClose={() => setIsOpen(false)} />
                </ModalForm>

            </div>
        </AppLayout>
    );
}
