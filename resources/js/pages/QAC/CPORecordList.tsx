import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';

import { Calculator, ChevronDown, ChevronUp, FlaskConical, Plus } from 'lucide-react';

import { CPORecord } from './types/CPORecord';

import RecordsTable from './components/list/RecordsTable';
import SearchBar from './components/list/SearchBar';

import DeleteModal from '@/components/DeleteModal';
import CPORecordForm from './components/CPORecordForm';

import { safeRound, safeSum, toNumber } from './utils/number';
import { normalizeDensityArray, normalizeRecord, normalizeTankInfoArray, transformRecordData } from './utils/transform';

type Flash = { success?: string; error?: string };

interface TankInfo {
    tank_no: number;
    height_m: number;
    diameter_m?: number;
    volume_m3: number;
}

interface DensityData {
    temperature_c: number;
    density: number;
}

interface CPORecordListProps {
    flash?: Flash;
    cpoTankInfo?: any[];
    cpoDensityRef?: any[];
}

export default function CPORecordList({ flash }: CPORecordListProps) {
    const {
        records: pageRecords,
        cpoTankInfo: pageTankInfo,
        cpoDensityRef: pageDensityRef,
    } = usePage().props as {
        records: CPORecord[];
        cpoTankInfo?: any[];
        cpoDensityRef?: any[];
    };

    const [records, setRecords] = useState<CPORecord[]>(pageRecords || []);
    const [tankInfo, setTankInfo] = useState(normalizeTankInfoArray(pageTankInfo || []));
    const [densityRef, setDensityRef] = useState(normalizeDensityArray(pageDensityRef || []));
    const [loading, setLoading] = useState(false);

    const [editingRecord, setEditingRecord] = useState<CPORecord | null>(null);
    const [showForm, setShowForm] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const fetchApiData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(route('cpo.api'));

            if (!response.data.success) throw new Error();

            setRecords(response.data.records || []);
            setTankInfo(normalizeTankInfoArray(response.data.cpoTankInfo || []));
            setDensityRef(normalizeDensityArray(response.data.cpoDensityRef || []));
        } catch (err) {
            Swal.fire({
                title: 'ผิดพลาด!',
                text: 'ไม่สามารถโหลดข้อมูลล่าสุดได้',
                icon: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApiData();
    }, []);

    const refreshData = async () => await fetchApiData();

    /* -----------------------------------------------------------
       คำนวณปริมาณ CPO แบบเดิมทุกตัว
    ----------------------------------------------------------- */
    const calculateCPOVolume = useCallback(
        (tankData: any[]) => {
            if (!tankInfo.length || !densityRef.length) {
                return { volumes: {}, total_cpo: 0 };
            }

            const tankMap = new Map<number, any>();
            tankInfo.forEach((t) => tankMap.set(t.tank_no, t));

            const densityMap = new Map<number, number>();
            densityRef.forEach((d) => densityMap.set(d.temperature_c, d.density));

            let total = 0;
            const volumes: Record<number, number> = {};

            tankData.forEach((tank) => {
                const tankNo = toNumber(tank.tank_no);
                const oilLevel = toNumber(tank.oil_level);
                const temp = Math.round(toNumber(tank.temperature));

                if (!tankNo || !oilLevel || !temp) {
                    volumes[tankNo] = 0;
                    return;
                }

                const info = tankMap.get(tankNo);
                if (!info) {
                    volumes[tankNo] = 0;
                    return;
                }

                const density = densityMap.get(temp) ?? densityMap.get(temp - 1) ?? densityMap.get(temp + 1) ?? 0.8841;

                const volumePerCm_m3 = info.volume_m3 / info.height_m / 100;
                const weightTon = oilLevel * volumePerCm_m3 * density;

                volumes[tankNo] = safeRound(weightTon, 3);
                total += weightTon;
            });

            // 🎯 ส่วนสำคัญที่สุด: รวมแบบ Safe Round
            const totalSafe = safeRound(total, 3);

            return { volumes, total_cpo: totalSafe };
        },
        [tankInfo, densityRef],
    );

    const calculateTankTotals = (record: CPORecord) => {
        const normalized = normalizeRecord(record);
        const transformed = transformRecordData(normalized);
        
        // ถ้าเป็นโหมด no_production: ใช้ค่า cpo_volume ที่บันทึกไว้โดยตรง (ไม่คำนวณใหม่)
        const isNoProduction = record.production_mode === 'no_production';
        
        let tankDetails: { tank_no: number; volume: number; oil_level: number; temperature: number }[];
        
        if (isNoProduction) {
            // ใช้ค่า cpo_volume ที่บันทึกไว้ในฐานข้อมูล
            tankDetails = transformed.tanks.map((tank: any) => ({
                tank_no: tank.tank_no,
                volume: safeRound(toNumber(tank.cpo_volume), 3),
                oil_level: toNumber(tank.oil_level),
                temperature: toNumber(tank.temperature),
            }));
        } else {
            // โหมด production: คำนวณใหม่จาก oil_level และ temperature
            const res = calculateCPOVolume(transformed.tanks);
            tankDetails = transformed.tanks.map((tank: any) => ({
                tank_no: tank.tank_no,
                volume: toNumber(res.volumes[tank.tank_no]),
                oil_level: toNumber(tank.oil_level),
                temperature: toNumber(tank.temperature),
            }));
        }

        // รวมแบบปลอดภัย
        const totalVolume = safeSum(...tankDetails.map((t) => t.volume));

        return {
            tankDetails,
            tankCount: tankDetails.length,
            totalVolume, // <-- เป็น number + safe
            skim: safeRound(normalized.skim || 0, 3),
        };
    };

    const calculateQualityAverages = (record: CPORecord) => {
        const r = normalizeRecord(record);
        const t = transformRecordData(r);

        const list = t.tanks.filter((tk: any) => tk.ffa || tk.moisture || tk.dobi);

        const avgFFA = list.reduce((sum: number, tk: any) => sum + toNumber(tk.ffa), 0) / list.length || 0;

        const avgMoisture = list.reduce((sum: number, tk: any) => sum + toNumber(tk.moisture), 0) / list.length || 0;

        const avgDobi = list.reduce((sum: number, tk: any) => sum + toNumber(tk.dobi), 0) / list.length || 0;

        return {
            avgFFA: avgFFA.toFixed(2),
            avgMoisture: avgMoisture.toFixed(2),
            avgDobi: avgDobi.toFixed(2),
        };
    };

    /* -----------------------------------------------------------
       CRUD
    ----------------------------------------------------------- */
    const handleEdit = (record: CPORecord) => {
        setEditingRecord(record);
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingRecord(null);
        setShowForm(true);
    };

    const handleSave = async (data: any) => {
        try {
            if (editingRecord) {
                await router.put(`/cpo/${editingRecord.id}`, data);
            } else {
                await router.post('/cpo', data);
            }
            setShowForm(false);
            refreshData();
        } catch (err) {
            Swal.fire({
                title: 'ผิดพลาด!',
                text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
                icon: 'error',
            });
        }
    };

    const handleDeleteWithPermission = (id: number) => {
        setSelectedId(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!selectedId) return;

        router.delete(route('cpo.destroy', selectedId), {
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'ลบรายการเรียบร้อยแล้ว',
                }),
        });

        setIsDeleteModalOpen(false);
        refreshData();
    };

    /* -----------------------------------------------------------
       SORT
    ----------------------------------------------------------- */
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (field: string) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? <ChevronUp /> : <ChevronDown />;
    };

    /* -----------------------------------------------------------
       FILTER
    ----------------------------------------------------------- */
    const filteredRecords = records.filter((r) => new Date(r.date).toLocaleDateString('th-TH').includes(searchTerm));

    const sortedRecords = [...filteredRecords].sort((a, b) => {
        if (sortField === 'date') {
            const ad = new Date(a.date).getTime();
            const bd = new Date(b.date).getTime();
            return sortDirection === 'asc' ? ad - bd : bd - ad;
        }

        return sortDirection === 'asc' ? toNumber(a.total_cpo) - toNumber(b.total_cpo) : toNumber(b.total_cpo) - toNumber(a.total_cpo);
    });

    /* -----------------------------------------------------------
       FORM MODE
    ----------------------------------------------------------- */
    if (showForm) {
        return (
            <CPORecordForm
                record={editingRecord}
                onSave={handleSave}
                onCancel={() => {
                    setShowForm(false);
                    setEditingRecord(null);
                }}
            />
        );
    }

    /* -----------------------------------------------------------
       RENDER PAGE
    ----------------------------------------------------------- */
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 p-6 font-anuphan">
            <div className="mx-auto max-w-7xl space-y-4">
                {/* HEADER */}
                <div className="rounded-3xl border border-white/50 bg-white/70 p-4 shadow-2xl backdrop-blur-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="mb-6 flex items-center space-x-4 lg:mb-0">
                            <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 shadow-lg">
                                <FlaskConical className="h-8 w-8 text-white" />
                            </div>

                            <div>
                                <h1 className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-3xl font-bold text-transparent">
                                    ข้อมูล Stock CPO
                                </h1>
                                <p className="mt-2 flex items-center text-gray-600">
                                    <Calculator className="mr-1 h-4 w-4 text-amber-500" />
                                    จัดการและติดตามข้อมูลน้ำมันปาล์มดิบ (CPO) แบบเรียลไทม์
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleCreate}
                            className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            บันทึกข้อมูลใหม่
                        </button>
                    </div>
                </div>

                {/* SEARCH */}
                <SearchBar searchTerm={searchTerm} onSearch={setSearchTerm} />

                {/* TABLE */}
                <RecordsTable
                    records={sortedRecords}
                    calculateTankTotals={calculateTankTotals}
                    calculateQualityAverages={calculateQualityAverages}
                    onEdit={handleEdit}
                    onDelete={handleDeleteWithPermission}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                    densityRef={densityRef}
                />
            </div>

            <DeleteModal isModalOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="ยืนยันการลบ" onConfirm={handleDelete}>
                <p className="text-sm text-gray-500">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</p>
            </DeleteModal>
        </div>
    );
}
