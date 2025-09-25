import GenericTable, { Column } from '@/components/Tables/GenericTable';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { Pencil, Trash2, Users, Target, Clock, Zap } from 'lucide-react';

interface Labor {
    id: number;
    production_id: number;
    workers: number;
    hours: number;
    ot_hours: number;
    labor_cost: number;
}

interface Energy {
    production_id: number;
    type: string;
    quantity: number | string;
    price: number | string;
    total: number | string;
    number_kwh?: number | string;
    electricity_kwh?: number | string;
}

interface Production {
    id: number;
    date: string;
    shift: string;
    line_id: number | string;
    product_qty: number | string;
    target_qty?: number; // เพิ่ม property ที่ขาดหาย
    labors?: Labor[];
    energies?: Energy[];
}

interface ProductionTableProps {
    productions: Production[];
    labors: Labor[];
    energies: Energy[];
    onEdit?: (production: Production) => void;
    onDelete?: (production: Production) => void;
}

export default function ProductionTable({ productions, onEdit, onDelete, labors, energies }: ProductionTableProps) {
    const handleEdit = (production: Production) => {
        if (onEdit) {
            onEdit(production);
        }
    };

    const handleDelete = (production: Production) => {
        if (onDelete) {
            onDelete(production);
        }
    };

    const calculateAchievementRate = (productQty: number, targetQty: number) => {
        if (!targetQty || targetQty === 0) return '0.00';
        return ((productQty / targetQty) * 100).toFixed(2);
    };

    const getShiftColor = (shift: string) => {
        switch (shift.toLowerCase()) {
            case 'กลางวัน':
            case 'day':
                return 'bg-blue-50 border-l-4 border-blue-500';
            case 'กลางคืน':
            case 'night':
                return 'bg-indigo-50 border-l-4 border-indigo-500';
            default:
                return 'bg-gray-50 border-l-4 border-gray-400';
        }
    };

    const productionsWithLabors = productions.map((p) => {
        const matchedLabors = labors.filter((l) => l.production_id === p.id);
        return {
            ...p,
            labors: matchedLabors,
        };
    });

    const productionColumns: Column<Production>[] = [
        {
            key: 'date',
            label: 'วันที่ผลิต',
            sortable: true,
            align: 'center',
            render: (production) => (
                <div className="flex flex-col items-center">
                    <div className="text-sm font-medium text-gray-900">
                        {production.date ? dayjs(production.date).format('DD/MM/YYYY') : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                        {production.date ? dayjs(production.date).locale('th').format('dddd') : ''}
                    </div>
                </div>
            ),
        },
        {
            key: 'shift',
            label: 'กะการทำงาน',
            sortable: true,
            align: 'center',
            render: (production) => {
                if (!production.labors || production.labors.length === 0) {
                    return (
                        <div className={`rounded-lg p-3 ${getShiftColor(production.shift)}`}>
                            <div className="flex items-center justify-center gap-1">
                                <Users size={16} className="text-gray-600" />
                                <span className="font-medium">{production.shift || '-'}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">ไม่มีข้อมูลพนักงาน</div>
                        </div>
                    );
                }

                // รวมจำนวน workers ทั้งหมดของ labor ที่ตรง production.id
                const totalWorkers = production.labors.reduce((acc, labor) => acc + (labor.workers || 0), 0);

                return (
                    <div className={`rounded-lg p-1.5 ${getShiftColor(production.shift)}`}>
                        <div className="flex items-center justify-center gap-1">
                            <span className="font-medium">{production.shift}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-1">
                            <Users size={14} className="text-gray-600 me-1" />
                            <span className="text-sm font-semibold text-blue-700">{totalWorkers}</span>
                            <span className="text-xs text-gray-600">คน</span>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'line_id',
            label: 'ไลน์การผลิต',
            sortable: true,
            align: 'center',
            render: (production) => (
                <div className="flex flex-col items-center">
                    <div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
                        Line {production.line_id || '-'}
                    </div>
                </div>
            ),
        },
        {
            key: 'product_qty',
            label: 'จำนวนที่ผลิตได้',
            sortable: true,
            align: 'right',
            render: (production) => (
                <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                        {production.product_qty ? Number(production.product_qty).toLocaleString('th-TH') : '-'}
                    </div>
                    <div className="text-xs text-gray-500">หน่วย</div>
                </div>
            ),
        },
        {
            key: 'target',
            label: 'อัตราบรรลุเป้าหมาย',
            sortable: true,
            align: 'center',
            render: (production) => {
                const rate = parseFloat(
                    calculateAchievementRate(
                        Number(production.product_qty),
                        Number(production.target_qty || 0)
                    )
                );

                const getRateColor = () => {
                    if (rate >= 100) return 'bg-green-100 text-green-800';
                    if (rate >= 80) return 'bg-yellow-100 text-yellow-800';
                    return 'bg-red-100 text-red-800';
                };

                const getRateIcon = () => {
                    if (rate >= 100) return '🎯';
                    if (rate >= 80) return '📈';
                    return '📉';
                };

                return (
                    <div className="flex flex-col items-center">
                        <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${getRateColor()}`}>
                            {/* <Target size={14} /> */}
                            {rate}%
                        <div className="text-xs text-gray-500">{getRateIcon()}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'hours',
            label: 'ชั่วโมงทำงาน',
            render: (p) => {
                if (!p.labors || p.labors.length === 0) return (
                    <div className="text-center text-gray-400">-</div>
                );

                const totalHours = p.labors.reduce((acc, labor) => acc + (labor.hours || 0), 0);

                return (
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                            <Clock size={14} className="text-blue-600" />
                            <span className="font-medium">{(totalHours).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-500">ชั่วโมง</div>
                    </div>
                );
            },
            align: 'center',
        },
        {
            key: 'ot_hours',
            label: 'ชั่วโมง OT',
            render: (p) => {
                if (!p.labors || p.labors.length === 0) return (
                    <div className="text-center text-gray-400">-</div>
                );

                const totalOtHours = p.labors.reduce((acc, labor) => acc + (labor.ot_hours || 0), 0);

                return (
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                            <Clock size={14} className="text-orange-500" />
                            <span className="font-medium">{(totalOtHours).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-500">ชั่วโมง</div>
                    </div>
                );
            },
            align: 'center',
        },
        {
            key: 'electricity_kwh',
            label: 'การใช้ไฟฟ้า',
            sortable: true,
            align: 'center',
            render: (production) => (
                <div className="flex flex-col items-center">
                    <div className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-purple-800">
                        <Zap size={14} className="text-orange-500 me-2" />
                         {production.energies[0]?.electricity_kwh || '-'}
                    </div>
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'การดำเนินการ',
            align: 'center',
        },
    ];

    return (
        <GenericTable
            title="ข้อมูลการผลิตปุ๋ย"
            data={productionsWithLabors}
            columns={productionColumns}
            idField="id"
            actions={(row) => (
                <div className="flex justify-center gap-2">
                    <button
                        className="group relative text-yellow-600 transition-all duration-300 hover:scale-110 focus:outline-none"
                        onClick={() => handleEdit(row)}
                        aria-label="แก้ไข"
                    >
                        <div className="relative flex items-center justify-center">
                            <div className="rounded-lg bg-yellow-50 p-1 transition-colors duration-300 group-hover:bg-yellow-100">
                                <Pencil size={18} className="text-yellow-600" />
                            </div>

                            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-yellow-600 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100">
                                แก้ไข
                                <div className="absolute bottom-[-4px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-yellow-600"></div>
                            </span>
                        </div>
                    </button>

                    <button
                        className="group relative text-red-700 transition-all duration-300 hover:scale-110 focus:outline-none"
                        onClick={() => handleDelete(row)}
                        aria-label="ลบ"
                    >
                        <div className="relative flex items-center justify-center">
                            <div className="rounded-lg bg-red-50 p-1 transition-colors duration-300 group-hover:bg-red-100">
                                <Trash2 size={18} className="text-red-700" />
                            </div>

                            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100">
                                ลบ
                                <div className="absolute bottom-[-4px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-red-600"></div>
                            </span>
                        </div>
                    </button>
                </div>
            )}
        />
    );
}
