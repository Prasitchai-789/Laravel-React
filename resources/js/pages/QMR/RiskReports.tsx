import AppLayout from '@/layouts/app-layout';
import { RISK_LEVEL_DEFINITIONS } from '@/lib/risk-analysis';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { FileDown, Printer } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ฝ่ายแผนพัฒนาคุณภาพ', href: '/qmr/risk-management' },
    { title: 'รายงานความเสี่ยงและโอกาส', href: '/qmr/risk-management/reports' },
];

type ReportStats = {
    totalRisks: number;
    highRisks: number;
    kpiSuccessRate: number;
    controlCompletionRate: number;
    totalControls: number;
    metKpis: number;
    totalKpis: number;
};

type RiskByType = {
    issue_type: string;
    high: number;
    medium: number;
    low: number;
};

type KpiTrend = {
    month: string;
    met: number;
    missed: number;
    inProgress: number;
};

type TopMission = {
    name: string;
    value: number;
};

type RiskReportsProps = {
    stats: ReportStats;
    riskByType: RiskByType[];
    kpiTrend: KpiTrend[];
    topMissions: TopMission[];
};

function MetricCard({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) {
    return (
        <section
            className="rounded-xl border border-slate-100 bg-white p-5 shadow-xl shadow-blue-200/35"
            style={{ borderLeftColor: color, borderLeftWidth: 4 }}
        >
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-5xl font-black text-slate-950">{value}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">{detail}</p>
        </section>
    );
}

export default function RiskReports({
    stats = {
        totalRisks: 0,
        highRisks: 0,
        kpiSuccessRate: 0,
        controlCompletionRate: 0,
        totalControls: 0,
        metKpis: 0,
        totalKpis: 0,
    },
    riskByType = [],
    kpiTrend = [],
    topMissions = [],
}: RiskReportsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="รายงานความเสี่ยงและโอกาสด้านคุณภาพ - RiskGuard" />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100 p-4 font-anuphan text-slate-900 sm:p-6">
                <div className="mx-auto max-w-[1660px]">
                    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">รายงานความเสี่ยงและโอกาสด้านคุณภาพ</h1>
                            <p className="mt-2 text-sm font-semibold text-slate-500">วิเคราะห์ประเด็นที่พิจารณา · KPI · มาตรการ · ผลการติดตาม</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                disabled
                                title="ยังไม่ได้เปิดใช้งานการส่งออก"
                                className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-black text-slate-400 opacity-70 shadow"
                            >
                                <FileDown className="h-4 w-4" />
                                ส่งออก Excel (3 sheets)
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-300/40 transition-all hover:-translate-y-0.5"
                                onClick={() => window.print()}
                            >
                                <Printer className="h-4 w-4" />
                                พิมพ์รายงาน (PDF)
                            </button>
                        </div>
                    </header>

                    <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard label="ประเด็นทั้งหมด" value={stats.totalRisks.toString()} detail="ความเสี่ยงและโอกาส" color="#06b6d4" />
                        <MetricCard label="ระดับสูงมาก (H)" value={stats.highRisks.toString()} detail="ต้องเร่งดำเนินการ" color="#ef4444" />
                        <MetricCard
                            label="KPI Success Rate"
                            value={`${stats.kpiSuccessRate}%`}
                            detail={`${stats.metKpis}/${stats.totalKpis} รายการ`}
                            color="#22c55e"
                        />
                        <MetricCard
                            label="ความสำเร็จมาตรการ"
                            value={`${stats.controlCompletionRate}%`}
                            detail={`${stats.totalControls} มาตรการ`}
                            color="#eab308"
                        />
                    </section>

                    <section className="mt-6 rounded-xl border border-slate-100 bg-white p-5 shadow-xl shadow-blue-200/35">
                        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-black tracking-wide text-slate-500 uppercase">KPI Status Trend</p>
                                <h2 className="text-xl font-black text-slate-950">แนวโน้มสถานะ KPI รายเดือน</h2>
                            </div>
                            <div className="flex gap-4 text-[10px] font-black tracking-widest text-slate-600 uppercase">
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
                                    Met
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm" />
                                    Missed
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm" />
                                    Progress
                                </span>
                            </div>
                        </div>
                        <div className="h-80 w-full min-w-0">
                            {kpiTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={kpiTrend} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="metFill" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.28} />
                                                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.04} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="#e2e8f0" vertical={false} strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 900 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="met"
                                            name="บรรลุเป้า"
                                            stroke="#22c55e"
                                            fill="url(#metFill)"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="missed"
                                            name="ไม่บรรลุ"
                                            stroke="#e11d48"
                                            fill="transparent"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="inProgress"
                                            name="รอผล"
                                            stroke="#f59e0b"
                                            fill="transparent"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center font-bold text-slate-400">ยังไม่มีข้อมูลแนวโน้ม</div>
                            )}
                        </div>
                    </section>

                    <section className="mt-6 grid gap-6 lg:grid-cols-2">
                        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-xl shadow-blue-200/35">
                            <p className="text-sm font-semibold tracking-tight text-slate-500 uppercase">Risk Distribution</p>
                            <h2 className="text-xl font-black text-slate-950">ประเด็นความเสี่ยงแยกตามระดับ H/M/L</h2>
                            <div className="mt-5 h-80 w-full min-w-0">
                                {riskByType.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={riskByType} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
                                            <CartesianGrid stroke="#e2e8f0" vertical={false} strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="issue_type"
                                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                }}
                                            />
                                            <Bar dataKey="high" name="สูงมาก (H)" stackId="risk" fill="#ef4444" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="medium" name="ปานกลาง (M)" stackId="risk" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="low" name="ต่ำ (L)" stackId="risk" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center font-bold text-slate-400">ยังไม่มีข้อมูลสถิติ</div>
                                )}
                            </div>
                            <div className="mt-4 flex flex-wrap justify-center gap-4 text-[10px] font-black tracking-wider text-slate-500">
                                {RISK_LEVEL_DEFINITIONS.map((level) => (
                                    <span key={level.code} className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-6 rounded-sm shadow-sm" style={{ backgroundColor: level.color }} />
                                        {level.name} ({level.code})
                                    </span>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-xl shadow-blue-200/35">
                            <p className="text-sm font-semibold tracking-tight text-slate-500 uppercase">Mission Breakdown</p>
                            <h2 className="text-xl font-black text-slate-950">Top 10 พันธกิจ · จำนวนประเด็นความเสี่ยง</h2>
                            <div className="mt-6 space-y-5">
                                {topMissions.length > 0 ? (
                                    topMissions.map((mission) => (
                                        <div key={mission.name} className="group">
                                            <div className="mb-1.5 flex items-start justify-between gap-3">
                                                <span className="text-sm leading-tight font-black text-slate-800 transition-colors group-hover:text-blue-700">
                                                    {mission.name}
                                                </span>
                                                <span className="shrink-0 rounded border border-slate-100 bg-slate-50 px-2 py-0.5 text-sm font-black text-slate-950 shadow-sm">
                                                    {mission.value}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 flex-1 overflow-hidden rounded-full border border-slate-50 bg-slate-100 shadow-inner">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 transition-all duration-1000"
                                                        style={{ width: `${(mission.value / (topMissions[0]?.value || 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex h-40 items-center justify-center font-bold text-slate-400">ยังไม่มีข้อมูลพันธกิจ</div>
                                )}
                            </div>
                        </section>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
