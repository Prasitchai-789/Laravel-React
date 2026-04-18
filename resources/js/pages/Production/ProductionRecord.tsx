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
    CS1: number;
    CS2: number;
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
    CS1: '', CS2: '',
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
                CS1: fN(d.CS1),
                CS2: fN(d.CS2),
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
            CS1: fN(p.CS1), CS2: fN(p.CS2),
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
            CS1: n(form.CS1) || 0, CS2: n(form.CS2) || 0,
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
                                            'กะ A', 'กะ B', 'กะ 3', 'CS1', 'CS2',
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
                                                <td className="px-3 py-2.5 text-center tabular-nums text-blue-600 font-bold">{fmtInt(p.CS1)}</td>
                                                <td className="px-3 py-2.5 text-center tabular-nums text-blue-600 font-bold">{fmtInt(p.CS2)}</td>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden scale-in-center animate-in zoom-in-95 duration-300 border border-white/20 ring-1 ring-slate-900/5">

                        {/* ── Header (Premium & Clean) ── */}
                        <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-4 border-b border-slate-100 flex-shrink-0 bg-white/80 backdrop-blur-md z-10">
                            <div className="flex items-center gap-4 sm:gap-5">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <Factory className="w-6 h-6 text-white drop-shadow-sm" />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                                        {editId ? 'แก้ไขข้อมูลการผลิต' : 'บันทึกข้อมูลการผลิต'}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1 sm:mt-1.5">
                                        <CalendarDays className="w-4 h-4 text-emerald-500" />
                                        <p className="text-slate-500 text-sm font-medium">
                                            {form.Date ? new Date(form.Date + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'กรุณาเลือกวันที่ดำเนินการ'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:bg-red-500 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 hover:rotate-90">
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {/* ── Body (Responsive Two Column Layout) ── */}
                        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden bg-slate-50/50">

                            {/* LEFT: Main Form Area */}
                            <div className="flex-1 lg:overflow-y-auto p-4 sm:p-4 lg:p-4 space-y-2 sm:space-y-2 scroll-smooth flex-shrink-0 lg:flex-shrink">

                                {/* Card 1: General Info */}
                                <div className="bg-white p-4 sm:p-4 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                            <h3 className="text-base sm:text-lg font-bold text-slate-800">ข้อมูลพื้นฐาน & วัตถุดิบ</h3>
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-100/50 p-1.5 pr-4 rounded-full border border-slate-200 shadow-sm">
                                            <button type="button" onClick={() => handleChange('use_check', !form.use_check)}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 ${form.use_check ? 'bg-emerald-500' : 'bg-slate-300'
                                                    }`}>
                                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${form.use_check ? 'translate-x-6' : 'translate-x-1'
                                                    }`} />
                                            </button>
                                            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors duration-300 ${form.use_check ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {form.use_check ? '🟢 ผลิตปกติ' : '🔴 หยุดผลิต'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {/* Date Field */}
                                        <div className="group">
                                            <label className="block text-sm font-semibold text-slate-600 mb-2 group-hover:text-emerald-600 transition-colors">วันที่ดำเนินการ <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <input type="date" value={form.Date} required
                                                    onChange={(e) => handleDateChange(e.target.value)}
                                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-700 hover:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                                                {loadingDate && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 p-1 rounded-md">
                                                        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* FFB Forward */}
                                        <div className="group">
                                            <label className="block text-sm font-semibold text-slate-600 mb-2 group-hover:text-emerald-600 transition-colors">ยอดยกมา (Backlog)</label>
                                            <div className="relative">
                                                <input type="text" inputMode="decimal" placeholder="0.00"
                                                    value={form.FFBForward}
                                                    onChange={(e) => handleChange('FFBForward', e.target.value)}
                                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-14 text-sm font-medium text-slate-700 hover:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">TON</span>
                                            </div>
                                        </div>
                                        {/* FFB Purchase */}
                                        <div className="group">
                                            <label className="block text-sm font-semibold text-slate-600 mb-2 group-hover:text-emerald-600 transition-colors">ยอดรับเข้า (Purchase)</label>
                                            <div className="relative">
                                                <input type="text" inputMode="decimal" placeholder="0.00"
                                                    value={form.FFBPurchase}
                                                    onChange={(e) => handleChange('FFBPurchase', e.target.value)}
                                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-14 text-sm font-medium text-slate-700 hover:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">TON</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: Shift Data */}
                                <div className="bg-white p-4 sm:p-4 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                        <h3 className="text-base sm:text-lg font-bold text-slate-800">ข้อมูลการผลิต</h3>
                                    </div>

                                    {form.use_check ? (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {[
                                                    { key: 'ShiftA', label: 'กะ A', accent: 'hover:border-amber-400 focus:ring-amber-500/10 focus:border-amber-500' },
                                                    { key: 'ShiftB', label: 'กะ B', accent: 'hover:border-sky-400 focus:ring-sky-500/10 focus:border-sky-500' },
                                                    { key: 'Shift3', label: 'กะ 3', accent: 'hover:border-purple-400 focus:ring-purple-500/10 focus:border-purple-500' },
                                                ].map(({ key, label, accent }) => (
                                                    <div key={key}>
                                                        <label className="block text-sm font-semibold text-slate-600 mb-2">{label}</label>
                                                        <div className="relative">
                                                            <input type="text" inputMode="numeric" placeholder="0"
                                                                value={(form as any)[key]}
                                                                onChange={(e) => handleChange(key as any, e.target.value)}
                                                                className={`w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-12 text-sm font-medium text-slate-700 focus:bg-white focus:ring-4 outline-none transition-all shadow-sm ${accent}`} />
                                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">กะบะ</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="h-px bg-slate-100 mt-4" />

                                            
                                        </div>
                                    ) : (
                                        <div className="bg-rose-50/50 border-2 border-dashed border-rose-200 rounded-2xl p-2 sm:p-2 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
                                            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md shadow-rose-100">
                                                <AlertCircle className="w-4 h-4 text-rose-500" />
                                            </div>
                                            <h4 className="text-base sm:text-sm font-bold text-rose-800">ไม่มีการผลิตในวันที่เลือก</h4>
                                            <p className="text-xs text-rose-500 max-w-sm">แบบฟอร์มบันทึกกะบะการผลิตถูกปิดใช้งานชั่วคราว</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                                                {[
                                                    { key: 'PickupRemain', label: 'ค้างกะบะ', icon: <AlertCircle className="w-4 h-4 text-orange-500" /> },
                                                    { key: 'RamRemain', label: 'คาดการณ์บนลาน', icon: <Factory className="w-4 h-4 text-emerald-500" /> },
                                                ].map(({ key, label, icon }) => (
                                                    <div key={key}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {icon}
                                                            <label className="text-sm font-semibold text-slate-600">{label}</label>
                                                        </div>
                                                        <div className="relative">
                                                            <input type="text" inputMode="numeric" placeholder="0"
                                                                value={(form as any)[key]}
                                                                onChange={(e) => handleChange(key as any, e.target.value)}
                                                                className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 pr-12 text-sm font-medium text-slate-700 hover:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">กะบะ</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                </div>

                                {/* Card 3: Operations */}
                                <div className="bg-white p-4 sm:p-4 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-6 bg-slate-700 rounded-full" />
                                        <h3 className="text-base sm:text-lg font-bold text-slate-800">ข้อมูลเพิ่มเติม</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {[
                                            { key: 'Steam', label: 'อบ (Steam)', unit: 'กะบะ' },
                                            { key: 'StuckIn', label: 'บรรจุ (Stuck)', unit: 'กะบะ' },
                                            { key: 'RawFFB', label: 'ผลปาล์มดิบ (Raw)', unit: 'TON' },
                                            { key: 'CS1', label: 'CS 1', unit: 'CM' },
                                            { key: 'CS2', label: 'CS 2', unit: 'CM' },
                                        ].map(({ key, label, unit }) => (
                                            <div key={key} className="group">
                                                <label className="block text-sm font-semibold text-slate-600 mb-1 group-hover:text-slate-900 transition-colors">{label}</label>
                                                <div className="relative">
                                                    <input type="text" inputMode="decimal" placeholder="0"
                                                        value={(form as any)[key]}
                                                        onChange={(e) => handleChange(key as any, e.target.value)}
                                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-14 text-sm font-medium text-slate-700 hover:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 outline-none transition-all shadow-sm" />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Sidebar Analytics (Premium Floating Style) */}
                            <div className="w-full lg:w-[340px] flex-shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 lg:overflow-y-auto">
                                <div className="p-4 lg:p-4 flex-shrink-0">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center shadow-md">
                                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-md font-bold text-slate-900">สรุปข้อมูลประจำวัน</h3>
                                            <p className="text-xs text-slate-500">Live Analytics Data</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Main KPI Card */}
                                        <div className="relative p-4 rounded-3xl bg-gradient-to-br from-blue-800 via-blue-850 to-blue-900 text-white shadow-xl shadow-slate-900/20 overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
                                            <p className="text-md font-medium text-slate-200 mb-2">ปริมาณผลิตรวมสุทธิ</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black tracking-tight tabular-nums">{form.FFBGoodQty || '0.00'}</span>
                                                <span className="text-sm font-bold text-emerald-400">TON</span>
                                            </div>
                                        </div>

                                        {/* Secondary KPIs */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4 lg:gap-3">
                                            {[
                                                { label: 'ค่าเฉลี่ยรถ', value: form.AvgPickup, unit: 'TON/กะบะ' },
                                                { label: 'FFB คงค้าง', value: form.FFBRemain, unit: 'TON' },
                                                { label: 'รวม FFB ทั้งสิ้น', value: (n(form.FFBForward) + n(form.FFBPurchase)).toLocaleString('th-TH', { minimumFractionDigits: 2 }), unit: 'TON' },
                                            ].map((kpi, idx) => (
                                                <div key={idx} className="p-2 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex justify-between items-center transition-colors">
                                                    <div>
                                                        <p className="text-md font-semibold text-slate-700 mb-1">{kpi.label}</p>
                                                        <p className="text-lg font-bold text-slate-800 tabular-nums">{kpi.value || '0.00'}</p>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-400 uppercase bg-white px-2 py-1 rounded-lg border border-slate-100">{kpi.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 hidden lg:block" />

                                {/* Footer Actions (Sticky on Mobile) */}
                                <div className="p-6 lg:p-8 border-t border-slate-100 space-y-3 bg-white sticky bottom-0 z-20">
                                    <button type="submit"
                                        className="w-full flex items-center justify-center gap-2 h-14 text-base font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl hover:from-emerald-500 hover:to-emerald-400 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
                                        <Save className="w-5 h-5" />
                                        {editId ? 'ยืนยันการแก้ไขข้อมูล' : 'บันทึกข้อมูลการผลิต'}
                                    </button>
                                    <button type="button" onClick={() => setShowModal(false)}
                                        className="w-full h-12 text-sm font-bold text-slate-600 bg-white border-2 border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all duration-200">
                                        ยกเลิกทำรายการ
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
