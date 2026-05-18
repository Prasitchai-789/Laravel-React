import AppLayout from '@/layouts/app-layout';
import { analyzeRisk, getRiskLevelByScore, RISK_LEVEL_DEFINITIONS } from '@/lib/risk-analysis';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    CalendarDays,
    ChevronDown,
    ClipboardCheck,
    Eye,
    FileText,
    Hash,
    Info,
    Layers3,
    LayoutGrid,
    MessageSquareText,
    Save,
    ShieldAlert,
    TrendingUp,
    UserRound,
    Users,
    X,
} from 'lucide-react';
import { type ChangeEvent, type FormEvent, type ReactNode } from 'react';

interface RiskData {
    id?: number;
    code: string;
    document_type: string;
    document_code: string;
    document_name: string;
    effective_date: string;
    revision_no: string;
    document_title: string;
    issue_type: string;
    consideration: string;
    stakeholder: string;
    expectation: string;
    impact: string;
    risk_category: string;
    process_name: string;
    owner_name: string;
    risk_likelihood: number;
    risk_impact: number;
    improvement_likelihood: number;
    improvement_impact: number;
    status: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ฝ่ายแผนพัฒนาคุณภาพ', href: '/qmr/risk-management' },
    { title: 'ทะเบียนความเสี่ยง', href: '/qmr/risk-management/risks' },
    { title: 'ลงทะเบียน', href: '#' },
];

const formFieldClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/70';

function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <section className={`rounded-xl border border-slate-200/70 bg-white/85 shadow-lg shadow-slate-200/40 backdrop-blur-md ${className}`}>
            {children}
        </section>
    );
}

function SelectField({ children, value, onChange }: { children: ReactNode; value?: string; onChange?: (e: ChangeEvent<HTMLSelectElement>) => void }) {
    return (
        <div className="relative">
            <select className={`${formFieldClass} appearance-none pr-12`} value={value} onChange={onChange}>
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
    );
}

function EditableListField({
    value,
    onChange,
    options,
    listId,
    placeholder = 'เลือกหรือพิมพ์เพิ่ม...',
}: {
    value?: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    options: string[];
    listId: string;
    placeholder?: string;
}) {
    return (
        <div className="relative">
            <input className={formFieldClass} value={value} onChange={onChange} list={listId} placeholder={placeholder} />
            <datalist id={listId}>
                {options.map((option) => (
                    <option key={option} value={option} />
                ))}
            </datalist>
        </div>
    );
}

function ScoreInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
    return (
        <div className="min-w-0 flex-1 space-y-1">
            <span className="text-[11px] font-black tracking-wide text-slate-600 uppercase">{label}</span>
            <div className="grid grid-cols-5 gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                {[1, 2, 3, 4, 5].map((score) => (
                    <button
                        key={`${label}-${score}`}
                        type="button"
                        onClick={() => onChange(score)}
                        className={`h-8 rounded-md text-sm font-black transition-all ${
                            value === score ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-800'
                        }`}
                    >
                        {score}
                    </button>
                ))}
            </div>
        </div>
    );
}

function RegistrySection({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode }) {
    return (
        <GlassPanel className="overflow-hidden">
            <div className="border-b border-slate-200/70 bg-slate-50/70 px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-white p-1.5 text-blue-700 shadow-sm ring-1 ring-slate-200">{icon}</div>
                    <div>
                        <h2 className="text-base font-black text-slate-950">{title}</h2>
                        <p className="text-xs font-medium text-slate-500">{subtitle}</p>
                    </div>
                </div>
            </div>
            <div className="p-4">{children}</div>
        </GlassPanel>
    );
}

function FieldLabel({ children, required = false }: { children: ReactNode; required?: boolean }) {
    return (
        <span className="text-[12px] font-black text-slate-700">
            {children} {required && <b className="text-red-500">*</b>}
        </span>
    );
}

function SummaryTile({ label, value, className = '' }: { label: string; value: string | number; className?: string }) {
    return (
        <div className={`rounded-lg border border-slate-200 bg-white px-2.5 py-2 ${className}`}>
            <p className="text-[10px] font-black tracking-wide text-slate-400 uppercase">{label}</p>
            <p className="mt-0.5 truncate text-sm font-black text-slate-900">{value || '-'}</p>
        </div>
    );
}

