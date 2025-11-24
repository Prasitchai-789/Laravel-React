import DeleteModal from '@/components/DeleteModal';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    BarChart3,
    Beaker,
    Calculator,
    Calendar,
    ChevronDown,
    ChevronUp,
    Edit,
    Filter,
    FlaskConical,
    Plus,
    Search,
    Thermometer,
    Trash2,
    TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import CPORecordForm from './CPORecordForm';

type Flash = { success?: string; error?: string };

// Interface definitions
export interface CPORecord {
    id: number;
    date: string;
    // Tank 1
    tank1_oil_level?: string | number;
    tank1_temperature?: string | number;
    tank1_cpo_volume?: string | number;
    tank1_ffa?: string | number;
    tank1_moisture?: string | number;
    tank1_dobi?: string | number;
    tank1_top_ffa?: string | number;
    tank1_top_moisture?: string | number;
    tank1_top_dobi?: string | number;
    tank1_bottom_ffa?: string | number;
    tank1_bottom_moisture?: string | number;
    tank1_bottom_dobi?: string | number;

    // Tank 2
    tank2_oil_level?: string | number;
    tank2_temperature?: string | number;
    tank2_cpo_volume?: string | number;
    tank2_ffa?: string | number;
    tank2_moisture?: string | number;
    tank2_dobi?: string | number;
    tank2_top_ffa?: string | number;
    tank2_top_moisture?: string | number;
    tank2_top_dobi?: string | number;
    tank2_bottom_ffa?: string | number;
    tank2_bottom_moisture?: string | number;
    tank2_bottom_dobi?: string | number;

    // Tank 3
    tank3_oil_level?: string | number;
    tank3_temperature?: string | number;
    tank3_cpo_volume?: string | number;
    tank3_ffa?: string | number;
    tank3_moisture?: string | number;
    tank3_dobi?: string | number;
    tank3_top_ffa?: string | number;
    tank3_top_moisture?: string | number;
    tank3_top_dobi?: string | number;
    tank3_bottom_ffa?: string | number;
    tank3_bottom_moisture?: string | number;
    tank3_bottom_dobi?: string | number;

    // Tank 4
    tank4_oil_level?: string | number;
    tank4_temperature?: string | number;
    tank4_cpo_volume?: string | number;
    tank4_ffa?: string | number;
    tank4_moisture?: string | number;
    tank4_dobi?: string | number;
    tank4_top_ffa?: string | number;
    tank4_top_moisture?: string | number;
    tank4_top_dobi?: string | number;
    tank4_bottom_ffa?: string | number;
    tank4_bottom_moisture?: string | number;
    tank4_bottom_dobi?: string | number;

    // Oil Room
    total_cpo?: string | number;
    ffa_cpo?: string | number;
    dobi_cpo?: string | number;
    cs1_cm?: string | number;
    undilute_1?: string | number;
    undilute_2?: string | number;
    setting?: string | number;
    clean_oil?: string | number;
    skim?: string | number;
    mix?: string | number;
    loop_back?: string | number;
}

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

interface TankTotals {
    totalVolume: string;
    tankCount: number;
    skim: string;
    tankDetails: {
        tank_no: number;
        volume: number;
        oil_level: number;
        temperature: number;
    }[];
}

interface CPORecordListProps {
    flash?: Flash;
    cpoTankInfo?: any[];
    cpoDensityRef?: any[];
}

/* -----------------------------
   Number Utils (ปลอดภัย 100%)
------------------------------*/

/** ทำให้ค่าที่มาจาก API เป็นตัวเลขแน่นอน */
const toNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined) return defaultValue;
    if (value === '') return defaultValue;

    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? defaultValue : num;
};

/** ใช้สำหรับแสดงผลตัวเลข */
const toFixed = (value: any, digits: number = 3): string => {
    return toNumber(value).toFixed(digits);
};

