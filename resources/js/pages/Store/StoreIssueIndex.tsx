import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import StoreIssueOrderDetail from './StoreIssueOrderDetail';
import FormEditOrder from './FormEditOrder'; // ต้องสร้าง component นี้
import Swal from 'sweetalert2';
import { Eye, Search, Pencil, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar, User, Building, FileText, Monitor, Globe, Filter, X, Download, BarChart3, RefreshCw, Plus } from "lucide-react";
import ModalForm from '@/components/ModalForm';
import { can } from '@/lib/can';


interface OrderItem {
    id: number;
    product_name: string;
    product_type?: string;
    stock_qty?: number;
    reserved_qty?: number;
    remaining_qty?: number;
    quantity?: number;
    unit?: string;
    issueDate?: string;
}

interface Order {
    id: number;
    document_number: string;
    order_date: string;
    status: string;
    source: 'WEB' | 'WIN';
    department?: string;
    requester?: string;
    items?: OrderItem[];
}

interface Props {
    orders: Order[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: any[];
        first_page_url: string;
        last_page_url: string;
        next_page_url: string | null;
        prev_page_url: string | null;
    };
}

export default function StoreOrderIndex({ orders, pagination }: Props) {
    const { url } = usePage() as any;
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false); // เพิ่ม state สำหรับ modal แก้ไข
    const [detailOrder, setDetailOrder] = useState<Order | null>(null);
    const [editOrder, setEditOrder] = useState<Order | null>(null); // เพิ่ม state สำหรับข้อมูลที่ต้องการแก้ไข
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // ดึงค่าจาก URL parameters แทนการใช้ filters prop
    const urlParams = new URLSearchParams(window.location.search);
    const [dailyDate, setDailyDate] = useState(urlParams.get('dailyDate') || '');
    const [searchTerm, setSearchTerm] = useState(urlParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(urlParams.get('status') || 'ทั้งหมด');
    const [activeTab, setActiveTab] = useState<'WIN' | 'WEB'>(
        (urlParams.get('source') as 'WIN' | 'WEB') || 'WEB'
    );
    const [dailyTotal, setDailyTotal] = useState(0);

    // คำนวณรายการวันนี้จาก orders ปัจจุบัน
    useEffect(() => {
        const todayCount = orders.filter(order =>
            new Date(order.order_date).toDateString() === new Date().toDateString()
        ).length;
        setDailyTotal(todayCount);
    }, [orders]);

    const formatNumber = (num: number | undefined | null): string => {
        if (num === undefined || num === null) return '0';
        return num.toLocaleString('th-TH');
    };

    // ฟังก์ชันเปิด modal แก้ไข
    const handleEdit = (order: Order) => {
        setEditOrder(order);
        setIsEditOpen(true);
    };

    // ฟังก์ชันปิด modal แก้ไข
    const handleEditClose = () => {
        setIsEditOpen(false);
        setEditOrder(null);
    };

    // ฟังก์ชันเมื่อบันทึกการแก้ไขสำเร็จ
    const handleEditSuccess = () => {
        handleEditClose();
        // รีโหลดข้อมูลหรืออัพเดต state ตามต้องการ
        router.reload({ only: ['orders'] });
        Swal.fire({
            title: 'บันทึกสำเร็จ',
            text: 'แก้ไขข้อมูลการเบิกสินค้าสำเร็จ',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            customClass: { popup: 'rounded-2xl font-anuphan' }
        });
    };

    const handleTabChange = (tab: 'WIN' | 'WEB') => {
        setActiveTab(tab);
        router.get(route('StoreIssue.index'), {
            source: tab,
            page: 1,
            search: searchTerm,
            status: statusFilter === 'ทั้งหมด' ? '' : statusFilter,
            dailyDate: dailyDate || '',
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePagination = (url?: string) => {
        if (!url) return;

        const urlObj = new URL(url, window.location.origin);

        // เพิ่มพารามิเตอร์ filter ทั้งหมด
        const params = {
            source: activeTab,
            search: searchTerm,
            status: statusFilter !== 'ทั้งหมด' ? statusFilter : undefined,
            dailyDate: dailyDate || undefined,
        };

        // ลบพารามิเตอร์เดิมออก
        ['source', 'search', 'status', 'dailyDate'].forEach(param => {
            urlObj.searchParams.delete(param);
        });

        // เพิ่มพารามิเตอร์ใหม่
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                urlObj.searchParams.set(key, value.toString());
            }
        });

        router.visit(urlObj.toString(), {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleSearch = () => {
        router.get(route('StoreIssue.index'), {
            source: activeTab,
            page: 1,
            search: searchTerm,
            status: statusFilter === 'ทั้งหมด' ? '' : statusFilter,
            dailyDate: dailyDate || '',
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('ทั้งหมด');
        setDailyDate('');
        router.get(route('StoreIssue.index'), {
            source: activeTab,
            page: 1,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        const result = await Swal.fire({
            title: 'ยืนยันการเปลี่ยนสถานะ',
            text: 'คุณต้องการเปลี่ยนสถานะรายการนี้ใช่หรือไม่?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-2xl font-anuphan',
                confirmButton: 'rounded-xl px-4 py-2 font-anuphan',
                cancelButton: 'rounded-xl px-4 py-2 font-anuphan'
            }
        });

        if (!result.isConfirmed) return;

        try {
            await router.put(`/store-orders/${orderId}/status`, { status: newStatus }, {
                preserveState: true,
                onSuccess: () => {
                    router.reload({ only: ['orders'] });
                    Swal.fire({
                        title: 'อัปเดตสถานะสำเร็จ',
                        icon: 'success',
                        confirmButtonColor: '#3085d6',
                        customClass: { popup: 'rounded-2xl font-anuphan' }
                    });
                },
                onError: () => {
                    Swal.fire({
                        title: 'เกิดข้อผิดพลาด',
                        text: 'ไม่สามารถอัปเดตสถานะได้',
                        icon: 'error',
                        confirmButtonColor: '#d33',
                        customClass: { popup: 'rounded-2xl font-anuphan' }
                    });
                }
            });
        } catch (error) {
            console.error(error);
            Swal.fire({
                customClass: { popup: 'rounded-2xl font-anuphan' },
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถอัปเดตสถานะได้',
                icon: 'error',
                confirmButtonColor: '#d33',
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'รอดำเนินการ';
            case 'approved': return 'อนุมัติ';
            case 'rejected': return 'ปฏิเสธ';
            case 'completed': return 'เสร็จสิ้น';
            default: return status;
        }
    };

    // นับจำนวน orders ตาม source สำหรับสถิติ
    const winOrdersCount = orders.filter(o => o.source === 'WIN').length;
    const webOrdersCount = orders.filter(o => o.source === 'WEB').length;

    return (
        <AppLayout breadcrumbs={[
            { title: "หน้าหลัก", href: route('dashboard') },
            { title: "ประวัติการเบิก", href: route('StoreIssue.index') },
        ]}>
            <Head title="ประวัติการเบิก" />

            <div className="px-4 py-6 sm:px-6 lg:px-8 font-anuphan">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">ประวัติการเบิกสินค้า</h1>
                            <p className="text-gray-600 text-lg">จัดการและติดตามสถานะการเบิกสินค้าตามระบบที่เลือก</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-5 text-white shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm opacity-90">ทั้งหมด</p>
                                <p className="text-2xl font-bold mt-1">{formatNumber(pagination?.total)}</p>
                                <p className="text-sm mt-2">รายการ</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-5 text-white shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm opacity-90">รายการวันนี้</p>
                                <p className="text-2xl font-bold mt-1">{formatNumber(dailyTotal)}</p>
                                <p className="text-sm mt-2">รายการ</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <Calendar className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm opacity-90">ระบบ WIN</p>
                                <p className="text-2xl font-bold mt-1">{formatNumber(winOrdersCount)}</p>
                                <p className="text-sm mt-2">รายการ</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <Monitor className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm opacity-90">ระบบ WEB</p>
                                <p className="text-2xl font-bold mt-1">{formatNumber(webOrdersCount)}</p>
                                <p className="text-sm mt-2">รายการ</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <Globe className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 mb-6">
                    {(['WEB', 'WIN'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`px-6 py-3 rounded-xl font-medium border transition-all duration-200 ${activeTab === tab
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform -translate-y-0.5'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {tab === 'WIN' ? 'WIN (ระบบเดิม)' : 'WEB (ระบบใหม่)'}
                        </button>
                    ))}
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            <Filter className="w-5 h-5 mr-2 text-blue-500" />
                            ตัวกรองข้อมูล
                        </h2>
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            {isFilterOpen ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-12 gap-4 ${isFilterOpen ? 'block' : 'hidden md:grid'}`}>
                        {/* Search - ใช้พื้นที่ 5/12 */}
                        <div className="md:col-span-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
                            <div className="flex rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                                <input
                                    type="text"
                                    placeholder="ค้นหาเลขเอกสารหรือชื่อสินค้า..."
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                />
                                <button
                                    onClick={handleSearch}
                                    className="px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-r-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Status Filter - ใช้พื้นที่ 3/12 */}
                        {activeTab === 'WEB' && (
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className={`w-full text-sm px-4 py-2.5 rounded-xl font-medium border ${getStatusColor(statusFilter)} shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                >
                                    <option value="ทั้งหมด">ทั้งหมด</option>
                                    <option value="pending">{getStatusText('pending')}</option>
                                    <option value="approved">{getStatusText('approved')}</option>
                                    <option value="rejected">{getStatusText('rejected')}</option>
                                </select>
                            </div>
                        )}

                        {/* Action Buttons - ใช้พื้นที่ 4/12 */}
                        <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-3 md:col-span-4 items-end">
                            <button
                                onClick={handleSearch}
                                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center text-sm font-medium w-full md:w-auto"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                ค้นหา
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center text-sm font-medium w-full md:w-auto"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                ล้างตัวกรอง
                            </button>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        {activeTab === 'WIN' ? (
                            /* WIN System Table - Simplified */
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider rounded-tl-xl">เลขเอกสาร</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">วันที่เบิก</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">สินค้า</th>
                                        <th className="px-6 py-4 text-center text-xs font-medium text-blue-800 uppercase tracking-wider rounded-tr-xl">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.length > 0 ? orders.map(order => (
                                        <tr key={order.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-blue-100 rounded-lg mr-3 shadow-sm">
                                                        <FileText className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{order.document_number}</div>
                                                        <div className="text-xs text-gray-500 mt-1">ID: {order.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <div className="p-2 bg-gray-100 rounded-lg mr-3 shadow-sm">
                                                        <Calendar className="h-4 w-4 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {new Date(order.order_date).toLocaleDateString('th-TH', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {new Date(order.order_date).toLocaleTimeString('th-TH', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    {order.items?.slice(0, 1).map(item => (
                                                        <div
                                                            key={item.id}
                                                            className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm hover:bg-blue-50 transition-colors duration-200 group"
                                                        >
                                                            <span className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700">
                                                                {item.product_name}
                                                            </span>
                                                            {order.items && order.items.length > 1 && (
                                                                <span className="text-blue-600 text-xs font-medium ml-2">
                                                                    +{order.items.length - 1} รายการ
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setDetailOrder(order);
                                                            setIsDetailOpen(true);
                                                        }}
                                                        className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                                                        title="ดูรายละเอียด"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                                        <Search className="w-10 h-10 opacity-50" />
                                                    </div>
                                                    <p className="text-xl font-medium text-gray-500 mb-2">ไม่พบข้อมูลการเบิก</p>
                                                    <p className="text-sm text-gray-400 mb-4">ลองเปลี่ยนคำค้นหาหรือตัวกรองดูนะ</p>
                                                    <button
                                                        onClick={handleClearFilters}
                                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-md"
                                                    >
                                                        ล้างตัวกรอง
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            /* WEB System Table - Full Details */
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider rounded-tl-xl">เลขเอกสาร</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">วันที่เบิก</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">ผู้เบิก</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">ฝ่าย/แผนก</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">สินค้า</th>
                                        <th className="px-6 py-4 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">สถานะ</th>
                                        <th className="px-6 py-4 text-center text-xs font-medium text-blue-800 uppercase tracking-wider rounded-tr-xl">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.length > 0 ? (
                                        orders.map(order => (
                                            <tr
                                                key={order.id}
                                                className="hover:bg-blue-50/30 transition-all duration-200 group"
                                            >
                                                {/* เลขเอกสาร */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="p-2 bg-blue-100 rounded-lg mr-3 shadow-sm">
                                                            <FileText className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {order.document_number}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* วันที่ */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-700">
                                                        <div className="p-2 bg-gray-100 rounded-lg mr-3 shadow-sm">
                                                            <Calendar className="h-4 w-4 text-gray-600" />
                                                        </div>
                                                        {new Date(order.order_date).toLocaleDateString('th-TH', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </div>
                                                </td>

                                                {/* ผู้เบิก */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-700">
                                                        <div className="p-2 bg-gray-100 rounded-lg mr-3 shadow-sm">
                                                            <User className="h-4 w-4 text-gray-600" />
                                                        </div>
                                                        {order.requester || 'ไม่ระบุ'}
                                                    </div>
                                                </td>

                                                {/* แผนก */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-700">
                                                        <div className="p-2 bg-gray-100 rounded-lg mr-3 shadow-sm">
                                                            <Building className="h-4 w-4 text-gray-600" />
                                                        </div>
                                                        {order.department || 'ไม่ระบุ'}
                                                    </div>
                                                </td>

                                                {/* รายการสินค้า */}
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-700 flex flex-col">
                                                        {order.items?.slice(0, 1).map(item => (
                                                            <div
                                                                key={item.id}
                                                                className="flex justify-between items-center p-2 bg-gray-50 rounded-lg shadow-sm"
                                                            >
                                                                <span className="truncate max-w-xs">{item.product_name}</span>
                                                                {order.items && order.items.length > 1 && (
                                                                    <div className="flex justify-end items-center text-xs text-blue-600 font-medium ml-2">
                                                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                                                                            +{order.items.length - 1}
                                                                        </div>
                                                                        รายการเพิ่มเติม
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>

                                                {/* สถานะ */}
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex justify-center">
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                            className={`text-xs px-3 py-2 rounded-xl font-medium border ${getStatusColor(order.status)} shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                                                            disabled={
                                                                !can('PUR.edit') ||
                                                                order.status === 'approved' ||
                                                                order.status === 'rejected'
                                                            }
                                                        >
                                                            <option value="pending">{getStatusText('pending')}</option>
                                                            <option value="approved">{getStatusText('approved')}</option>
                                                            <option value="rejected">{getStatusText('rejected')}</option>
                                                        </select>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex justify-center gap-2">
                                                        {/* ดูรายละเอียด */}
                                                        <button
                                                            onClick={() => {
                                                                setDetailOrder(order);
                                                                setIsDetailOpen(true);
                                                            }}
                                                            className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                                                            title="ดูรายละเอียด"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>

                                                        {/* แก้ไขข้อมูล */}
                                                        <button
                                                            onClick={() => handleEdit(order)}
                                                            className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                                                            title="แก้ไขข้อมูล"
                                                            disabled={!can('PUR.edit') || order.status === 'approved' || order.status === 'rejected'}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>

                                                        {/* Export PDF */}
                                                        <button
                                                            onClick={() => window.open(route('store.export-excel', { id: order.id }), '_blank')}
                                                            className="inline-flex items-center justify-center p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                                                            title="Export PDF"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                                        <Search className="w-10 h-10 opacity-50" />
                                                    </div>
                                                    <p className="text-xl font-medium text-gray-500 mb-2">ไม่พบข้อมูลการเบิก</p>
                                                    <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองดูนะ</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination?.last_page > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                                <div className="text-sm text-gray-700">
                                    แสดง <span className="font-medium">{formatNumber(pagination.from)}</span> ถึง <span className="font-medium">{formatNumber(pagination.to)}</span> จาก{' '}
                                    <span className="font-medium">{formatNumber(pagination.total)}</span> รายการ
                                </div>

                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => handlePagination(pagination.first_page_url)}
                                        disabled={pagination.current_page === 1}
                                        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                                        title="หน้าแรก"
                                    >
                                        <ChevronsLeft className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => handlePagination(pagination.prev_page_url)}
                                        disabled={!pagination.prev_page_url}
                                        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                                        title="หน้าก่อนหน้า"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    <div className="flex space-x-1">
                                        {pagination.links.map((link: any, idx: number) => {
                                            if (!link.label.match(/^\d+$/)) return null;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => link.url && handlePagination(link.url)}
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${link.active
                                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md font-medium'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md'
                                                        }`}
                                                >
                                                    {link.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePagination(pagination.next_page_url)}
                                        disabled={!pagination.next_page_url}
                                        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                                        title="หน้าถัดไป"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => handlePagination(pagination.last_page_url)}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                                        title="หน้าสุดท้าย"
                                    >
                                        <ChevronsRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                {isDetailOpen && (
                    <ModalForm
                        isModalOpen={isDetailOpen}
                        onClose={() => setIsDetailOpen(false)}
                        title="รายละเอียดใบเบิกสินค้า"
                    >
                        <StoreIssueOrderDetail
                            order={detailOrder}
                            onClose={() => setIsDetailOpen(false)}
                            showHistory={true}
                        />
                    </ModalForm>
                )}

                {/* Edit Modal */}
                {isEditOpen && (
                    <ModalForm
                        isModalOpen={isEditOpen}
                        onClose={handleEditClose}
                        title="แก้ไขข้อมูลการเบิกสินค้า"
                        size="w-xl"
                    >
                        <FormEditOrder
                            order={editOrder}  // ส่ง order object ทั้งก้อนแทน orderId
                            onClose={handleEditClose}
                            onSuccess={handleEditSuccess}
                        />
                    </ModalForm>
                )}
            </div>
        </AppLayout>
    );
}
