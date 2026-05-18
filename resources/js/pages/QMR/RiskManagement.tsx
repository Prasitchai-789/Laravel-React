import AppLayout from '@/layouts/app-layout';
import { getRiskLevelByScore, RISK_LEVEL_DEFINITIONS, type RiskLevelName } from '@/lib/risk-analysis';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Download, ShieldAlert, ShieldCheck, TrendingUp } from 'lucide-react';
import React, { type ReactNode } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type RiskCategory = 'Operation' | 'Strategic' | 'Finance' | 'Compliance';

type Risk = {
    id: string;
    db_id: number;
    title: string;
    detail: string;
    category: RiskCategory;
    owner: string;
    level: RiskLevelName;
    likelihood: number;
    impact: number;
    residualLikelihood: number;
    residualImpact: number;
    score: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ฝ่ายแผนพัฒนาคุณภาพ', href: '/qmr/risk-management' },
    { title: 'ความเสี่ยงและโอกาสด้านคุณภาพ', href: '/qmr/risk-management' },
];

const levelColors = Object.fromEntries(RISK_LEVEL_DEFINITIONS.map((level) => [level.name, level.color])) as Record<RiskLevelName, string>;

function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <section className={`rounded-xl border border-slate-200/60 bg-white/70 shadow-xl shadow-slate-200/40 backdrop-blur-md ${className}`}>
            {children}
        </section>
    );
}

