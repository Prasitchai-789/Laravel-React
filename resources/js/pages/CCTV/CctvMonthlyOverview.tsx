import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Camera, ChevronLeft, ChevronRight, Activity, CalendarDays, ShieldCheck, BarChart3 } from 'lucide-react';

interface DvrInfo { id: number; name: string; camera_count: number; }
interface CellData { dvr_id: number; is_inspected: boolean; broken_count: number; no_signal_count: number; checked_by: string | null; remark: string | null; }
interface RowData { date: string; cells: CellData[]; }
interface OverviewData { success: boolean; month: string; dates: string[]; dvrs: DvrInfo[]; rows: RowData[]; total_slots: number; inspected_slots: number; }

const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const THAI_MONTHS_FULL = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function formatThaiDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    return { day: d.getDate(), dayOfWeek: THAI_DAYS[d.getDay()], monthShort: THAI_MONTHS_SHORT[d.getMonth()], isSunday: d.getDay() === 0 };
}

function StatusCell({ cell, dvrName, date }: { cell: CellData; dvrName: string; date: string }) {
    const hasAnomaly = cell.broken_count > 0 || cell.no_signal_count > 0;

    if (!cell.is_inspected) {
        return (
            <div className="flex items-center justify-center h-full min-h-[42px]">
                <span className="text-slate-200 text-base select-none">—</span>
            </div>
        );
    }

    return (
        <div
            className={`group relative flex flex-col items-center justify-center gap-0.5 min-h-[42px] rounded-lg mx-0.5 my-0.5 px-1 py-1 transition-all cursor-default
                ${hasAnomaly
                    ? 'bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200 shadow-sm'
                    : 'bg-gradient-to-b from-emerald-50 to-green-50 border border-emerald-200 shadow-sm'
                }`}
        >
            {hasAnomaly
                ? <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                : <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            }
            {(cell.broken_count > 0 || cell.no_signal_count > 0) && (
                <div className="flex gap-0.5 flex-wrap justify-center">
                    {cell.broken_count > 0 && (
                        <span className="rounded-full bg-red-100 px-1 py-0 text-[8px] font-bold text-red-700 leading-4">B:{cell.broken_count}</span>
                    )}
                    {cell.no_signal_count > 0 && (
                        <span className="rounded-full bg-amber-100 px-1 py-0 text-[8px] font-bold text-amber-700 leading-4">N:{cell.no_signal_count}</span>
                    )}
                </div>
            )}
            {cell.checked_by && (
                <span className="text-[8px] text-slate-400 truncate max-w-[60px] leading-3">{cell.checked_by}</span>
            )}
            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:flex flex-col
                rounded-xl bg-slate-800/95 text-white text-xs px-3 py-2 shadow-2xl whitespace-nowrap w-max max-w-[200px] gap-0.5">
                <span className="font-semibold text-slate-200">{dvrName}</span>
                <span className="text-slate-400 text-[11px]">{date}</span>
                {cell.checked_by && <span className="text-emerald-300 text-[11px]">👤 {cell.checked_by}</span>}
                {cell.broken_count > 0 && <span className="text-red-300 text-[11px]">🔴 กล้องเสีย: {cell.broken_count} ตัว</span>}
                {cell.no_signal_count > 0 && <span className="text-amber-300 text-[11px]">🟡 ไม่มีสัญญาณ: {cell.no_signal_count} ตัว</span>}
                {!hasAnomaly && <span className="text-emerald-300 text-[11px]">✅ ทุกกล้องปกติ</span>}
                {cell.remark && <span className="text-slate-300 text-[11px] mt-0.5 border-t border-slate-600 pt-0.5">💬 {cell.remark}</span>}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800/95" />
            </div>
        </div>
    );
}

