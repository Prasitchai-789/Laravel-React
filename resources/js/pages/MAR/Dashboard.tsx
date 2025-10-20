import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { useState } from 'react';
import ProductPieChart from '../../components/MAR/ProductPieChart';
import RecentSalesTable from '../../components/MAR/RecentSalesTable';
import StatCard from '../../components/MAR/StatCard';
import { mockData } from '../../data/mockData';
import { SalesChartVariants } from '@/components/MAR/SalesChart';

const Dashboard = () => {
    const [dateRange, setDateRange] = useState('monthly');
    const [selectedProduct, setSelectedProduct] = useState('all');

    const products = [
        { id: 'all', name: 'ทั้งหมด' },
        { id: 'palm_oil', name: 'น้ำมันปาล์มดิบ' },
        { id: 'palm_seeds', name: 'เมล็ดในปาล์ม' },
        { id: 'palm_shell', name: 'กะลาปาล์ม' },
        { id: 'chopped_bunch', name: 'ทะลายสับ' },
        { id: 'empty_bunch', name: 'ทะลายปาล์มเปล่า' },
        { id: 'palm_fiber', name: 'ใยปาล์ม' },
    ];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Expense Documents', href: '/memo/documents' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">รายงานการขายสินค้า</h1>
                        <p className="mt-2 text-gray-600">วิเคราะห์ข้อมูลเพื่อช่วยในการตัดสินใจทางธุรกิจ</p>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex flex-wrap gap-2">
                            {products.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => setSelectedProduct(product.id)}
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                        selectedProduct === product.id
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {product.name}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="daily">รายวัน</option>
                                <option value="weekly">รายสัปดาห์</option>
                                <option value="monthly">รายเดือน</option>
                                <option value="yearly">รายปี</option>
                            </select>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="ยอดขายรวม" value="1,250,000" change="+12.5%" changeType="positive" icon="💰" />
                        <StatCard title="ปริมาณขายรวม" value="850 ตัน" change="+8.3%" changeType="positive" icon="⚖️" />
                        <StatCard title="ลดหนี้" value="75,000" change="-5.2%" changeType="negative" icon="📉" />
                        <StatCard title="ราคาเฉลี่ย" value="1,470 บาท/ตัน" change="+3.8%" changeType="positive" icon="📊" />
                    </div>

                    {/* Charts */}
                    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
                            <h2 className="mb-4 text-xl font-semibold text-gray-800">แนวโน้มการขาย</h2>
                            {/* <SalesChart data={mockData.salesTrend} /> */}
                            <SalesChartVariants.Animated data={mockData.salesTrend} height={450} />
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-xl font-semibold text-gray-800">สัดส่วนการขายแยกสินค้า</h2>
                            <ProductPieChart data={mockData.productDistribution} />
                        </div>
                    </div>

                    {/* Recent Sales & Performance */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
                            <h2 className="mb-4 text-xl font-semibold text-gray-800">รายการขายล่าสุด</h2>
                            <RecentSalesTable data={mockData.recentSales} />
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-xl font-semibold text-gray-800">ประสิทธิภาพสินค้า</h2>
                            <div className="space-y-4">
                                {mockData.productPerformance.map((product, index) => (
                                    <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                        <div>
                                            <p className="font-medium text-gray-800">{product.name}</p>
                                            <p className="text-sm text-gray-600">ปริมาณ: {product.volume}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">{product.revenue}</p>
                                            <p className={`text-sm ${product.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {product.change >= 0 ? '+' : ''}
                                                {product.change}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Dashboard;
