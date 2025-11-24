import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import {
    Award,
    Box,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Clock,
    DollarSign,
    Download,
    Eye,
    FileBarChart,
    FileText,
    FlaskRound,
    MapPin,
    Package,
    RefreshCw,
    Scale,
    Search,
    Shield,
    ShoppingCart,
    Truck,
    User,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Interface definitions
interface DateRange {
    startDate: string;
    endDate: string;
}

interface Order {
    DocuNo: string;
    DocuDate: string;
    CustName: string;
    qty_order: number;
    qty_invoice: number;
    qty_balance: number;
    amount: number;
    AppvFlag: string;
    GoodID?: number;
}

interface Invoice {
    InvoiceNo: string;
    DocuDate: string;
    GoodName: string;
    CustPONo: string;
    qty: number;
    weight_destination: number;
    amount: number;
    transport_company: string;
    mar_lot: string;
    plan_number_car: string;
    plan_driver_name: string;
    plan_recipient_name: string;
    reference_no: string;
    coa_number: string;
    coa_result_ffa: number | string;
    coa_result_moisture: number | string;
    coa_result_iv: number | string;
    coa_result_dobi: number | string;
    coa_result_shell: number | string;
    coa_result_kn_moisture: number | string;
    GoodID: number;
}

interface Product {
    code: number;
    label: string;
    tabName: string;
}

interface SortConfig {
    key: string | null;
    direction: string;
}

export default function SalesOrder() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedSO, setSelectedSO] = useState<string | null>(null);
    const [invoiceList, setInvoiceList] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpenDetail, setIsModalOpenDetail] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [openCard, setOpenCard] = useState<number | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState('cpo');
    const [selectedCode, setSelectedCode] = useState<number>(2147);

    const products: Product[] = [
        { code: 2147, label: 'น้ำมันปาล์มดิบ', tabName: 'cpo' },
        { code: 2152, label: 'เมล็ดในปาล์ม', tabName: 'palm_kernel' },
    ];

    // Utility functions
    const getFirstDayOfMonth = (): string => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const year = firstDay.getFullYear();
        const month = String(firstDay.getMonth() + 1).padStart(2, '0');
        const day = String(firstDay.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getTodayDate = (): string => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDateForDisplay = (dateString: string): string => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // State initialization
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: getFirstDayOfMonth(),
        endDate: getTodayDate(),
    });

    // API functions - ใช้ GET ตาม Route ที่มี
    const loadOrders = (code?: number, tabName?: string) => {
        setLoading(true);

        const params = new URLSearchParams({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
        });

        // เพิ่ม products ถ้ามีการเลือก
        if (code) {
            params.append('products', code.toString());
        }

        // เพิ่ม tabName ถ้ามี
        if (tabName) {
            params.append('tabName', tabName);
        }

        // console.log('Fetching orders with params:', params.toString());

        fetch(`/orders/pending?${params}`)
            .then((res) => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then((data) => {
                setOrders(data.orders || data);
                // console.log('Data received:', data);
            })
            .catch((error) => {
                console.error('Error loading orders:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Event handlers
    const handleSelectProduct = (code: number, tabName: string) => {
        setActiveTab(tabName);
        setSelectedCode(code);
        loadOrders(code, tabName);
    };

    const handleDetail = async (docuNo: string, order: Order | null = null) => {
        setLoading(true);
        setSelectedSO(docuNo);
        setSelectedOrder(order);

        try {
            const res = await fetch(`/sales-order/${docuNo}/invoices`);
            const data = await res.json();
            setInvoiceList(data);
            setIsModalOpenDetail(true);
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: string) => {
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
        });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <ChevronDown size={14} className="opacity-30" />;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    // Effects
    useEffect(() => {
        // Load initial data when component mounts
        loadOrders(selectedCode, activeTab);
    }, []);

    useEffect(() => {
        // Load data when dateRange changes
        loadOrders(selectedCode, activeTab);
    }, [dateRange]);

    // Data processing
    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.DocuNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.CustName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'approved' && order.AppvFlag === 'Y') ||
            (statusFilter === 'pending' && order.AppvFlag !== 'Y');

        return matchesSearch && matchesStatus;
    });

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aValue = a[sortConfig.key as keyof Order];
        const bValue = b[sortConfig.key as keyof Order];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Statistics calculation
    const calculateStats = () => {
        const totalWeightOrigin = invoiceList.reduce((sum, item) => sum + Number(item.qty || 0), 0);
        const totalWeightDestination = invoiceList.reduce((sum, item) => sum + Number(item.weight_destination || item.qty || 0), 0);
        const totalAmount = invoiceList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const totalInvoices = invoiceList.length;
        const totalDiff = totalWeightDestination - totalWeightOrigin;
        const totalDiffPercent = totalWeightOrigin > 0 ? (totalDiff / totalWeightOrigin) * 100 : 0;

        return {
            totalWeightOrigin,
            totalWeightDestination,
            totalAmount,
            totalInvoices,
            totalDiff,
            totalDiffPercent,
        };
    };

    const stats = calculateStats();
console.log('stats =', stats);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'จัดการคำสั่งขาย', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="mb-6 flex items-center justify-between font-anuphan">
                        <div>
                            <div className="flex items-center space-x-3">
                                <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-3 shadow-lg">
                                    <Package className="text-white" size={32} />
                                </div>
                                <div>
                                    <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
                                        จัดการคำสั่งขาย
                                    </h1>
                                    <p className="mt-2 flex items-center text-gray-600">
                                        <Shield className="mr-2 text-green-500" size={16} />
                                        ติดตามและจัดการคำสั่งขายทั้งหมดในระบบ
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* <div className="flex items-center space-x-3">
                            <button className="flex items-center rounded-xl border border-gray-300 bg-white px-5 py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                                <Download size={18} className="mr-2" />
                                ส่งออก
                            </button>
                            <button
                                onClick={() => loadOrders(selectedCode, activeTab)}
                                className="flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                            >
                                <RefreshCw size={18} className="mr-2" />
                                รีเฟรชข้อมูล
                            </button>
                        </div> */}
                    </div>

                    {/* Stats Cards */}
                    <div className="mb-4 grid grid-cols-1 gap-4 font-anuphan md:grid-cols-3">
                        {[
                            {
                                label: 'ทั้งหมด',
                                value: orders.length,
                                icon: Package,
                                color: 'blue',
                                gradient: 'from-blue-500 to-cyan-500',
                            },
                            {
                                label: 'น้ำหนัก',
                                value: `${orders.reduce((sum, o) => sum + Number(o.qty_invoice || 0), 0).toLocaleString()} Kg.`,
                                icon: CheckCircle,
                                color: 'green',
                                gradient: 'from-green-500 to-emerald-500',
                            },
                            {
                                label: 'มูลค่ารวม',
                                value: `฿${orders.reduce((sum, o) => sum + Number(o.amount || 0), 0).toLocaleString()}`,
                                icon: DollarSign,
                                color: 'purple',
                                gradient: 'from-purple-500 to-pink-500',
                            },
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                            >
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                            <p className="mt-2 text-3xl font-bold text-gray-800">{stat.value}</p>
                                        </div>
                                        <div className={`rounded-2xl bg-gradient-to-r ${stat.gradient} p-3 shadow-lg`}>
                                            <stat.icon className="text-white" size={24} />
                                        </div>
                                    </div>
                                    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-gray-200">
                                        <div
                                            className={`h-full bg-gradient-to-r ${stat.gradient} transition-all duration-1000`}
                                            style={{
                                                width: `${Math.min(100, orders.length > 0 ? (typeof stat.value === 'number' ? (stat.value / orders.length) * 100 : 100) : 0)}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                            </div>
                        ))}
                    </div>

                    {/* Search and Filter Section */}
                    <div className="mb-4 rounded-2xl border border-gray-100/80 bg-gradient-to-br from-white to-gray-50/80 p-4 font-anuphan shadow-xl backdrop-blur-sm">
                        {/* Single Row Layout */}
                        <div className="flex flex-col items-stretch gap-4 lg:flex-row">
                            {/* Tabs - Left Side */}
                            <div className="flex-1">
                                <div className="flex w-fit space-x-1 rounded-2xl border border-gray-200/60 bg-gray-100/80 p-1.5">
                                    {products.map((product) => (
                                        <button
                                            key={product.code}
                                            onClick={() => handleSelectProduct(product.code, product.tabName)}
                                            className={`flex items-center gap-3 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                                                activeTab === product.tabName
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                                                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-800'
                                            }`}
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                {product.tabName === 'cpo' ? (
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                                    />
                                                ) : (
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                    />
                                                )}
                                            </svg>
                                            {product.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Search and Filters - Right Side */}
                            <div className="flex flex-1 items-center gap-3">
                                {/* Date Range Picker */}
                                <div className="flex min-w-[280px] items-center gap-2">
                                    <div className="group relative flex-1">
                                        <input
                                            type="date"
                                            value={dateRange.startDate}
                                            onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                                            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 transition-all duration-300 group-hover:border-gray-400 focus:border-blue-500 focus:shadow-lg focus:ring-2 focus:shadow-blue-500/20 focus:ring-blue-200/50"
                                        />
                                    </div>
                                    <span className="mx-1 text-gray-400">ถึง</span>
                                    <div className="group relative flex-1">
                                        <input
                                            type="date"
                                            value={dateRange.endDate}
                                            onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                                            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 transition-all duration-300 group-hover:border-gray-400 focus:border-blue-500 focus:shadow-lg focus:ring-2 focus:shadow-blue-500/20 focus:ring-blue-200/50"
                                        />
                                    </div>
                                </div>

                                {/* Search Input */}
                                <div className="min-w-0 flex-1">
                                    <div className="group relative">
                                        <Search
                                            className="absolute top-1/2 left-4 -translate-y-1/2 transform text-gray-400 transition-colors duration-300 group-focus-within:text-blue-500"
                                            size={20}
                                        />
                                        <input
                                            type="text"
                                            placeholder="ค้นหาด้วยเลขที่ SO หรือชื่อลูกค้า..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full rounded-2xl border border-gray-300 bg-white py-3 pr-6 pl-12 transition-all duration-300 group-hover:border-gray-400 focus:border-blue-500 focus:shadow-lg focus:ring-2 focus:shadow-blue-500/20 focus:ring-blue-200/50"
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 transition-colors duration-200 hover:text-gray-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Active Filters Display */}
                        {(searchTerm ||
                            statusFilter !== 'all' ||
                            dateRange.startDate !== getFirstDayOfMonth() ||
                            dateRange.endDate !== getTodayDate()) && (
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="text-sm text-gray-600">ตัวกรองที่ใช้งาน:</span>

                                {/* Date Range Filter */}
                                {(dateRange.startDate !== getFirstDayOfMonth() || dateRange.endDate !== getTodayDate()) && (
                                    <div className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1.5 text-sm text-purple-700">
                                        <Calendar size={14} />
                                        <span>
                                            {formatDateForDisplay(dateRange.startDate)} ถึง {formatDateForDisplay(dateRange.endDate)}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setDateRange({
                                                    startDate: getFirstDayOfMonth(),
                                                    endDate: getTodayDate(),
                                                })
                                            }
                                            className="ml-1 rounded-full p-0.5 transition-colors duration-200 hover:bg-purple-200"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}

                                {searchTerm && (
                                    <div className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-700">
                                        <Search size={14} />
                                        <span>ค้นหา: "{searchTerm}"</span>
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="ml-1 rounded-full p-0.5 transition-colors duration-200 hover:bg-blue-200"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}

                                {statusFilter !== 'all' && (
                                    <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1.5 text-sm text-green-700">
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>สถานะ: {statusFilter === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}</span>
                                        <button
                                            onClick={() => setStatusFilter('all')}
                                            className="ml-1 rounded-full p-0.5 transition-colors duration-200 hover:bg-green-200"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center py-8">
                        <div className="flex items-center space-x-2 text-blue-600">
                            <RefreshCw className="animate-spin" size={20} />
                            <span>กำลังโหลดข้อมูล...</span>
                        </div>
                    </div>
                )}

                {!loading && activeTab === 'cpo' && (
                    <div className="overflow-hidden rounded-2xl border border-gray-100 font-anuphan shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg">
                                        {[
                                            { key: 'DocuNo', label: 'เลขที่ SO', align: 'left' },
                                            { key: 'DocuDate', label: 'วันที่สั่ง', align: 'left' },
                                            { key: 'CustName', label: 'ลูกค้า', align: 'left' },
                                            { key: 'qty_order', label: 'สั่ง (kg)', align: 'right' },
                                            { key: null, label: 'ออก Inv (kg)', align: 'right' },
                                            { key: null, label: 'คงเหลือ (kg)', align: 'right' },
                                            { key: 'amount', label: 'มูลค่า', align: 'right' },
                                            { key: null, label: 'จัดการ', align: 'center' },
                                        ].map((header, index) => (
                                            <th
                                                key={index}
                                                className={`p-6 font-bold cursor-pointer border-r border-white/20 transition-all duration-300 last:border-r-0 hover:bg-white/10`}
                                                onClick={() => header.key && handleSort(header.key)}
                                            >
                                                <div
                                                    className={`flex items-center gap-2 ${header.align === 'right' ? 'justify-end' : header.align === 'center' ? 'justify-center' : 'justify-start'}`}
                                                >
                                                    {header.label}
                                                    {header.key && getSortIcon(header.key)}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {sortedOrders.map((o, i) => (
                                        <tr
                                            key={`order-${o.DocuNo}-${i}`}
                                            className="group transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 hover:shadow-lg"
                                        >
                                            {/* เลขที่ SO */}
                                            <td className="p-4">
                                                <button
                                                    className="flex transform items-center gap-2 font-bold text-blue-700 transition-all duration-300 group-hover:scale-105 group-hover:text-blue-800"
                                                    onClick={() => handleDetail(o.DocuNo, o)}
                                                >
                                                    <div className="rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 p-2 shadow-md transition-all duration-300 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg">
                                                        <Package size={14} className="text-blue-600" />
                                                    </div>
                                                    <span className="text-md font-mono">{o.DocuNo}</span>
                                                </button>
                                            </td>

                                            {/* วันที่สั่ง */}
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium text-gray-800">{o.DocuDate?.substring(0, 10)}</span>
                                                </div>
                                            </td>

                                            {/* ลูกค้า */}
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-lg bg-gray-100 p-2 group-hover:bg-white">
                                                        <User size={14} className="text-gray-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="block max-w-[180px] truncate font-semibold text-gray-800">{o.CustName}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* สั่ง (kg) */}
                                            <td className="p-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-md font-bold text-gray-900">{Number(o.qty_order).toLocaleString()}</span>
                                                </div>
                                            </td>

                                            {/* ออก Inv (kg) */}
                                            <td className="p-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-md font-bold text-blue-600">
                                                        {Number(o.qty_invoice || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* คงเหลือ (kg) */}
                                            <td className="p-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-md font-bold ${o.qty_balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                                        {Number(o.qty_balance).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* มูลค่า */}
                                            <td className="p-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-md font-bold text-green-700">{Number(o.amount).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* จัดการ */}
                                            <td className="p-6">
                                                <div className="flex justify-center">
                                                    <button
                                                        className="group relative transform rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 p-2 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:from-blue-600 hover:to-cyan-600 hover:shadow-2xl"
                                                        onClick={() => handleDetail(o.DocuNo, o)}
                                                        title="ดูรายละเอียด"
                                                    >
                                                        <Eye size={14} />
                                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 transform rounded-lg bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                            ดูรายละเอียด
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {sortedOrders.length === 0 && (
                                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white py-24">
                                    <div className="mb-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
                                        <div className="rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
                                            <Package size={64} className="text-blue-400" />
                                        </div>
                                    </div>
                                    <h3 className="mb-3 text-2xl font-bold text-gray-700">ไม่พบข้อมูลคำสั่งขาย</h3>
                                    <p className="text-lg text-gray-500">ลองเปลี่ยนคำค้นหาหรือเงื่อนไขการกรองดูนะครับ</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!loading && activeTab === 'palm_kernel' && (
                    <div className="overflow-hidden rounded-2xl border border-gray-100 font-anuphan shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg">
                                        {[
                                            { key: 'DocuNo', label: 'เลขที่ SO', align: 'left' },
                                            { key: 'DocuDate', label: 'วันที่สั่ง', align: 'left' },
                                            { key: 'CustName', label: 'ลูกค้า', align: 'left' },
                                            { key: 'qty_order', label: 'สั่ง (kg)', align: 'right' },
                                            { key: null, label: 'ออก Inv (kg)', align: 'right' },
                                            { key: null, label: 'คงเหลือ (kg)', align: 'right' },
                                            { key: 'amount', label: 'มูลค่า', align: 'right' },
                                            { key: null, label: 'จัดการ', align: 'center' },
                                        ].map((header, index) => (
                                            <th
                                                key={index}
                                                className={`p-6 font-bold cursor-pointer border-r border-white/20 transition-all duration-300 last:border-r-0 hover:bg-white/10`}
                                                onClick={() => header.key && handleSort(header.key)}
                                            >
                                                <div
                                                    className={`flex items-center gap-2 ${header.align === 'right' ? 'justify-end' : header.align === 'center' ? 'justify-center' : 'justify-start'}`}
                                                >
                                                    {header.label}
                                                    {header.key && getSortIcon(header.key)}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {sortedOrders.map((o, i) => (
                                        <tr
                                            key={`order-${o.DocuNo}-${i}`}
                                            className="group transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 hover:shadow-lg"
                                        >
                                            {/* เลขที่ SO */}
                                            <td className="p-4">
                                                <button
                                                    className="flex transform items-center gap-2 font-bold text-blue-700 transition-all duration-300 group-hover:scale-105 group-hover:text-blue-800"
                                                    onClick={() => handleDetail(o.DocuNo, o)}
                                                >
                                                    <div className="rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 p-2 shadow-md transition-all duration-300 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:shadow-lg">
                                                        <Package size={14} className="text-blue-600" />
                                                    </div>
                                                    <span className="text-md font-mono">{o.DocuNo}</span>
                                                </button>
                                            </td>

                                            {/* วันที่สั่ง */}
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium text-gray-800">{o.DocuDate?.substring(0, 10)}</span>
                                                </div>
                                            </td>

                                            {/* ลูกค้า */}
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-lg bg-gray-100 p-2 group-hover:bg-white">
                                                        <User size={14} className="text-gray-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="block max-w-[180px] truncate font-semibold text-gray-800">{o.CustName}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* สั่ง (kg) */}
                                            <td className="p-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-lg font-bold text-gray-900">{Number(o.qty_order).toLocaleString()}</span>
                                                </div>
                                            </td>

                                            {/* ออก Inv (kg) */}
                                            <td className="p-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-lg font-bold text-blue-600">
                                                        {Number(o.qty_invoice || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* คงเหลือ (kg) */}
                                            <td className="p-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-lg font-bold ${o.qty_balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                                        {Number(o.qty_balance).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* มูลค่า */}
                                            <td className="p-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-green-700">{Number(o.amount).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* จัดการ */}
                                            <td className="p-6">
                                                <div className="flex justify-center">
                                                    <button
                                                        className="group relative transform rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:from-blue-600 hover:to-cyan-600 hover:shadow-2xl"
                                                        onClick={() => handleDetail(o.DocuNo, o)}
                                                        title="ดูรายละเอียด"
                                                    >
                                                        <Eye size={14} />
                                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 transform rounded-lg bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                            ดูรายละเอียด
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {sortedOrders.length === 0 && (
                                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white py-24">
                                    <div className="mb-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
                                        <div className="rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
                                            <Package size={64} className="text-blue-400" />
                                        </div>
                                    </div>
                                    <h3 className="mb-3 text-2xl font-bold text-gray-700">ไม่พบข้อมูลคำสั่งขาย</h3>
                                    <p className="text-lg text-gray-500">ลองเปลี่ยนคำค้นหาหรือเงื่อนไขการกรองดูนะครับ</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Enhanced Modern Modal */}
                {isModalOpenDetail && (
                    <div className="bg-opacity-20 fixed inset-0 z-50 flex items-center justify-center bg-gray-300 font-anuphan backdrop-blur-md">
                        <div className="shadow-3xl flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white">
                            {/* Enhanced Header - Fixed */}
                            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-opacity-20 rounded-xl bg-white p-2 shadow-lg">
                                                <FileBarChart className="text-blue-600" size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-white">รายงานใบแจ้งหนี้</h2>
                                                <div className="mt-2 flex flex-wrap gap-2 text-blue-100">
                                                    <div className="bg-opacity-10 flex items-center space-x-2 rounded-lg bg-white px-4 py-1 text-sm text-blue-500">
                                                        <Package size={14} />
                                                        <span className="font-medium text-blue-500">
                                                            SO: <span className="font-medium text-blue-500">{selectedSO}</span>
                                                        </span>
                                                    </div>
                                                    <div className="bg-opacity-10 flex items-center space-x-2 rounded-lg bg-white px-4 py-1 text-sm text-blue-500">
                                                        <Box size={14} />
                                                        <span>
                                                            สินค้า: <span className="font-medium text-blue-500">{invoiceList[0]?.GoodName}</span>
                                                        </span>
                                                    </div>
                                                    <div className="bg-opacity-10 flex items-center space-x-2 rounded-lg bg-white px-4 py-1 text-sm text-blue-500">
                                                        <ShoppingCart size={14} />
                                                        <span>
                                                            PO: <span className="font-medium text-blue-500">{invoiceList[0]?.CustPONo || '-'}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpenDetail(false)}
                                        className="rounded-full bg-transparent p-1.5 text-red-500 transition-colors duration-200 hover:cursor-pointer hover:bg-red-500 hover:text-white focus:ring-2 focus:ring-red-300 focus:outline-none"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Enhanced Summary Cards - Compact */}
                            <div className="flex-shrink-0 border-b bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4">
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                    {[
                                        {
                                            label: 'Invoice',
                                            value: stats.totalInvoices,
                                            icon: FileText,
                                            gradient: 'from-blue-500 to-cyan-500',
                                        },
                                        {
                                            label: 'น้ำหนักต้นทาง',
                                            value: `${stats.totalWeightOrigin.toLocaleString()} kg`,
                                            icon: Scale,
                                            gradient: 'from-green-500 to-emerald-500',
                                        },
                                        {
                                            label: 'น้ำหนักปลายทาง',
                                            value: `${stats.totalWeightDestination.toLocaleString()} kg`,
                                            icon: Truck,
                                            gradient: 'from-purple-500 to-pink-500',
                                        },
                                        {
                                            label: 'มูลค่ารวม',
                                            value: `฿${stats.totalAmount.toLocaleString()}`,
                                            icon: DollarSign,
                                            gradient: 'from-orange-500 to-red-500',
                                        },
                                    ].map((stat, index) => (
                                        <div key={index} className="rounded-xl bg-white p-3 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                                                    <p className="mt-1 text-sm font-bold text-gray-800">{stat.value}</p>
                                                </div>
                                                <div className={`rounded-lg bg-gradient-to-r ${stat.gradient} p-2`}>
                                                    <stat.icon className="text-white" size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Overall Weight Difference - Compact */}
                                <div className="mt-4 rounded-xl bg-gradient-to-r from-slate-800 to-gray-900 p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Zap className="text-yellow-400" size={18} />
                                            <div>
                                                <p className="text-xs font-medium text-gray-300">ผลต่างน้ำหนักรวม</p>
                                                <p className={`text-lg font-bold ${stats.totalDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {stats.totalDiff >= 0 ? '+' : ''}
                                                    {stats.totalDiff.toLocaleString()} kg
                                                    <span className="ml-1 text-sm">({stats.totalDiffPercent.toFixed(1)}%)</span>
                                                </p>
                                            </div>
                                        </div>
                                        <Award className="text-yellow-400" size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Invoice List - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-4">
                                    {invoiceList.map((i, idx) => {
                                        const isOpen = openCard === idx;
                                        const w1 = Number(i.qty) || 0;
                                        const w2 = Number(i.weight_destination) || w1;
                                        const diff = w2 - w1;
                                        const diffPct = w1 > 0 ? (diff / w1) * 100 : 0;

                                        // ฟังก์ชันตรวจสอบและจัดรูปแบบข้อมูลผลตรวจคุณภาพ
                                        const formatQualityValue = (value: number | string) => {
                                            if (value === null || value === undefined || value === '') return '-';
                                            const numValue = Number(value);
                                            return isNaN(numValue)
                                                ? value
                                                : numValue.toLocaleString('th-TH', {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                  });
                                        };

                                        // ตรวจสอบว่ามีข้อมูลคุณภาพหรือไม่
                                        const hasQualityData =
                                            i.coa_result_ffa != null ||
                                            i.coa_result_moisture != null ||
                                            i.coa_result_iv != null ||
                                            i.coa_result_dobi != null ||
                                            i.coa_result_shell != null ||
                                            i.coa_result_kn_moisture != null;

                                        return (
                                            <div
                                                key={`invoice-${i.InvoiceNo}-${idx}`}
                                                className={`group cursor-pointer rounded-xl border transition-all duration-300 ${
                                                    isOpen
                                                        ? 'border-blue-300 bg-blue-50 shadow-md'
                                                        : 'border-gray-200 bg-white shadow-sm hover:border-blue-200 hover:shadow-md'
                                                }`}
                                            >
                                                {/* Compact Invoice Header */}
                                                <div className="p-4" onClick={() => setOpenCard(isOpen ? null : idx)}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-start space-x-3">
                                                            <div
                                                                className={`rounded-lg p-2 transition-all duration-300 ${
                                                                    isOpen
                                                                        ? 'bg-blue-500 text-white shadow-md'
                                                                        : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                                                                }`}
                                                            >
                                                                <FileText size={18} />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h3 className="truncate text-lg font-bold text-gray-800">{i.InvoiceNo}</h3>
                                                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                                                                    <div className="flex items-center space-x-1">
                                                                        <Calendar size={12} className="text-blue-500" />
                                                                        <span>{i.DocuDate?.substring(0, 10) || '-'}</span>
                                                                    </div>
                                                                    <div className="flex items-center space-x-1">
                                                                        <Truck size={12} className="text-purple-500" />
                                                                        <span className="max-w-[120px] truncate">
                                                                            {i.transport_company || 'ไม่ระบุ'}
                                                                        </span>
                                                                    </div>
                                                                    {hasQualityData && (
                                                                        <div className="flex items-center space-x-1">
                                                                            <FlaskRound size={12} className="text-green-500" />
                                                                            <span className="text-green-600">มีผลตรวจคุณภาพ</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="ml-4 text-right">
                                                            {/* Compact Weight Comparison */}
                                                            <div className="mb-2 space-y-1 text-sm">
                                                                <div className="flex items-center justify-end space-x-2">
                                                                    <span className="text-xs text-gray-500">ต้นทาง:</span>
                                                                    <span className="font-semibold text-gray-800">{w1.toLocaleString()} kg</span>
                                                                </div>
                                                                <div className="flex items-center justify-end space-x-2">
                                                                    <span className="text-xs text-gray-500">ปลายทาง:</span>
                                                                    <span className="font-semibold text-green-600">{w2.toLocaleString()} kg</span>
                                                                </div>
                                                            </div>

                                                            {/* Compact Difference Badge */}
                                                            <div
                                                                className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                                                                    diff < 0
                                                                        ? 'bg-red-100 text-red-700'
                                                                        : diff > 0
                                                                          ? 'bg-green-100 text-green-700'
                                                                          : 'bg-gray-100 text-gray-700'
                                                                }`}
                                                            >
                                                                {diff >= 0 ? '+' : ''}
                                                                {diff.toLocaleString()} kg ({diffPct.toFixed(1)}%)
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expandable Details */}
                                                {isOpen && (
                                                    <div className="animate-slide-down border-t border-blue-200 bg-white px-4 pb-4">
                                                        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                                                            {/* Shipping Information */}
                                                            <div className="space-y-3">
                                                                <h4 className="flex items-center space-x-2 text-sm font-bold text-gray-800">
                                                                    <Truck size={16} className="text-blue-600" />
                                                                    <span>ข้อมูลการขนส่ง</span>
                                                                    <span className="ml-1 text-xs text-blue-600">{i.reference_no || 'N/A'}</span>
                                                                </h4>
                                                                <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
                                                                    {[
                                                                        { label: 'ทะเบียนรถ', value: i.plan_number_car, icon: Truck },
                                                                        { label: 'คนขับ', value: i.plan_driver_name, icon: User },
                                                                        { label: 'ปลายทาง', value: i.plan_recipient_name, icon: MapPin },
                                                                        { label: 'เลขอ้างอิง', value: i.mar_lot, icon: ClipboardList },
                                                                    ].map((item, index) => (
                                                                        <div key={index} className="space-y-1">
                                                                            <div className="flex items-center space-x-1">
                                                                                <item.icon size={12} className="text-gray-500" />
                                                                                <p className="text-xs font-medium text-gray-600">{item.label}</p>
                                                                            </div>
                                                                            <p className="truncate text-sm font-semibold text-gray-800">
                                                                                {item.value || '-'}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Quality Results */}
                                                            {hasQualityData && (
                                                                <div className="space-y-3">
                                                                    <h4 className="flex items-center space-x-2 text-sm font-bold text-gray-800">
                                                                        <FlaskRound size={16} className="text-green-600" />
                                                                        <span>
                                                                            ผลตรวจคุณภาพ
                                                                            <span className="ml-1 text-xs text-blue-600">
                                                                                COA: {i.coa_number || 'N/A'}
                                                                            </span>
                                                                        </span>
                                                                    </h4>
                                                                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                                                        {Number(i.GoodID) === 2147 && (
                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                {[
                                                                                    {
                                                                                        label: 'FFA',
                                                                                        value: formatQualityValue(i.coa_result_ffa),
                                                                                        unit: '%',
                                                                                    },
                                                                                    {
                                                                                        label: 'Moisture',
                                                                                        value: formatQualityValue(i.coa_result_moisture),
                                                                                        unit: '%',
                                                                                    },
                                                                                    {
                                                                                        label: 'IV',
                                                                                        value: formatQualityValue(i.coa_result_iv),
                                                                                        unit: '',
                                                                                    },
                                                                                    {
                                                                                        label: 'DOBI',
                                                                                        value: formatQualityValue(i.coa_result_dobi),
                                                                                        unit: '',
                                                                                    },
                                                                                ].map((param, idx) => (
                                                                                    <div key={idx} className="text-center">
                                                                                        <p className="text-xs font-medium text-gray-600">
                                                                                            {param.label}
                                                                                        </p>
                                                                                        <p className="mt-1 text-sm font-bold text-gray-800">
                                                                                            {param.value}
                                                                                            {param.unit && param.value !== '-' ? param.unit : ''}
                                                                                        </p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {Number(i.GoodID) === 2152 && (
                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                {[
                                                                                    {
                                                                                        label: 'Shell',
                                                                                        value: formatQualityValue(i.coa_result_shell),
                                                                                        unit: '%',
                                                                                    },
                                                                                    {
                                                                                        label: 'Kernel Moisture',
                                                                                        value: formatQualityValue(i.coa_result_kn_moisture),
                                                                                        unit: '%',
                                                                                    },
                                                                                ].map((param, idx) => (
                                                                                    <div key={idx} className="text-center">
                                                                                        <p className="text-xs font-medium text-gray-600">
                                                                                            {param.label}
                                                                                        </p>
                                                                                        <p className="mt-1 text-sm font-bold text-gray-800">
                                                                                            {param.value}
                                                                                            {param.unit && param.value !== '-' ? param.unit : ''}
                                                                                        </p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Financial Info */}
                                                        <div className="mt-4 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 p-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <DollarSign size={16} className="text-white" />
                                                                    <span className="text-sm font-bold text-white">มูลค่าสินค้า</span>
                                                                </div>
                                                                <div className="text-lg font-bold text-white">
                                                                    ฿{Number(i.amount || 0).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {invoiceList.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="rounded-xl bg-gray-100 p-6">
                                                <FileText size={40} className="mx-auto text-gray-400" />
                                            </div>
                                            <p className="mt-4 text-lg font-bold text-gray-600">ไม่มีข้อมูลใบแจ้งหนี้</p>
                                            <p className="mt-1 text-sm text-gray-500">ยังไม่มีการออกใบแจ้งหนี้สำหรับคำสั่งขายนี้</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Compact Footer */}
                            <div className="flex-shrink-0 border-t bg-gray-50 px-6 py-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                                        <div className="flex items-center space-x-1">
                                            <Calendar size={12} />
                                            <span>รายงาน: {new Date().toLocaleDateString('th-TH')}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Clock size={12} />
                                            <span>อัพเดท: {new Date().toLocaleTimeString('th-TH')}</span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                                            พิมพ์รายงาน
                                        </button>
                                        <button
                                            onClick={() => setIsModalOpenDetail(false)}
                                            className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:shadow-lg"
                                        >
                                            ปิดรายงาน
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