export default function CctvMonthlyOverview() {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (month: string) => {
        setLoading(true); setError(null);
        try {
            const res = await axios.get('/cctv-inspection/monthly-api', { params: { month } });
            if (res.data.success) setData(res.data);
            else setError(res.data.message || 'เกิดข้อผิดพลาด');
        } catch (e: any) {
            setError(e.message || 'โหลดข้อมูลไม่สำเร็จ');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(selectedMonth); }, [selectedMonth]);

    const prevMonth = () => { const d = new Date(selectedMonth + '-01'); d.setMonth(d.getMonth() - 1); setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
    const nextMonth = () => { const d = new Date(selectedMonth + '-01'); d.setMonth(d.getMonth() + 1); setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };

    const [year, monthNum] = selectedMonth.split('-').map(Number);
    const thaiLabel = `${THAI_MONTHS_FULL[monthNum - 1]} ${year + 543}`;

    const dvrSummary = useMemo(() => {
        if (!data) return [];
        return data.dvrs.map((dvr, dvrIdx) => {
            let inspected = 0, broken = 0, noSignal = 0;
            data.rows.forEach(row => {
                const cell = row.cells[dvrIdx];
                if (cell?.is_inspected) inspected++;
                broken   += cell?.broken_count   ?? 0;
                noSignal += cell?.no_signal_count ?? 0;
            });
            return { dvr, inspected, broken, noSignal, total: data.dates.length };
        });
    }, [data]);

    const completionPct = data && data.total_slots > 0 ? Math.round((data.inspected_slots / data.total_slots) * 100) : 0;
    const anomalyCount = useMemo(() => data?.rows.reduce((acc, row) => acc + row.cells.filter(c => c.is_inspected && (c.broken_count > 0 || c.no_signal_count > 0)).length, 0) ?? 0, [data]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'ตรวจ CCTV', href: '/cctv-inspection' },
        { title: 'ภาพรวมรายเดือน', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col h-full bg-slate-50">

                {/* ─── Top Bar ─── */}
                <div className="bg-white border-b border-slate-200 px-5 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-indigo-200">
                            <Camera className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 leading-tight">ภาพรวมการตรวจ CCTV รายเดือน</h1>
                            <p className="text-xs text-slate-400">{thaiLabel}</p>
                        </div>
                    </div>

                    {/* Month Picker */}
                    <div className="flex items-center gap-1 rounded-xl bg-slate-50 border border-slate-200 px-2 py-1.5 shadow-sm">
                        <button onClick={prevMonth} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="border-0 bg-transparent text-center text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer px-1"
                        />
                        <button onClick={nextMonth} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* ─── KPI Row ─── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 flex-shrink-0">
                    {/* DVR */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 flex-shrink-0">
                            <Camera className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 leading-none">เครื่องบันทึก DVR</p>
                            <p className="text-2xl font-extrabold text-slate-800 leading-tight">{data?.dvrs.length ?? '—'}</p>
                        </div>
                        <div className="absolute -right-3 -bottom-3 h-16 w-16 rounded-full bg-violet-50 opacity-60" />
                    </div>
                    {/* Days */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 leading-none">จำนวนวัน</p>
                            <p className="text-2xl font-extrabold text-slate-800 leading-tight">{data?.dates.length ?? '—'}</p>
                        </div>
                        <div className="absolute -right-3 -bottom-3 h-16 w-16 rounded-full bg-blue-50 opacity-60" />
                    </div>
                    {/* Inspected */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 flex-shrink-0">
                            <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 leading-none">ตรวจแล้ว / ทั้งหมด</p>
                            <p className="text-2xl font-extrabold text-slate-800 leading-tight">
                                {data ? <>{data.inspected_slots}<span className="text-sm font-medium text-slate-400">/{data.total_slots}</span></> : '—'}
                            </p>
                        </div>
                        <div className="absolute -right-3 -bottom-3 h-16 w-16 rounded-full bg-emerald-50 opacity-60" />
                    </div>
                    {/* Completion */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 flex-shrink-0">
                                <BarChart3 className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 leading-none">ความครบถ้วน</p>
                                <p className={`text-2xl font-extrabold leading-tight ${completionPct >= 80 ? 'text-emerald-600' : completionPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {completionPct}%
                                </p>
                            </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${completionPct >= 80 ? 'bg-emerald-500' : completionPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${completionPct}%` }}
                            />
                        </div>
                        <div className="absolute -right-3 -bottom-3 h-16 w-16 rounded-full bg-amber-50 opacity-60" />
                    </div>
                </div>

                {/* ─── Legend ─── */}
                <div className="px-5 pb-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 flex-shrink-0">
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500"/><span>ตรวจแล้ว (ปกติ)</span></div>
                    <div className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-500"/><span>พบความผิดปกติ</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-slate-300 font-bold text-base leading-none">—</span><span>ยังไม่ตรวจ</span></div>
                    <div className="flex items-center gap-1.5"><span className="rounded-full bg-red-100 px-1.5 py-0 text-[10px] font-bold text-red-700 leading-4">B:n</span><span>กล้องเสีย</span></div>
                    <div className="flex items-center gap-1.5"><span className="rounded-full bg-amber-100 px-1.5 py-0 text-[10px] font-bold text-amber-700 leading-4">N:n</span><span>ไม่มีสัญญาณ</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-100 border border-red-300"/><span>วันอาทิตย์</span></div>
                </div>

                {/* ─── Loading / Error ─── */}
                {loading && (
                    <div className="flex flex-1 items-center justify-center gap-3 text-slate-400">
                        <svg className="h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        <span className="text-sm">กำลังโหลดข้อมูล...</span>
                    </div>
                )}
                {error && !loading && (
                    <div className="mx-5 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
                )}

                {/* ─── Matrix Table ─── */}
                {data && !loading && (
                    <div className="flex-1 overflow-auto px-5 pb-5 min-h-0">
                        <div className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                            <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '110px', minWidth: '110px' }} />
                                    {data.dvrs.map(d => <col key={d.id} style={{ minWidth: '80px' }} />)}
                                </colgroup>
                                <thead className="sticky top-0 z-20">
                                    {/* DVR Names */}
                                    <tr className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white">
                                        <th className="sticky left-0 z-30 bg-slate-900 px-3 py-3 text-left font-semibold border-r border-slate-700 whitespace-nowrap">
                                            <span className="text-slate-300 text-xs">วันที่</span>
                                        </th>
                                        {data.dvrs.map(dvr => (
                                            <th key={dvr.id} className="px-1 py-2.5 text-center font-medium border-l border-slate-700/50">
                                                <div className="text-[11px] font-semibold text-white leading-tight truncate px-1">{dvr.name}</div>
                                                <div className="text-[9px] text-indigo-300 mt-0.5">{dvr.camera_count} cam</div>
                                            </th>
                                        ))}
                                    </tr>
                                    {/* Summary Row */}
                                    <tr className="bg-slate-50 border-b-2 border-slate-200">
                                        <td className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-500 border-r border-slate-200 whitespace-nowrap uppercase tracking-wide">
                                            สรุปรวม
                                        </td>
                                        {dvrSummary.map(({ dvr, inspected, broken, noSignal, total }) => (
                                            <td key={dvr.id} className="px-1 py-2 text-center border-l border-slate-200">
                                                <div className={`text-xs font-bold ${inspected === total ? 'text-emerald-600' : inspected > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                    {inspected}<span className="font-normal text-slate-400">/{total}</span>
                                                </div>
                                                <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
                                                    {broken > 0 && <span className="text-[8px] text-red-500 font-bold">B:{broken}</span>}
                                                    {noSignal > 0 && <span className="text-[8px] text-amber-500 font-bold">N:{noSignal}</span>}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.rows.map((row, rowIdx) => {
                                        const { day, dayOfWeek, monthShort, isSunday } = formatThaiDate(row.date);
                                        const rowInspected = row.cells.filter(c => c.is_inspected).length;
                                        const rowTotal = row.cells.length;
                                        const rowHasAnomaly = row.cells.some(c => c.is_inspected && (c.broken_count > 0 || c.no_signal_count > 0));
                                        return (
                                            <tr
                                                key={row.date}
                                                className={`border-b border-slate-100 transition-colors
                                                    ${isSunday ? 'bg-red-50/60' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                                                    hover:bg-indigo-50/40`}
                                            >
                                                {/* Date Cell */}
                                                <td className={`sticky left-0 z-10 px-2 py-0.5 border-r border-slate-200 whitespace-nowrap
                                                    ${isSunday ? 'bg-red-50' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`flex flex-col items-center justify-center w-8 h-8 rounded-lg text-center flex-shrink-0
                                                            ${isSunday
                                                                ? 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm shadow-red-200'
                                                                : 'bg-slate-100 text-slate-600'}`}>
                                                            <span className="text-[8px] leading-none opacity-70">{dayOfWeek}</span>
                                                            <span className="text-sm font-bold leading-tight">{day}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[9px] text-slate-400 leading-none">{monthShort}</div>
                                                            <div className={`text-[10px] font-semibold leading-tight mt-0.5
                                                                ${rowHasAnomaly ? 'text-amber-600' : rowInspected === rowTotal ? 'text-emerald-600' : rowInspected > 0 ? 'text-blue-500' : 'text-slate-300'}`}>
                                                                {rowInspected}/{rowTotal}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* DVR Cells */}
                                                {row.cells.map((cell, cellIdx) => (
                                                    <td key={cell.dvr_id} className="border-l border-slate-100 p-0 align-middle">
                                                        <StatusCell cell={cell} dvrName={data.dvrs[cellIdx]?.name ?? ''} date={row.date} />
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {data && !loading && data.dates.length === 0 && (
                    <div className="flex flex-1 items-center justify-center text-slate-400 text-sm">ไม่มีข้อมูลสำหรับเดือนนี้</div>
                )}
            </div>
        </AppLayout>
    );
}
