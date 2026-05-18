import { QmrPagination } from '@/components/qmr-pagination';
import AppLayout from '@/layouts/app-layout';
import { useCanAny } from '@/lib/permissions';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, BarChart3, CheckCircle2, Clock, Filter, Pencil, Plus, Search, Target, Trash2 } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

interface RiskRegister {
    id: number;
    code: string;
    document_title: string;
}

interface Kpi {
    id: number;
    risk_register_id: number;
    code: string;
    name: string;
    threshold: string;
    unit: string;
    direction: string;
    target_value: number;
    status: 'met' | 'missed' | 'in_progress';
    risk_register?: RiskRegister;
}

interface KpisResponse {
    data: Kpi[];
    links?: { url: string | null; label: string; active: boolean }[];
    total?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ฝ่ายแผนพัฒนาคุณภาพ', href: '/qmr/risk-management' },
    { title: 'KPI ความเสี่ยง', href: '/qmr/risk-management/kpi' },
];

function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <section className={`rounded-xl border border-slate-200/60 bg-white/70 shadow-xl shadow-slate-200/40 backdrop-blur-md ${className}`}>
            {children}
        </section>
    );
}

export default function RiskKpiList({ kpis, filters = { search: '' } }: { kpis: KpisResponse; filters?: { search?: string } }) {
    const canEdit = useCanAny(['qmr.edit', 'admin.edit', 'developer.view']);
    const canDelete = useCanAny(['qmr.delete', 'admin.delete', 'developer.view']);
    const [search, setSearch] = useState(filters.search ?? '');

    const handleDelete = (id: number) => {
        if (confirm('คุณต้องการลบ KPI นี้ใช่หรือไม่?')) {
            router.delete(route('qmr.risk-management.kpi.destroy', id));
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'met':
                return {
                    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
                    icon: <CheckCircle2 className="h-3 w-3" />,
                    label: 'Met - เข้าเป้า',
                };
            case 'missed':
                return {
                    bg: 'bg-rose-50 text-rose-700 border-rose-200/50',
                    icon: <AlertCircle className="h-3 w-3" />,
                    label: 'Missed - ไม่เข้าเป้า',
                };
            default:
                return {
                    bg: 'bg-amber-50 text-amber-700 border-amber-200/50',
                    icon: <Clock className="h-3 w-3" />,
                    label: 'In Progress',
                };
        }
    };

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get(route('qmr.risk-management.kpi'), { search }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="KPI ความเสี่ยงและโอกาส - RiskGuard" />

            <div className="relative min-h-screen bg-slate-50/50 p-4 font-anuphan sm:p-6 lg:p-8">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />
                    <div className="absolute bottom-40 -left-20 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-[1440px]">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-lg shadow-emerald-200">
                                    <Target className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-slate-900">KPI ความเสี่ยงและโอกาส</h1>
                                    <p className="text-sm font-medium text-slate-500">ติดตามผลการดำเนินงานตามตัวชี้วัดคุณภาพ</p>
                                </div>
                            </div>
                        </div>

                        {canEdit && (
                            <Link
                                href={route('qmr.risk-management.kpi.create')}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0"
                            >
                                <Plus className="h-5 w-5" />
                                เพิ่ม KPI ใหม่
                            </Link>
                        )}
                    </div>

                    <GlassPanel className="overflow-hidden border-white/40 bg-white/80">
                        <div className="border-b border-slate-200/60 bg-white/40 p-4 sm:p-5">
                            <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="ค้นหาชื่อ KPI หรือรหัสความเสี่ยง..."
                                        className="w-full rounded-xl border border-slate-200/60 bg-white/50 py-2.5 pr-4 pl-11 text-sm font-bold text-slate-700 transition-all outline-none focus:border-emerald-400/50 focus:bg-white focus:ring-4 focus:ring-emerald-100/50"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white/50 px-4 py-2.5 text-sm font-black text-slate-600 transition-all hover:bg-white"
                                >
                                    <Filter className="h-4 w-4" />
                                    ค้นหา
                                </button>
                            </form>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-y border-slate-200/60 bg-slate-50/80 text-[12px] font-black tracking-widest text-slate-700 uppercase">
                                        <th className="px-6 py-4">รหัสความเสี่ยง</th>
                                        <th className="px-6 py-4">ตัวชี้วัด & ประเด็นความเสี่ยง</th>
                                        <th className="px-6 py-4 text-center">เป้าหมาย / เกณฑ์</th>
                                        <th className="px-6 py-4">สถานะผลลัพธ์</th>
                                        <th className="px-6 py-4 text-right">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {kpis.data.length > 0 ? (
                                        kpis.data.map((item) => {
                                            const status = getStatusStyles(item.status);
                                            return (
                                                <tr key={item.id} className="group transition-all hover:bg-emerald-50/30">
                                                    <td className="px-6 py-5">
                                                        <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-black tracking-tight text-blue-700">
                                                            {item.risk_register?.code}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <p className="text-[14px] font-black text-slate-800 transition-colors group-hover:text-emerald-700">
                                                            {item.name}
                                                        </p>
                                                        <p className="line-clamp-1 max-w-[300px] text-[11px] text-blue-700">
                                                            {item.risk_register?.document_title}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="text-sm font-black text-slate-900">
                                                                {item.target_value ? Number(item.target_value).toFixed(2) : '0.00'} {item.unit}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400">เกณฑ์: {item.threshold}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black ${status.bg}`}
                                                        >
                                                            {status.icon}
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {canEdit && (
                                                                <Link
                                                                    href={route('qmr.risk-management.kpi.edit', item.id)}
                                                                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Link>
                                                            )}
                                                            {canDelete && (
                                                                <button
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-slate-400">
                                                    <div className="mb-4 rounded-full bg-slate-50 p-6">
                                                        <BarChart3 className="h-12 w-12 opacity-20" />
                                                    </div>
                                                    <p className="text-base font-black text-slate-600">ไม่พบข้อมูลตัวชี้วัด (KPI)</p>
                                                    <p className="mt-1 text-sm font-medium">เริ่มกำหนดตัวชี้วัดเพื่อติดตามความเสี่ยง</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-slate-200/60 bg-slate-50/30 p-4 text-center">
                            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                                Total {kpis.total ?? kpis.data.length} KPI Records
                            </p>
                            <div className="mt-3">
                                <QmrPagination links={kpis.links} />
                            </div>
                        </div>
                    </GlassPanel>
                </div>
            </div>
        </AppLayout>
    );
}