/** Normalize ทุก field ของ CPORecord ที่เป็นตัวเลข */
const normalizeRecord = (record: CPORecord): CPORecord => {
    const normalized: any = { ...record };

    Object.keys(record).forEach((key) => {
        const value = record[key as keyof CPORecord];
        if (typeof value === 'string' || typeof value === 'number') {
            normalized[key] = toNumber(value);
        } else {
            normalized[key] = value;
        }
    });

    return normalized;
};

/** Normalize TankInfo จาก API (string → number) */
const normalizeTankInfoArray = (arr: any[]): TankInfo[] =>
    (arr || []).map((t) => ({
        tank_no: toNumber(t.tank_no),
        height_m: toNumber(t.height_m),
        diameter_m: t.diameter_m !== undefined ? toNumber(t.diameter_m) : undefined,
        volume_m3: toNumber(t.volume_m3),
    }));

/** Normalize DensityRef จาก API (string → number) */
const normalizeDensityArray = (arr: any[]): DensityData[] =>
    (arr || []).map((d) => ({
        temperature_c: toNumber(d.temperature_c),
        density: toNumber(d.density),
    }));

/* ------------------------------------
   Component หลัก CPORecordList
-------------------------------------*/

const CPORecordList = ({ flash, cpoTankInfo = [], cpoDensityRef = [] }: CPORecordListProps) => {
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
    const [tankInfo, setTankInfo] = useState<TankInfo[]>(
        normalizeTankInfoArray(pageTankInfo || cpoTankInfo || []),
    );
    const [densityRef, setDensityRef] = useState<DensityData[]>(
        normalizeDensityArray(pageDensityRef || cpoDensityRef || []),
    );
    const [loading, setLoading] = useState<boolean>(false);
    const [editingRecord, setEditingRecord] = useState<CPORecord | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

    useEffect(() => {
        fetchApiData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchApiData = async (): Promise<void> => {
        try {
            setLoading(true);
            const response = await axios.get(route('cpo.api'));

            if (response.data.success) {
                setRecords(response.data.records || []);

                const apiTankInfo = normalizeTankInfoArray(response.data.cpoTankInfo || []);
                const apiDensityRef = normalizeDensityArray(response.data.cpoDensityRef || []);

                setTankInfo(apiTankInfo);
                setDensityRef(apiDensityRef);
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

    /* ------------------------------
        คำนวณปริมาตร CPO (ตัน)
    -------------------------------*/
    const calculateCPOVolume = useCallback(
        (tankData: any[]) => {
            if (!tankInfo.length || !densityRef.length) {
                return { volumes: {} as Record<number, number>, total_cpo: 0 };
            }

            const tankMap = new Map<number, TankInfo>();
            tankInfo.forEach((t) => tankMap.set(t.tank_no, t));

            const densityMap = new Map<number, number>();
            densityRef.forEach((d) => densityMap.set(d.temperature_c, d.density));

            let total = 0;
            const volumes: Record<number, number> = {};

            tankData.forEach((tank) => {
                const tankNo = toNumber(tank.tank_no);
                const oilLevel = toNumber(tank.oil_level); // cm
                const temp = Math.round(toNumber(tank.temperature)); // °C

                if (!tankNo || !oilLevel || !temp) {
                    volumes[tankNo] = 0;
                    return;
                }

                const info = tankMap.get(tankNo);
                if (!info || !info.height_m || !info.volume_m3) {
                    volumes[tankNo] = 0;
                    return;
                }

                // หา density (ถ้าไม่เจอตรงตัว ให้ลอง temp-1, temp+1 ก่อน fallback ไปค่า default)
                const density =
                    densityMap.get(temp) ??
                    densityMap.get(temp - 1) ??
                    densityMap.get(temp + 1) ??
                    0.8841;

                // ปริมาตรต่อ 1 cm (m3/cm)
                const volumePerCm_m3 = info.volume_m3 / info.height_m / 100;

                const weightTon = oilLevel * volumePerCm_m3 * density;

                volumes[tankNo] = weightTon;
                total += weightTon;
            });

            return { volumes, total_cpo: total };
        },
        [tankInfo, densityRef],
    );

    // ฟังก์ชันแปลงข้อมูลจาก API ให้เป็นโครงสร้างที่ใช้ใน component
    const transformRecordData = (record: CPORecord) => {
        const tanks: any[] = [];

        const r = record as any;

        // Tank 1
        if (r.tank1_oil_level || r.tank1_temperature) {
            tanks.push({
                tank_no: 1,
                oil_level: r.tank1_oil_level ?? '',
                temperature: r.tank1_temperature ?? '',
                cpo_volume: r.tank1_cpo_volume ?? '',
                ffa: r.tank1_ffa ?? '',
                moisture: r.tank1_moisture ?? '',
                dobi: r.tank1_dobi ?? '',
                top_ffa: r.tank1_top_ffa ?? '',
                top_moisture: r.tank1_top_moisture ?? '',
                top_dobi: r.tank1_top_dobi ?? '',
                bottom_ffa: r.tank1_bottom_ffa ?? '',
                bottom_moisture: r.tank1_bottom_moisture ?? '',
                bottom_dobi: r.tank1_bottom_dobi ?? '',
            });
        }

        // Tank 2
        if (r.tank2_oil_level || r.tank2_temperature) {
            tanks.push({
                tank_no: 2,
                oil_level: r.tank2_oil_level ?? '',
                temperature: r.tank2_temperature ?? '',
                cpo_volume: r.tank2_cpo_volume ?? '',
                ffa: r.tank2_ffa ?? '',
                moisture: r.tank2_moisture ?? '',
                dobi: r.tank2_dobi ?? '',
                top_ffa: r.tank2_top_ffa ?? '',
                top_moisture: r.tank2_top_moisture ?? '',
                top_dobi: r.tank2_top_dobi ?? '',
                bottom_ffa: r.tank2_bottom_ffa ?? '',
                bottom_moisture: r.tank2_bottom_moisture ?? '',
                bottom_dobi: r.tank2_bottom_dobi ?? '',
            });
        }

        // Tank 3
        if (r.tank3_oil_level || r.tank3_temperature) {
            tanks.push({
                tank_no: 3,
                oil_level: r.tank3_oil_level ?? '',
                temperature: r.tank3_temperature ?? '',
                cpo_volume: r.tank3_cpo_volume ?? '',
                ffa: r.tank3_ffa ?? '',
                moisture: r.tank3_moisture ?? '',
                dobi: r.tank3_dobi ?? '',
                top_ffa: r.tank3_top_ffa ?? '',
                top_moisture: r.tank3_top_moisture ?? '',
                top_dobi: r.tank3_top_dobi ?? '',
                bottom_ffa: r.tank3_bottom_ffa ?? '',
                bottom_moisture: r.tank3_bottom_moisture ?? '',
                bottom_dobi: r.tank3_bottom_dobi ?? '',
            });
        }

        // Tank 4
        if (r.tank4_oil_level || r.tank4_temperature) {
            tanks.push({
                tank_no: 4,
                oil_level: r.tank4_oil_level ?? '',
                temperature: r.tank4_temperature ?? '',
                cpo_volume: r.tank4_cpo_volume ?? '',
                ffa: r.tank4_ffa ?? '',
                moisture: r.tank4_moisture ?? '',
                dobi: r.tank4_dobi ?? '',
                top_ffa: r.tank4_top_ffa ?? '',
                top_moisture: r.tank4_top_moisture ?? '',
                top_dobi: r.tank4_top_dobi ?? '',
                bottom_ffa: r.tank4_bottom_ffa ?? '',
                bottom_moisture: r.tank4_bottom_moisture ?? '',
                bottom_dobi: r.tank4_bottom_dobi ?? '',
            });
        }

        return {
            tanks,
            oil_room: {
                total_cpo: r.total_cpo ?? '',
                ffa_cpo: r.ffa_cpo ?? '',
                dobi_cpo: r.dobi_cpo ?? '',
                cs1_cm: r.cs1_cm ?? '',
                undilute_1: r.undilute_1 ?? '',
                undilute_2: r.undilute_2 ?? '',
                setting: r.setting ?? '',
                clean_oil: r.clean_oil ?? '',
                skim: r.skim ?? '',
                mix: r.mix ?? '',
                loop_back: r.loop_back ?? '',
            },
        };
    };

    // คำนวณ Total CPO และรายละเอียดแทงค์
    const calculateTankTotals = (record: CPORecord): TankTotals => {
        const normalized = normalizeRecord(record);
        const transformed = transformRecordData(normalized);
        const volumeResult = calculateCPOVolume(transformed.tanks);

        const tankDetails = transformed.tanks.map((tank: any) => ({
            tank_no: tank.tank_no,
            volume: toNumber(volumeResult.volumes[tank.tank_no]),
            oil_level: toNumber(tank.oil_level),
            temperature: toNumber(tank.temperature),
        }));

        const totalVolume = toFixed(volumeResult.total_cpo, 3);

        return {
            tankDetails,
            totalVolume,
            tankCount: tankDetails.length,
            skim: toFixed(normalized.skim || 0, 3),
        };
    };

    // คำนวณค่าเฉลี่ยคุณภาพน้ำมัน
    const calculateQualityAverages = (record: CPORecord) => {
        const normalized = normalizeRecord(record);
        const transformed = transformRecordData(normalized);

        const tanksWithData = transformed.tanks.filter(
            (tank: any) => tank.ffa || tank.moisture || tank.dobi,
        );

        const avgFFA =
            tanksWithData.length > 0
                ? tanksWithData.reduce((sum: number, tank: any) => sum + toNumber(tank.ffa), 0) /
                  tanksWithData.length
                : 0;

        const avgMoisture =
            tanksWithData.length > 0
                ? tanksWithData.reduce(
                      (sum: number, tank: any) => sum + toNumber(tank.moisture),
                      0,
                  ) / tanksWithData.length
                : 0;

        const avgDobi =
            tanksWithData.length > 0
                ? tanksWithData.reduce((sum: number, tank: any) => sum + toNumber(tank.dobi), 0) /
                  tanksWithData.length
                : 0;

        return {
            avgFFA: avgFFA.toFixed(2),
            avgMoisture: avgMoisture.toFixed(2),
            avgDobi: avgDobi.toFixed(2),
            tankCount: tanksWithData.length,
        };
    };

    const handleCreate = (): void => {
        setEditingRecord(null);
        setShowForm(true);
    };

    const handleEdit = (record: CPORecord): void => {
        setEditingRecord(record);
        setShowForm(true);
    };

    const handleSave = async (formData: any): Promise<void> => {
        try {
            if (editingRecord) {
                await router.put(`/cpo/${editingRecord.id}`, formData);
                Toast.fire({ icon: 'success', title: 'อัพเดทเรียบร้อยแล้ว' });
            } else {
                await router.post('/cpo', formData);
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
            router.delete(route('cpo.destroy', selectedId), {
                onSuccess: () => {
                    Toast.fire({ icon: 'success', title: 'ลบรายการเรียบร้อยแล้ว' });
                    closeDeleteModal();
                },
                preserveScroll: true,
            });
            refreshData();
        }
    };

    const filteredRecords = records.filter((record) =>
        new Date(record.date).toLocaleDateString('th-TH').includes(searchTerm),
    );

    const sortedRecords = [...filteredRecords].sort((a, b) => {
        const aValue = a[sortField as keyof CPORecord];
        const bValue = b[sortField as keyof CPORecord];

        if (sortField === 'date') {
            const aDate = new Date(aValue as string).getTime();
            const bDate = new Date(bValue as string).getTime();
            return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        }

        // field อื่นเอา default เป็น total_cpo
        const aTotal = toNumber(a.total_cpo);
        const bTotal = toNumber(b.total_cpo);
        return sortDirection === 'asc' ? aTotal - bTotal : bTotal - aTotal;
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 p-6 font-anuphan">
            <div className="mx-auto max-w-7xl space-y-4">
                {/* Header */}
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
                                        ? new Date(sortedRecords[0].date).toLocaleDateString('th-TH', {
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

                    {/* ยอด CPO ทั้งหมด */}
                    <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-amber-100">ยอด CPO</p>
                                <p className="mt-1 text-xl font-bold">
                                    {sortedRecords[0] ? calculateTankTotals(sortedRecords[0]).totalVolume : '0.000'} ตัน
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white/20 p-3">
                                <FlaskConical className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    {/* Skim */}
                    <div className="rounded-3xl bg-gradient-to-br from-red-500 to-pink-600 p-6 text-white shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-100">Skim</p>
                                <p className="mt-1 text-xl font-bold">
                                    {sortedRecords[0] ? calculateTankTotals(sortedRecords[0]).skim : '0.000'} ตัน
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white/20 p-3">
                                <Filter className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    {/* จำนวนแทงค์ที่ใช้งาน */}
                    <div className="rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-100">แทงค์ที่ใช้งาน</p>
                                <p className="mt-1 text-2xl font-bold">
                                    {sortedRecords[0] ? calculateTankTotals(sortedRecords[0]).tankCount : '0'}
                                </p>
                                <div className="mt-1 text-xs text-green-200">แทงค์</div>
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
                            <thead className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-amber-50/30">
                                <tr>
                                    <th
                                        className="cursor-pointer px-6 py-5 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100/50"
                                        onClick={() => handleSort('date')}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                            <span>วันที่บันทึก</span>
                                            {getSortIcon('date')}
                                        </div>
                                    </th>
                                    <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <FlaskConical className="h-4 w-4 text-amber-600" />
                                            <span>ข้อมูลแทงค์</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <Filter className="h-4 w-4 text-red-600" />
                                            <span>คุณภาพน้ำมัน</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <Beaker className="h-4 w-4 text-purple-600" />
                                            <span>ข้อมูล Oil Room</span>
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
                                    const tankTotals = calculateTankTotals(record);
                                    const qualityAverages = calculateQualityAverages(record);
                                    const transformed = transformRecordData(record);
                                    const volumeResult = calculateCPOVolume(transformed.tanks);

                                    return (
                                        <tr
                                            key={record.id}
                                            className={`group transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-50/30 hover:to-orange-50/30 ${
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
                                                            {new Date(record.date).toLocaleDateString('th-TH', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </div>
                                                        <div className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                                                            {new Date(record.date).toLocaleDateString('th-TH', {
                                                                weekday: 'long',
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* ข้อมูลแทงค์ */}
                                            <td className="px-2 py-2 align-top">
                                                <div className="space-y-2">
                                                    {transformed.tanks
                                                        .filter((tank: any) => tank.oil_level && tank.temperature)
                                                        .map((tank: any) => {
                                                            const tankVolume = volumeResult.volumes[tank.tank_no] || 0;
                                                            const temperature = Math.round(
                                                                toNumber(tank.temperature),
                                                            );
                                                            const densityData = densityRef.find(
                                                                (d) => d.temperature_c === temperature,
                                                            );

                                                            return (
                                                                <div
                                                                    key={tank.tank_no}
                                                                    className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3"
                                                                >
                                                                    <div className="mb-2 flex items-center justify-between">
                                                                        <div className="text-xs font-medium text-amber-600">
                                                                            Tank {tank.tank_no}
                                                                        </div>
                                                                        <div className="flex items-center space-x-1 text-xs text-amber-500">
                                                                            <Thermometer className="h-3 w-3" />
                                                                            <span>{tank.temperature}°C</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                                                        <div className="text-gray-600">ระดับ:</div>
                                                                        <div className="font-medium text-gray-700">
                                                                            {tank.oil_level} cm
                                                                        </div>
                                                                        <div className="text-gray-600">ปริมาณ:</div>
                                                                        <div className="font-bold text-amber-700">
                                                                            {toFixed(tankVolume, 3)} ตัน
                                                                        </div>
                                                                    </div>
                                                                    {densityData && (
                                                                        <div className="mt-1 text-xs text-gray-500">
                                                                            ความหนาแน่น: {densityData.density}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    {tankTotals.tankCount === 0 && (
                                                        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3 text-center">
                                                            <div className="text-xs text-gray-500">ไม่มีข้อมูลแทงค์</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* คุณภาพน้ำมัน */}
                                            <td className="px-2 py-2 align-top">
                                                <div className="space-y-2">
                                                    {transformed.tanks
                                                        .filter((tank: any) => tank.oil_level && tank.temperature)
                                                        .map((tank: any) => {
                                                            const isTank1 = tank.tank_no === 1;

                                                            return (
                                                                <div
                                                                    key={`quality-${tank.tank_no}`}
                                                                    className={`rounded-2xl border p-3 ${
                                                                        isTank1
                                                                            ? 'border-blue-100 bg-blue-50/50'
                                                                            : 'border-purple-100 bg-purple-50/50'
                                                                    }`}
                                                                >
                                                                    <div className="mb-2 flex items-center justify-between">
                                                                        <div
                                                                            className={`text-xs font-medium ${
                                                                                isTank1 ? 'text-blue-600' : 'text-purple-600'
                                                                            }`}
                                                                        >
                                                                            คุณภาพ Tank {tank.tank_no}
                                                                        </div>
                                                                        {!isTank1 && (
                                                                            <div className="flex items-center space-x-1 text-xs text-purple-500">
                                                                                <Filter className="h-3 w-3" />
                                                                                <span>Top/Bottom</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {isTank1 ? (
                                                                        <div className="text-xs">
                                                                            <div className="mb-1 grid grid-cols-3 gap-2 font-medium text-gray-600">
                                                                                <div>%FFA</div>
                                                                                <div>%Moisture</div>
                                                                                <div>DOBI</div>
                                                                            </div>
                                                                            <div className="grid grid-cols-3 gap-2 font-bold text-blue-700">
                                                                                <div>{tank.ffa || '-'}%</div>
                                                                                <div>{tank.moisture || '-'}%</div>
                                                                                <div>{tank.dobi || '-'}</div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-2 text-xs">
                                                                            {/* Top */}
                                                                            <div>
                                                                                <div className="mb-1 grid grid-cols-4 gap-2 text-gray-600">
                                                                                    <span></span>
                                                                                    <div>%FFA</div>
                                                                                    <div>%Moisture</div>
                                                                                    <div>DOBI</div>
                                                                                </div>
                                                                                <div className="grid grid-cols-4 gap-2 font-bold text-green-700">
                                                                                    <div className="mb-1 flex items-center space-x-1 font-medium text-green-600">
                                                                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                                                                        <span>ส่วนบน</span>
                                                                                    </div>
                                                                                    <div>{tank.top_ffa || '-'}%</div>
                                                                                    <div>{tank.top_moisture || '-'}%</div>
                                                                                    <div>{tank.top_dobi || '-'}</div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Bottom */}
                                                                            <div>
                                                                                <div className="grid grid-cols-4 gap-2 font-bold text-orange-700">
                                                                                    <div className="mb-1 flex items-center space-x-1 font-medium text-orange-600">
                                                                                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                                                                                        <span>ส่วนล่าง</span>
                                                                                    </div>
                                                                                    <div>{tank.bottom_ffa || '-'}%</div>
                                                                                    <div>{tank.bottom_moisture || '-'}%</div>
                                                                                    <div>{tank.bottom_dobi || '-'}</div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}

                                                    {transformed.tanks.filter((tank: any) => tank.oil_level && tank.temperature).length ===
                                                        0 && (
                                                        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3 text-center">
                                                            <div className="text-xs text-gray-500">ไม่มีข้อมูลคุณภาพน้ำมัน</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* ข้อมูล Oil Room */}
                                            <td className="px-2 py-2 align-top">
                                                <div className="space-y-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { label: 'Skim (Ton)', value: transformed.oil_room.skim, color: 'text-red-700' },
                                                            {
                                                                label: 'CS1 (cm.)',
                                                                value: transformed.oil_room.cs1_cm,
                                                                color: 'text-blue-700',
                                                            },
                                                            {
                                                                label: 'Undilute 1',
                                                                value: transformed.oil_room.undilute_1,
                                                                color: 'text-purple-700',
                                                            },
                                                            {
                                                                label: 'Undilute 2',
                                                                value: transformed.oil_room.undilute_2,
                                                                color: 'text-purple-700',
                                                            },
                                                            {
                                                                label: 'Setting',
                                                                value: transformed.oil_room.setting,
                                                                color: 'text-amber-700',
                                                            },
                                                            {
                                                                label: 'Clean Oil',
                                                                value: transformed.oil_room.clean_oil,
                                                                color: 'text-green-700',
                                                            },
                                                            {
                                                                label: 'Mix (Ton)',
                                                                value: transformed.oil_room.mix,
                                                                color: 'text-red-700',
                                                            },
                                                            {
                                                                label: 'Loop Back (Ton)',
                                                                value: transformed.oil_room.loop_back,
                                                                color: 'text-red-700',
                                                            },
                                                        ]
                                                            .filter((item) => item.value !== null && item.value !== undefined && item.value !== '')
                                                            .map((item, idx) => (
                                                                <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50/50 p-2">
                                                                    <div className="text-xs text-gray-600">{item.label}</div>
                                                                    <div className={`text-sm font-bold ${item.color}`}>
                                                                        {item.value}
                                                                        {item.label.includes('Undilute') ||
                                                                        item.label.includes('Setting') ||
                                                                        item.label.includes('Clean Oil')
                                                                            ? ' แผ่น'
                                                                            : ''}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Summary */}
                                            <td className="px-2 py-2 align-top">
                                                <div className="space-y-2">
                                                    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
                                                        <div className="mb-2 text-xs font-medium text-amber-600">
                                                            สรุปปริมาณ (คำนวณ) :{' '}
                                                            <span className="font-bold text-amber-700">
                                                                {tankTotals.tankCount} แทงค์
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2 text-xs">
                                                            {tankTotals.tankDetails.map((tank) => (
                                                                <div
                                                                    key={tank.tank_no}
                                                                    className="flex justify-between text-xs"
                                                                >
                                                                    <span className="text-gray-500">
                                                                        Tank {tank.tank_no}:
                                                                    </span>
                                                                    <span className="text-amber-600">
                                                                        {toFixed(tank.volume, 3)} ตัน
                                                                    </span>
                                                                </div>
                                                            ))}

                                                            <div className="flex justify-between border-t border-amber-200 pt-1">
                                                                <span className="font-medium text-gray-700">
                                                                    Total ทั้งหมด:
                                                                </span>
                                                                <span className="font-bold text-amber-800">
                                                                    {tankTotals.totalVolume} ตัน
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
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
                                <FlaskConical className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                                <h3 className="mb-2 text-lg font-semibold text-gray-600">ไม่พบข้อมูล</h3>
                                <p className="mb-6 text-sm text-gray-500">เริ่มต้นโดยการบันทึกข้อมูล CPO ใหม่</p>
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
            <DeleteModal
                isModalOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                title="ยืนยันการลบ"
                onConfirm={handleDelete}
            >
                <p className="font-anuphan text-sm text-gray-500">
                    คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
            </DeleteModal>
        </div>
    );
};

export default CPORecordList;
