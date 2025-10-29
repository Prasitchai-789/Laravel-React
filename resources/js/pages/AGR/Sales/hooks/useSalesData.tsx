import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { useState } from 'react';
import Swal from 'sweetalert2';

interface Sale {
    id: number;
    sale_date: string;
    quantity: number;
    total_amount: number;
    deposit: number;
    paid_amount: number;
    payment_status: string;
}

interface UseSalesDataProps {
    sales: Sale[];
    customers: any[];
    userPermissions: string[];
}

export function useSalesData({ sales, customers, userPermissions }: UseSalesDataProps) {
    const [mode, setMode] = useState<'create' | 'edit' | 'pay'>('create');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);

    // คำนวณสถิติ
    const today = dayjs().format('YYYY-MM-DD');

    const stats = {
        totalCustomers: customers?.length ?? 0,
        qtyToday: sales
            .filter((s: Sale) => dayjs(s.sale_date).format('YYYY-MM-DD') === today)
            .reduce((sum: number, s: Sale) => sum + (s.quantity ?? 0), 0),
        revenueToday: sales
            .filter((s: Sale) => dayjs(s.sale_date).format('YYYY-MM-DD') === today)
            .reduce((sum: number, s: Sale) => sum + (s.total_amount ?? 0), 0),
        totalRevenue: sales.reduce((sum: number, s: Sale) => sum + Number(s.total_amount ?? 0), 0),
        totalDeposit: sales.reduce((sum: number, s: Sale) => sum + Number(s.deposit ?? 0), 0),
        paymentStats: {
            completed: sales.filter(s => s.payment_status === 'completed').length,
            partial: sales.filter(s => s.payment_status === 'partial').length,
            pending: sales.filter(s => s.payment_status === 'pending').length,
        }
    };

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
        if (userPermissions.includes('Admin.edit')) {
            handleEdit(sale);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถแก้ไขข้อมูลได้',
                text: 'คุณไม่มีสิทธิ์ในการแก้ไขข้อมูล',
                customClass: { popup: 'custom-swal' },
            });
        }
    };

    const handleDeleteWithPermission = (sale: Sale) => {
        if (userPermissions.includes('Admin.delete')) {
            openDeleteModal(sale.id);
        } else {
            Swal.fire({
                icon: 'error',
                customClass: { popup: 'custom-swal' },
                title: 'ไม่สามารถลบข้อมูลได้',
                text: 'คุณไม่มีสิทธิ์ในการลบข้อมูล',
            });
        }
    };

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
                        title: 'ลบรายการขายเรียบร้อยแล้ว',
                    });
                    closeDeleteModal();
                },
                onError: () => {
                    Toast.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาดในการลบรายการขาย',
                    });
                },
                preserveScroll: true,
            });
        }
    };

    return {
        mode,
        searchTerm,
        statusFilter,
        isSaleModalOpen,
        isPayModalOpen,
        isDeleteModalOpen,
        selectedSale,
        selectedSaleId,
        setMode,
        setSearchTerm,
        setStatusFilter,
        setIsSaleModalOpen,
        setIsPayModalOpen,
        setIsDeleteModalOpen,
        setSelectedSale,
        setSelectedSaleId,
        openCreate,
        handlePay,
        handleEditWithPermission,
        handleDeleteWithPermission,
        openDeleteModal,
        closeDeleteModal,
        handleDelete,
        stats
    };
}
