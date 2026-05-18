import AppLayout from '@/layouts/app-layout';
import { useCanAny } from '@/lib/permissions';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { BarChart3, CalendarDays, ChevronDown, ClipboardCheck, Save, Trash2, X } from 'lucide-react';
import { type ChangeEvent, type FormEvent, type ReactNode } from 'react';

interface RiskOption {
    id: number;
    code: string;
    document_title: string;
}

interface KpiOption {
    id: number;
    code: string;
    name: string;
}

interface ControlData {
    id?: number;
    risk_register_id: string | number;
    risk_kpi_id?: string | number;
    code: string;
    name: string;
    description?: string;
    status: string;
    progress_percent: number;
    responsible_name?: string;
    start_date?: string;
    due_date?: string;
    note?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ฝ่ายแผนพัฒนาคุณภาพ', href: '/qmr/risk-management' },
    { title: 'มาตรการและการติดตามผล', href: '/qmr/risk-management/controls' },
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

function ControlSection({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode }) {
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

export default function RiskControls({ risks = [], kpis = [], control }: { risks?: RiskOption[]; kpis?: KpiOption[]; control?: ControlData }) {
    const canDelete = useCanAny(['qmr.delete', 'admin.delete', 'developer.view']);
    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
    } = useForm({
        risk_register_id: control?.risk_register_id || '',
        risk_kpi_id: control?.risk_kpi_id || '',
        code: control?.code || '',
        name: control?.name || '',
        description: control?.description || '',
        status: control?.status || 'active',
        progress_percent: control?.progress_percent || 0,
        responsible_name: control?.responsible_name || '',
        start_date: control?.start_date || '',
        due_date: control?.due_date || '',
        note: control?.note || '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (control?.id) {
            put(route('qmr.risk-management.controls.update', control.id));
        } else {
            post(route('qmr.risk-management.controls.store'));
        }
    };

    const handleDelete = () => {
        if (confirm('คุณต้องการลบมาตรการนี้ใช่หรือไม่?')) {
            destroy(route('qmr.risk-management.controls.destroy', control?.id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${control?.id ? 'แก้ไข' : 'เพิ่มมาตรการ'}ใหม่ - RiskGuard`} />

            <div className="relative min-h-screen bg-slate-50 p-2 font-anuphan text-slate-900 sm:p-3 lg:p-4">
                {/* Background Glow */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
                    <div className="absolute top-56 -right-24 h-80 w-80 rounded-full bg-cyan-100/40 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-[1440px]">
                    {/* Header */}
                    <header className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/40">
                        <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
                            <div className="border-b border-emerald-800 bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 px-4 py-4 text-white lg:border-r lg:border-b-0">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-white/10 p-2 ring-1 ring-white/15">
                                            <ClipboardCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black tracking-[0.2em] text-emerald-200 uppercase">
                                                Control Measures Tracking
                                            </p>
                                            <h1 className="mt-0.5 text-xl font-black tracking-tight">
                                                {control?.id ? 'แก้ไขมาตรการ' : 'เพิ่มมาตรการใหม่'}
                                            </h1>
                                            <p className="mt-0.5 text-xs font-medium text-slate-300">
                                                บันทึกรายละเอียด สถานะความคืบหน้า และผลการติดตามมาตรการควบคุมความเสี่ยง
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex w-fit items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-black text-white ring-1 ring-white/15">
                                        <CalendarDays className="h-4 w-4 text-emerald-200" />
                                        {control?.id ? 'แก้ไข' : 'ใหม่'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3">
                                <SummaryTile label="รหัสมาตรการ" value={data.code || '-'} />
                                <SummaryTile label="สถานะ" value={data.status || '-'} />
                                <SummaryTile label="ความคืบหน้า" value={`${data.progress_percent}%`} />
                                <SummaryTile label="ผู้รับผิดชอบ" value={data.responsible_name || '-'} />
                            </div>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="grid gap-3 xl:grid-cols-[1fr_340px]">
                        <div className="space-y-3">
                            {/* ข้อมูลมาตรการ */}
                            <ControlSection
                                icon={<ClipboardCheck className="h-4 w-4" />}
                                title="ข้อมูลมาตรการ"
                                subtitle="ระบุความเสี่ยงที่เกี่ยวข้อง และรายละเอียดมาตรการควบคุม"
                            >
                                <div className="space-y-3">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="space-y-1">
                                            <FieldLabel required>ความเสี่ยง/โอกาส/ความคาดหวัง</FieldLabel>
                                            <SelectField value={data.risk_register_id} onChange={(e) => setData('risk_register_id', e.target.value)}>
                                                <option value="">-- เลือกความเสี่ยง --</option>
                                                {risks.map((risk) => (
                                                    <option key={risk.id} value={risk.id}>
                                                        {risk.code} — {risk.document_title}
                                                    </option>
                                                ))}
                                            </SelectField>
                                        </label>

                                        <label className="space-y-1">
                                            <FieldLabel>KPI ที่เกี่ยวข้อง</FieldLabel>
                                            <SelectField value={data.risk_kpi_id} onChange={(e) => setData('risk_kpi_id', e.target.value)}>
                                                <option value="">-- เลือก KPI (ถ้ามี) --</option>
                                                {kpis.map((kpi) => (
                                                    <option key={kpi.id} value={kpi.id}>
                                                        {kpi.code} — {kpi.name}
                                                    </option>
                                                ))}
                                            </SelectField>
                                        </label>
                                    </div>

                                    <label className="space-y-1">
                                        <FieldLabel required>รหัสมาตรการ</FieldLabel>
                                        <input
                                            className={formFieldClass}
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value)}
                                            placeholder="เช่น CTR-QP-001"
                                            required
                                        />
                                    </label>

                                    <label className="space-y-1">
                                        <FieldLabel required>ชื่อมาตรการ</FieldLabel>
                                        <input
                                            className={formFieldClass}
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="เช่น สนับสนุน ส่งเสริมเกษตรกรผู้สนใจปลูกปาล์ม"
                                            required
                                        />
                                    </label>

                                    <label className="space-y-1">
                                        <FieldLabel>รายละเอียดมาตรการ</FieldLabel>
                                        <textarea
                                            className={`${formFieldClass} min-h-[104px] resize-none`}
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="บันทึกรายละเอียดการดำเนินงาน วิธีการ และเป้าหมายของมาตรการนี้..."
                                        />
                                    </label>
                                </div>
                            </ControlSection>

                            {/* ผลการติดตามและความคืบหน้า */}
                            <ControlSection
                                icon={<BarChart3 className="h-4 w-4" />}
                                title="ผลการติดตามและความคืบหน้า"
                                subtitle="ระบุสถานะ ความคืบหน้า และผลการติดตามตามรอบทบทวน"
                            >
                                <div className="space-y-3">
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        <label className="space-y-1">
                                            <FieldLabel required>สถานะ</FieldLabel>
                                            <SelectField value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                                <option value="active">Active (กำลังดำเนินการ)</option>
                                                <option value="complete">Complete (เสร็จสมบูรณ์)</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="cancel">Cancel</option>
                                            </SelectField>
                                        </label>

                                        <label className="space-y-1">
                                            <FieldLabel>ความคืบหน้า (%)</FieldLabel>
                                            <input
                                                className={formFieldClass}
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={data.progress_percent}
                                                onChange={(e) => setData('progress_percent', parseInt(e.target.value) || 0)}
                                            />
                                        </label>

                                        <label className="space-y-1">
                                            <FieldLabel>ผู้รับผิดชอบ</FieldLabel>
                                            <input
                                                className={formFieldClass}
                                                value={data.responsible_name}
                                                onChange={(e) => setData('responsible_name', e.target.value)}
                                                placeholder="เช่น ฝ่ายแผนพัฒนาคุณภาพ"
                                            />
                                        </label>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="space-y-1">
                                            <FieldLabel>วันที่เริ่ม</FieldLabel>
                                            <input
                                                className={formFieldClass}
                                                type="date"
                                                value={data.start_date}
                                                onChange={(e) => setData('start_date', e.target.value)}
                                            />
                                        </label>

                                        <label className="space-y-1">
                                            <FieldLabel>กำหนดเสร็จ</FieldLabel>
                                            <input
                                                className={formFieldClass}
                                                type="date"
                                                value={data.due_date}
                                                onChange={(e) => setData('due_date', e.target.value)}
                                            />
                                        </label>
                                    </div>

                                    <label className="space-y-1">
                                        <FieldLabel>ผลการติดตาม</FieldLabel>
                                        <textarea
                                            className={`${formFieldClass} min-h-[104px] resize-none`}
                                            value={data.note}
                                            onChange={(e) => setData('note', e.target.value)}
                                            placeholder="บันทึกผลการติดตามตามรอบทบทวน ความสำเร็จ ปัญหาที่พบ และแนวทางการปรับปรุง..."
                                        />
                                    </label>
                                </div>
                            </ControlSection>

                            {/* Sticky Footer */}
                            <div className="sticky bottom-2 z-20 rounded-xl border border-slate-200 bg-white/90 p-2.5 shadow-xl shadow-slate-300/40 backdrop-blur-md">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                                        ตรวจสอบข้อมูลก่อนบันทึกมาตรการและการติดตามผล
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
                                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0 disabled:opacity-50"
                                        >
                                            <Save className="h-4 w-4" />
                                            {control?.id ? 'บันทึกการแก้ไข' : 'บันทึกมาตรการ'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside className="space-y-3 xl:sticky xl:top-4 xl:self-start">
                            {/* Control Summary */}
                            <GlassPanel className="overflow-hidden">
                                <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 px-3 py-2.5 text-white">
                                    <div className="flex items-center gap-2">
                                        <ClipboardCheck className="h-4 w-4 text-emerald-300" />
                                        <h3 className="text-xs font-black tracking-widest uppercase">ข้อมูลมาตรการ</h3>
                                    </div>
                                </div>
                                <div className="space-y-1.5 p-3">
                                    <SummaryTile label="รหัสมาตรการ" value={data.code || 'ยังไม่ระบุ'} />
                                    <SummaryTile label="ชื่อมาตรการ" value={data.name || 'ยังไม่ระบุ'} />
                                    <SummaryTile label="ผู้รับผิดชอบ" value={data.responsible_name || 'ยังไม่ระบุ'} />
                                    <SummaryTile label="สถานะ" value={data.status || 'ยังไม่ระบุ'} />
                                </div>
                            </GlassPanel>

                            {/* Progress Indicator */}
                            <GlassPanel className="overflow-hidden border-emerald-100 bg-white shadow-emerald-100/50">
                                <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 px-3 py-3 text-white">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-emerald-200" />
                                        <h3 className="text-xs font-black tracking-widest uppercase">ความคืบหน้า</h3>
                                    </div>
                                </div>
                                <div className="space-y-2 p-3">
                                    <div className="text-center">
                                        <p className="text-3xl font-black text-emerald-600">{data.progress_percent}%</p>
                                        <p className="text-xs font-semibold text-slate-500">ความสำเร็จของมาตรการ</p>
                                    </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 shadow-sm">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                                            style={{ width: `${Math.min(data.progress_percent, 100)}%` }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-semibold">
                                        <div>
                                            <p className="text-slate-500">เริ่ม</p>
                                            <p className="text-slate-900">{data.start_date || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">เสร็จ</p>
                                            <p className="text-slate-900">{data.due_date || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </GlassPanel>

                            {/* Delete Button - if editing */}
                            {control?.id && canDelete && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-red-300/40 transition-all hover:-translate-y-0.5 hover:bg-red-700 active:translate-y-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    ลบมาตรการ
                                </button>
                            )}
                        </aside>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
