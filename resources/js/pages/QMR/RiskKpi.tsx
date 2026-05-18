import AppLayout from '@/layouts/app-layout';
import { useCanAny } from '@/lib/permissions';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    ChevronDown,
    ClipboardCheck,
    Gauge,
    Info,
    LayoutGrid,
    Pencil,
    Save,
    ShieldAlert,
    Target,
    Trash2,
    X,
} from 'lucide-react';
import { type ChangeEvent, type FormEvent, type ReactNode } from 'react';

interface RiskOption {
    id: number;
    code: string;
    document_title: string;
}

interface KpiData {
    id?: number;
    risk_register_id: string | number;
    code: string;
    name: string;
    threshold: string;
    unit: string;
    direction: string;
    target_value: number | string;
    warning_value?: number | string;
    critical_value?: number | string;
    status: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ฝ่ายแผนพัฒนาคุณภาพ', href: '/qmr/risk-management' },
    { title: 'KPI ความเสี่ยง', href: '/qmr/risk-management/kpi' },
    { title: 'จัดการตัวชี้วัด', href: '#' },
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

function SelectField({
    children,
    value,
    onChange,
}: {
    children: ReactNode;
    value?: string | number;
    onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
}) {
    return (
        <div className="relative">
            <select className={`${formFieldClass} appearance-none pr-12`} value={value} onChange={onChange}>
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-slate-500" />
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

function statusText(status: string) {
    if (status === 'met') {
        return 'บรรลุเป้า';
    }

    if (status === 'missed') {
        return 'ไม่บรรลุเป้า';
    }

    return 'อยู่ระหว่างติดตาม';
}

function statusClass(status: string) {
    if (status === 'met') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (status === 'missed') {
        return 'border-red-200 bg-red-50 text-red-700';
    }

    return 'border-amber-200 bg-amber-50 text-amber-700';
}

function formatDecimalValue(value: number | string | undefined | null) {
    if (value === undefined || value === null || value === '') {
        return '';
    }

    const parsedValue = Number(value);

    if (Number.isNaN(parsedValue)) {
        return '';
    }

    return parsedValue.toFixed(2);
}

function displayTargetValue(value: number | string | undefined | null) {
    return formatDecimalValue(value) || '0.00';
}

function KpiPreviewCard({ data, risks }: { data: KpiData; risks: RiskOption[] }) {
    const selectedRisk = risks.find((risk) => String(risk.id) === String(data.risk_register_id));

    return (
        <aside className="space-y-3 xl:sticky xl:top-4 xl:self-start">
            <GlassPanel className="overflow-hidden">
                <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 px-3 py-2.5 text-white">
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-200" />
                        <h3 className="text-xs font-black tracking-widest uppercase">KPI Summary</h3>
                    </div>
                </div>
                <div className="space-y-1.5 p-3">
                    <SummaryTile label="รหัส KPI" value={data.code || 'ยังไม่ระบุ'} />
                    <SummaryTile label="ชื่อตัวชี้วัด" value={data.name || 'ยังไม่ระบุ'} />
                    <SummaryTile label="เป้าหมาย" value={`${displayTargetValue(data.target_value)} ${data.unit || ''}`} />
                    <SummaryTile label="เกณฑ์" value={data.threshold || 'ยังไม่ระบุ'} />
                </div>
            </GlassPanel>

            <GlassPanel className="overflow-hidden border-blue-100 bg-white shadow-blue-100/50">
                <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 px-3 py-3 text-white">
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-200" />
                        <h3 className="text-xs font-black tracking-widest uppercase">Live Preview</h3>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-blue-100">ตัวอย่างข้อมูลก่อนบันทึก</p>
                </div>

                <div className="space-y-3 p-3">
                    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-3">
                        <p className="text-[10px] font-black tracking-wide text-blue-700 uppercase">KPI Name</p>
                        <h2 className="mt-1 line-clamp-2 text-base leading-snug font-black text-slate-950">{data.name || 'กรุณาระบุชื่อ KPI'}</h2>
                    </div>

                    <div className={`rounded-xl border p-3 ${statusClass(data.status)}`}>
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black tracking-wide uppercase">สถานะปัจจุบัน</p>
                            <Gauge className="h-4 w-4 opacity-60" />
                        </div>
                        <p className="mt-1 text-base font-black">{statusText(data.status)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
                            <p className="text-[10px] font-black tracking-wide text-slate-400 uppercase">เป้าหมาย</p>
                            <p className="mt-0.5 text-lg font-black text-blue-800">
                                {displayTargetValue(data.target_value)}
                                <span className="ml-1 text-[10px] font-bold text-slate-400">{data.unit}</span>
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
                            <p className="text-[10px] font-black tracking-wide text-slate-400 uppercase">ทิศทาง</p>
                            <p className="mt-1 truncate text-sm font-black text-slate-800">
                                {data.direction === 'higher_better'
                                    ? 'ค่ายิ่งมากยิ่งดี'
                                    : data.direction === 'lower_better'
                                      ? 'ค่ายิ่งน้อยยิ่งดี'
                                      : 'ตามค่าเป้าหมาย'}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3">
                        <p className="text-[10px] font-black tracking-wide text-slate-400 uppercase">ความเสี่ยงที่เกี่ยวข้อง</p>
                        <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-600">
                            {selectedRisk ? `${selectedRisk.code} - ${selectedRisk.document_title}` : 'ยังไม่ได้เลือก'}
                        </p>
                    </div>
                </div>
            </GlassPanel>
        </aside>
    );
}

export default function RiskKpi({ risks = [], kpi }: { risks?: RiskOption[]; kpi?: KpiData }) {
    const canDelete = useCanAny(['qmr.delete', 'admin.delete', 'developer.view']);
    const {
        data,
        setData,
        post,
        put,
        transform,
        delete: destroy,
        processing,
        errors,
    } = useForm({
        risk_register_id: kpi?.risk_register_id || '',
        code: kpi?.code || '',
        name: kpi?.name || '',
        threshold: kpi?.threshold || '',
        unit: kpi?.unit || '',
        direction: kpi?.direction || 'higher_better',
        target_value: formatDecimalValue(kpi?.target_value ?? ''),
        status: kpi?.status || 'in_progress',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        transform((formData) => ({
            ...formData,
            target_value: formatDecimalValue(formData.target_value),
        }));

        if (kpi?.id) {
            put(route('qmr.risk-management.kpi.update', kpi.id));
        } else {
            post(route('qmr.risk-management.kpi.store'));
        }
    };

    const handleDelete = () => {
        if (confirm('คุณต้องการลบ KPI นี้ใช่หรือไม่?')) {
            destroy(route('qmr.risk-management.kpi.destroy', kpi?.id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${kpi?.id ? 'แก้ไข' : 'เพิ่ม'} KPI - RiskGuard`} />

            <div className="relative min-h-screen bg-slate-50 p-2 font-anuphan text-slate-900 sm:p-3 lg:p-4">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
                    <div className="absolute top-56 -right-24 h-80 w-80 rounded-full bg-cyan-100/40 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-[1440px]">
                    <header className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/40">
                        <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
                            <div className="border-b border-blue-800 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 px-4 py-4 text-white lg:border-r lg:border-b-0">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-white/10 p-2 ring-1 ring-white/15">
                                            {kpi?.id ? <Pencil className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black tracking-[0.2em] text-blue-200 uppercase">Risk KPI Management</p>
                                            <h1 className="mt-0.5 text-xl font-black tracking-tight">
                                                {kpi?.id ? 'แก้ไข KPI ความเสี่ยง' : 'เพิ่ม KPI ใหม่'}
                                            </h1>
                                            <p className="mt-0.5 text-xs font-medium text-slate-300">
                                                กำหนดตัวชี้วัด เป้าหมาย และสถานะติดตามผลการจัดการความเสี่ยง
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex w-fit items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-black text-white ring-1 ring-white/15">
                                        <BarChart3 className="h-4 w-4 text-blue-200" />
                                        KPI Tracking
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3">
                                <SummaryTile label="รหัส KPI" value={data.code || 'ยังไม่ระบุ'} />
                                <SummaryTile label="สถานะ" value={statusText(data.status)} className={statusClass(data.status)} />
                                <SummaryTile label="หน่วยนับ" value={data.unit || 'ยังไม่ระบุ'} />
                                <SummaryTile label="เป้าหมาย" value={`${displayTargetValue(data.target_value)} ${data.unit || ''}`} />
                            </div>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
                        <div className="space-y-3">
                            <RegistrySection
                                icon={<LayoutGrid className="h-4 w-4" />}
                                title="ข้อมูลตัวชี้วัด"
                                subtitle="ระบุรหัส KPI ชื่อตัวชี้วัด และผูกกับทะเบียนความเสี่ยงที่เกี่ยวข้อง"
                            >
                                <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-3">
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-blue-100/70 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white shadow-sm shadow-blue-200">
                                                <Target className="h-4 w-4" />
                                            </span>
                                            <div>
                                                <p className="text-xs font-black tracking-wide text-blue-700 uppercase">KPI Item</p>
                                                <p className="text-xs font-semibold text-slate-500">ข้อมูลหลักของตัวชี้วัดความเสี่ยง</p>
                                            </div>
                                        </div>
                                        <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black text-blue-700">
                                            {data.code || 'ยังไม่ระบุรหัส'}
                                        </span>
                                    </div>

                                    <div className="grid gap-3">
                                        <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                <label className="space-y-1">
                                                    <FieldLabel required>รหัสตัวชี้วัด</FieldLabel>
                                                    <input
                                                        className={formFieldClass}
                                                        value={data.code}
                                                        onChange={(e) => setData('code', e.target.value)}
                                                        placeholder="เช่น KPI-01"
                                                        required
                                                    />
                                                    {errors.code && <p className="text-[10px] font-bold text-red-500">{errors.code}</p>}
                                                </label>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                <label className="space-y-1">
                                                    <FieldLabel required>ความเสี่ยงที่เกี่ยวข้อง</FieldLabel>
                                                    <SelectField
                                                        value={data.risk_register_id}
                                                        onChange={(e) => setData('risk_register_id', e.target.value)}
                                                    >
                                                        <option value="">เลือกความเสี่ยง</option>
                                                        {risks.map((risk) => (
                                                            <option key={risk.id} value={risk.id}>
                                                                {risk.code} - {risk.document_title}
                                                            </option>
                                                        ))}
                                                    </SelectField>
                                                    {errors.risk_register_id && (
                                                        <p className="text-[10px] font-bold text-red-500">{errors.risk_register_id}</p>
                                                    )}
                                                </label>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                                            <label className="space-y-1">
                                                <FieldLabel required>ชื่อตัวชี้วัด KPI</FieldLabel>
                                                <input
                                                    className={formFieldClass}
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    placeholder="เช่น จำนวนมาตรการที่ดำเนินการเสร็จตามแผน"
                                                    required
                                                />
                                                {errors.name && <p className="text-[10px] font-bold text-red-500">{errors.name}</p>}
                                            </label>
                                        </div>

                                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
                                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                <label className="space-y-1">
                                                    <FieldLabel>เกณฑ์การวัด</FieldLabel>
                                                    <input
                                                        className={formFieldClass}
                                                        value={data.threshold}
                                                        onChange={(e) => setData('threshold', e.target.value)}
                                                        placeholder="เช่น มากกว่าหรือเท่ากับ 90%"
                                                    />
                                                </label>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                <label className="space-y-1">
                                                    <FieldLabel>หน่วยนับ</FieldLabel>
                                                    <input
                                                        className={formFieldClass}
                                                        value={data.unit}
                                                        onChange={(e) => setData('unit', e.target.value)}
                                                        placeholder="%, ครั้ง"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </RegistrySection>

                            <RegistrySection
                                icon={<Gauge className="h-4 w-4" />}
                                title="เป้าหมายและสถานะ"
                                subtitle="กำหนดค่าเป้าหมาย ทิศทางการประเมิน และสถานะปัจจุบันของ KPI"
                            >
                                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                                    <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                                        <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm shadow-slate-200/70">
                                            <label className="space-y-1">
                                                <FieldLabel>ค่าเป้าหมาย</FieldLabel>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    className={`${formFieldClass} bg-blue-50/40 text-lg font-black text-blue-800 focus:bg-white`}
                                                    value={data.target_value}
                                                    onBlur={() => setData('target_value', formatDecimalValue(data.target_value))}
                                                    onChange={(e) => setData('target_value', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                            </label>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                                            <label className="space-y-1">
                                                <FieldLabel required>สถานะปัจจุบัน</FieldLabel>
                                                <SelectField value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                                    <option value="in_progress">อยู่ระหว่างติดตาม</option>
                                                    <option value="met">บรรลุเป้า</option>
                                                    <option value="missed">ไม่บรรลุเป้า</option>
                                                </SelectField>
                                            </label>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white p-3 lg:col-span-2">
                                            <FieldLabel>ทิศทางการประเมิน</FieldLabel>
                                            <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                                {[
                                                    { label: 'ค่ายิ่งมากยิ่งดี', value: 'higher_better' },
                                                    { label: 'ค่ายิ่งน้อยยิ่งดี', value: 'lower_better' },
                                                    { label: 'ตามค่าเป้าหมาย', value: 'target_only' },
                                                ].map((item) => (
                                                    <label
                                                        key={item.value}
                                                        className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-xs font-black transition-all ${
                                                            data.direction === item.value
                                                                ? 'border-blue-600 bg-blue-700 text-white shadow-sm shadow-blue-200'
                                                                : 'border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-800'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="direction"
                                                            value={item.value}
                                                            checked={data.direction === item.value}
                                                            onChange={(e) => setData('direction', e.target.value)}
                                                            className="hidden"
                                                        />
                                                        {item.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </RegistrySection>

                            <div className="sticky bottom-2 z-20 rounded-xl border border-slate-200 bg-white/90 p-2.5 shadow-xl shadow-slate-300/40 backdrop-blur-md">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <ClipboardCheck className="h-4 w-4 text-blue-600" />
                                        ตรวจสอบข้อมูล KPI ก่อนบันทึก
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
                                            {kpi?.id ? 'บันทึกการแก้ไข' : 'เพิ่ม KPI ใหม่'}
                                        </button>
                                        {kpi?.id && canDelete && (
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-600 shadow-sm transition-all hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                ลบรายการ
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <KpiPreviewCard data={data} risks={risks} />
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
