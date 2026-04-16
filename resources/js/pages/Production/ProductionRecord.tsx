import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import axios from 'axios';
import { PlusCircle, Pencil, Trash2, X, ChevronLeft, ChevronRight, Factory, BarChart3, Leaf, CalendarDays, Check, AlertCircle, Settings, Save, Loader2, TrendingUp } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────
interface Production {
    id: number;
    Date: string;
    FFBForward: number;
    FFBPurchase: number;
    TotalFFB: number;
    ShiftA: number;
    ShiftB: number;
    Shift3: number;
    PickupRemain: number;
    RamRemain: number;
    AvgPickup: number;
    FFBGoodQty: number;
    Steam: number;
    StuckIn: number;
    RawFFB: number;
    RamRemain2: number;
    FFBRemain: number;
}
interface MonthlySummary {
    month_label: string;
    total_days: number;
    total_ffb_in: number;
    total_ffb_purchase: number;
    first_ffb_forward: number;
    total_output: number;
    total_truckloads: number;
    avg_yield: number;
    avg_pickup: number;
    last_ffb_remain: number;
}
interface Props {
    productions: Production[];
    summary: MonthlySummary;
    filters: { month?: string };
}

// ─── Form state ───────────────────────────────────────────────────────────
const DEFAULT_FORM = {
    Date: '', use_check: false,
    FFBForward: '', FFBPurchase: '',
    ShiftA: '', ShiftB: '', Shift3: '',
    PickupRemain: '', RamRemain: '',
    AvgPickup: '', FFBGoodQty: '',
    Steam: '', StuckIn: '',
    RawFFB: '', RamRemain2: '', FFBRemain: '',
};
type FormState = typeof DEFAULT_FORM;

// ─── Calculation (mirrors Livewire) ──────────────────────────────────────
function n(v: any): number { return parseFloat(String(v).replace(/,/g, '')) || 0; }
function calcAvgPickup(f: FormState): number {
    const totalFFB = n(f.FFBPurchase) + n(f.FFBForward);
    const sumShift = n(f.ShiftA) + n(f.ShiftB) + n(f.Shift3) + n(f.PickupRemain) + n(f.RamRemain);
    return sumShift > 0 ? totalFFB / sumShift : 0;
}
function fN(v: any): string {
    if (v === null || v === undefined || v === '') return '';
    const parts = String(v).replace(/,/g, '').split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}
function calcFFBGoodQty(f: FormState): number {
    return (n(f.ShiftA) + n(f.ShiftB) + n(f.Shift3)) * calcAvgPickup(f);
}
function calcFFBRemain(f: FormState): number {
    const total = n(f.FFBPurchase) + n(f.FFBForward);
    return total - calcFFBGoodQty(f);
}
function calcRamRemain2(f: FormState): number {
    const avg = calcAvgPickup(f);
    const good = calcFFBGoodQty(f);
    const pickUpRemain = good > 0 ? (n(f.StuckIn) + n(f.Steam)) * avg : n(f.FFBForward);
    return calcFFBRemain(f) - pickUpRemain;
}
function recalculate(f: FormState): FormState {
    const avg = calcAvgPickup(f);
    const good = calcFFBGoodQty(f);
    const remain = calcFFBRemain(f);
    const ram2 = calcRamRemain2(f);
    const fmtDec = (val: number) => val ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    return {
        ...f,
        AvgPickup: fmtDec(avg),
        FFBGoodQty: fmtDec(good),
        FFBRemain: fmtDec(remain),
        RamRemain2: fmtDec(ram2),
    };
}