function RiskMap({ risks = [], levelChart = [], className = '' }: { risks?: any[]; levelChart?: any[]; className?: string }) {
    const [viewMode, setViewMode] = React.useState<'before' | 'after'>('before');

    return (
        <GlassPanel className={`p-4 ${className}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-slate-900">Risk Map</h2>
                        <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-black text-cyan-700">5 x 5</span>
                    </div>
                    <p className="text-xs text-slate-700">{viewMode === 'before' ? 'ก่อนจัดการ (Inherent Risk)' : 'หลังจัดการ (Residual Risk)'}</p>
                </div>
                <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1 text-xs font-bold">
                    <button
                        onClick={() => setViewMode('before')}
                        className={`rounded px-3 py-1 transition-all ${viewMode === 'before' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        ก่อนจัดการ
                    </button>
                    <button
                        onClick={() => setViewMode('after')}
                        className={`rounded px-3 py-1 transition-all ${viewMode === 'after' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        หลังจัดการ
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-[24px_repeat(5,minmax(0,1fr))] gap-1">
                <div />
                {[1, 2, 3, 4, 5].map((impact) => (
                    <div key={`impact-head-placeholder-${impact}`} className="h-0" />
                ))}

                {[5, 4, 3, 2, 1].map((likelihood) => (
                    <div className="contents" key={`risk-row-${likelihood}`}>
                        <div className="flex items-center justify-center text-[11px] font-black text-slate-500">{likelihood}</div>
                        {[1, 2, 3, 4, 5].map((impact) => {
                            const cellRisks = risks.filter((risk) => {
                                const l = viewMode === 'before' ? risk.likelihood : risk.residualLikelihood;
                                const i = viewMode === 'before' ? risk.impact : risk.residualImpact;
                                return l === likelihood && i === impact;
                            });
                            const level = getRiskLevelByScore(likelihood * impact);

                            return (
                                <div
                                    key={`${likelihood}-${impact}`}
                                    className={`relative flex min-h-[50px] items-center justify-center rounded-md bg-gradient-to-br text-xs font-black text-white shadow-sm transition-all duration-500 ${level.gradientClass}`}
                                >
                                    {level.code}
                                    <span className="absolute right-1 bottom-1 text-[10px] text-white/80">
                                        {impact}×{likelihood}
                                    </span>
                                    {cellRisks.length > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-black text-slate-900 shadow-md ring-2 ring-white animate-in zoom-in-50">
                                            {cellRisks.length}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                <div className="flex items-center justify-center">
                    <span className="text-[9px] font-black text-slate-700">L/I</span>
                </div>
                {[1, 2, 3, 4, 5].map((impact) => (
                    <div key={`impact-head-${impact}`} className="py-1 text-center text-[11px] font-black text-slate-500">
                        {impact}
                    </div>
                ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
                <span>L = Likelihood (โอกาส) | I = Impact (ผลกระทบ)</span>
                <div className="flex flex-wrap gap-2">
                    {levelChart.map((item) => (
                        <span key={item.name} className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: levelColors[item.name as RiskLevelName] }} />
                            {item.name} ({item.code}) {item.range}
                        </span>
                    ))}
                </div>
            </div>
        </GlassPanel>
    );
}

function DonutPanel({
    title,
    subtitle,
    center,
    centerLabel,
    data,
    className = '',
}: {
    title: string;
    subtitle: string;
    center: string;
    centerLabel: string;
    data: { name: string; value: number; color?: string }[];
    className?: string;
}) {
    return (
        <GlassPanel className={`p-4 ${className}`}>
            <h2 className="text-base font-black text-slate-900">{title}</h2>
            <p className="text-xs text-slate-700">{subtitle}</p>
            <div className="relative mt-2 h-48 w-full min-w-0" style={{ minHeight: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={76} paddingAngle={1}>
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={entry.color ?? levelColors[entry.name as RiskLevelName]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' }}
                            itemStyle={{ color: '#0f172a' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-900">{center}</span>
                    <span className="text-[10px] font-bold tracking-widest text-slate-700 uppercase">{centerLabel}</span>
                </div>
            </div>
            <div className="space-y-1.5 text-xs">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 text-slate-700">
                            <span
                                className="h-2.5 w-2.5 rounded-sm"
                                style={{ backgroundColor: item.color ?? levelColors[item.name as RiskLevelName] }}
                            />
                            {item.name}
                        </span>
                        <span className="font-black text-slate-900">{item.value}</span>
                    </div>
                ))}
            </div>
        </GlassPanel>
    );
}

export default function RiskManagement({
    risks: initialRisks = [],
    levelChart: initialLevelChart = [],
    categoryChart: initialCategoryChart = [],
    kpiStatus: initialKpiStatus = [],
    controlSegments: initialControlSegments = [],
    trendData: initialTrendData = [],
    trendRange,
    riskChange,
    completionChange,
    watchCount,
    keyRisks: initialKeyRisks = [],
    issueStatus = [],
}: {
    risks?: Risk[];
    levelChart?: any[];
    categoryChart?: any[];
    kpiStatus?: any[];
    controlSegments?: any[];
    issueStatus?: any[];
    trendData?: any[];
    trendRange: string;
    riskChange: number;
    completionChange: number;
    watchCount: number;
    keyRisks?: Risk[];
}) {
    const risks = initialRisks.length > 0 ? initialRisks : [];

    const levelChart = RISK_LEVEL_DEFINITIONS.map((def) => {
        const liveData = initialLevelChart.find((d) => d.name === def.name);
        return {
            ...def,
            value: liveData ? liveData.value : risks.filter((risk) => risk.level === def.name).length,
        };
    });

    const categoryChart = initialCategoryChart;
    const kpiStatus = initialKpiStatus;
    const controlSegments = initialControlSegments;
    const trendData = initialTrendData;
    const keyRisks = initialKeyRisks;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ความเสี่ยงและโอกาสด้านคุณภาพ - ฝ่ายแผนพัฒนาคุณภาพ" />
            <div className="relative min-h-screen bg-slate-50/50 p-4 font-anuphan sm:p-6 lg:p-8">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
                    <div className="absolute top-40 -right-20 h-96 w-96 rounded-full bg-cyan-100/50 blur-3xl" />
                    <div className="absolute bottom-0 left-20 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-2xl shadow-blue-900/5">
                    <div className="min-h-[880px]">
                        <main className="p-4 sm:p-6">
                            <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">RiskGuard · การประเมินความเสี่ยงและโอกาสด้านคุณภาพ</h2>
                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        อ้างอิงแบบฟอร์ม FM-QMR-61-0023 · ฝ่ายแผนพัฒนาคุณภาพ · ข้อมูลแบบ Real-time
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm"
                                    >
                                        ช่วงรายงาน: ปัจจุบัน - 9 พ.ค. 2569
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-200"
                                    >
                                        <Download className="h-4 w-4" />
                                        ส่งออกรายงาน
                                    </button>
                                </div>
                            </section>

                            <section className="mt-5 grid gap-5 xl:grid-cols-3">
                                {/* การ์ด 1: ความเสี่ยงและโอกาส */}
                                <GlassPanel className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 p-5 shadow-lg backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                                    {/* แถบสีด้านบน */}
                                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-cyan-400" />

                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-3 text-blue-600 shadow-md shadow-blue-100/50 transition-transform duration-300 group-hover:scale-110">
                                            <ShieldAlert className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">จำนวนความเสี่ยงและโอกาสทั้งหมด</p>
                                            <span
                                                className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                                                    riskChange > 0
                                                        ? 'border-red-200/50 bg-red-50 text-red-700'
                                                        : riskChange < 0
                                                          ? 'border-emerald-200/50 bg-emerald-50 text-emerald-700'
                                                          : 'border-slate-200/50 bg-slate-50 text-slate-600'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-1.5 w-1.5 animate-pulse rounded-full ${
                                                        riskChange > 0 ? 'bg-red-500' : riskChange < 0 ? 'bg-emerald-500' : 'bg-slate-400'
                                                    }`}
                                                />
                                                {riskChange > 0 ? '+' : ''}
                                                {riskChange} จากเดือนที่แล้ว
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-end gap-2">
                                        <span className="text-5xl font-extrabold tracking-tighter text-slate-800">{risks.length}</span>
                                        <span className="pb-2 text-sm text-slate-700">รายการ</span>
                                    </div>

                                    {/* หลอดบ่งชี้ระดับ */}
                                    <div className="mt-2 space-y-3">
                                        <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                                            {levelChart.map((level) => (
                                                <span
                                                    key={level.name}
                                                    className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                                    style={{
                                                        width: `${(level.value / (risks.length || 1)) * 100}%`,
                                                        backgroundColor: levelColors[level.name as RiskLevelName],
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            {levelChart.map((level) => (
                                                <div key={level.name} className="space-y-0.5">
                                                    <p className="text-sm font-bold text-slate-700">{level.value}</p>
                                                    <p className="text-[11px] font-semibold text-slate-600">{level.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </GlassPanel>

                                {/* การ์ด 2: สถานะมาตรการ */}
                                <GlassPanel className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 p-5 shadow-lg backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-green-400" />

                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 text-emerald-600 shadow-md shadow-emerald-100/50 transition-transform duration-300 group-hover:scale-110">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">สถานะมาตรการโดยรวมรายประเด็น</p>
                                            <span
                                                className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                                                    completionChange >= 0
                                                        ? 'border-emerald-200/50 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-200/50 bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                                                        completionChange >= 0 ? 'animate-pulse bg-emerald-500' : 'bg-amber-500'
                                                    }`}
                                                />
                                                {completionChange > 0 ? '+' : ''}
                                                {completionChange}% เสร็จสมบูรณ์เพิ่มขึ้น
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-end gap-1.5">
                                        <span className="text-5xl font-extrabold tracking-tighter text-slate-800">
                                            {controlSegments.find((s) => s.status === 'complete')?.value.replace('%', '') || '0'}
                                        </span>
                                        <span className="pb-1.5 text-2xl font-bold text-slate-600">%</span>
                                        <span className="pb-1.5 text-sm text-slate-700">ดำเนินการเสร็จสิ้น</span>
                                    </div>

                                    <div className="mt-2 space-y-3">
                                        <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                                            {controlSegments.map((item) => (
                                                <span
                                                    key={item.label}
                                                    className={`${item.color} h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                                                    style={{ width: item.width }}
                                                />
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-4 gap-1 text-center">
                                            {controlSegments.map((item) => (
                                                <div key={item.label} className="space-y-0.5">
                                                    <p className="text-sm font-bold text-slate-700">{item.value}</p>
                                                    <p className="text-[11px] font-semibold whitespace-nowrap text-slate-600">{item.label}</p>
                                                    {/* <p className="text-[10px] font-black text-slate-300">({item.count})</p> */}
                                                </div>
                                            ))}
                                        </div>

                                        {/* แยกตามประเด็น */}
                                        {/* <div className="mt-4 pt-3 border-t border-slate-100/60">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 flex items-center justify-between">
                                                ความคืบหน้าแยกตามประเด็น
                                                <span className="text-[9px] font-bold lowercase text-slate-300">Issue Breakdown</span>
                                            </p>
                                            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                                {issueStatus.length > 0 ? (
                                                    issueStatus.map((issue: any) => (
                                                        <div key={issue.label} className="group/item">
                                                            <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                                                                <span className="text-slate-600 transition-colors group-hover/item:text-blue-700 truncate mr-2" title={issue.label}>
                                                                    {issue.label}
                                                                </span>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                   <span className="text-slate-400 font-medium">({issue.complete}/{issue.total})</span>
                                                                   <span className="text-emerald-600">{issue.percent}%</span>
                                                                </div>
                                                            </div>
                                                            <div className="h-1.5 w-full rounded-full bg-slate-100/80 overflow-hidden p-[1px]">
                                                                <div 
                                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                                                                    style={{ width: `${issue.percent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[10px] text-center text-slate-400 py-2">ไม่พบข้อมูลประเด็น</p>
                                                )}
                                            </div>
                                        </div> */}
                                    </div>
                                </GlassPanel>

                                {/* การ์ด 3: สถานะ KPI */}
                                <GlassPanel className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 p-5 shadow-lg backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-orange-400 to-amber-400" />

                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-3 text-orange-600 shadow-md shadow-orange-100/50 transition-transform duration-300 group-hover:scale-110">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">สถานะ KPI โดยรวมรายประเด็นคุณภาพ</p>
                                            <span
                                                className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                                                    watchCount > 0
                                                        ? 'border-orange-200/50 bg-orange-50 text-orange-700'
                                                        : 'border-emerald-200/50 bg-emerald-50 text-emerald-700'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                                                        watchCount > 0 ? 'animate-pulse bg-orange-500' : 'bg-emerald-500'
                                                    }`}
                                                />
                                                {watchCount} ความเสี่ยงต้องเฝ้าระวัง
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-end gap-2">
                                        <span className="text-5xl font-extrabold tracking-tighter text-slate-800">
                                            {kpiStatus.reduce((acc, curr) => acc + (curr.value || 0), 0)}
                                        </span>
                                        <span className="pb-2 text-sm font-semibold text-slate-700">ตัวชี้วัด</span>
                                    </div>

                                    <div className="mt-2 -mr-2 -mb-2 -ml-2 grid grid-cols-3 gap-2">
                                        {kpiStatus.map((item) => (
                                            <div
                                                key={item.label}
                                                className="group/card rounded-xl border border-slate-100 bg-white/60 p-3 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                                            >
                                                <p className={`text-2xl font-extrabold tracking-tight ${item.color.replace('300', '600')}`}>
                                                    {item.value}
                                                </p>
                                                <p className="mt-1 text-[11px] font-semibold text-slate-600">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </GlassPanel>
                            </section>

                            <section className="mt-5 grid gap-4 lg:grid-cols-12">
                                <RiskMap risks={risks} levelChart={levelChart} className="lg:col-span-6" />
                                <DonutPanel
                                    title="ระดับความเสี่ยง"
                                    subtitle="จำแนกความรุนแรง"
                                    center={risks.length.toString()}
                                    centerLabel="ความเสี่ยง"
                                    data={levelChart}
                                    className="lg:col-span-3"
                                />
                                <DonutPanel
                                    title="ประเภทความเสี่ยง"
                                    subtitle="จำแนกหมวดหมู่"
                                    center={risks.length.toString()}
                                    centerLabel="หมวดหมู่"
                                    data={categoryChart}
                                    className="lg:col-span-3"
                                />
                            </section>

                            <section className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
                                <GlassPanel className="relative overflow-hidden pt-5">
                                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                                    <div className="mb-1 flex items-start justify-between gap-3 px-5">
                                        <div>
                                            <h2 className="text-base font-black text-slate-900">แนวโน้มความเสี่ยง 6 เดือน</h2>
                                            <p className="text-xs font-semibold text-blue-700">{trendRange} · เปรียบเทียบก่อน/หลัง จัดการ</p>
                                        </div>
                                        <div className="flex gap-4 text-[11px] font-bold tracking-wider uppercase">
                                            <span className="inline-flex items-center gap-1.5 text-red-500">
                                                <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                                ก่อนจัดการ
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-emerald-600">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                                หลังจัดการ
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 h-[360px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={trendData} margin={{ left: -1, right: -1, top: 10, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="beforeRisk" x1="0" x2="0" y1="0" y2="1">
                                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
                                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="afterRisk" x1="0" x2="0" y1="0" y2="1">
                                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
                                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis
                                                    dataKey="month"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                                    padding={{ left: 20, right: 20 }}
                                                />
                                                <YAxis hide={true} domain={[0, 25]} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        border: '1px solid #f1f5f9',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="before"
                                                    stroke="#ef4444"
                                                    strokeWidth={4}
                                                    fill="url(#beforeRisk)"
                                                    dot={{ r: 4, fill: '#fff', stroke: '#ef4444', strokeWidth: 2 }}
                                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="after"
                                                    stroke="#10b981"
                                                    strokeWidth={4}
                                                    fill="url(#afterRisk)"
                                                    dot={{ r: 4, fill: '#fff', stroke: '#10b981', strokeWidth: 2 }}
                                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </GlassPanel>

                                <GlassPanel className="p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-base font-black text-slate-900">ประเด็นสำคัญ</h2>
                                            <p className="text-xs text-slate-500">{keyRisks.length} ความเสี่ยง/โอกาสที่ต้องติดตามสูงสุด</p>
                                        </div>
                                        <Link
                                            href="/qmr/risk-management/risks"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600"
                                        >
                                            ดูทั้งหมด <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                    <div className="space-y-3">
                                        {keyRisks.length > 0 ? (
                                            keyRisks.map((risk) => (
                                                <Link
                                                    key={risk.id}
                                                    href={`/qmr/risk-management/risks/${risk.db_id}/edit`}
                                                    className="group block rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition-all duration-300 hover:border-blue-400/40 hover:bg-white hover:shadow-lg hover:shadow-blue-500/10"
                                                >
                                                    <div className="mb-2.5 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-black tracking-wider text-blue-700">
                                                                {risk.id}
                                                            </span>
                                                            <span
                                                                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
                                                                style={{ backgroundColor: `${levelColors[risk.level]}ee` }}
                                                            >
                                                                {risk.level}
                                                            </span>
                                                        </div>
                                                        <TrendingUp
                                                            className={`h-3.5 w-3.5 ${risk.score >= 15 ? 'animate-pulse text-red-500' : 'text-slate-400'}`}
                                                        />
                                                    </div>
                                                    <h3 className="line-clamp-2 text-sm leading-tight font-bold text-slate-900 transition-colors group-hover:text-blue-700">
                                                        {risk.title}
                                                    </h3>
                                                    <div className="mt-3 flex items-center justify-between text-[11px]">
                                                        <span className="font-medium text-slate-500">
                                                            {risk.category} · {risk.owner}
                                                        </span>
                                                        <span className="font-black" style={{ color: levelColors[risk.level] }}>
                                                            ระดับคะแนน: {risk.score}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200 p-[1px]">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000"
                                                            style={{
                                                                width: `${(risk.score / 25) * 100}%`,
                                                                backgroundColor: levelColors[risk.level],
                                                            }}
                                                        />
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                                                <ShieldAlert className="mb-2 h-8 w-8 opacity-20" />
                                                <p className="text-xs">ไม่พบข้อมูลประเด็นความเสี่ยง</p>
                                            </div>
                                        )}
                                    </div>
                                </GlassPanel>
                            </section>
                        </main>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
