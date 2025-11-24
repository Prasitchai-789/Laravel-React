import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";

interface WorkOrder {
    id: number;
    Date: string;
    NameOfInformant: string;
    MachineName: string;
    MachineCode: string;
    Detail: string;
    Location: string;
    WorkStatus: string;
    Technician: string;
    Telephone: string;
}

const WOIndex: React.FC = () => {
    const { workOrders } = usePage<{ workOrders: WorkOrder[] }>().props;
    const [filterStatus, setFilterStatus] = useState<string>("ทั้งหมด");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'id',
        direction: 'desc'
    });

    // สีสำหรับสถานะต่างๆ
    const statusColor = (status: string): string => {
        switch(status) {
            case "เปิดอยู่":
            case "รอดำเนินการ":
                return "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200";
            case "ส่งมอบงาน":
            case "เสร็จสิ้น":
                return "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200";
            case "ยกเลิก":
                return "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200";
            case "กำลังดำเนินการ":
                return "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-200";
            default:
                return "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200";
        }
    };

    // ไอคอนสำหรับสถานะ
    const statusIcon = (status: string): string => {
        switch(status) {
            case "เปิดอยู่":
            case "รอดำเนินการ":
                return "⏳";
            case "ส่งมอบงาน":
            case "เสร็จสิ้น":
                return "✅";
            case "ยกเลิก":
                return "❌";
            case "กำลังดำเนินการ":
                return "🔧";
            default:
                return "📋";
        }
    };

    // กรองข้อมูลตามสถานะและคำค้นหา
    const filteredOrders = workOrders.filter(order => {
        const matchesStatus = filterStatus === "ทั้งหมด" || order.WorkStatus === filterStatus;
        const matchesSearch =
            order.NameOfInformant.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.MachineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.Location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.Detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.Technician.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    // เรียงลำดับข้อมูล
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (sortConfig.key) {
            const aValue = a[sortConfig.key as keyof WorkOrder];
            const bValue = b[sortConfig.key as keyof WorkOrder];

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
        }
        return 0;
    });

    const handleSort = (key: string) => {
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
        });
    };

    // ดึงสถานะทั้งหมดที่ไม่ซ้ำ
    const uniqueStatuses = [...new Set(workOrders.map(order => order.WorkStatus))];

    // สถิติ
    const stats = {
        total: workOrders.length,
        pending: workOrders.filter(o => o.WorkStatus === "เปิดอยู่" || o.WorkStatus === "รอดำเนินการ").length,
        completed: workOrders.filter(o => o.WorkStatus === "ส่งมอบงาน" || o.WorkStatus === "เสร็จสิ้น").length,
        inProgress: workOrders.filter(o => o.WorkStatus === "กำลังดำเนินการ").length,
        cancelled: workOrders.filter(o => o.WorkStatus === "ยกเลิก").length
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="p-4 md:p-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-blue-100">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">จัดการใบสั่งงาน</h1>
                                    <p className="text-gray-600 mt-1 text-sm">ระบบติดตามและจัดการงานซ่อมบำรุง</p>
                                </div>
                            </div>
                        </div>
                        <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="font-semibold">สร้างใบสั่งงานใหม่</span>
                        </button>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-gray-500 text-sm font-medium">ทั้งหมด</h3>
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-gray-500 text-sm font-medium">รอดำเนินการ</h3>
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(stats.pending / stats.total) * 100}%` }}></div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-gray-500 text-sm font-medium">กำลังดำเนินการ</h3>
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{stats.inProgress}</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}></div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-gray-500 text-sm font-medium">เสร็จสิ้น</h3>
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{stats.completed}</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(stats.completed / stats.total) * 100}%` }}></div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-gray-500 text-sm font-medium">ยกเลิก</h3>
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{stats.cancelled}</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(stats.cancelled / stats.total) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-sm border border-white/50">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                            <div className="flex-1 w-full">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                                        placeholder="ค้นหาชื่อผู้แจ้ง, เครื่อง, สถานที่, ผู้รับผิดชอบ..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 w-full lg:w-auto">
                                <select
                                    className="border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200 w-full lg:w-48"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="ทั้งหมด">สถานะทั้งหมด</option>
                                    {uniqueStatuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                                    <tr>
                                        <th
                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => handleSort('id')}
                                        >
                                            <div className="flex items-center gap-2">
                                                ID
                                                {sortConfig.key === 'id' && (
                                                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            วันที่
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            ผู้แจ้ง
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            เครื่อง
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            รายละเอียด
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            สถานะงาน
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            ผู้รับผิดชอบ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200/50">
                                    {sortedOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-blue-50/30 transition-colors duration-150 group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">#{order.id}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {order.Date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="font-medium text-gray-900">{order.NameOfInformant}</div>
                                                    <div className="text-sm text-gray-500">{order.Location}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="font-medium text-gray-900">{order.MachineName}</div>
                                                    <div className="text-sm text-gray-500">{order.MachineCode}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="text-sm text-gray-700 line-clamp-2">{order.Detail}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusColor(order.WorkStatus)}`}>
                                                    <span className="mr-1.5">{statusIcon(order.WorkStatus)}</span>
                                                    {order.WorkStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="font-medium text-gray-900">{order.Technician}</div>
                                                    <div className="text-sm text-gray-500">{order.Telephone}</div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {sortedOrders.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบข้อมูล</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">ลองเปลี่ยนเงื่อนไขการค้นหาหรือเลือกสถานะอื่น</p>
                            </div>
                        )}
                    </div>

                    {/* Mobile Card */}
                    <div className="lg:hidden space-y-4">
                        {sortedOrders.map((order) => (
                            <div key={order.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/50 hover:shadow-md transition-all duration-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold">
                                            #{order.id}
                                        </div>
                                        <span className="text-sm text-gray-500">{order.Date}</span>
                                    </div>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor(order.WorkStatus)}`}>
                                        <span className="mr-1.5">{statusIcon(order.WorkStatus)}</span>
                                        {order.WorkStatus}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{order.NameOfInformant}</p>
                                            <p className="text-sm text-gray-500 mt-1">{order.Location}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{order.MachineName}</p>
                                            <p className="text-sm text-gray-500 mt-1">รหัส: {order.MachineCode}</p>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-gray-50/50 rounded-xl">
                                        <p className="text-sm text-gray-700 leading-relaxed">{order.Detail}</p>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{order.Technician}</p>
                                            <p className="text-sm text-gray-500 mt-1">โทร: {order.Telephone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {sortedOrders.length === 0 && (
                            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-medium text-gray-900 mb-2">ไม่พบข้อมูล</h3>
                                <p className="text-gray-500 text-sm">ลองเปลี่ยนเงื่อนไขการค้นหาหรือเลือกสถานะอื่น</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default WOIndex;
