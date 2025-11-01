import {
    BarChart3,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    DollarSign,
    Download,
    Eye,
    Filter,
    Package,
    RefreshCw,
    Search,
    FileText,
    User,
    Scale,
    Info,
    Truck,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SalesOrder() {
    const [orders, setOrders] = useState([]);
    const [selectedSO, setSelectedSO] = useState(null);
    const [invoiceList, setInvoiceList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpenDetail, setIsModalOpenDetail] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [expandedRow, setExpandedRow] = useState(null);
    const [openCard, setOpenCard] = useState(null);

    // โหลดข้อมูล SO
    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = () => {
        fetch('/orders/pending')
            .then((res) => res.json())
            .then((data) => setOrders(data));
    };

    // ดึงข้อมูล invoice ตาม SO
    const handleDetail = async (docuNo) => {
        setLoading(true);
        setSelectedSO(docuNo);

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

    // ฟังก์ชันค้นหาและกรอง
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

    // ฟังก์ชันเรียงลำดับ
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key) => {
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
        });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronDown size={14} className="opacity-30" />;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

     // คำนวณสถิติสำหรับ Modal
    const calculateStats = () => {
        const totalWeight = invoiceList.reduce((sum, item) => sum + Number(item.qty || 0), 0);
        const totalAmount = invoiceList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const totalInvoices = invoiceList.length;

        return { totalWeight, totalAmount, totalInvoices };
    };

    const stats = calculateStats();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            {/* Header Section */}
            <div className="mb-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
                            📦 จัดการคำสั่งขาย
                        </h1>
                        <p className="mt-2 text-gray-600">ติดตามและจัดการคำสั่งขายทั้งหมดในระบบ</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button className="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 transition-all duration-300 hover:shadow-md">
                            <Download size={18} className="mr-2" />
                            ส่งออก
                        </button>
                        <button
                            onClick={loadOrders}
                            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white shadow-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl"
                        >
                            <RefreshCw size={18} className="mr-2" />
                            รีเฟรช
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border-l-4 border-blue-500 bg-white p-4 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">ทั้งหมด</p>
                                <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
                            </div>
                            <div className="rounded-full bg-blue-100 p-3">
                                <Package className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border-l-4 border-green-500 bg-white p-4 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">อนุมัติแล้ว</p>
                                <p className="text-2xl font-bold text-gray-800">{orders.filter((o) => o.AppvFlag === 'Y').length}</p>
                            </div>
                            <div className="rounded-full bg-green-100 p-3">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border-l-4 border-amber-500 bg-white p-4 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">รออนุมัติ</p>
                                <p className="text-2xl font-bold text-gray-800">{orders.filter((o) => o.AppvFlag !== 'Y').length}</p>
                            </div>
                            <div className="rounded-full bg-amber-100 p-3">
                                <Clock className="text-amber-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border-l-4 border-purple-500 bg-white p-4 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">มูลค่ารวม</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    ฿{orders.reduce((sum, o) => sum + Number(o.amount || 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded-full bg-purple-100 p-3">
                                <DollarSign className="text-purple-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="w-full flex-1 md:w-auto">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="ค้นหาด้วยเลขที่ SO หรือชื่อลูกค้า..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 py-3 pr-4 pl-10 transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-xl border border-gray-300 px-4 py-3 transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">สถานะทั้งหมด</option>
                                <option value="approved">อนุมัติแล้ว</option>
                                <option value="pending">รออนุมัติ</option>
                            </select>

                            <button className="flex items-center rounded-xl bg-gray-100 px-4 py-3 text-gray-700 transition-all duration-300 hover:bg-gray-200">
                                <Filter size={18} className="mr-2" />
                                กรองเพิ่มเติม
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                                <th
                                    className="cursor-pointer p-4 text-left font-semibold transition-colors hover:bg-blue-600"
                                    onClick={() => handleSort('DocuNo')}
                                >
                                    <div className="flex items-center">
                                        เลขที่ SO
                                        {getSortIcon('DocuNo')}
                                    </div>
                                </th>
                                <th
                                    className="cursor-pointer p-4 text-left font-semibold transition-colors hover:bg-blue-600"
                                    onClick={() => handleSort('DocuDate')}
                                >
                                    <div className="flex items-center">
                                        วันที่สั่ง
                                        {getSortIcon('DocuDate')}
                                    </div>
                                </th>
                                <th
                                    className="cursor-pointer p-4 text-left font-semibold transition-colors hover:bg-blue-600"
                                    onClick={() => handleSort('CustName')}
                                >
                                    <div className="flex items-center">
                                        ลูกค้า
                                        {getSortIcon('CustName')}
                                    </div>
                                </th>
                                <th
                                    className="cursor-pointer p-4 text-right font-semibold transition-colors hover:bg-blue-600"
                                    onClick={() => handleSort('qty_order')}
                                >
                                    <div className="flex items-center justify-end">
                                        สั่ง (kg)
                                        {getSortIcon('qty_order')}
                                    </div>
                                </th>
                                <th className="p-4 text-right font-semibold">ออก Inv (kg)</th>
                                <th className="p-4 text-right font-semibold">คงเหลือ (kg)</th>
                                <th
                                    className="cursor-pointer p-4 text-right font-semibold transition-colors hover:bg-blue-600"
                                    onClick={() => handleSort('amount')}
                                >
                                    <div className="flex items-center justify-end">
                                        มูลค่า
                                        {getSortIcon('amount')}
                                    </div>
                                </th>
                                <th className="p-4 text-center font-semibold">สถานะ</th>
                                <th className="p-4 text-center font-semibold">จัดการ</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200">
                            {sortedOrders.map((o, i) => (
                                <>
                                    <tr key={i} className="group transition-all duration-200 hover:bg-blue-50">
                                        <td className="p-4">
                                            <button
                                                className="flex transform items-center font-bold text-blue-600 transition-colors duration-200 group-hover:scale-105 hover:text-blue-800"
                                                onClick={() => handleDetail(o.DocuNo)}
                                            >
                                                <Package size={16} className="mr-2" />
                                                {o.DocuNo}
                                            </button>
                                        </td>

                                        <td className="flex items-center p-4 text-gray-700">
                                            <Calendar size={14} className="mr-2 text-gray-400" />
                                            {o.DocuDate?.substring(0, 10)}
                                        </td>
                                        <td className="p-4 text-gray-700">
                                            <div className="flex items-center">
                                                <User size={14} className="mr-2 text-gray-400" />
                                                <span className="max-w-[150px] truncate">{o.CustName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-medium">{Number(o.qty_order).toLocaleString()}</td>
                                        <td className="p-4 text-right font-medium text-blue-600">{Number(o.qty_invoice || 0).toLocaleString()}</td>
                                        <td className={`p-4 text-right font-bold ${o.qty_balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                            {Number(o.qty_balance).toLocaleString()}
                                        </td>
                                        <td className="flex items-center justify-end p-4 text-right font-semibold text-green-600">
                                            <DollarSign size={14} className="mr-1" />
                                            {Number(o.amount).toLocaleString()}
                                        </td>

                                        <td className="p-4">
                                            <div className="flex justify-center">
                                                {o.AppvFlag === 'Y' ? (
                                                    <span className="flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 shadow-sm">
                                                        <CheckCircle size={12} className="mr-1" />
                                                        อนุมัติ
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 shadow-sm">
                                                        <Clock size={12} className="mr-1" />
                                                        {o.StatusRemark || 'รออนุมัติ'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    className="transform rounded-lg bg-blue-50 p-2 text-blue-600 transition-all duration-300 hover:scale-110 hover:bg-blue-100 hover:shadow-md"
                                                    onClick={() => handleDetail(o.DocuNo)}
                                                    title="ดูรายละเอียด"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    className="transform rounded-lg bg-green-50 p-2 text-green-600 transition-all duration-300 hover:scale-110 hover:bg-green-100 hover:shadow-md"
                                                    title="ดูสถิติ"
                                                >
                                                    <BarChart3 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </>
                            ))}
                        </tbody>
                    </table>

                    {sortedOrders.length === 0 && (
                        <div className="py-12 text-center">
                            <Package size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-lg text-gray-500">ไม่พบข้อมูลคำสั่งขาย</p>
                            <p className="mt-1 text-sm text-gray-400">ลองเปลี่ยนคำค้นหาหรือเงื่อนไขการกรอง</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modern Modal */}
            {isModalOpenDetail && (
                <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
                    <div className="animate-scale-in w-full max-w-6xl">
                        <div className="flex h-[85vh] flex-col rounded-3xl bg-white shadow-2xl">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="rounded-2xl bg-white bg-opacity-20 p-3">
                                            <FileText size={28} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">รายงานใบแจ้งหนี้</h2>
                                            <p className="mt-1 text-blue-100 opacity-90">
                                                SO: <span className="font-semibold">{selectedSO}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpenDetail(false)}
                                        className="rounded-full p-2 transition-all duration-300 hover:bg-white hover:bg-opacity-20 hover:scale-110"
                                    >
                                        <X size={24} className="text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Stats Overview */}
                            <div className="border-b bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="flex items-center space-x-3 rounded-xl bg-white p-3 shadow-sm">
                                        <div className="rounded-lg bg-blue-100 p-2">
                                            <Package size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">จำนวน Invoice</p>
                                            <p className="text-xl font-bold text-gray-800">{stats.totalInvoices} รายการ</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 rounded-xl bg-white p-3 shadow-sm">
                                        <div className="rounded-lg bg-green-100 p-2">
                                            <Scale size={20} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">น้ำหนักรวม</p>
                                            <p className="text-xl font-bold text-gray-800">{stats.totalWeight.toLocaleString()} kg</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 rounded-xl bg-white p-3 shadow-sm">
                                        <div className="rounded-lg bg-purple-100 p-2">
                                            <DollarSign size={20} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">มูลค่ารวม</p>
                                            <p className="text-xl font-bold text-gray-800">฿{stats.totalAmount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-hidden">
                                {loading ? (
                                    <div className="flex h-full flex-col items-center justify-center py-16">
                                        <div className="border-blue-600 mb-4 h-16 w-16 animate-spin rounded-full border-4 border-t-transparent"></div>
                                        <p className="text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
                                        <p className="mt-1 text-sm text-gray-400">กรุณารอสักครู่</p>
                                    </div>
                                ) : (
                                    <div className="flex h-full flex-col">
                                        {/* Invoice List */}
                                        <div className="flex-1 overflow-y-auto p-6">
                                            <div className="space-y-4">
                                                {invoiceList.map((i, idx) => {
                                                    const isOpen = openCard === idx;
                                                    const weightOrigin = Number(i.qty);
                                                    const weightDestination = Number(i.weight_destination || weightOrigin);
                                                    const netWeight = weightDestination;
                                                    const diff = weightDestination - weightOrigin;
                                                    const diffPercent = weightOrigin > 0 ? (diff / weightOrigin) * 100 : 0;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`transform rounded-2xl border transition-all duration-300 ${
                                                                isOpen
                                                                    ? 'border-blue-300 bg-blue-50 shadow-lg'
                                                                    : 'border-gray-200 bg-white shadow-sm hover:shadow-md'
                                                            }`}
                                                        >
                                                            {/* Card Header */}
                                                            <div
                                                                className="cursor-pointer p-5"
                                                                onClick={() => setOpenCard(isOpen ? null : idx)}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center space-x-4">
                                                                        <div className={`rounded-xl p-2 ${
                                                                            isOpen ? 'bg-blue-100' : 'bg-gray-100'
                                                                        }`}>
                                                                            <FileText size={20} className={
                                                                                isOpen ? 'text-blue-600' : 'text-gray-600'
                                                                            } />
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="text-lg font-bold text-gray-800">
                                                                                {i.InvoiceNo}
                                                                            </h3>
                                                                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                                                                <span className="flex items-center">
                                                                                    <Calendar size={14} className="mr-1" />
                                                                                    {i.DocuDate.substring(0, 10)}
                                                                                </span>
                                                                                <span className="flex items-center">
                                                                                    <Truck size={14} className="mr-1" />
                                                                                    {i.transport_company || 'ไม่ระบุ'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center space-x-4">
                                                                        {/* Weight Info */}
                                                                        <div className="text-right">
                                                                            <div className="flex items-center space-x-2">
                                                                                <span className="text-sm text-gray-600">ต้นทาง:</span>
                                                                                <span className="font-semibold text-gray-700">
                                                                                    {weightOrigin.toLocaleString()} kg
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center space-x-2">
                                                                                <span className="text-sm text-gray-600">ปลายทาง:</span>
                                                                                <span className="font-semibold text-green-600">
                                                                                    {weightDestination.toLocaleString()} kg
                                                                                </span>
                                                                            </div>
                                                                            <div className={`flex items-center space-x-2 ${
                                                                                diff < 0 ? 'text-red-600' : 'text-green-600'
                                                                            }`}>
                                                                                <span className="text-sm">
                                                                                    {diff >= 0 ? '+' : ''}{diff.toLocaleString()} kg
                                                                                </span>
                                                                                <span className="text-xs">
                                                                                    ({diffPercent.toFixed(1)}%)
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Expand Icon */}
                                                                        <div className={`transform transition-transform duration-300 ${
                                                                            isOpen ? 'rotate-180' : ''
                                                                        }`}>
                                                                            <ChevronDown size={20} className="text-gray-400" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Expandable Content */}
                                                            {isOpen && (
                                                                <div className="animate-slide-down border-t border-blue-200 bg-white px-5 pb-5">
                                                                    <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                                                                        {/* Left Column - Basic Info */}
                                                                        <div className="space-y-3">
                                                                            <h4 className="font-semibold text-gray-700">ข้อมูลพื้นฐาน</h4>
                                                                            <div className="space-y-2">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600">สินค้า:</span>
                                                                                    <span className="font-medium">{i.GoodName}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600">เลขอ้างอิง:</span>
                                                                                    <span className="font-medium">{i.reference_no || '-'}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600">สถานะ:</span>
                                                                                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                                                                        สำเร็จ
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Right Column - Weight Details */}
                                                                        <div className="space-y-3">
                                                                            <h4 className="font-semibold text-gray-700">รายละเอียดน้ำหนัก</h4>
                                                                            <div className="space-y-2">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600">น้ำหนักต้นทาง:</span>
                                                                                    <span className="font-medium">{weightOrigin.toLocaleString()} kg</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600">น้ำหนักปลายทาง:</span>
                                                                                    <span className="font-medium text-green-600">
                                                                                        {weightDestination.toLocaleString()} kg
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600">น้ำหนักสุทธิ:</span>
                                                                                    <span className="font-medium text-blue-600">
                                                                                        {netWeight.toLocaleString()} kg
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600">มูลค่า:</span>
                                                                                    <span className="font-bold text-green-600">
                                                                                        ฿{Number(i.amount).toLocaleString()}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Difference Indicator */}
                                                                    <div className="mt-4 rounded-lg bg-gray-50 p-3">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center space-x-2">
                                                                                <Info size={16} className="text-blue-500" />
                                                                                <span className="text-sm text-gray-600">
                                                                                    ผลต่างน้ำหนักระหว่างต้นทางและปลายทาง
                                                                                </span>
                                                                            </div>
                                                                            <div className={`text-sm font-semibold ${
                                                                                diff < 0 ? 'text-red-600' : 'text-green-600'
                                                                            }`}>
                                                                                {diff >= 0 ? '+' : ''}{diff.toLocaleString()} kg ({diffPercent.toFixed(1)}%)
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {invoiceList.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                                        <div className="rounded-2xl bg-gray-100 p-6">
                                                            <Package size={48} className="mx-auto text-gray-400" />
                                                        </div>
                                                        <p className="mt-4 text-lg font-medium text-gray-600">ไม่มีข้อมูลใบแจ้งหนี้</p>
                                                        <p className="mt-1 text-gray-400">ยังไม่มีการออกใบแจ้งหนี้สำหรับคำสั่งขายนี้</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                    <Calendar size={14} />
                                                    <span>อัพเดทล่าสุด: {new Date().toLocaleDateString('th-TH')}</span>
                                                </div>
                                                <div className="flex space-x-3">
                                                    <button className="rounded-xl border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 transition-all duration-300 hover:bg-gray-50">
                                                        พิมพ์รายงาน
                                                    </button>
                                                    <button
                                                        onClick={() => setIsModalOpenDetail(false)}
                                                        className="rounded-xl bg-blue-600 px-6 py-2 font-medium text-white shadow-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl"
                                                    >
                                                        ปิดรายงาน
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
