import DeleteModal from '@/components/DeleteModal';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    BarChart3,
    Box,
    Calculator,
    Calendar,
    ChevronDown,
    ChevronUp,
    Edit,
    Filter,
    Nut,
    Package,
    Plus,
    Search,
    Trash2,
    TreePine,
    TrendingUp,
    Warehouse,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import SiloRecordForm from './SiloRecordForm';

type Flash = { success?: string; error?: string };

// Interface definitions
interface SiloRecord {
    id: number;
    record_date: string;
    nut_silo_1_level: number | string;
    nut_silo_2_level: number | string;
    nut_silo_3_level: number | string;
    kernel_silo_1_level: number | string;
    kernel_silo_2_level: number | string;
    silo_sale_big_level: number | string;
    silo_sale_small_level: number | string;
    kernel_outside_pile: number | string;
    outside_nut: number | string;
    moisture_percent?: number | string;
    shell_percent?: number | string;
}

interface TotalsResult {
    nutTotal: string;
    kernelTotal: string;
    saleTotal: string;
    outsideTotal: string;
    grandTotal: string;
    components?: {
        nutSilo1: string;
        nutSilo2: string;
        nutSilo3: string;
        kernelSilo1: string;
        kernelSilo2: string;
        saleBig: string;
        saleSmall: string;
        outsideNut: string;
        kernelOutsidePile: string;
    };
}

