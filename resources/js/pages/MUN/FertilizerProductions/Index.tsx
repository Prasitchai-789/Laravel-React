import Button from '@/components/Buttons/Button';
import DeleteModal from '@/components/DeleteModal';
import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import FerProductionForm from './FerProductionForm';
import FerProductionTable from './FerProductionTable';

interface Production {
    id: number;
    date: string;
    line_id: number;
    shift: string;
    product_qty: number;
    target_qty: number;
    created_at: string;
    updated_at: string;
}

interface Line {
    id: number;
    name: string;
}

interface Labor {
    id: number;
    workers: number;
    hours: number;
    ot_hours: number;
}

interface Energy {
    id: number;
    electricity_kwh: number;
    palm_fiber: number;
    number_kwh: number;
}
interface ProductionWithLaborsAndEnergies extends Production {
    labors: Labor[];
    energies: Energy[];
}

export default function Index() {
    const [productions, setProductions] = useState<Production[]>([]);
    const [lines, setLines] = useState<Line[]>([]);
    const [labors, setLabors] = useState<Labor[]>([]);
    const [energies, setEnergies] = useState<Energy[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
    const [mode, setMode] = useState('create');
    const [selectedProduction, setSelectedProduction] = useState<ProductionWithLaborsAndEnergies | null>(null);

    useEffect(() => {
        fetchProductions();
    }, []);

    const fetchProductions = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/fertilizer/productions/api');
            setProductions(res.data.productions);
            setLines(res.data.lines);
            setLabors(res.data.labors);
            setEnergies(res.data.energies);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching productions:', error);
        } finally {
            setLoading(false);
        }
    };
    const openCreate = () => {
        setMode('create');
        setSelectedProduction(null);
        setIsProductionModalOpen(true);
    };

    const productionsWithDetails: ProductionWithLaborsAndEnergies[] = productions.map((p) => {
        const matchedLabors = labors.filter((l) => l.production_id === p.id);
        const matchedEnergies = energies.filter((e) => e.production_id === p.id);

        return {
            ...p,
            labors: matchedLabors,
            energies: matchedEnergies,
        };
    });

    const handleEdit = (production: ProductionWithLaborsAndEnergies) => {
        setMode('edit');
        setSelectedProduction(production);
        setIsProductionModalOpen(true);
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const openDeleteModal = (production: ProductionWithLaborsAndEnergies) => {
        setSelectedId(production.id);
        setIsDeleteModalOpen(true);
    };
    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedId(null);
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

    const handleDelete = async () => {
        if (selectedId !== null) {
            try {
                // ลบข้อมูลจาก server
                await axios.delete(`/fertilizer/productions/${selectedId}`);

                // แสดง Toast success
                Toast.fire({
                    icon: 'success',
                    title: 'ลบรายการผลิตเรียบร้อยแล้ว',
                });

                // ปิด modal
                closeDeleteModal();

                // อัพเดต state ของ productions
                setProductions(productions.filter((p) => p.id !== selectedId));
            } catch (error) {
                console.error(error);
                alert('ลบไม่สำเร็จ');
            }
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Fertilizer Productions', href: '/fertilizer/productions' },
    ];

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex h-64 items-center justify-center">
                    <p className="text-lg text-gray-600">Loading...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6">
                {/* Header Section */}
                <div className="mb-6 flex flex-col gap-4 font-anuphan md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Fertilizer Productions</h1>
                        <p className="text-sm text-gray-500">จัดการข้อมูลการผลิตปุ๋ย</p>
                    </div>

                    <div className="flex w-full flex-nowrap items-center justify-end gap-3 py-1 md:w-auto">
                        <Button
                            onClick={openCreate}
                            icon={<Plus className="h-5 w-5" />}
                            iconPosition="left"
                            variant="success"
                            className="flex-shrink-0 font-anuphan whitespace-nowrap"
                        >
                            สร้างข้อมูลการผลิต
                        </Button>
                    </div>
                </div>

                {/* Production Table */}
                {/* Production Summary */}
                {productions.length > 0 && (
                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-lg bg-white p-4 shadow">
                            <h3 className="text-sm font-medium text-gray-500">จำนวนรายการทั้งหมด</h3>
                            <p className="text-2xl font-bold text-gray-900">{productions.length}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow">
                            <h3 className="text-sm font-medium text-gray-500">ผลผลิตทั้งหมด</h3>
                            <p className="text-2xl font-bold text-gray-900">
                                {productions.reduce((sum, p) => sum + Number(p.product_qty), 0).toLocaleString('th-TH')}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow">
                            <h3 className="text-sm font-medium text-gray-500">เป้าหมายทั้งหมด</h3>
                            <p className="text-2xl font-bold text-gray-900">
                                {productions.reduce((sum, p) => sum + Number(p.target_qty), 0).toLocaleString('th-TH')}
                            </p>
                        </div>
                    </div>
                )}
                <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-sm">
                    <FerProductionTable
                        productions={productionsWithDetails}
                        onEdit={handleEdit}
                        onDelete={openDeleteModal}
                        labors={labors}
                        energies={energies}
                    />
                </div>
            </div>

            {/* Production Form Modal */}
            <ModalForm
                isModalOpen={isProductionModalOpen}
                onClose={() => setIsProductionModalOpen(false)}
                title={mode === 'create' ? 'บันทึกข้อมูลการผลิต' : 'แก้ไขข้อมูลการผลิต'}
                description=" "
                size="max-w-2xl"
            >
                <FerProductionForm
                    mode={mode}
                    production={selectedProduction}
                    onClose={() => setIsProductionModalOpen(false)}
                    onSuccess={() => {
                        setIsProductionModalOpen(false);
                        fetchProductions();
                    }}
                    lines={lines}
                    labors={selectedProduction?.labors || []}
                    energies={selectedProduction?.energies || []}
                />
            </ModalForm>

            <DeleteModal isModalOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Delete Product" onConfirm={handleDelete}>
                <p className="font-anuphan text-sm text-gray-500">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            </DeleteModal>
        </AppLayout>
    );
}
