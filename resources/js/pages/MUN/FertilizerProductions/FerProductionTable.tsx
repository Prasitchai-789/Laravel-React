import GenericTable, { Column } from '@/components/Tables/GenericTable';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { Pencil, Trash2, Users, Target, Clock, Zap, TrendingUp, Factory } from 'lucide-react';

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
    quantity: number;
    price: number;
    total: number;
    number_kwh?: number;
    electricity_kwh?: number;
}

interface Production {
    id: number;
    date: string;
    shift: string;
    line_id: number;
    product_qty: number;
    target_qty?: number;
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
        if (!targetQty || targetQty === 0) return 0;
        return (productQty / targetQty) * 100;
    };

    const getShiftColor = (shift: string) => {
        switch (shift.toLowerCase()) {
            case 'กลางวัน':
            case 'day':
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'text-blue-700',
                    icon: 'text-blue-500'
                };
            case 'กลางคืน':
            case 'night':
                return {
                    bg: 'bg-indigo-50',
                    border: 'border-indigo-200',
                    text: 'text-indigo-700',
                    icon: 'text-indigo-500'
                };
            default:
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    text: 'text-gray-700',
                    icon: 'text-gray-500'
                };
        }
    };

    // รวมข้อมูล productions, labors, และ energies
    const productionsWithDetails = productions.map((p) => {
        const matchedLabors = labors.filter((l) => Number(l.production_id) === Number(p.id));
        const matchedEnergies = energies.filter((e) => Number(e.production_id) === Number(p.id));

        return {
            ...p,
            labors: matchedLabors,
            energies: matchedEnergies
        };
    });

    const productionColumns: Column<Production>[] = [
        {
            key: 'date',
            label: 'วันที่ผลิต',
            sortable: true,
            align: 'center',
            render: (production) => (
                <div className="flex flex-col items-center py-2">
                    <div className="text-base font-semibold text-gray-900">
                        {production.date ? dayjs(production.date).format('DD/MM/YYYY') : '-'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
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
                const shiftColors = getShiftColor(production.shift);

                if (!production.labors || production.labors.length === 0) {
                    return (
                        <div className={`rounded-lg p-2 border ${shiftColors.bg} ${shiftColors.border}`}>
                            <div className="flex items-center justify-center gap-2">
                                <Users size={18} className={shiftColors.icon} />
                                <span className={`font-medium ${shiftColors.text}`}>{production.shift || '-'}</span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500 bg-white/70 rounded py-1 px-2">ไม่มีข้อมูลพนักงาน</div>
                        </div>
                    );
                }

                const totalWorkers = production.labors.reduce((acc, labor) => acc + (labor.workers || 0), 0);

                return (
                    <div className={`rounded-lg p-3 border ${shiftColors.bg} ${shiftColors.border}`}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Users size={18} className={shiftColors.icon} />
                            <span className={`font-semibold ${shiftColors.text}`}>{production.shift}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 bg-white/70 rounded-full py-1 px-3">
                            <span className="text-sm font-bold text-gray-800">{totalWorkers}</span>
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
                <div className="flex flex-col items-center py-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-800">
                        <Factory size={16} className="text-purple-600" />
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
            render: (production) => {
                const productQty = Number(production.product_qty) || 0;
                return (
                    <div className="text-right py-2">
                        <div className="text-xl font-bold text-gray-900">
                            {productQty.toLocaleString('th-TH')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">หน่วย</div>
                    </div>
                );
            },
        },
        {
            key: 'target',
            label: 'อัตราบรรลุเป้าหมาย',
            sortable: true,
            align: 'center',
            render: (production) => {
                const productQty = Number(production.product_qty) || 0;
                const targetQty = Number(production.target_qty) || 0;
                const rate = calculateAchievementRate(productQty, targetQty);

                const getRateColor = () => {
                    if (rate >= 100) return {
                        bg: 'bg-green-50',
                        text: 'text-green-800',
                        border: 'border-green-200',
                        icon: 'text-green-600'
                    };
                    if (rate >= 80) return {
                        bg: 'bg-yellow-50',
                        text: 'text-yellow-800',
                        border: 'border-yellow-200',
                        icon: 'text-yellow-600'
                    };
                    return {
                        bg: 'bg-red-50',
                        text: 'text-red-800',
                        border: 'border-red-200',
                        icon: 'text-red-600'
                    };
                };

                const rateColors = getRateColor();

                return (
                    <div className="flex flex-col items-center py-2">
                        <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${rateColors.bg} ${rateColors.border}`}>
                            <TrendingUp size={16} className={rateColors.icon} />
                            <span className={`font-bold ${rateColors.text}`}>{rate.toFixed(1)}%</span>
                        </div>
                        {targetQty > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                                เป้า: {targetQty.toLocaleString('th-TH')}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'hours',
            label: 'ชั่วโมงทำงาน',
            render: (production) => {
                if (!production.labors || production.labors.length === 0) return (
                    <div className="text-center text-gray-400 py-2">-</div>
                );

                const totalHours = production.labors.reduce((acc, labor) => acc + (Number(labor.hours) || 0), 0);

                return (
                    <div className="flex flex-col items-center py-2">
                        <div className="flex items-center gap-2 bg-blue-50 rounded-full px-3 py-2">
                            <Clock size={16} className="text-blue-600" />
                            <span className="font-semibold text-blue-800">{totalHours.toFixed(1)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">ชั่วโมง</div>
                    </div>
                );
            },
            align: 'center',
        },
        {
            key: 'ot_hours',
            label: 'ชั่วโมง OT',
            render: (production) => {
                if (!production.labors || production.labors.length === 0) return (
                    <div className="text-center text-gray-400 py-2">-</div>
                );

                const totalOtHours = production.labors.reduce((acc, labor) => acc + (Number(labor.ot_hours) || 0), 0);

                return (
                    <div className="flex flex-col items-center py-2">
                        <div className="flex items-center gap-2 bg-orange-50 rounded-full px-3 py-2">
                            <Clock size={16} className="text-orange-600" />
                            <span className="font-semibold text-orange-800">{totalOtHours.toFixed(1)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">ชั่วโมง</div>
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
            render: (production) => {
                // หาข้อมูลพลังงานที่ตรงกับ production นี้
                const energyData = energies.find(e => Number(e.production_id) === Number(production.id));
                const electricityKwh = energyData?.electricity_kwh || energyData?.number_kwh || 0;

                return (
                    <div className="flex flex-col items-center py-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 px-4 py-2 text-sm font-semibold text-yellow-800">
                            <Zap size={16} className="text-yellow-600" />
                            {Number(electricityKwh).toLocaleString('th-TH')} kWh
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'actions',
            label: 'การดำเนินการ',
            align: 'center',
        },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Target className="text-blue-600" size={24} />
                    ข้อมูลการผลิตปุ๋ย
                </h2>
                <p className="text-sm text-gray-600 mt-1">แสดงข้อมูลการผลิตทั้งหมด {productions.length} รายการ</p>
            </div> */}

            <GenericTable
                data={productionsWithDetails}
                columns={productionColumns}
                idField="id"
                actions={(row) => (
                    <div className="flex justify-center gap-2 py-2">
                        <button
                            className="group relative transition-all duration-300 hover:scale-105 focus:outline-none"
                            onClick={() => handleEdit(row)}
                            aria-label="แก้ไข"
                        >
                            <div className="relative flex items-center justify-center">
                                <div className="rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 p-2 transition-all duration-300 group-hover:from-yellow-100 group-hover:to-amber-100 group-hover:shadow-sm">
                                    <Pencil size={18} className="text-yellow-700" />
                                </div>

                                <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-yellow-600 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100">
                                    แก้ไข
                                    <div className="absolute bottom-[-4px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-yellow-600"></div>
                                </span>
                            </div>
                        </button>

                        <button
                            className="group relative transition-all duration-300 hover:scale-105 focus:outline-none"
                            onClick={() => handleDelete(row)}
                            aria-label="ลบ"
                        >
                            <div className="relative flex items-center justify-center">
                                <div className="rounded-lg bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 p-2 transition-all duration-300 group-hover:from-red-100 group-hover:to-pink-100 group-hover:shadow-sm">
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
        </div>
    );
}
