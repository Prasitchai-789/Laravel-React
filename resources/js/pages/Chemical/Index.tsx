import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { can } from '@/lib/can';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { BarChart3, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, FlaskRound, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import DetailView from './Detail';
import UseForm from './UseForm';

export default function ChemicalsIndex({ records, pagination }) {
    const [isModalOpen, setIsOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailRecord, setDetailRecord] = useState<any[]>([]);
    const [shift, setShift] = useState<'A' | 'B'>('A');

    const openCreate = () => {
        setMode('create');
        setSelectedRecords([]);
        setShift('A');
        setIsOpen(true);
    };

    const handleDelete = (group = null) => {
        // กรณีลบทั้งกลุ่ม
        let recordIds = [];
        if (group?.records?.length) {
            recordIds = group.records.map((record) => record.id);
        } else if (selectedRecords.length) {
            // กรณีลบจาก selectedRecords
            recordIds = selectedRecords;
        }

        if (!recordIds.length) return;

        Swal.fire({
            title: 'คุณแน่ใจหรือไม่?',
            text: `คุณกำลังจะลบข้อมูลทั้งหมด ${recordIds.length} รายการ!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#',
            cancelButtonColor: '#',
            confirmButtonText: 'ใช่, ลบข้อมูล!',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            customClass: {
                popup: 'custom-swal',
                confirmButton: 'swal-confirm-btn',
                cancelButton: 'swal-cancel-btn',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    '/chemical/delete',
                    { ids: recordIds },
                    {
                        onSuccess: () => {
                            closeDeleteModal?.(); // ถ้ามี modal ให้ปิด

                            const remainingCount = pagination.total - recordIds.length;
                            const currentPage = pagination.current_page;
                            const perPage = pagination.per_page;
                            const remainingItemsInCurrentPage = perPage - recordIds.length;

                            if (remainingItemsInCurrentPage <= 0 && currentPage > 1) {
                                if (pagination.prev_page_url) {
                                    handlePagination(pagination.prev_page_url);
                                } else {
                                    router.reload({ only: ['records', 'pagination'] });
                                }
                            } else {
                                router.reload({ only: ['records', 'pagination'] });
                            }

                            Swal.fire({
                                title: 'ลบข้อมูลสำเร็จ!',
                                text: `ข้อมูล ${recordIds.length} รายการถูกลบเรียบร้อยแล้ว`,
                                icon: 'success',
                                confirmButtonColor: '#',
                                confirmButtonText: 'ตกลง',
                                customClass: {
                                    popup: 'custom-swal',
                                    confirmButton: 'swal-success-btn',
                                },
                            });
                        },
                        onError: () => {
                            Swal.fire({
                                title: 'เกิดข้อผิดพลาด!',
                                text: 'ไม่สามารถลบข้อมูลได้',
                                icon: 'error',
                                confirmButtonColor: '#',
                                confirmButtonText: 'ตกลง',
                                customClass: {
                                    popup: 'custom-swal',
                                    confirmButton: 'swal-error-btn',
                                },
                            });
                        },
                    },
                );
            }
        });
    };
    const openDeleteModal = (group) => {
        // เก็บ ID ของทุก record ในกลุ่มนี้
        const recordIds = group.records.map((record) => record.id);
        setSelectedRecords(recordIds);
        setIsDeleteModalOpen(true);
    };
    const closeDeleteModal = () => {
        setSelectedRecords([]);
        setIsDeleteModalOpen(false);
    };

    const groupedByShift = records.map((group) => {
        const uniqueChemicals = new Set(group.records.map((r) => r.chemical_name));
        return {
            id: group.id, // เก็บ group ID หากมี
            date: group.date,
            shift: group.shift,
            records: group.records,
            totalChemicals: uniqueChemicals.size,
        };
    });

    // ฟังก์ชันจัดการ Pagination
    const handlePagination = (url) => {
        if (url) {
            router.visit(url, {
                preserveState: true,
                preserveScroll: true,
                only: ['records', 'pagination'],
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Chemicals',
            href: '/chemical',
        },
        {
            title: 'Daily Chemicals',
            href: '/chemical',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daily Chemicals">
                {/* เพิ่มลิงก์ไปยังฟอนต์ Anuphan */}
                <link href="https://fonts.googleapis.com/css2?family=Anuphan:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
                <style>{`
                    body, button, input, select, textarea, table {
                        font-family: 'Anuphan', sans-serif;
                    }
                `}</style>
            </Head>

            <div className="px-4 py-4 font-anuphan sm:px-6">
                {/* Header Section */}
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-blue-100 p-2">
                            <FlaskRound className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Daily Chemicals</h1>
                            <p className="mt-1 text-xs text-gray-500">จัดการข้อมูลการใช้สารเคมีรายวัน</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Monthly Report Button */}
                        <button
                            onClick={() => router.visit('/monthly')}
                            className="flex items-center gap-1.5 rounded-3xl bg-gradient-to-r from-green-500 to-green-600 px-3 py-2.5 font-anuphan text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-105 hover:cursor-pointer hover:from-green-600 hover:to-green-700"
                        >
                            <BarChart3 size={16} />
                            <span>รายงานประจำเดือน</span>
                        </button>

                        {/* Add Record Button */}
                        {can('chemical.view') && (
                            <button
                                onClick={openCreate}
                                className="flex items-center gap-1.5 rounded-3xl bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2.5 font-anuphan text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-105 hover:cursor-pointer hover:from-blue-600 hover:to-blue-700"
                            >
                                <Plus size={16} />
                                <span>เพิ่มข้อมูลใหม่</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary Card */}
                <div className="mb-4 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 font-anuphan">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                            <span className="text-xs font-medium text-gray-700">จำนวนรายการทั้งหมด:</span>
                            <span className="text-xs font-semibold text-blue-700">{pagination?.total || records.length} รายการ</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                            <span className="text-xs font-medium text-gray-700">จำนวนวันที่มีข้อมูล:</span>
                            <span className="text-xs font-semibold text-green-700">{new Set(records.map((r) => r.date)).size} วัน</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-purple-500"></div>
                            <span className="text-xs font-medium text-gray-700">หน้าปัจจุบัน:</span>
                            <span className="text-xs font-semibold text-purple-700">
                                {pagination?.current_page} / {pagination?.last_page}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white font-anuphan shadow-xs">
                    <table className="w-full text-base">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-anuphan text-sm font-semibold tracking-wider text-gray-600 uppercase">
                                    วันที่
                                </th>
                                <th className="px-4 py-3 text-left font-anuphan text-sm font-semibold tracking-wider text-gray-600 uppercase">
                                    ช่วงเวลาการทำงาน
                                </th>
                                <th className="px-4 py-3 text-center font-anuphan text-sm font-semibold tracking-wider text-gray-600 uppercase">
                                    จำนวนสารเคมี
                                </th>
                                <th className="px-4 py-3 text-center font-anuphan text-sm font-semibold tracking-wider text-gray-600 uppercase">
                                    การดำเนินการ
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {groupedByShift.length > 0 ? (
                                groupedByShift.map((group, idx) => (
                                    <tr key={idx} className="p2 font-anuphan transition-colors duration-150 hover:bg-blue-50/30">
                                        <td className="px-3 py-3 font-anuphan font-medium whitespace-nowrap text-gray-900">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-400" />
                                                {group.date}
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 font-anuphan whitespace-nowrap text-gray-700">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${group.shift === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} font-anuphan`}
                                            >
                                                หน่วยงาน กะ {group.shift}
                                            </span>
                                        </td>
                                        <td className="px-2 py-3 text-center font-anuphan">
                                            <button
                                                onClick={() => {
                                                    setDetailRecord(group);
                                                    setIsDetailOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 font-anuphan text-xs text-emerald-700 transition-all duration-200 hover:cursor-pointer hover:border-emerald-200 hover:bg-emerald-100"
                                                title="ดูรายละเอียด"
                                            >
                                                <span className="font-semibold">{group.totalChemicals}</span>
                                                <span>รายการ</span>
                                                <Eye size={12} className="opacity-80" />
                                            </button>
                                        </td>
                                        <td className="px-2 py-3 font-anuphan">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => {
                                                        setMode('edit');
                                                        setSelectedRecords(group.records);
                                                        setShift(group.shift);
                                                        setIsOpen(true);
                                                    }}
                                                    className="group relative p-1.5 font-anuphan text-yellow-600 transition-colors duration-200 hover:scale-110 hover:cursor-pointer"
                                                    title=""
                                                >
                                                    <Pencil size={16} />
                                                    <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 transform rounded-md bg-yellow-500 px-2 py-1 font-anuphan text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:scale-105 hover:cursor-pointer">
                                                        แก้ไข
                                                    </span>
                                                </button>
                                                {can('users.delete') && (
                                                    <button
                                                        onClick={() => handleDelete(group)}
                                                        className="group duration-200hover:cursor-pointer relative p-1.5 font-anuphan text-red-700 transition-colors hover:scale-110"
                                                        title=""
                                                    >
                                                        <Trash2 size={16} />
                                                        <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 transform rounded-md bg-red-600 px-2 py-1 font-anuphan text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:scale-105 hover:cursor-pointer">
                                                            ลบข้อมูล
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-3 py-4 text-center font-anuphan">
                                        <div className="flex flex-col items-center justify-center font-anuphan text-gray-400">
                                            <FlaskRound className="mb-1.5 h-8 w-8 opacity-50" />
                                            <p className="font-anuphan text-xs">ไม่มีข้อมูลการใช้สารเคมี</p>
                                            <p className="mt-0.5 font-anuphan text-[11px]">กรุณาเพิ่มข้อมูลใหม่โดยคลิกปุ่ม "เพิ่มข้อมูลใหม่"</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="mt-6 flex flex-col items-center justify-center gap-4 font-anuphan">
                        <div className="font-anuphan text-xs text-gray-600">
                            แสดง {pagination.from} ถึง {pagination.to} จาก {pagination.total} รายการ
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            {/* Desktop Pagination */}
                            <div className="hidden items-center gap-1 font-anuphan md:flex">
                                {/* First Page */}
                                <button
                                    onClick={() => handlePagination(pagination.first_page_url)}
                                    disabled={pagination.current_page === 1}
                                    className="rounded-lg border border-gray-300 bg-white p-2 font-anuphan text-gray-600 shadow-xs transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="หน้าแรก"
                                >
                                    <ChevronsLeft size={16} />
                                </button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1 font-anuphan">
                                    {(() => {
                                        const links = pagination.links;
                                        const currentPage = pagination.current_page;
                                        const lastPage = pagination.last_page;

                                        // ถ้ามีน้อยกว่า 7 หน้าแสดงทั้งหมด
                                        if (lastPage <= 7) {
                                            return links.map((link, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handlePagination(link.url)}
                                                    disabled={!link.url || link.active}
                                                    className={`h-10 min-w-[2.5rem] rounded-lg px-3 py-2 font-anuphan text-sm font-medium shadow-xs transition-all duration-200 ${
                                                        link.active
                                                            ? 'border border-blue-700 bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-inner'
                                                            : 'border border-gray-300 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                                                    }`}
                                                >
                                                    {link.label}
                                                </button>
                                            ));
                                        }

                                        // ถ้ามากกว่า 7 หน้าแสดงเฉพาะบางหน้า
                                        let visiblePages = [];

                                        // หน้าแรก
                                        visiblePages.push(links[0]);

                                        // หน้าปัจจุบันและรอบๆ
                                        if (currentPage <= 4) {
                                            // ใกล้หน้าแรก
                                            for (let i = 1; i <= 5; i++) {
                                                if (i < links.length) visiblePages.push(links[i]);
                                            }
                                            visiblePages.push({ label: '...', url: null, active: false });
                                            visiblePages.push(links[links.length - 1]);
                                        } else if (currentPage >= lastPage - 3) {
                                            // ใกล้หน้าสุดท้าย
                                            visiblePages.push({ label: '...', url: null, active: false });
                                            for (let i = lastPage - 6; i < links.length; i++) {
                                                visiblePages.push(links[i]);
                                            }
                                        } else {
                                            // ตรงกลาง
                                            visiblePages.push({ label: '...', url: null, active: false });
                                            for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                                                if (i > 0 && i <= lastPage) {
                                                    visiblePages.push(links[i - 1]);
                                                }
                                            }
                                            visiblePages.push({ label: '...', url: null, active: false });
                                            visiblePages.push(links[links.length - 1]);
                                        }

                                        return visiblePages.map((link, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handlePagination(link.url)}
                                                disabled={!link.url || link.active}
                                                className={`h-10 min-w-[2.5rem] rounded-lg px-3 py-2 font-anuphan text-sm font-medium shadow-xs transition-all duration-200 ${
                                                    link.active
                                                        ? 'border border-blue-700 bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-inner'
                                                        : link.url
                                                          ? 'border border-gray-300 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                                                          : 'cursor-default border border-gray-200 bg-gray-100 text-gray-400'
                                                }`}
                                            >
                                                {link.label}
                                            </button>
                                        ));
                                    })()}
                                </div>

                                {/* Last Page */}
                                <button
                                    onClick={() => handlePagination(pagination.last_page_url)}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="rounded-lg border border-gray-300 bg-white p-2 font-anuphan text-gray-600 shadow-xs transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="หน้าสุดท้าย"
                                >
                                    <ChevronsRight size={16} />
                                </button>
                            </div>

                            {/* Mobile Pagination */}
                            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 font-anuphan md:hidden">
                                <button
                                    onClick={() => handlePagination(pagination.prev_page_url)}
                                    disabled={!pagination.prev_page_url}
                                    className="rounded-lg border border-gray-300 bg-white p-2 font-anuphan text-gray-600 shadow-xs transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="หน้าก่อนหน้า"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <div className="font-anuphan text-sm font-medium text-gray-700">
                                    หน้า {pagination.current_page} / {pagination.last_page}
                                </div>

                                <button
                                    onClick={() => handlePagination(pagination.next_page_url)}
                                    disabled={!pagination.next_page_url}
                                    className="rounded-lg border border-gray-300 bg-white p-2 font-anuphan text-gray-600 shadow-xs transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="หน้าถัดไป"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* <DeleteModal isModalOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="ลบข้อมูล" onConfirm={handleDelete}>
                <p className="font-anuphan text-sm text-gray-700">คุณแน่ใจว่าต้องการลบข้อมูลนี้หรือไม่?</p>
                <p className="mt-1 font-anuphan text-xs text-gray-500">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
            </DeleteModal> */}

            {/* ... [ส่วน Modal อื่นๆ] */}
            {isModalOpen && (
                <ModalForm
                    isModalOpen={isModalOpen}
                    onClose={() => setIsOpen(false)}
                    title={mode === 'create' ? 'เพิ่มข้อมูลใหม่' : 'แก้ไขข้อมูล'}
                    description={mode === 'create' ? 'กรุณากรอกข้อมูลให้ครบ' : 'กรุณาแก้ไขข้อมูลให้ครบ'}
                    size="max-w-2xl"
                >
                    <UseForm
                        key={mode + '_' + Date.now()}
                        mode={mode}
                        data={selectedRecords}
                        shift={shift}
                        onClose={() => setIsOpen(false)}
                        onSuccess={() => {
                            // รีเฟรชข้อมูลหลังจากสร้างหรือแก้ไขสำเร็จ
                            router.reload({ only: ['records', 'pagination'] });

                            Swal.fire({
                                position: 'center',
                                icon: 'success',
                                title: mode === 'create' ? 'เพิ่มข้อมูลสำเร็จ' : 'แก้ไขข้อมูลสำเร็จ',
                                showConfirmButton: false,
                                timer: 1500,
                                customClass: {
                                    popup: 'custom-swal',
                                },
                            });
                        }}
                    />
                </ModalForm>
            )}

            <ModalForm isModalOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="รายละเอียดข้อมูลสารเคมี" size="max-w-4xl">
                <div className="max-h-[70vh] overflow-x-auto">
                    <DetailView group={detailRecord} />
                </div>
            </ModalForm>
            <style>{`
                .custom-swal {
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                }
                .swal-confirm-btn {
                    border-radius: 8px;
                    padding: 10px 24px;
                    background: linear-gradient(to right, #ef4444, #dc2626);
                    transition: all 0.2s;
                }
                .swal-confirm-btn:hover {
                    background: linear-gradient(to right, #dc2626, #b91c1c);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
                }
                .swal-cancel-btn {
                    border-radius: 8px;
                    padding: 10px 24px;
                    background: #f3f4f6;
                    color: #4b5563;
                    transition: all 0.2s;
                }
                .swal-cancel-btn:hover {
                    background: #e5e7eb;
                    transform: translateY(-1px);
                }
                .swal-success-btn {
                    border-radius: 8px;
                    padding: 10px 24px;
                    background: linear-gradient(to right, #10b981, #059669);
                    transition: all 0.2s;
                }
                .swal-success-btn:hover {
                    background: linear-gradient(to right, #059669, #047857);
                    transform: translateY(-1px);
                }
                .swal-error-btn {
                    border-radius: 8px;
                    padding: 10px 24px;
                    background: linear-gradient(to right, #ef4444, #dc2626);
                    transition: all 0.2s;
                }
                .swal-error-btn:hover {
                    background: linear-gradient(to right, #dc2626, #b91c1c);
                    transform: translateY(-1px);
                }
            `}</style>
        </AppLayout>
    );
}