function toDateInputValue(value?: string | null) {
    if (!value) {
        return '';
    }

    const dateText = String(value).trim();
    const isoDate = dateText.match(/^\d{4}-\d{2}-\d{2}/);

    if (isoDate) {
        return isoDate[0];
    }

    const parsedDate = new Date(dateText.replace(/:(AM|PM)$/i, ' $1'));

    if (Number.isNaN(parsedDate.getTime())) {
        return '';
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function RiskFormPreviewMap({
    inherentRisk,
    residualRisk,
}: {
    inherentRisk: ReturnType<typeof analyzeRisk>;
    residualRisk: ReturnType<typeof analyzeRisk>;
}) {
    const likelihoods = [5, 4, 3, 2, 1];
    const impacts = [1, 2, 3, 4, 5];
    const riskScoreChange = inherentRisk.score - residualRisk.score;
    const riskChangePercent = inherentRisk.score > 0 ? Math.round((Math.abs(riskScoreChange) / inherentRisk.score) * 100) : 0;

    return (
        <GlassPanel className="border-blue-100/50 p-3">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <h2 className="text-sm font-black text-slate-900">Risk Matrix Preview</h2>
                </div>
                <div className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            </div>

            <div className="grid grid-cols-[20px_repeat(5,minmax(0,1fr))] gap-1">
                {likelihoods.map((likelihood) => (
                    <div className="contents" key={`preview-row-${likelihood}`}>
                        <div className="flex items-center justify-center text-[10px] font-black text-slate-400">{likelihood}</div>
                        {impacts.map((impact) => {
                            const isBefore = likelihood === inherentRisk.likelihood && impact === inherentRisk.impact;
                            const isAfter = likelihood === residualRisk.likelihood && impact === residualRisk.impact;
                            const level = getRiskLevelByScore(likelihood * impact);

                            return (
                                <div
                                    key={`${impact}-${likelihood}`}
                                    className={`relative flex min-h-[38px] items-center justify-center rounded bg-gradient-to-br text-[10px] font-black text-white shadow-sm transition-all ${level.gradientClass} ${isBefore || isAfter ? 'z-10 scale-105 ring-2 ring-white/50' : 'opacity-60 grayscale-[0.3]'}`}
                                >
                                    {isBefore && (
                                        <div className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-red-600 text-[8px] font-black shadow-lg">
                                            B
                                        </div>
                                    )}
                                    {isAfter && (
                                        <div className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-[8px] font-black shadow-lg">
                                            A
                                        </div>
                                    )}
                                    <span className={isBefore || isAfter ? 'opacity-100' : 'opacity-40'}>{level.code}</span>
                                </div>
                            );
                        })}
                    </div>
                ))}
                <div />
                {impacts.map((impact) => (
                    <div key={`impact-${impact}`} className="flex items-center justify-center py-1 text-[10px] font-black text-slate-400">
                        {impact}
                    </div>
                ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5">
                <div className="rounded-xl bg-slate-50 p-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Risk Reduction</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                        <ArrowDown className={`h-3 w-3 ${riskScoreChange > 0 ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className={`text-sm font-black ${riskScoreChange > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                            {Math.abs(riskScoreChange)} คะแนน
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">({riskChangePercent}%)</span>
                    </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Movement</p>
                    <div className="mt-0.5 flex items-center gap-1 text-xs font-black text-slate-700">
                        <span className="text-red-500">{inherentRisk.score}</span>
                        <ArrowRight className="h-3 w-3 text-slate-300" />
                        <span className="text-emerald-500">{residualRisk.score}</span>
                    </div>
                </div>
            </div>
        </GlassPanel>
    );
}

export default function RiskRegistry({ risk, latestEffectiveDate }: { risk?: RiskData; latestEffectiveDate?: string | null }) {
    const { data, setData, post, put, processing, errors } = useForm({
        code: risk?.code || '',
        document_type: risk?.document_type || 'แบบฟอร์ม',
        document_code: risk?.document_code || 'FM-QMR-61-0023',
        document_name: risk?.document_name || 'แบบฟอร์มการประเมินความเสี่ยงและโอกาสด้านคุณภาพ',
        effective_date: toDateInputValue(risk?.effective_date ?? latestEffectiveDate),
        revision_no: risk?.revision_no || '04',
        document_title: risk?.document_title || '',
        issue_type: risk?.issue_type || 'ปัจจัยภายใน/นอก',
        consideration: risk?.consideration || '',
        stakeholder: risk?.stakeholder || '',
        expectation: risk?.expectation || '',
        impact: risk?.impact || '',
        risk_category: risk?.risk_category || 'Operation',
        process_name: risk?.process_name || '',
        owner_name: risk?.owner_name || '',
        risk_likelihood: risk?.risk_likelihood || 1,
        risk_impact: risk?.risk_impact || 1,
        improvement_likelihood: risk?.improvement_likelihood || 1,
        improvement_impact: risk?.improvement_impact || 1,
        status: risk?.status || 'active',
    });

    const inherentRisk = analyzeRisk(data.risk_likelihood, data.risk_impact);
    const residualRisk = analyzeRisk(data.improvement_likelihood, data.improvement_impact);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (risk?.id) {
            put(route('qmr.risk-management.update', risk.id));
        } else {
            post(route('qmr.risk-management.store'));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${risk?.id ? 'แก้ไข' : 'ลงทะเบียน'}ความเสี่ยง - RiskGuard`} />

            <div className="relative min-h-screen bg-slate-50 p-2 font-anuphan text-slate-900 sm:p-3 lg:p-4">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
                    <div className="absolute top-56 -right-24 h-80 w-80 rounded-full bg-cyan-100/40 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-[1440px]">
                    <header className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/40">
                        <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
                            <div className="border-b border-blue-800 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 px-4 py-4 text-white lg:border-r lg:border-b-0">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-white/10 p-2 ring-1 ring-white/15">
                                            <ShieldAlert className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black tracking-[0.2em] text-blue-200 uppercase">
                                                Risk & Opportunity Registry
                                            </p>
                                            <h1 className="mt-0.5 text-xl font-black tracking-tight">
                                                {risk?.id ? 'แก้ไขทะเบียนความเสี่ยงและโอกาส' : 'ลงทะเบียนความเสี่ยงและโอกาส'}
                                            </h1>
                                            <p className="mt-0.5 text-xs font-medium text-slate-300">
                                                บันทึกประเด็น ผู้เกี่ยวข้อง ผลกระทบ และคะแนนประเมินตามแบบฟอร์ม FM-QMR-61-0023
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex w-fit items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-black text-white ring-1 ring-white/15">
                                        <CalendarDays className="h-4 w-4 text-blue-200" />
                                        Rev. {data.revision_no || '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3">
                                <SummaryTile label="รหัสเอกสาร" value={data.document_code} />
                                <SummaryTile label="ประเภทเอกสาร" value={data.document_type} />
                                <SummaryTile label="หมวด" value={data.risk_category} />
                                <SummaryTile
                                    label="คะแนนปัจจุบัน"
                                    value={`${inherentRisk.score} / ${inherentRisk.name}`}
                                    className={inherentRisk.bgClass}
                                />
                            </div>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="grid gap-3 xl:grid-cols-[1fr_340px]">
                        <div className="space-y-3">
                            <RegistrySection
                                icon={<FileText className="h-4 w-4" />}
                                title="ข้อมูลเอกสาร"
                                subtitle="ใช้ระบุเลขที่แบบฟอร์ม วันที่บังคับใช้ และ revision"
                            >
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <label className="space-y-1">
                                        <FieldLabel>ประเภทเอกสาร</FieldLabel>
                                        <SelectField value={data.document_type} onChange={(e) => setData('document_type', e.target.value)}>
                                            <option value="แบบฟอร์ม">แบบฟอร์ม</option>
                                            <option value="ระเบียบปฏิบัติ">ระเบียบปฏิบัติ</option>
                                            <option value="ทะเบียน">ทะเบียน</option>
                                        </SelectField>
                                    </label>
                                    <label className="space-y-1">
                                        <FieldLabel>รหัสเอกสาร</FieldLabel>
                                        <input
                                            className={formFieldClass}
                                            value={data.document_code}
                                            onChange={(e) => setData('document_code', e.target.value)}
                                            placeholder="FM-QMR-61-0023"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <FieldLabel>วันที่บังคับใช้</FieldLabel>
                                        <input
                                            className={formFieldClass}
                                            type="date"
                                            value={data.effective_date}
                                            onChange={(e) => setData('effective_date', e.target.value)}
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <FieldLabel>ครั้งที่แก้ไข</FieldLabel>
                                        <input
                                            className={formFieldClass}
                                            value={data.revision_no}
                                            onChange={(e) => setData('revision_no', e.target.value)}
                                            placeholder="04"
                                        />
                                    </label>
                                </div>
                                <label className="mt-3 block space-y-1">
                                    <FieldLabel>ชื่อเอกสาร</FieldLabel>
                                    <input
                                        className={formFieldClass}
                                        value={data.document_name}
                                        onChange={(e) => setData('document_name', e.target.value)}
                                        placeholder="แบบฟอร์มการประเมินความเสี่ยงและโอกาสด้านคุณภาพ"
                                    />
                                </label>
                            </RegistrySection>

                            <RegistrySection
                                icon={<LayoutGrid className="h-4 w-4" />}
                                title="รายละเอียดประเด็นความเสี่ยงและโอกาส"
                                subtitle="บันทึกสิ่งที่พิจารณา ความเสี่ยง/โอกาส/ความคาดหวัง และผลกระทบที่เกิดขึ้น"
                            >
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-3">
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white shadow-sm shadow-blue-200">
                                                    <Hash className="h-4 w-4" />
                                                </span>
                                                <div>
                                                    <p className="text-xs font-black tracking-wide text-blue-700 uppercase">Registry Item</p>
                                                    <p className="text-xs font-semibold text-slate-500">ระบุรหัสและข้อมูลจำแนกประเด็น</p>
                                                </div>
                                            </div>
                                            <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black text-blue-700">
                                                {data.code || 'ยังไม่ระบุรหัส'}
                                            </span>
                                        </div>

                                        <label className="mb-3 block space-y-1">
                                            <FieldLabel>ชื่อประเด็น / ชื่อทะเบียน</FieldLabel>
                                            <input
                                                className={formFieldClass}
                                                value={data.document_title}
                                                onChange={(e) => setData('document_title', e.target.value)}
                                                placeholder="เช่น มาตรฐานสามารถตอบสนองด้านความต้องการของลูกค้า"
                                            />
                                        </label>

                                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[220px_1fr_1fr_1fr]">
                                            <label className="space-y-1">
                                                <FieldLabel required>รหัสความเสี่ยง</FieldLabel>
                                                <input
                                                    className={formFieldClass}
                                                    value={data.code}
                                                    onChange={(e) => setData('code', e.target.value)}
                                                    placeholder="RSK-QP-001"
                                                    required
                                                />
                                                {errors.code && <p className="text-[10px] font-bold text-red-500">{errors.code}</p>}
                                            </label>
                                            <label className="space-y-1">
                                                <FieldLabel>ประเภทประเด็น</FieldLabel>
                                                <SelectField value={data.issue_type} onChange={(e) => setData('issue_type', e.target.value)}>
                                                    <option value="ปัจจัยภายใน/นอก">ปัจจัยภายใน/นอก</option>
                                                    <option value="ผู้ที่เกี่ยวข้อง">ผู้ที่เกี่ยวข้อง</option>
                                                    <option value="การเปลี่ยนแปลง">การเปลี่ยนแปลง</option>
                                                    <option value="ข้อกำหนดกฎหมาย/มาตรฐาน">ข้อกำหนดกฎหมาย/มาตรฐาน</option>
                                                </SelectField>
                                            </label>
                                            <label className="space-y-1">
                                                <FieldLabel>หมวดความเสี่ยง</FieldLabel>
                                                <SelectField value={data.risk_category} onChange={(e) => setData('risk_category', e.target.value)}>
                                                    <option value="Operation">Operation</option>
                                                    <option value="Strategic">Strategic</option>
                                                    <option value="Finance">Finance</option>
                                                    <option value="Compliance">Compliance</option>
                                                    <option value="Quality">Quality</option>
                                                </SelectField>
                                            </label>
                                            <label className="space-y-1">
                                                <FieldLabel>ผู้รับผิดชอบ</FieldLabel>
                                                <input
                                                    className={formFieldClass}
                                                    value={data.owner_name}
                                                    onChange={(e) => setData('owner_name', e.target.value)}
                                                    placeholder="เช่น ฝ่ายผลิต"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 lg:grid-cols-3">
                                        <label className="space-y-1 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                                            <span className="mb-1.5 flex items-center gap-2">
                                                <Layers3 className="h-4 w-4 text-blue-700" />
                                                <FieldLabel>สิ่งที่พิจารณา</FieldLabel>
                                            </span>
                                            <input
                                                className={formFieldClass}
                                                value={data.process_name}
                                                onChange={(e) => setData('process_name', e.target.value)}
                                                placeholder="เช่น การดำเนินงาน / ภาครัฐ"
                                            />
                                        </label>

                                        <label className="space-y-1 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                                            <span className="mb-1.5 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-700" />
                                                <FieldLabel required>แหล่งที่มา / รายละเอียดที่พิจารณา</FieldLabel>
                                            </span>
                                            <EditableListField
                                                value={data.consideration}
                                                onChange={(e) => setData('consideration', e.target.value)}
                                                listId="risk-consideration-options"
                                                options={[
                                                    'บริบทภายใน',
                                                    'บริบทภายนอก',
                                                    'ลูกค้า',
                                                    'ผู้ส่งมอบ',
                                                    'หน่วยงานราชการ',
                                                    'ข้อกำหนดมาตรฐาน',
                                                    'การเปลี่ยนแปลงกระบวนการ',
                                                ]}
                                            />
                                            {errors.consideration && <p className="text-[10px] font-bold text-red-500">{errors.consideration}</p>}
                                        </label>

                                        <label className="space-y-1 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                                            <span className="mb-1.5 flex items-center gap-2">
                                                <UserRound className="h-4 w-4 text-blue-700" />
                                                <FieldLabel>ผู้มีส่วนได้ส่วนเสีย</FieldLabel>
                                            </span>
                                            <EditableListField
                                                value={data.stakeholder}
                                                onChange={(e) => setData('stakeholder', e.target.value)}
                                                listId="risk-stakeholder-options"
                                                options={['ลูกค้า', 'พนักงาน', 'ผู้ส่งมอบ', 'หน่วยงานราชการ', 'ชุมชน', 'ผู้บริหาร', 'ผู้ถือหุ้น']}
                                                placeholder="เช่น ลูกค้า / หน่วยงานราชการ"
                                            />
                                        </label>
                                    </div>

                                    <div className="grid gap-3 lg:grid-cols-2">
                                        <label className="group space-y-1.5 rounded-xl border border-blue-100 bg-white p-3 shadow-sm shadow-slate-200/70">
                                            <span className="flex items-center gap-2">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                                    <MessageSquareText className="h-4 w-4" />
                                                </span>
                                                <FieldLabel required>ความเสี่ยง/โอกาส/ความคาดหวัง</FieldLabel>
                                            </span>
                                            <textarea
                                                className={`${formFieldClass} min-h-[104px] resize-none bg-blue-50/40 leading-relaxed focus:bg-white`}
                                                value={data.expectation}
                                                onChange={(e) => setData('expectation', e.target.value)}
                                                placeholder="เช่น มาตรฐานสามารถตอบสนองด้านความต้องการของลูกค้า..."
                                                required
                                            />
                                            {errors.expectation && <p className="text-[10px] font-bold text-red-500">{errors.expectation}</p>}
                                        </label>

                                        <label className="group space-y-1.5 rounded-xl border border-amber-100 bg-white p-3 shadow-sm shadow-slate-200/70">
                                            <span className="flex items-center gap-2">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                                    <AlertTriangle className="h-4 w-4" />
                                                </span>
                                                <FieldLabel>ผลกระทบที่เกิดขึ้น</FieldLabel>
                                            </span>
                                            <textarea
                                                className={`${formFieldClass} min-h-[104px] resize-none bg-amber-50/40 leading-relaxed focus:bg-white`}
                                                value={data.impact}
                                                onChange={(e) => setData('impact', e.target.value)}
                                                placeholder="เช่น ต้องจัดทำมาตรฐานให้สอดคล้องต่อความต้องการของลูกค้า..."
                                            />
                                        </label>
                                    </div>
                                </div>
                            </RegistrySection>

                            <RegistrySection
                                icon={<TrendingUp className="h-4 w-4" />}
                                title="การประเมินระดับความเสี่ยง"
                                subtitle="ให้คะแนนโอกาสเกิดและความรุนแรง เพื่อคำนวณระดับความเสี่ยงและระดับโอกาสในการปรับปรุง"
                            >
                                <div className="grid gap-3 lg:grid-cols-2">
                                    <div className="rounded-xl border border-red-200 bg-red-50/60 p-3">
                                        <h3 className="mb-2 flex items-center gap-2 text-[11px] font-black tracking-wider text-red-800 uppercase">
                                            <span className="h-2 w-2 rounded-full bg-red-500" />
                                            ความเสี่ยง
                                        </h3>
                                        <div className="mb-3 flex gap-2">
                                            <ScoreInput
                                                label="โอกาสเกิด"
                                                onChange={(val) => setData('risk_likelihood', val)}
                                                value={data.risk_likelihood}
                                            />
                                            <ScoreInput label="ความรุนแรง" onChange={(val) => setData('risk_impact', val)} value={data.risk_impact} />
                                        </div>
                                        <div className={`rounded-lg border bg-white p-2.5 text-center ${inherentRisk.borderClass}`}>
                                            <p className="text-[10px] font-black tracking-wide text-slate-400 uppercase">ระดับความเสี่ยง</p>
                                            <p className={`mt-0.5 text-lg font-black ${inherentRisk.textClass}`}>
                                                {inherentRisk.score} คะแนน · ระดับ{inherentRisk.name}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                                        <h3 className="mb-2 flex items-center gap-2 text-[11px] font-black tracking-wider text-emerald-800 uppercase">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            ระดับโอกาสในการปรับปรุง
                                        </h3>
                                        <div className="mb-3 flex gap-2">
                                            <ScoreInput
                                                label="โอกาสปรับปรุง"
                                                onChange={(val) => setData('improvement_likelihood', val)}
                                                value={data.improvement_likelihood}
                                            />
                                            <ScoreInput
                                                label="ผลการปรับปรุง"
                                                onChange={(val) => setData('improvement_impact', val)}
                                                value={data.improvement_impact}
                                            />
                                        </div>
                                        <div className={`rounded-lg border bg-white p-2.5 text-center ${residualRisk.borderClass}`}>
                                            <p className="text-[10px] font-black tracking-wide text-slate-400 uppercase">ระดับโอกาสในการปรับปรุง</p>
                                            <p className={`mt-0.5 text-lg font-black ${residualRisk.textClass}`}>
                                                {residualRisk.score} คะแนน · ระดับ{residualRisk.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </RegistrySection>

                            <div className="sticky bottom-2 z-20 rounded-xl border border-slate-200 bg-white/90 p-2.5 shadow-xl shadow-slate-300/40 backdrop-blur-md">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <ClipboardCheck className="h-4 w-4 text-blue-600" />
                                        ตรวจสอบข้อมูลก่อนบันทึกลงทะเบียนความเสี่ยงและโอกาส
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => window.history.back()}
                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm transition-all hover:bg-slate-50"
                                        >
                                            <X className="h-4 w-4" />
                                            ยกเลิก
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 disabled:opacity-50"
                                        >
                                            <Save className="h-4 w-4" />
                                            {risk?.id ? 'บันทึกการแก้ไข' : 'ลงทะเบียนความเสี่ยง'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <aside className="space-y-3 xl:sticky xl:top-4 xl:self-start">
                            <GlassPanel className="overflow-hidden">
                                <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 px-3 py-2.5 text-white">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-blue-300" />
                                        <h3 className="text-xs font-black tracking-widest uppercase">ทะเบียนย่อ</h3>
                                    </div>
                                </div>
                                <div className="space-y-1.5 p-3">
                                    <SummaryTile label="รหัสความเสี่ยง" value={data.code || 'ยังไม่ระบุ'} />
                                    <SummaryTile label="กระบวนการ" value={data.process_name || 'ยังไม่ระบุ'} />
                                    <SummaryTile label="ผู้รับผิดชอบ" value={data.owner_name || 'ยังไม่ระบุ'} />
                                    <SummaryTile label="ผู้เกี่ยวข้อง" value={data.stakeholder || 'ยังไม่ระบุ'} />
                                </div>
                            </GlassPanel>

                            <RiskFormPreviewMap inherentRisk={inherentRisk} residualRisk={residualRisk} />

                            <GlassPanel className="overflow-hidden border-blue-100 bg-white shadow-blue-100/50">
                                <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 px-3 py-3 text-white">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-blue-200" />
                                        <h3 className="text-xs font-black tracking-widest uppercase">Risk Definitions</h3>
                                    </div>
                                    <p className="mt-1 text-[11px] font-semibold text-blue-100">คำอธิบายระดับคะแนนความเสี่ยง</p>
                                </div>
                                <div className="space-y-2 p-3">
                                    {RISK_LEVEL_DEFINITIONS.map((level) => (
                                        <div
                                            key={level.code}
                                            className="group rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl font-black text-white shadow-md ${level.gradientClass}`}
                                                >
                                                    {level.code}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-base leading-tight font-black text-slate-950">ระดับ{level.name}</p>
                                                    <p className="mt-0.5 text-sm font-black text-blue-800">{level.range} คะแนน</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                                <div
                                                    className={`h-full rounded-full bg-gradient-to-r ${level.gradientClass} transition-all group-hover:brightness-105`}
                                                    style={{
                                                        width: level.code === 'H' ? '100%' : level.code === 'M' ? '62%' : '32%',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassPanel>
                        </aside>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
