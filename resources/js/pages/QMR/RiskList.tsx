import { QmrPagination } from '@/components/qmr-pagination';
import AppLayout from '@/layouts/app-layout';
import { useCanAny } from '@/lib/permissions';
import { getRiskLevelByScore, RISK_LEVEL_DEFINITIONS, type RiskLevelName } from '@/lib/risk-analysis';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Download, FileText, Filter, Pencil, Plus, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

interface Risk {
    id: number;
    code: string;
    document_title: string;
    risk_category: string;
    owner_name: string;
    risk_score: number;
    risk_level: string;
    status: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ฝ่ายแผนพัฒนาคุณภาพ', href: '/qmr/risk-management' },
    { title: 'ทะเบียนความเสี่ยงและโอกาส', href: '/qmr/risk-management/risks' },
];

const levelColors = Object.fromEntries(RISK_LEVEL_DEFINITIONS.map((level) => [level.name, level.color])) as Record<RiskLevelName, string>;

function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <section className={`rounded-xl border border-slate-200/60 bg-white/70 shadow-xl shadow-slate-200/40 backdrop-blur-md ${className}`}>
            {children}
        </section>
    );
}

export default function RiskList({
    risks,
    filters = { search: '' },
}: {
    risks: { data: Risk[]; links?: { url: string | null; label: string; active: boolean }[]; total?: number };
    filters?: { search?: string };
}) {
    const canEdit = useCanAny(['qmr.edit', 'admin.edit', 'developer.view']);
    const canDelete = useCanAny(['qmr.delete', 'admin.delete', 'developer.view']);
    const [search, setSearch] = useState(filters.search ?? '');

    const handleDelete = (id: number) => {
        if (confirm('คุณต้องการลบความเสี่ยงนี้ใช่หรือไม่? การลบจะรวมถึงข้อมูล KPI และมาตรการที่เกี่ยวข้อง')) {
            router.delete(route('qmr.risk-management.destroy', id));
        }
    };

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'Operation':
                return 'bg-blue-50 text-blue-700 border-blue-200/50';
            case 'Strategic':
                return 'bg-purple-50 text-purple-700 border-purple-200/50';
            case 'Finance':
                return 'bg-cyan-50 text-cyan-700 border-cyan-200/50';
            case 'Compliance':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200/50';
        }
    };

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get(route('qmr.risk-management.risks'), { search }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ทะเบียนความเสี่ยงและโอกาสด้านคุณภาพ - RiskGuard" />

            <div className="relative min-h-screen bg-slate-50/50 p-4 font-anuphan sm:p-6 lg:p-8">
                {/* แสงฟุ้งพื้นหลัง */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
                    <div className="absolute top-40 -right-20 h-96 w-96 rounded-full bg-cyan-100/50 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-[1440px]">
                    {/* ส่วนหัวหน้าจอ */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-200">
                                    <ShieldAlert className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-slate-900">ทะเบียนความเสี่ยงและโอกาส</h1>
                                    <p className="text-sm font-medium text-slate-500">Risk & Opportunity Registry (FM-QMR-61-0023)</p>
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
                                    href={route('qmr.risk-management.create')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
                                >
                                    <Plus className="h-5 w-5" />
                                    เพิ่มความเสี่ยงใหม่
                                </Link>
                            )}
                        </div>
                    </div>

                    <GlassPanel className="overflow-hidden border-white/40 bg-white/80">
                        {/* เครื่องมือจัดการตาราง */}
                        <div className="border-b border-slate-200/60 bg-white/40 p-4 sm:p-5">
                            <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="ค้นหาด้วยรหัส, ชื่อประเด็น หรือผู้รับผิดชอบ..."
                                        className="w-full rounded-xl border border-slate-200/60 bg-white/50 py-2.5 pr-4 pl-11 text-sm font-bold text-slate-700 transition-all outline-none focus:border-blue-400/50 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
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

                        {/* ตัวตาราง */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-y border-slate-200/60 bg-slate-50/80 text-[12px] font-black tracking-widest text-slate-700 uppercase">
                                        <th className="px-6 py-4">รหัส / ประเภท</th>
                                        <th className="px-6 py-4">ประเด็นความเสี่ยงและโอกาส</th>
                                        <th className="px-6 py-4 text-center">ระดับ (คะแนน)</th>
                                        <th className="px-6 py-4">ผู้รับผิดชอบหลัก</th>
                                        <th className="px-6 py-4">สถานะการดำเนินงาน</th>
                                        <th className="px-6 py-4 text-right">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {risks.data.length > 0 ? (
                                        risks.data.map((risk) => {
                                            const level = getRiskLevelByScore(risk.risk_score);
                                            return (
                                                <tr key={risk.id} className="group transition-all hover:bg-blue-50/30">
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-sm font-black text-blue-700">{risk.code}</span>
                                                            <span
                                                                className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold ${getCategoryStyles(risk.risk_category)}`}
                                                            >
                                                                {risk.risk_category}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="max-w-[450px]">
                                                            <p className="line-clamp-2 text-[14px] leading-relaxed font-bold text-slate-800 transition-colors group-hover:text-blue-700">
                                                                {risk.document_title}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div
                                                                className={`flex min-w-[56px] items-center justify-center rounded-lg bg-gradient-to-br px-2 py-1.5 text-xs font-black text-white shadow-sm ${level.gradientClass}`}
                                                            >
                                                                {level.code} ({risk.risk_score})
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap">
                                                        <span className="text-sm font-bold text-slate-600">{risk.owner_name}</span>
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${
                                                                risk.status === 'active'
                                                                    ? 'border border-emerald-200/50 bg-emerald-50 text-emerald-700'
                                                                    : 'border border-slate-200 bg-slate-100 text-slate-600'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${risk.status === 'active' ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'}`}
                                                            />
                                                            {risk.status === 'active' ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {canEdit && (
                                                                <Link
                                                                    href={route('qmr.risk-management.edit', risk.id)}
                                                                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                                                                    title="แก้ไข"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Link>
                                                            )}
                                                            {canDelete && (
                                                                <button
                                                                    onClick={() => handleDelete(risk.id)}
                                                                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                                                                    title="ลบ"
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
                                            <td colSpan={6} className="px-6 py-20 text-center">
                                                <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-slate-400">
                                                    <div className="mb-4 rounded-full bg-slate-50 p-6">
                                                        <FileText className="h-12 w-12 opacity-20" />
                                                    </div>
                                                    <p className="text-base font-black text-slate-600">ไม่พบข้อมูลทะเบียนความเสี่ยง</p>
                                                    <p className="mt-1 text-sm font-medium">
                                                        เริ่มสร้างรายการแรกโดยการคลิกปุ่ม "เพิ่มความเสี่ยงใหม่"
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination หรือ Footer ของตาราง */}
                        <div className="border-t border-slate-200/60 bg-slate-50/30 p-4 text-center">
                            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                                Total {risks.total ?? risks.data.length} Records Found
                            </p>
                            <div className="mt-3">
                                <QmrPagination links={risks.links} />
                            </div>
                        </div>
                    </GlassPanel>
                </div>
            </div>
        </AppLayout>
    );
}