// ─── Formatters ───────────────────────────────────────────────────────────
function fmt(v?: number | null): string {
    if (!v) return '—';
    return Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtInt(v?: number | null): string { return (!v || v === 0) ? '—' : String(v); }
function thDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────
export default function ProductionRecord({ productions, summary, filters }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'ฝ่ายผลิต', href: '#' },
        { title: 'บันทึกข้อมูลการผลิต', href: '/pro/production-record' },
    ];

    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM });
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [monthFilter, setMonthFilter] = useState(filters.month || currentMonth);
    const [loadingDate, setLoadingDate] = useState(false);

    const handleDateChange = useCallback(async (date: string) => {
        setForm(prev => ({ ...prev, Date: date }));
        if (!date) return;
        setLoadingDate(true);
        try {
            const res = await axios.get('/pro/production-record/date-info', { params: { date } });
            const d = res.data;
            setForm(prev => recalculate({
                ...prev,
                Date: date,
                FFBForward: fN(d.FFBForward),
                FFBPurchase: fN(d.FFBPurchase),
            }));
        } finally {
            setLoadingDate(false);
        }
    }, []);

    function handleChange(key: keyof FormState, value: any) {
        if (key === 'use_check' || key === 'Date') {
            setForm(recalculate({ ...form, [key]: value }));
            return;
        }

        let clean = String(value).replace(/[^0-9.]/g, '');
        const parts = clean.split('.');
        if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
        
        let formatted = clean;
        if (clean) {
            const [intPart, decPart] = clean.split('.');
            let intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            formatted = decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted;
        }

        setForm(recalculate({ ...form, [key]: formatted }));
    }

    function openCreate() {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        setEditId(null);
        setForm({ ...DEFAULT_FORM, Date: yesterday });
        setShowModal(true);
        handleDateChange(yesterday);
    }

    function openEdit(p: Production) {
        setEditId(p.id);
        const f: FormState = {
            Date: p.Date ? p.Date.substring(0, 10) : '',
            use_check: (p.FFBGoodQty ?? 0) > 0,
            FFBForward: fN(p.FFBForward), FFBPurchase: fN(p.FFBPurchase),
            ShiftA: fN(p.ShiftA), ShiftB: fN(p.ShiftB), Shift3: fN(p.Shift3),
            PickupRemain: fN(p.PickupRemain), RamRemain: fN(p.RamRemain),
            AvgPickup: fN(p.AvgPickup), FFBGoodQty: fN(p.FFBGoodQty),
            Steam: fN(p.Steam), StuckIn: fN(p.StuckIn),
            RawFFB: fN(p.RawFFB), RamRemain2: fN(p.RamRemain2),
            FFBRemain: fN(p.FFBRemain),
        };
        setForm(recalculate(f));
        setShowModal(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            Date: form.Date,
            FFBForward: n(form.FFBForward) || 0, FFBPurchase: n(form.FFBPurchase) || 0,
            ShiftA: form.use_check ? (n(form.ShiftA) || 0) : 0,
            ShiftB: form.use_check ? (n(form.ShiftB) || 0) : 0,
            Shift3: form.use_check ? (n(form.Shift3) || 0) : 0,
            PickupRemain: n(form.PickupRemain) || 0, RamRemain: n(form.RamRemain) || 0,
            Steam: n(form.Steam) || 0, StuckIn: n(form.StuckIn) || 0, RawFFB: n(form.RawFFB) || 0,
        };
        if (editId) {
            router.put(`/pro/production-record/${editId}`, payload, { onSuccess: () => setShowModal(false) });
        } else {
            router.post('/pro/production-record', payload, { onSuccess: () => setShowModal(false) });
        }
    }

    function handleDelete() {
        if (!deleteId) return;
        router.delete(`/pro/production-record/${deleteId}`, { onSuccess: () => setDeleteId(null) });
    }

    // ─────────────────────────────────────────────────────────────────────
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="บันทึกข้อมูลการผลิต" />

            {/* ── CSS animations ── */}
            <style>{`
                @keyframes float-a { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-20px,15px) scale(0.95)} }
                @keyframes float-b { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,20px) scale(0.95)} 66%{transform:translate(20px,-15px) scale(1.05)} }
                @keyframes float-c { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,25px) scale(0.97)} }
                .anim-a { animation: float-a 12s ease-in-out infinite; }
                .anim-b { animation: float-b 15s ease-in-out infinite; }
                .anim-c { animation: float-c 10s ease-in-out infinite; }
                .glass-card { background:rgba(255,255,255,0.72); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }
            `}</style>

            <div className="relative min-h-screen bg-[#f0f4f8] font-anuphan overflow-hidden">

                {/* Ambient glows */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
                    <div className="anim-a absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle,#6ee7b7 0%,transparent 70%)' }} />
                    <div className="anim-b absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-25" style={{ background: 'radial-gradient(circle,#93c5fd 0%,transparent 70%)' }} />
                    <div className="anim-c absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle,#c4b5fd 0%,transparent 70%)' }} />
                </div>

                <div className="relative z-10 p-6 space-y-6">

                    {/* ── Page Header ── */}
                    <div className="glass-card rounded-3xl ring-1 ring-slate-900/8 shadow-xl p-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <Factory className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">บันทึกข้อมูลการผลิต</h1>
                                    <p className="text-slate-500 text-sm mt-0.5">จัดการข้อมูลการผลิตรายวัน · ปริมาณผลปาล์ม · กะการทำงาน</p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2 bg-white/80 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                                    <span className="text-xs text-slate-400 font-medium">เดือน</span>
                                    <input type="month" value={monthFilter}
                                        onChange={(e) => {
                                            setMonthFilter(e.target.value);
                                            router.get('/pro/production-record', { month: e.target.value }, { preserveState: true });
                                        }}
                                        className="bg-transparent text-sm text-slate-700 focus:outline-none cursor-pointer" />
                                </div>
                                <a href={`/pro/production-record/export?month=${monthFilter}`}
                                    target="_blank" rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-700 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all duration-200">
                                    📥 Export Excel
                                </a>
                                <button onClick={openCreate}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-black rounded-xl hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200">
                                    <PlusCircle className="w-4 h-4" /> + บันทึกข้อมูล
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Summary KPI Cards ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Card 1: FFB รับเข้า */}
                        <div className="glass-card rounded-2xl ring-1 ring-emerald-200/60 shadow-md p-5 bg-gradient-to-br from-emerald-50 to-teal-50">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow">
                                    <Leaf className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{summary.month_label}</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">รวม FFB รับเข้า (ยอดรับ + ยกมาต้นเดือน)</p>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {fmt(summary.total_ffb_in)}
                                <span className="text-sm font-semibold text-slate-400 ml-1">ตัน</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">
                                ซื้อ {fmt(summary.total_ffb_purchase)} + ยกมา <span className="font-bold text-emerald-600">{fmt(summary.first_ffb_forward)} ตัน</span>
                            </p>
                        </div>

                        {/* Card 2: ผลผลิต */}
                        <div className="glass-card rounded-2xl ring-1 ring-blue-200/60 shadow-md p-5 bg-gradient-to-br from-blue-50 to-indigo-50">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow">
                                    <Factory className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{summary.total_days} วัน</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">รวมปริมาณผลิต</p>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {fmt(summary.total_output)}
                                <span className="text-sm font-semibold text-slate-400 ml-1">ตัน</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">
                                รวม {summary.total_truckloads.toLocaleString()} กะบะ · เฉลี่ย {fmt(summary.avg_pickup)} ตัน/กะบะ
                            </p>
                        </div>

                        {/* Card 3: % Yield */}
                        <div className="glass-card rounded-2xl ring-1 ring-violet-200/60 shadow-md p-5 bg-gradient-to-br from-violet-50 to-purple-50">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white shadow">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">การผลิต</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">% การผลิต</p>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {summary.avg_yield.toFixed(2)}
                                <span className="text-sm font-semibold text-slate-400 ml-1">%</span>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-2 h-1.5 bg-violet-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min(summary.avg_yield, 30) / 30 * 100}%` }} />
                            </div>
                        </div>

                        {/* Card 4: FFB คงค้าง */}
                        <div className="glass-card rounded-2xl ring-1 ring-rose-200/60 shadow-md p-5 bg-gradient-to-br from-rose-50 to-orange-50">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white shadow">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">คงค้าง</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">FFB คงค้าง (ล่าสุด)</p>
                            <div className="text-2xl font-black text-rose-600 tracking-tight">
                                {fmt(summary.last_ffb_remain)}
                                <span className="text-sm font-semibold text-rose-400 ml-1">ตัน</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">บันทึก {productions.length} รายการในเดือนนี้</p>
                        </div>
                    </div>

                    {/* ── Table ── */}
                    <div className="glass-card rounded-3xl ring-1 ring-slate-900/8 shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-emerald-500" />
                            <span className="font-bold text-slate-800 text-sm">รายการข้อมูลการผลิต</span>
                            <span className="ml-auto text-xs text-slate-400">{productions.length} รายการ</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-emerald-600 to-green-600 text-white">
                                        {[
                                            'วันที่', 'สถานะ',
                                            'ยอดยกมา\n(ตัน)', 'ยอดรับเข้า\n(ตัน)', 'รวม FFB\n(ตัน)',
                                            'กะ A', 'กะ B', 'กะ 3',
                                            'ปริมาณผลิต\n(ตัน)', 'ค่าเฉลี่ย\n(ตัน/กะบะ)',
                                            'อบ', 'บรรจุ', 'ลานเท\n(ตัน)', 'FFB คงค้าง\n(ตัน)',
                                            'จัดการ',
                                        ].map((h, i) => (
                                            <th key={i} className="px-3 py-3 font-bold text-xs whitespace-pre-line border border-emerald-500/50 text-center">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {productions.length === 0 ? (
                                        <tr>
                                            <td colSpan={15} className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-3 text-slate-400">
                                                    <Factory className="w-12 h-12 opacity-30" />
                                                    <p className="font-semibold">ไม่พบข้อมูลการผลิต</p>
                                                    <p className="text-xs">กดปุ่ม + บันทึกข้อมูล เพื่อเพิ่มรายการใหม่</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        productions.map((p: Production, idx: number) => (
                                            <tr key={p.id}
                                                className={`border-b border-slate-100 hover:bg-emerald-50/60 transition-colors text-slate-800 ${idx % 2 === 0 ? 'bg-white/50' : 'bg-slate-50/40'}`}>
                                                <td className="px-3 py-2.5 text-center font-semibold text-slate-700 whitespace-nowrap">
                                                    {thDate(p.Date)}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {(p.FFBGoodQty ?? 0) > 0 ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
                                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />ผลิต
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-600 ring-1 ring-rose-200">
                                                            <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />ไม่ผลิต
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(p.FFBForward)}</td>
                                                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{fmt(p.FFBPurchase)}</td>
                                                <td className="px-3 py-2.5 text-right tabular-nums font-bold text-blue-600">{fmt(p.TotalFFB)}</td>
                                                <td className="px-3 py-2.5 text-center tabular-nums">{fmtInt(p.ShiftA)}</td>
                                                <td className="px-3 py-2.5 text-center tabular-nums">{fmtInt(p.ShiftB)}</td>
                                                <td className="px-3 py-2.5 text-center tabular-nums">{fmtInt(p.Shift3)}</td>
                                                <td className="px-3 py-2.5 text-right tabular-nums font-bold text-emerald-600">{fmt(p.FFBGoodQty)}</td>
                                                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(p.AvgPickup)}</td>
                                                <td className="px-3 py-2.5 text-center tabular-nums">{fmtInt(p.Steam)}</td>
                                                <td className="px-3 py-2.5 text-center tabular-nums">{fmtInt(p.StuckIn)}</td>
                                                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(p.RamRemain2)}</td>
                                                <td className="px-3 py-2.5 text-right tabular-nums font-bold text-rose-500">{fmt(p.FFBRemain)}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => openEdit(p)}
                                                            className="p-1.5 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 hover:text-amber-700 hover:scale-110 transition-all" title="แก้ไข">
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => setDeleteId(p.id)}
                                                            className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-700 hover:scale-110 transition-all" title="ลบ">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>


                    </div>
                </div>
            </div>

            {/* ════ ADD / EDIT MODAL ════ */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[94vh] overflow-hidden ring-1 ring-slate-200 flex flex-col">

                        {/* ── Header ── */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                                    <Factory className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-white tracking-tight">
                                        {editId ? 'แก้ไขข้อมูลการผลิต' : 'บันทึกข้อมูลการผลิต'}
                                    </h2>
                                    <p className="text-emerald-100 text-xs">ระบบบันทึกข้อมูลการผลิต · {form.Date ? new Date(form.Date + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)}
                                className="w-9 h-9 rounded-xl bg-white/15 hover:bg-red-500 flex items-center justify-center text-white transition-all duration-200 hover:rotate-90">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* ── Body: 2-column ── */}
                        <form onSubmit={handleSubmit} className="flex flex-1 overflow-hidden min-h-0">

                            {/* LEFT: Form inputs */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-w-0">

                                {/* Row: วันที่ + สถานะ */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* วันที่ */}
                                    <div>
                                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                            <CalendarDays className="w-3 h-3" /> วันที่ผลิต *
                                        </label>
                                        <div className="relative">
                                            <input type="date" value={form.Date} required
                                                onChange={(e) => handleDateChange(e.target.value)}
                                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all" />
                                            {loadingDate && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin inline-block" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* สถานะ */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">สถานะการผลิต</label>
                                        <label className={`flex items-center gap-3 cursor-pointer px-4 py-2.5 rounded-xl border-2 transition-all duration-200 h-[42px] ${
                                            form.use_check
                                                ? 'bg-emerald-50 border-emerald-400 shadow-sm shadow-emerald-100'
                                                : 'bg-rose-50 border-rose-200'
                                        }`}>
                                            <input type="checkbox" checked={form.use_check}
                                                onChange={(e) => handleChange('use_check', e.target.checked)}
                                                className="sr-only" />
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                form.use_check ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-rose-300'
                                            }`}>
                                                {form.use_check && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                            </div>
                                            <span className={`text-sm font-bold ${form.use_check ? 'text-emerald-700' : 'text-rose-500'}`}>
                                                {form.use_check ? '🟢 ผลิต' : '🔴 ไม่ผลิต'}
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Section 1: ปริมาณ FFB */}
                                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-100/80 border-b border-blue-200">
                                        <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                                            <Leaf className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <span className="text-xs font-black text-blue-800 uppercase tracking-wider">ปริมาณผลปาล์ม</span>
                                    </div>
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        {[
                                            { key: 'FFBForward',  label: 'ยอดยกมา',   unit: 'ตัน' },
                                            { key: 'FFBPurchase', label: 'ยอดรับเข้า', unit: 'ตัน' },
                                        ].map(({ key, label, unit }) => (
                                            <div key={key}>
                                                <label className="text-xs font-semibold text-slate-600 mb-1 block">{label}</label>
                                                <div className="relative">
                                                    <input type="text" inputMode="decimal" placeholder="0.00"
                                                        value={(form as any)[key]}
                                                        onChange={(e) => handleChange(key as any, e.target.value)}
                                                        className="w-full border border-blue-200 rounded-xl px-3 py-2 pr-10 text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all" />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 2: กะการผลิต */}
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100/80 border-b border-emerald-200">
                                        <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                            <Factory className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">กะการผลิต</span>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {/* Shift A/B/3 */}
                                        {form.use_check ? (
                                            <div className="grid grid-cols-3 gap-2">
                                                {([
                                                    { key: 'ShiftA', label: 'กะ A', accent: 'border-amber-300 bg-amber-50' },
                                                    { key: 'ShiftB', label: 'กะ B', accent: 'border-sky-300   bg-sky-50' },
                                                    { key: 'Shift3', label: 'กะ 3', accent: 'border-purple-300 bg-purple-50' },
                                                ] as const).map(({ key, label, accent }) => (
                                                    <div key={key}>
                                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">{label}</label>
                                                        <div className="relative">
                                                            <input type="text" inputMode="numeric" placeholder="0"
                                                                value={(form as any)[key]}
                                                                onChange={(e) => handleChange(key as any, e.target.value)}
                                                                className={`w-full border rounded-xl px-3 py-2 pr-9 text-sm focus:ring-2 focus:ring-emerald-400 outline-none transition-all ${accent}`} />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">กะบะ</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-50 border border-dashed border-rose-200 text-rose-400 text-xs">
                                                <AlertCircle className="w-3.5 h-3.5" /> ไม่มีการผลิต ไม่แสดงช่องกรอกข้อมูลกะ
                                            </div>
                                        )}
                                        {/* ค้างกะบะ / คาดการณ์บนลาน */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { key: 'PickupRemain', label: 'ค้างกะบะ',       unit: 'กะบะ' },
                                                { key: 'RamRemain',    label: 'คาดการณ์บนลาน', unit: 'กะบะ' },
                                            ].map(({ key, label, unit }) => (
                                                <div key={key}>
                                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">{label}</label>
                                                    <div className="relative">
                                                        <input type="text" inputMode="numeric" placeholder="0"
                                                            value={(form as any)[key]}
                                                            onChange={(e) => handleChange(key as any, e.target.value)}
                                                            className="w-full border border-emerald-200 rounded-xl px-3 py-2 pr-8 text-sm bg-white focus:ring-2 focus:ring-emerald-400 outline-none transition-all" />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">{unit}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: ข้อมูลเพิ่มเติม */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100/80 border-b border-slate-200">
                                        <div className="w-6 h-6 rounded-lg bg-slate-500 flex items-center justify-center flex-shrink-0">
                                            <Settings className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider">ข้อมูลเพิ่มเติม</span>
                                    </div>
                                    <div className="p-4 grid grid-cols-3 gap-2">
                                        {[
                                            { key: 'Steam',   label: 'อบ',      unit: 'กะบะ' },
                                            { key: 'StuckIn', label: 'บรรจุ',    unit: 'กะบะ' },
                                            { key: 'RawFFB',  label: 'ปาล์มดิบ', unit: 'ตัน', step: '0.01' },
                                        ].map(({ key, label, unit, step }) => (
                                            <div key={key}>
                                                <label className="text-xs font-semibold text-slate-600 mb-1 block">{label}</label>
                                                <div className="relative">
                                                    <input type="text" inputMode="decimal" placeholder="0"
                                                        value={(form as any)[key]}
                                                        onChange={(e) => handleChange(key as any, e.target.value)}
                                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm bg-white focus:ring-2 focus:ring-slate-400 outline-none transition-all" />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">{unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Live Calculation Panel */}
                            <div className="w-52 flex-shrink-0 bg-gradient-to-b from-slate-50 to-white border-l border-slate-200 flex flex-col overflow-hidden">
                                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200">
                                    <p className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> ผลคำนวณ
                                    </p>
                                </div>
                                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                                    {/* รวม FFB */}
                                    <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 text-center">
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">รวม FFB</p>
                                        <p className="text-xl font-black text-blue-700 leading-tight">
                                            {(n(form.FFBForward) + n(form.FFBPurchase)).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] text-blue-400 mt-0.5">ตัน</p>
                                    </div>
                                    {/* AvgPickup */}
                                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-center">
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">ค่าเฉลี่ย</p>
                                        <p className="text-xl font-black text-emerald-700 leading-tight">
                                            {form.AvgPickup || '—'}
                                        </p>
                                        <p className="text-[10px] text-emerald-400 mt-0.5">ตัน / กะบะ</p>
                                    </div>
                                    {/* FFBGoodQty */}
                                    <div className="rounded-2xl bg-violet-50 border border-violet-200 p-3 text-center">
                                        <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-1">ปริมาณผลิต</p>
                                        <p className="text-xl font-black text-violet-700 leading-tight">
                                            {form.FFBGoodQty || '—'}
                                        </p>
                                        <p className="text-[10px] text-violet-400 mt-0.5">ตัน</p>
                                    </div>
                                    {/* FFBRemain */}
                                    <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-center">
                                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">FFB คงค้าง</p>
                                        <p className="text-xl font-black text-rose-600 leading-tight">
                                            {form.FFBRemain || '—'}
                                        </p>
                                        <p className="text-[10px] text-rose-400 mt-0.5">ตัน</p>
                                    </div>
                                </div>
                                {/* Footer buttons */}
                                <div className="px-4 py-4 border-t border-slate-200 space-y-2 flex-shrink-0">
                                    <button type="submit"
                                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-md shadow-emerald-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                                        <Save className="w-4 h-4" />
                                        {editId ? 'บันทึกแก้ไข' : 'บันทึก'}
                                    </button>
                                    <button type="button" onClick={() => setShowModal(false)}
                                        className="w-full py-2 text-sm font-semibold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">
                                        ยกเลิก
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ════ DELETE CONFIRM ════ */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
                    <div className="bg-white/95 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center ring-1 ring-slate-900/10">
                        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8 text-rose-500" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">ยืนยันการลบ</h3>
                        <p className="text-slate-500 text-sm mb-6">ต้องการลบข้อมูลนี้ใช่หรือไม่?<br />การกระทำนี้ไม่สามารถเรียกคืนได้</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setDeleteId(null)}
                                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all flex-1">
                                ยกเลิก
                            </button>
                            <button onClick={handleDelete}
                                className="px-5 py-2.5 text-sm font-black text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all flex-1">
                                ลบ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
