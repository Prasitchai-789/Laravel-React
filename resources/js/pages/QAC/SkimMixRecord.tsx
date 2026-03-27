import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Beaker,
    Calendar,
    ChevronDown,
    Droplets,
    Edit3,
    FlaskConical,
    Gauge,
    Hash,
    Layers,
    Plus,
    Save,
    Thermometer,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Skim / Mix Record', href: '#' },
];

interface TankInfo {
    tank_no: number;
    height_m: number;
    volume_m3: number;
}

interface DensityRef {
    temperature_c: number;
    density: number;
}

interface SkimMixRow {
    id: number;
    date: string;
    oil_level: string;
    temperature: string;
    volume: string;
    difference: string;
    type: 'skim' | 'mix';
    created_at: string;
}

interface Summary {
    latest_volume: number;
    total_records: number;
    skim_total: number;
    skim_count: number;
    mix_total: number;
    mix_count: number;
}

export default function SkimMixRecord() {
    const { tankInfo, densityRef } = usePage<any>().props as {
        tankInfo: TankInfo;
        densityRef: DensityRef[];
    };

    const [records, setRecords] = useState<SkimMixRow[]>([]);
    const [summary, setSummary] = useState<Summary>({
        latest_volume: 0,
        total_records: 0,
        skim_total: 0,
        skim_count: 0,
        mix_total: 0,
        mix_count: 0,
    });
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

    const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [oilLevel, setOilLevel] = useState('');
    const [temperature, setTemperature] = useState('');
    const [type, setType] = useState<'skim' | 'mix'>('skim');

    const computeVolume = useCallback(
        (oil: number, temp: number): number => {
            if (!tankInfo || oil <= 0 || !temp) return 0;
            const densityRow = [...densityRef].sort(
                (a, b) => Math.abs(a.temperature_c - temp) - Math.abs(b.temperature_c - temp),
            )[0];
            const density = densityRow?.density ?? 0.8841;
            const volumePerCmM3 = tankInfo.volume_m3 / tankInfo.height_m / 100;
            return parseFloat((oil * volumePerCmM3 * density).toFixed(3));
        },
        [tankInfo, densityRef],
    );

    const calculatedVolume = computeVolume(parseFloat(oilLevel) || 0, parseFloat(temperature) || 0);

    const fetchData = async (date?: string) => {
        try {
            setLoading(true);
            const d = date || selectedDate;
            const res = await axios.get(route('skim-mix.summary'), { params: { date: d } });
            if (res.data.success) {
                setSummary({
                    latest_volume: res.data.latest_volume,
                    total_records: res.data.total_records,
                    skim_total: res.data.skim_total,
                    skim_count: res.data.skim_count,
                    mix_total: res.data.mix_total,
                    mix_count: res.data.mix_count,
                });
                setRecords(res.data.records || []);
            }
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const resetForm = () => {
        setOilLevel('');
        setTemperature('');
        setType('skim');
        setFormDate(selectedDate);
        setEditingId(null);
    };

    const handleCreate = () => {
        resetForm();
        setShowForm(true);
    };

    const handleEdit = (row: SkimMixRow) => {
        setEditingId(row.id);
        const d = new Date(row.date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setFormDate(`${yyyy}-${mm}-${dd}`);
        setOilLevel(row.oil_level);
        setTemperature(row.temperature);
        setType(row.type);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!oilLevel || !temperature) {
            Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบ' });
            return;
        }

        try {
            const payload = {
                date: formDate,
                oil_level: parseFloat(oilLevel),
                temperature: parseFloat(temperature),
                type,
            };

            let res;
            if (editingId) {
                res = await axios.put(route('skim-mix.update', editingId), payload);
            } else {
                res = await axios.post(route('skim-mix.store'), payload);
            }

            if (res.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: editingId ? 'แก้ไขสำเร็จ' : 'บันทึกสำเร็จ',
                    timer: 1200,
                    showConfirmButton: false,
                });
                resetForm();
                setShowForm(false);
                fetchData();
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'เกิดข้อผิดพลาด';
            Swal.fire({ icon: 'error', title: 'ไม่สามารถบันทึกได้', text: msg });
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: 'ต้องการลบรายการนี้หรือไม่',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก',
        });
        if (!result.isConfirmed) return;

        try {
            const res = await axios.delete(route('skim-mix.destroy', id));
            if (res.data.success) {
                Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1200, showConfirmButton: false });
                fetchData();
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
        }
    };

    const fmt = (v: number) => v.toFixed(3);

    const thaiDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 font-anuphan sm:p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* ======================== HEADER ======================== */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 shadow-2xl sm:p-8"
                    >
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/30 blur-2xl" />
                            <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
                        </div>

                        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="rounded-2xl bg-white/20 p-3.5 shadow-lg backdrop-blur-sm">
                                    <Beaker className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white drop-shadow-lg sm:text-3xl">
                                        บันทึก Skim / Mix
                                    </h1>
                                    <p className="mt-1 text-sm text-blue-100/80">
                                        บันทึกระดับน้ำมัน Tank No. 1 สำหรับการ Skim และ Mix
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-2.5 backdrop-blur-sm">
                                    <Calendar className="h-4 w-4 text-blue-200" />
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="border-none bg-transparent text-sm font-medium text-white placeholder-blue-200 focus:outline-none"
                                    />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleCreate}
                                    className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-blue-700 shadow-lg transition-all hover:shadow-xl"
                                >
                                    <Plus className="h-4 w-4" />
                                    บันทึกใหม่
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    {/* ======================== DASHBOARD CARDS ======================== */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        {/* Card 1: Tank 1 ล่าสุด */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="group relative overflow-hidden rounded-2xl border border-amber-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
                        >
                            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 opacity-60 transition-transform group-hover:scale-150" />
                            <div className="relative">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-2.5 shadow-md">
                                            <Gauge className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Tank 1 (ล่าสุด)</p>
                                            <p className="text-[11px] text-gray-500">ปริมาณ CPO ครั้งล่าสุด</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                                        <Hash className="h-3 w-3" />
                                        {summary.total_records} รอบ
                                    </div>
                                </div>
                                <p className="text-4xl font-extrabold tracking-tight text-amber-600">
                                    {fmt(summary.latest_volume)}
                                </p>
                                <p className="mt-1 text-xs font-medium text-gray-500">ตัน</p>
                            </div>
                        </motion.div>

                        {/* Card 2: Skim */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="group relative overflow-hidden rounded-2xl border border-rose-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
                        >
                            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-rose-100 to-red-100 opacity-60 transition-transform group-hover:scale-150" />
                            <div className="relative">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-gradient-to-br from-rose-400 to-red-500 p-2.5 shadow-md">
                                            <Droplets className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Skim</p>
                                            <p className="text-[11px] text-gray-500">ผลรวมส่วนต่าง Skim</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
                                        <Layers className="h-3 w-3" />
                                        {summary.skim_count} ครั้ง
                                    </div>
                                </div>
                                <p className="text-4xl font-extrabold tracking-tight text-rose-600">
                                    {fmt(summary.skim_total)}
                                </p>
                                <p className="mt-1 text-xs font-medium text-gray-500">ตัน</p>
                            </div>
                        </motion.div>

                        {/* Card 3: Mix */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="group relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
                        >
                            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 opacity-60 transition-transform group-hover:scale-150" />
                            <div className="relative">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 p-2.5 shadow-md">
                                            <FlaskConical className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Mix</p>
                                            <p className="text-[11px] text-gray-500">ผลรวมส่วนต่าง Mix</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                        <Layers className="h-3 w-3" />
                                        {summary.mix_count} ครั้ง
                                    </div>
                                </div>
                                <p className="text-4xl font-extrabold tracking-tight text-emerald-600">
                                    {Math.abs(summary.mix_total).toFixed(3)}
                                </p>
                                <p className="mt-1 text-xs font-medium text-gray-500">ตัน</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* ======================== FORM ======================== */}
                    <AnimatePresence>
                        {showForm && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xl">
                                    {/* Form Header */}
                                    <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-2">
                                                {editingId ? (
                                                    <Edit3 className="h-4 w-4 text-white" />
                                                ) : (
                                                    <Plus className="h-4 w-4 text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-gray-800">
                                                    {editingId ? 'แก้ไขข้อมูล' : 'กรอกข้อมูล Tank No. 1'}
                                                </h2>
                                                <p className="text-xs text-gray-500">
                                                    ระบุระดับน้ำมัน อุณหภูมิ และประเภท
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowForm(false);
                                                resetForm();
                                            }}
                                            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="p-6">
                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                            {/* วันที่ */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                                    <Calendar className="h-4 w-4 text-blue-500" />
                                                    วันที่
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formDate}
                                                    onChange={(e) => setFormDate(e.target.value)}
                                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm font-medium text-gray-700 transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                                />
                                            </div>

                                            {/* ระดับน้ำมัน */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                                    <Gauge className="h-4 w-4 text-amber-500" />
                                                    ระดับน้ำมัน (cm)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    placeholder="0.000"
                                                    value={oilLevel}
                                                    onChange={(e) => setOilLevel(e.target.value)}
                                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm font-medium transition-all focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100 focus:outline-none"
                                                />
                                            </div>

                                            {/* อุณหภูมิ */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                                    <Thermometer className="h-4 w-4 text-red-500" />
                                                    อุณหภูมิ (°C)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="0.0"
                                                    value={temperature}
                                                    onChange={(e) => setTemperature(e.target.value)}
                                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm font-medium transition-all focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 focus:outline-none"
                                                />
                                            </div>

                                            {/* ปริมาณ CPO (คำนวณอัตโนมัติ) */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                                    <FlaskConical className="h-4 w-4 text-emerald-500" />
                                                    ปริมาณ CPO (ตัน)
                                                </label>
                                                <div className="flex h-[46px] items-center rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 px-4">
                                                    <span className="text-xl font-extrabold tracking-tight text-emerald-700">
                                                        {calculatedVolume.toFixed(3)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ประเภท + ปุ่มบันทึก */}
                                        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                            <div className="flex-1">
                                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                    ประเภท
                                                </label>
                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setType('skim')}
                                                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold transition-all duration-200 ${
                                                            type === 'skim'
                                                                ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-sm'
                                                                : 'border-gray-200 bg-gray-50/50 text-gray-500 hover:border-rose-200 hover:bg-rose-50/30'
                                                        }`}
                                                    >
                                                        <Droplets className={`h-4 w-4 ${type === 'skim' ? 'text-rose-500' : 'text-gray-400'}`} />
                                                        Skim
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setType('mix')}
                                                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold transition-all duration-200 ${
                                                            type === 'mix'
                                                                ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm'
                                                                : 'border-gray-200 bg-gray-50/50 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/30'
                                                        }`}
                                                    >
                                                        <FlaskConical className={`h-4 w-4 ${type === 'mix' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                                        Mix
                                                    </button>
                                                </div>
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                type="submit"
                                                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl sm:w-auto"
                                            >
                                                <Save className="h-4 w-4" />
                                                {editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                                            </motion.button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ======================== TABLE ======================== */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 p-2">
                                    <Layers className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800">รายการบันทึก</h3>
                                    <p className="text-xs text-gray-500">{thaiDate(selectedDate)}</p>
                                </div>
                            </div>
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
                                {records.length} รายการ
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/80">
                                        {['#', 'ประเภท', 'ระดับน้ำมัน (cm)', 'อุณหภูมิ (°C)', 'ปริมาณ (ตัน)', 'ส่วนต่าง (ตัน)', 'จัดการ'].map(
                                            (h, i) => (
                                                <th
                                                    key={h}
                                                    className={`px-5 py-3.5 text-xs font-semibold tracking-wider text-gray-500 uppercase ${
                                                        i === 0
                                                            ? 'text-left'
                                                            : i === 1
                                                              ? 'text-center'
                                                              : i === 6
                                                                ? 'text-center'
                                                                : 'text-right'
                                                    }`}
                                                >
                                                    {h}
                                                </th>
                                            ),
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center">
                                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    >
                                                        <ChevronDown className="h-6 w-6" />
                                                    </motion.div>
                                                    <span className="text-sm">กำลังโหลด...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : records.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center">
                                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                                    <Beaker className="h-10 w-10 text-gray-300" />
                                                    <span className="text-sm">ไม่มีข้อมูลในวันที่เลือก</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        records.map((row, i) => (
                                            <motion.tr
                                                key={row.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="group transition-colors hover:bg-blue-50/30"
                                            >
                                                <td className="px-5 py-3.5 text-sm font-medium text-gray-500">
                                                    {i + 1}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                                                            row.type === 'skim'
                                                                ? 'bg-rose-50 text-rose-700'
                                                                : 'bg-emerald-50 text-emerald-700'
                                                        }`}
                                                    >
                                                        {row.type === 'skim' ? (
                                                            <Droplets className="h-3 w-3" />
                                                        ) : (
                                                            <FlaskConical className="h-3 w-3" />
                                                        )}
                                                        {row.type === 'skim' ? 'Skim' : 'Mix'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right text-sm font-semibold text-amber-700">
                                                    {parseFloat(row.oil_level).toFixed(3)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right text-sm font-semibold text-red-600">
                                                    {parseFloat(row.temperature).toFixed(1)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right text-sm font-bold text-gray-800">
                                                    {parseFloat(row.volume).toFixed(3)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <span
                                                        className={`text-sm font-bold ${
                                                            row.type === 'mix'
                                                                ? 'text-emerald-600'
                                                                : 'text-blue-600'
                                                        }`}
                                                    >
                                                        {row.type === 'mix'
                                                            ? Math.abs(parseFloat(row.difference || '0')).toFixed(3)
                                                            : parseFloat(row.difference || '0').toFixed(3)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <button
                                                            onClick={() => handleEdit(row)}
                                                            className="rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                                                            title="แก้ไข"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(row.id)}
                                                            className="rounded-lg p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-600"
                                                            title="ลบ"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    );
}