const SiloRecordList = ({ flash }: { flash?: Flash }) => {
    const { records: pageRecords } = usePage().props as { records: SiloRecord[] };
    const [records, setRecords] = useState<SiloRecord[]>(pageRecords || []);
    const [loading, setLoading] = useState<boolean>(false);
    const [editingRecord, setEditingRecord] = useState<SiloRecord | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('record_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [selectedRecord, setSelectedRecord] = useState<SiloRecord | null>(null);

    const page = usePage<{ auth: { user?: any; permissions?: string[] } }>();
    const userPermissions: string[] = Array.isArray(page.props.auth?.permissions)
        ? page.props.auth.permissions
        : Array.isArray(page.props.auth?.user?.permissions)
          ? page.props.auth.user.permissions
          : [];

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        customClass: { popup: 'custom-swal' },
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        },
    });

    // เพิ่ม useEffect สำหรับโหลดข้อมูล
    useEffect(() => {
        setRecords(pageRecords || []);
    }, [pageRecords]);

    // ฟังก์ชันสำหรับเรียก API
    const fetchApiData = async (): Promise<void> => {
        try {
            setLoading(true);
            const response = await axios.get(route('stock.kernel.api'));

            if (response.data.success) {
                setRecords(response.data.records || []);
                // Toast.fire({
                //     icon: 'success',
                //     title: 'โหลดข้อมูลล่าสุดเรียบร้อยแล้ว',
                // });
            } else {
                throw new Error(response.data.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
            }
        } catch (error) {
            console.error('Error fetching API data:', error);
            Swal.fire({
                title: 'ผิดพลาด!',
                text: 'ไม่สามารถโหลดข้อมูลล่าสุดได้',
                icon: 'error',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#ef4444',
            });
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async (): Promise<void> => {
        await fetchApiData();
    };

    const safeParseFloat = (value: any): number => {
        if (value === null || value === undefined || value === '') return 0;
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? 0 : num;
    };

    const formatDisplayNumber = (value: any, decimalPlaces: number = 3): string => {
        const num = safeParseFloat(value);
        return num.toFixed(decimalPlaces);
    };

    const calculateQuantity = (level: string | number, multiplier: number, constant: number, extra: number = 0): string => {
        if (!level && level !== 0) return '0.000';

        const levelNum = typeof level === 'string' ? parseFloat(level) : level;
        if (isNaN(levelNum)) return '0.000';

        const result = (constant - levelNum) * multiplier + extra;
        return result.toFixed(3);
    };

    const calculateTotals = (record: SiloRecord): TotalsResult => {
        // คำนวณ Nut Total
        const nutSilo1 = safeParseFloat(calculateQuantity(record.nut_silo_1_level, 0.0453, 614));
        const nutSilo2 = safeParseFloat(calculateQuantity(record.nut_silo_2_level, 0.0453, 614));
        const nutSilo3 = safeParseFloat(calculateQuantity(record.nut_silo_3_level, 0.0538, 614, 2.19));
        const nutTotal = nutSilo1 + nutSilo2 + nutSilo3;

        // คำนวณ Kernel Total
        const kernelSilo1 = safeParseFloat(calculateQuantity(record.kernel_silo_1_level, 0.0296, 640));
        const kernelSilo2 = safeParseFloat(calculateQuantity(record.kernel_silo_2_level, 0.0296, 640));
        const kernelTotal = kernelSilo1 + kernelSilo2;

        // คำนวณ Sale Total
        const saleBig = safeParseFloat(calculateQuantity(record.silo_sale_big_level, 0.228, 920));
        const saleSmall = safeParseFloat(calculateQuantity(record.silo_sale_small_level, 0.228, 870));
        const saleTotal = (saleBig + saleSmall) / 2 + 12;

        // คำนวณ Outside Total
        const outsideNut = safeParseFloat(record.outside_nut);
        const kernelOutsidePile = safeParseFloat(record.kernel_outside_pile);
        const outsideTotal = outsideNut + kernelOutsidePile;

        // คำนวณ Grand Total
        const grandTotal = nutTotal + kernelTotal + saleTotal + outsideTotal;

        return {
            nutTotal: nutTotal.toFixed(3),
            kernelTotal: kernelTotal.toFixed(3),
            saleTotal: saleTotal.toFixed(3),
            outsideTotal: outsideTotal.toFixed(3),
            grandTotal: grandTotal.toFixed(3),
            components: {
                nutSilo1: nutSilo1.toFixed(3),
                nutSilo2: nutSilo2.toFixed(3),
                nutSilo3: nutSilo3.toFixed(3),
                kernelSilo1: kernelSilo1.toFixed(3),
                kernelSilo2: kernelSilo2.toFixed(3),
                saleBig: saleBig.toFixed(3),
                saleSmall: saleSmall.toFixed(3),
                outsideNut: outsideNut.toFixed(3),
                kernelOutsidePile: kernelOutsidePile.toFixed(3),
            },
        };
    };

    const handleCreate = (): void => {
        setEditingRecord(null);
        setShowForm(true);
    };

    const handleEdit = (record: SiloRecord): void => {
        setEditingRecord(record);
        setShowForm(true);
        
    };

    const handleSave = async (formData: any): Promise<void> => {
        try {
            if (editingRecord) {
                await router.put(`/stock/kernel/${editingRecord.id}`, formData);
                Toast.fire({ icon: 'success', title: 'อัพเดทเรียบร้อยแล้ว' });
            } else {
                await router.post('/stock/kernel', formData);
                Toast.fire({ icon: 'success', title: 'บันทึกเรียบร้อยแล้ว' });
            }
            setShowForm(false);
            setEditingRecord(null);
            refreshData();
        } catch (error) {
            console.error('Error saving record:', error);
            Swal.fire({
                title: 'ผิดพลาด!',
                text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
                icon: 'error',
                customClass: { popup: 'custom-swal' },
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#ef4444',
            });
        }
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const openDeleteModal = (id: number): void => {
        setSelectedId(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = (): void => {
        setIsDeleteModalOpen(false);
        setSelectedId(null);
    };

    const handleDeleteWithPermission = (id: number): void => {
        if (userPermissions.includes('Admin.delete')) {
            openDeleteModal(id);
        } else {
            Swal.fire({
                icon: 'error',
                customClass: { popup: 'custom-swal' },
                title: 'ไม่มีสิทธิ์ในการลบข้อมูล',
            });
        }
    };

    const handleDelete = (): void => {
        if (selectedId) {
            router.delete(route('stock.kernel.destroy', selectedId), {
                onSuccess: () => {
                    Toast.fire({ icon: 'success', title: 'ลบรายการเรียบร้อยแล้ว' });
                    closeDeleteModal();
                },
                preserveScroll: true,
            });
            refreshData();
        }
    };

    const filteredRecords = records.filter((record) => new Date(record.record_date).toLocaleDateString('th-TH').includes(searchTerm));

    const sortedRecords = [...filteredRecords].sort((a, b) => {
        const aValue = a[sortField as keyof SiloRecord];
        const bValue = b[sortField as keyof SiloRecord];

        if (sortField === 'record_date') {
            const aDate = new Date(aValue as string).getTime();
            const bDate = new Date(bValue as string).getTime();
            return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        }

        const aNum = safeParseFloat(aValue);
        const bNum = safeParseFloat(bValue);
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });

    const handleSort = (field: string): void => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (field: string): JSX.Element | null => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    if (showForm) {
        return (
            <SiloRecordForm
                record={editingRecord}
                onSave={handleSave}
                onCancel={() => {
                    setShowForm(false);
                    setEditingRecord(null);
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 p-6 font-anuphan">
            <div className="mx-auto max-w-7xl space-y-4">
                {/* Header */}
                <div className="rounded-3xl border border-white/50 bg-white/70 p-4 shadow-2xl backdrop-blur-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="mb-6 flex items-center space-x-4 lg:mb-0">
                            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-4 shadow-lg">
                                <BarChart3 className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-3xl font-bold text-transparent">
                                    ข้อมูลปริมาณเมล็ดใน Silo
                                </h1>
                                <p className="mt-2 flex items-center text-gray-600">
                                    <Calculator className="mr-1 h-4 w-4 text-amber-500" />
                                    จัดการและติดตามข้อมูลระดับ Silo แบบเรียลไทม์
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={handleCreate}
                                className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                บันทึกข้อมูลใหม่
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* วันที่ล่าสุด */}
                    <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-100">วันที่บันทึกล่าสุด</p>
                                <p className="mt-1 text-lg font-bold">
                                    {sortedRecords[0]
                                        ? new Date(sortedRecords[0].record_date).toLocaleDateString('th-TH', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                          })
                                        : 'ไม่มีข้อมูล'}
                                </p>
                                <p className="mt-1 text-xs text-blue-200">{sortedRecords.length} รายการ</p>
                            </div>
                            <div className="rounded-2xl bg-white/20 p-3">
                                <Calendar className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    {/* ยอด Nut ทั้งหมด */}
                    <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 p-6 text-white shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-emerald-100">ยอด Nut Silo ล่าสุด</p>
                                <p className="mt-1 text-xl font-bold">
                                    {sortedRecords[0] ? calculateTotals(sortedRecords[0]).nutTotal : '0.000'} ตัน
                                </p>
                                <div className="mt-1 flex space-x-2 text-xs text-emerald-200">
                                    <span>Silo 1+2+3</span>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-white/20 p-3">
                                <Nut className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    {/* ยอด Kernel ทั้งหมด */}
                    <div className="rounded-3xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-100">ยอด Kernel Silo ล่าสุด</p>
                                <p className="mt-1 text-xl font-bold">
                                    {sortedRecords[0] ? calculateTotals(sortedRecords[0]).kernelTotal : '0.000'} ตัน
                                </p>
                                <div className="mt-1 flex space-x-2 text-xs text-purple-200">
                                    <span>Silo 1+2</span>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-white/20 p-3">
                                <Package className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    {/* ยอดรวมทั้งหมด */}
                    <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-amber-100">ยอด Silo ขาย ล่าสุด</p>
                                <p className="mt-1 text-2xl font-bold">
                                    {sortedRecords[0] ? calculateTotals(sortedRecords[0]).saleTotal : '0.000'} ตัน
                                </p>
                                <div className="mt-1 text-xs text-amber-200">( ฝาใหญ่ + ฝาจุก / 2 ) + 12</div>
                            </div>
                            <div className="rounded-2xl bg-white/20 p-3">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="rounded-3xl border border-white/50 bg-white/70 p-4 shadow-2xl backdrop-blur-sm">
                    <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                        <div className="max-w-md flex-1">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาตามวันที่..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-2xl border border-gray-200 bg-white py-3 pr-4 pl-10 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="flex items-center justify-center rounded-2xl border border-blue-200/50 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-3 text-blue-700 shadow-sm transition-all duration-200 hover:shadow-md">
                                <Filter className="mr-2 h-4 w-4" />
                                กรองข้อมูล
                            </button>
                        </div>
                    </div>
                </div>

                {/* Records Table */}
                <div className="overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-2xl backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50/30">
                                <tr>
                                    <th
                                        className="cursor-pointer px-6 py-5 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100/50"
                                        onClick={() => handleSort('record_date')}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                            <span>วันที่บันทึก</span>
                                            {getSortIcon('record_date')}
                                        </div>
                                    </th>
                                    <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <Nut className="h-4 w-4 text-blue-600" />
                                            <span>Nut Silo</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <Package className="h-4 w-4 text-emerald-600" />
                                            <span>Kernel Silo</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <Warehouse className="h-4 w-4 text-purple-600" />
                                            <span>Silo ขาย</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <TreePine className="h-4 w-4 text-amber-600" />
                                            <span>กองนอก</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <BarChart3 className="h-4 w-4 text-gray-600" />
                                            <span>สรุปผลลัพธ์</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/50">
                                {sortedRecords.map((record, index) => {
                                    const totals = calculateTotals(record);

                                    return (
                                        <tr
                                            key={record.id}
                                            className={`group transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 ${
                                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                            }`}
                                        >
                                            {/* วันที่บันทึก */}
                                            <td className="px-2 py-2 align-top">
                                                <div className="flex items-start space-x-3">
                                                    <div className="rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 p-2 shadow-sm">
                                                        <Calendar className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {new Date(record.record_date).toLocaleDateString('th-TH', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </div>
                                                        <div className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                                                            {new Date(record.record_date).toLocaleDateString('th-TH', {
                                                                weekday: 'long',
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Nut Silo */}
                                            <td className="px-2 py-2 align-top">
                                                <div className="space-y-2">
                                                    {[
                                                        {
                                                            level: record.nut_silo_1_level,
                                                            label: 'Silo 1',
                                                            value: calculateQuantity(record.nut_silo_1_level, 0.0453, 614),
                                                        },
                                                        {
                                                            level: record.nut_silo_2_level,
                                                            label: 'Silo 2',
                                                            value: calculateQuantity(record.nut_silo_2_level, 0.0453, 614),
                                                        },
                                                        {
                                                            level: record.nut_silo_3_level,
                                                            label: 'Silo 3',
                                                            value: calculateQuantity(record.nut_silo_3_level, 0.0538, 614, 2.19),
                                                        },
                                                    ].map((silo, idx) => (
                                                        <div key={idx} className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
                                                            <div className="mb-1 text-xs font-medium text-blue-600">{silo.label}</div>
                                                            <div className="text-sm text-gray-600">
                                                                ระดับ: {formatDisplayNumber(silo.level, 1)} cm
                                                            </div>
                                                            <div className="mt-1 text-sm font-bold text-blue-700">{silo.value} ตัน</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Kernel Silo */}
                                            <td className="px-2 py-2 align-top">
                                                <div className="space-y-2">
                                                    {[
                                                        {
                                                            level: record.kernel_silo_1_level,
                                                            label: 'Silo 1',
                                                            value: calculateQuantity(record.kernel_silo_1_level, 0.0296, 640),
                                                        },
                                                        {
                                                            level: record.kernel_silo_2_level,
                                                            label: 'Silo 2',
                                                            value: calculateQuantity(record.kernel_silo_2_level, 0.0296, 640),
                                                        },
                                                    ].map((silo, idx) => (
                                                        <div key={idx} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
                                                            <div className="mb-1 text-xs font-medium text-emerald-600">{silo.label}</div>
                                                            <div className="text-sm text-gray-600">
                                                                ระดับ: {formatDisplayNumber(silo.level, 1)} cm
                                                            </div>
                                                            <div className="mt-1 text-sm font-bold text-emerald-700">{silo.value} ตัน</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Sale Silo */}
                                            <td className="px-2 py-2 align-top">
                                                <div className="space-y-2">
                                                    {[
                                                        {
                                                            level: record.silo_sale_big_level,
                                                            label: 'ฝาใหญ่',
                                                            value: calculateQuantity(record.silo_sale_big_level, 0.228, 920),
                                                        },
                                                        {
                                                            level: record.silo_sale_small_level,
                                                            label: 'ฝาจุก',
                                                            value: calculateQuantity(record.silo_sale_small_level, 0.228, 870),
                                                        },
                                                    ].map((silo, idx) => (
                                                        <div key={idx} className="rounded-2xl border border-purple-100 bg-purple-50/50 p-3">
                                                            <div className="mb-1 text-xs font-medium text-purple-600">{silo.label}</div>
                                                            <div className="text-sm text-gray-600">
                                                                ระดับ: {formatDisplayNumber(silo.level, 1)} cm
                                                            </div>
                                                            <div className="mt-1 text-sm font-bold text-purple-700">{silo.value} ตัน</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* กองนอก */}
                                            <td className="px-2 py-2 align-top">
                                                <div className="space-y-2">
                                                    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
                                                        <div className="mb-2 flex items-center space-x-2">
                                                            <TreePine className="h-4 w-4 text-amber-600" />
                                                            <div className="text-xs font-medium text-amber-600">NUT นอก</div>
                                                        </div>
                                                        <div className="text-sm font-bold text-amber-700">
                                                            {formatDisplayNumber(record.outside_nut)} ตัน
                                                        </div>
                                                    </div>
                                                    <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-3">
                                                        <div className="mb-2 flex items-center space-x-2">
                                                            <Box className="h-4 w-4 text-orange-600" />
                                                            <div className="text-xs font-medium text-orange-600">Kernel กองนอก</div>
                                                        </div>
                                                        <div className="text-sm font-bold text-orange-700">
                                                            {formatDisplayNumber(record.kernel_outside_pile)} ตัน
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Summary */}
                                            <td className="px-2 py-2 align-top">
                                                <div className="space-y-2">
                                                    {[
                                                        {
                                                            label: 'Nut Total',
                                                            value: totals.nutTotal,
                                                            color: 'text-blue-700',
                                                            bg: 'bg-blue-50',
                                                        },
                                                        {
                                                            label: 'Kernel Total',
                                                            value: totals.kernelTotal,
                                                            color: 'text-emerald-700',
                                                            bg: 'bg-emerald-50',
                                                        },
                                                        {
                                                            label: 'Sale Total',
                                                            value: totals.saleTotal,
                                                            color: 'text-purple-700',
                                                            bg: 'bg-purple-50',
                                                        },
                                                    ].map((item, idx) => (
                                                        <div key={idx} className={`${item.bg} rounded-xl border p-2`}>
                                                            <div className="text-xs text-gray-600">{item.label}</div>
                                                            <div className={`text-sm font-bold ${item.color}`}>{item.value} ตัน</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-2 py-2 align-top">
                                                <div className="flex flex-col space-y-2">
                                                    <button
                                                        onClick={() => handleEdit(record)}
                                                        className="flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
                                                    >
                                                        <Edit className="mr-1 h-4 w-4" />
                                                        แก้ไข
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteWithPermission(record.id)}
                                                        className="flex items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
                                                    >
                                                        <Trash2 className="mr-1 h-4 w-4" />
                                                        ลบ
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {sortedRecords.length === 0 && (
                        <div className="py-16 text-center">
                            <div className="mx-auto max-w-md rounded-3xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100 p-8">
                                <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                                <h3 className="mb-2 text-lg font-semibold text-gray-600">ไม่พบข้อมูล</h3>
                                <p className="mb-6 text-sm text-gray-500">เริ่มต้นโดยการบันทึกข้อมูล Silo ใหม่</p>
                                <button
                                    onClick={handleCreate}
                                    className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                                >
                                    <Plus className="mr-2 inline h-4 w-4" />
                                    บันทึกข้อมูลแรก
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            <DeleteModal isModalOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="ยืนยันการลบ" onConfirm={handleDelete}>
                <p className="font-anuphan text-sm text-gray-500">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            </DeleteModal>
        </div>
    );
};

export default SiloRecordList;
