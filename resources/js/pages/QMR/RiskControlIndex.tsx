import { QmrPagination } from '@/components/qmr-pagination';
import AppLayout from '@/layouts/app-layout';
import { useCanAny } from '@/lib/permissions';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, ClipboardCheck, Clock, Download, FileText, Filter, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

interface Control {
    id: number;
    code: string;
    name: string;
    status: string;
    progress_percent: number;
    responsible_name: string;
    due_date?: string;
    start_date?: string;
    risk_register: {
        id: number;
        code: string;
        document_title: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ฝ่ายแผนพัฒนาคุณภาพ', href: '/qmr/risk-management' },
    { title: 'มาตรการและการติดตามผล', href: '/qmr/risk-management/controls' },
];

function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <section className={`rounded-xl border border-slate-200/60 bg-white/70 shadow-xl shadow-slate-200/40 backdrop-blur-md ${className}`}>
            {children}
        </section>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'active':
        case 'in_progress':
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/50 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                    {status === 'active' ? 'กำลังดำเนินการ' : 'In Progress'}
                </span>
            );
        case 'complete':
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/50 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    เสร็จสมบูรณ์
                </span>
            );
        case 'cancel':
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600">
                    <AlertCircle className="h-3 w-3" />
                    ยกเลิก
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/50 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700">
                    {status}
                </span>
            );
    }
}

function ProgressBar({ percent }: { percent: number }) {
    return (
        <div className="flex w-full items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full border border-slate-100 bg-slate-200 shadow-inner">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                />
            </div>
            <span className="min-w-[36px] text-[12px] font-black text-slate-700">{percent}%</span>
        </div>
    );
}

function formatThaiDate(dateString?: string) {
    if (!dateString) return '-';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear() + 543; // Thai Buddhist year

    return `${day}/${month}/${year}`;
}

export default function RiskControlsList({
    controls,
    filters = { search: '' },
}: {
    controls: { data: Control[]; links?: { url: string | null; label: string; active: boolean }[]; total?: number };
    filters?: { search?: string };
}) {
    const canEdit = useCanAny(['qmr.edit', 'admin.edit', 'developer.view']);
    const canDelete = useCanAny(['qmr.delete', 'admin.delete', 'developer.view']);
    const [search, setSearch] = useState(filters.search ?? '');

    const handleDelete = (id: number) => {
        if (confirm('คุณต้องการลบมาตรการนี้ใช่หรือไม่?')) {
            router.delete(route('qmr.risk-management.controls.destroy', id));
        }
    };

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get(route('qmr.risk-management.controls'), { search }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="มาตรการและการติดตามผล - RiskGuard" />

            <div className="relative min-h-screen bg-slate-50/50 p-4 font-anuphan sm:p-6 lg:p-8">
                {/* Background Glow */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl" />
                    <div className="absolute top-40 -right-20 h-96 w-96 rounded-full bg-cyan-100/50 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-[1440px]">
                    {/* Header Section */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-lg shadow-emerald-200">
                                    <ClipboardCheck className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-slate-900">มาตรการและการติดตามผล</h1>
                                    <p className="text-sm font-medium text-slate-500">Control Measures Tracking & Monitoring</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                disabled
                                title="ยังไม่ได้เปิดใช้งานการส่งออก"
                                className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-400 opacity-70 shadow-sm"
                            >
                                <Download className="h-4 w-4" />
                                ส่งออก Excel
                            </button>
                            {canEdit && (
                                <Link
                                    href={route('qmr.risk-management.controls.create')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0"
                                >
                                    <Plus className="h-5 w-5" />
                                    เพิ่มมาตรการใหม่
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Main Table Panel */}
                    <GlassPanel className="overflow-hidden border-white/40 bg-white/80">
                        {/* Table Controls */}
                        <div className="border-b border-slate-200/60 bg-white/40 p-4 sm:p-5">
                            <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="ค้นหาด้วยรหัส ชื่อมาตรการ หรือผู้รับผิดชอบ..."
                                        className="w-full rounded-xl border border-slate-200/60 bg-white/50 py-2.5 pr-4 pl-11 text-sm font-bold text-slate-700 transition-all outline-none focus:border-emerald-400/50 focus:bg-white focus:ring-4 focus:ring-emerald-100/50"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white/50 px-4 py-2.5 text-sm font-black text-slate-600 transition-all hover:bg-white"
                                    >
                                        <Filter className="h-4 w-4" />
                                        ค้นหา
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-y border-slate-200/60 bg-slate-50/80 text-[12px] font-black tracking-widest text-slate-700 uppercase">
                                        <th className="px-6 py-4">มาตรการควบคุม</th>
                                        <th className="px-6 py-4">สถานะ</th>
                                        <th className="px-6 py-4">ความคืบหน้า</th>
                                        <th className="px-6 py-4">ผู้รับผิดชอบ</th>
                                        <th className="px-6 py-4">กำหนดเสร็จ</th>
                                        <th className="px-6 py-4 text-right">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {controls.data.length > 0 ? (
                                        controls.data.map((control) => (
                                            <tr key={control.id} className="group transition-all hover:bg-emerald-50/30">
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-black text-emerald-700">{control.name}</span>
                                                        <span className="text-xs font-semibold text-slate-500 transition-colors group-hover:text-slate-600">
                                                            {control.code}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <StatusBadge status={control.status} />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex min-w-[200px] items-center gap-3">
                                                        <ProgressBar percent={control.progress_percent} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-slate-600">{control.responsible_name}</span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                        {control.due_date ? (
                                                            <>
                                                                <Clock className="h-4 w-4 text-slate-400" />
                                                                {formatThaiDate(control.due_date)}
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {canEdit && (
                                                            <Link
                                                                href={route('qmr.risk-management.controls.edit', control.id)}
                                                                className="rounded-lg p-2 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600"
                                                                title="แก้ไข"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                        )}
                                                        {canDelete && (
                                                            <button
                                                                onClick={() => handleDelete(control.id)}
                                                                className="rounded-lg p-2 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                                                                title="ลบ"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center">
                                                <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-slate-400">
                                                    <div className="mb-4 rounded-full bg-slate-50 p-6">
                                                        <FileText className="h-12 w-12 opacity-20" />
                                                    </div>
                                                    <p className="text-base font-black text-slate-600">ไม่พบข้อมูลมาตรการและการติดตามผล</p>
                                                    <p className="mt-1 text-sm font-medium">เริ่มสร้างรายการแรกโดยการคลิกปุ่ม "เพิ่มมาตรการใหม่"</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Table Footer */}
                        <div className="border-t border-slate-200/60 bg-slate-50/30 p-4 text-center">
                            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                                Total {controls.total ?? controls.data.length} Records Found
                            </p>
                            <div className="mt-3">
                                <QmrPagination links={controls.links} />
                            </div>
                        </div>
                    </GlassPanel>
                </div>
            </div>
        </AppLayout>
    );
}
