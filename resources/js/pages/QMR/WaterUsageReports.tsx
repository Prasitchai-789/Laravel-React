import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    Clock,
    Droplets,
    Eye,
    FileText,
    FlaskConical,
    Pencil,
    Plus,
    RotateCcw,
    Save,
    Search,
    Trash2,
    TrendingUp,
    User,
    Waves,
    X,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';

type UserType = {
    id: number;
    name: string;
    email: string;
};

type WaterUsageReport = {
    id: number;
    report_date: string;
    wastewater_meter_before: string | number;
    wastewater_meter_after: string | number;
    wastewater_volume: string | number;
    water_treatment_meter_before: string | number;
    water_treatment_meter_after: string | number;
    water_treatment_volume: string | number;
    raw_water_volume: string | number;
    sludge_weight_kg: string | number;
    em_usage_liter: string | number;
    molasses_usage_liter: string | number;
    note: string | null;
    created_at: string;
    user?: UserType | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedReports = {
    data: WaterUsageReport[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type Filters = {
    date_from?: string;
    date_to?: string;
    search?: string;
};

type LatestMeterReading = {
    report_date: string;
    wastewater_meter_after: string | number;
    water_treatment_meter_after: string | number;
};

type Props = {
    reports: PaginatedReports;
    filters: Filters;
    latestMeterReading?: LatestMeterReading | null;
    summary: {
        count: number;
        wastewater_volume: number;
        water_treatment_volume: number;
        sludge_weight_kg: number;
        em_usage_liter: number;
        molasses_usage_liter: number;
    };
};

type FormData = {
    report_date: string;
    wastewater_meter_before: string;
    wastewater_meter_after: string;
    water_treatment_meter_before: string;
    water_treatment_meter_after: string;
    sludge_weight_kg: string;
    em_usage_liter: string;
    molasses_usage_liter: string;
    note: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'บันทึกข้อมูลน้ำ', href: '/qmr/water-usage-reports' },
];

const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const today = toDateInputValue(new Date());

const formatNumber = (value: number | string) =>
    Number(value || 0).toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const calculateUsage = (before: string, after: string) => {
    const beforeNumber = Number(before || 0);
    const afterNumber = Number(after || 0);
    const usage = afterNumber - beforeNumber;

    return usage > 0 ? usage : 0;
};

const emptyFormData = (): FormData => ({
    report_date: today,
    wastewater_meter_before: '',
    wastewater_meter_after: '',
    water_treatment_meter_before: '',
    water_treatment_meter_after: '',
    sludge_weight_kg: '',
    em_usage_liter: '',
    molasses_usage_liter: '',
    note: '',
});

const createFormDataFromLatestReading = (latestMeterReading?: LatestMeterReading | null): FormData => ({
    ...emptyFormData(),
    wastewater_meter_before: latestMeterReading?.wastewater_meter_after ? String(latestMeterReading.wastewater_meter_after) : '',
    water_treatment_meter_before: latestMeterReading?.water_treatment_meter_after ? String(latestMeterReading.water_treatment_meter_after) : '',
});

const formatDate = (value: string) => {
    if (!value) return '-';

    const [year, month, day] = value.slice(0, 10).split('-').map(Number);

    if (year && month && day) {
        return new Intl.DateTimeFormat('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(new Date(year, month - 1, day));
    }

    return new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(value));
};

export default function WaterUsageReports({ reports, filters, latestMeterReading, summary }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [detailReport, setDetailReport] = useState<WaterUsageReport | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const [filterForm, setFilterForm] = useState<Filters>({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        search: filters.search ?? '',
    });

    const { data, setData, post, put, processing, errors, reset } = useForm<FormData>(emptyFormData());

    const calculatedWastewaterVolume = useMemo(
        () => calculateUsage(data.wastewater_meter_before, data.wastewater_meter_after),
        [data.wastewater_meter_before, data.wastewater_meter_after],
    );
    const calculatedTreatmentVolume = useMemo(
        () => calculateUsage(data.water_treatment_meter_before, data.water_treatment_meter_after),
        [data.water_treatment_meter_before, data.water_treatment_meter_after],
    );

    const closeModal = useCallback(() => {
        setModalOpen(false);
        setEditingId(null);
        reset();
        setData(emptyFormData());
    }, [reset, setData]);

    const closeDetailModal = useCallback(() => {
        setDetailReport(null);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;

            if (detailReport) {
                closeDetailModal();
                return;
            }

            if (modalOpen) closeModal();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [closeDetailModal, closeModal, detailReport, modalOpen]);

    useEffect(() => {
        document.body.style.overflow = modalOpen || detailReport ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [detailReport, modalOpen]);

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (editingId) {
            put(`/qmr/water-usage-reports/${editingId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                    showToast('อัปเดตสำเร็จ', 'ข้อมูลปริมาณน้ำถูกอัปเดตเรียบร้อยแล้ว');
                },
            });
            return;
        }

        post('/qmr/water-usage-reports', {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                showToast('บันทึกสำเร็จ', 'ข้อมูลปริมาณน้ำถูกบันทึกเรียบร้อยแล้ว');
            },
        });
    };

    const openCreateModal = () => {
        setEditingId(null);
        reset();
        setData(createFormDataFromLatestReading(latestMeterReading));
        setModalOpen(true);
    };

    const openEditModal = (report: WaterUsageReport) => {
        setEditingId(report.id);
        setData({
            report_date: String(report.report_date).slice(0, 10),
            wastewater_meter_before: String(report.wastewater_meter_before ?? ''),
            wastewater_meter_after: String(report.wastewater_meter_after ?? ''),
            water_treatment_meter_before: String(report.water_treatment_meter_before ?? ''),
            water_treatment_meter_after: String(report.water_treatment_meter_after ?? ''),
            sludge_weight_kg: String(report.sludge_weight_kg ?? ''),
            em_usage_liter: String(report.em_usage_liter ?? ''),
            molasses_usage_liter: String(report.molasses_usage_liter ?? ''),
            note: report.note ?? '',
        });
        setModalOpen(true);
    };

    const openDetailModal = (report: WaterUsageReport) => {
        setDetailReport(report);
    };

    const destroy = (report: WaterUsageReport) => {
        Swal.fire({
            title: 'ยืนยันการลบ',
            html: `
                <p class="text-gray-600">คุณต้องการลบข้อมูลวันที่</p>
                <p class="text-lg font-bold text-gray-900 mt-1">${formatDate(report.report_date)}</p>
                <p class="text-gray-600 mt-2">ใช่หรือไม่?</p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            focusCancel: true,
        }).then((result) => {
            if (!result.isConfirmed) return;

            router.delete(`/qmr/water-usage-reports/${report.id}`, {
                preserveScroll: true,
                onSuccess: () => showToast('ลบสำเร็จ', 'ข้อมูลถูกลบเรียบร้อยแล้ว'),
            });
        });
    };

    const search = (event: FormEvent) => {
        event.preventDefault();
        router.get('/qmr/water-usage-reports', filterForm, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setFilterForm({ date_from: '', date_to: '', search: '' });
        router.get('/qmr/water-usage-reports', {}, { preserveScroll: true, replace: true });
    };

    const hasActiveFilters = filterForm.date_from || filterForm.date_to || filterForm.search;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="รายงานปริมาณน้ำ" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                                        <Droplets className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                                ฝ่ายแผนพัฒนาคุณภาพ
                                            </span>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                                {reports.total.toLocaleString('th-TH')} รายการ
                                            </span>
                                        </div>
                                        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">รายงานปริมาณน้ำ</h1>
                                    </div>
                                </div>
                                <p className="ml-[60px] text-sm text-slate-500">
                                    บันทึกเลขมิเตอร์น้ำเสียและ Water Treatment พร้อมคำนวณปริมาณน้ำเข้า-ออกอัตโนมัติ
                                </p>
                            </div>

                            <button
                                onClick={openCreateModal}
                                className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
                            >
                                <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
                                บันทึกข้อมูลใหม่
                            </button>
                        </div>
                    </div>

                    <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        <SummaryCard
                            icon={CalendarDays}
                            label="จำนวนรายการทั้งหมด"
                            value={`${summary.count.toLocaleString('th-TH')} วัน`}
                            accentColor="blue"
                        />
                        <SummaryCard
                            icon={Droplets}
                            label="น้ำเข้า Treatment"
                            value={`${formatNumber(summary.water_treatment_volume)} ลบ.ม.`}
                            accentColor="emerald"
                        />
                        <SummaryCard
                            icon={Waves}
                            label="น้ำเสียเข้าระบบ"
                            value={`${formatNumber(summary.wastewater_volume)} ลบ.ม.`}
                            accentColor="rose"
                        />
                        <SummaryCard
                            icon={FlaskConical}
                            label="ตะกอนลงบ่อ"
                            value={`${formatNumber(summary.sludge_weight_kg)} Kg`}
                            accentColor="amber"
                        />
                        <SummaryCard
                            icon={Droplets}
                            label="EM / กากน้ำตาล"
                            value={`${formatNumber(summary.em_usage_liter)} / ${formatNumber(summary.molasses_usage_liter)} ล.`}
                            accentColor="purple"
                        />
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-6">
                            <form onSubmit={search}>
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Search className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-semibold text-slate-700">ตัวกรองข้อมูล</span>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <FilterDate
                                                label="ตั้งแต่วันที่"
                                                value={filterForm.date_from ?? ''}
                                                onChange={(value) => setFilterForm((prev) => ({ ...prev, date_from: value }))}
                                            />
                                            <FilterDate
                                                label="ถึงวันที่"
                                                value={filterForm.date_to ?? ''}
                                                onChange={(value) => setFilterForm((prev) => ({ ...prev, date_to: value }))}
                                            />
                                            <div>
                                                <label className="mb-2 block text-xs font-medium tracking-wider text-slate-500 uppercase">
                                                    ค้นหาหมายเหตุ
                                                </label>
                                                <div className="relative">
                                                    <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        value={filterForm.search ?? ''}
                                                        onChange={(event) => setFilterForm((prev) => ({ ...prev, search: event.target.value }))}
                                                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                                        placeholder="ค้นหาจากหมายเหตุ..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={clearFilters}
                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                ล้าง
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-[0.98]"
                                        >
                                            <Search className="h-4 w-4" />
                                            ค้นหา
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <WaterUsageTable reports={reports} openDetailModal={openDetailModal} openEditModal={openEditModal} destroy={destroy} />
                    </div>
                </div>
            </div>

            {detailReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Overlay */}
    <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={closeDetailModal}
    />

    {/* Modal Container */}
    <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-5">
            <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100">
                    <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold leading-tight text-slate-800">
                        รายงานปริมาณน้ำประจำวัน
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-400">
                        ข้อมูลปริมาณน้ำและผู้บันทึก
                    </p>
                </div>
            </div>
            <button
                onClick={closeDetailModal}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-500"
            >
                <X className="h-5 w-5" />
            </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-4 py-4">

            {/* Date Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    วันที่
                </div>
                <div className="text-xl font-semibold text-slate-800">
                    {formatDate(detailReport.report_date)}
                </div>
            </div>

            {/* Volume Metrics */}
            <div className="grid gap-4 sm:grid-cols-2">
                <DetailMetric
                    icon={Droplets}
                    label="ปริมาณน้ำดิบ"
                    value={`${formatNumber(detailReport.raw_water_volume)} ลบ.ม.`}
                    color="emerald"
                />
                <DetailMetric
                    icon={Waves}
                    label="ปริมาณน้ำเสีย"
                    value={`${formatNumber(detailReport.wastewater_volume)} ลบ.ม.`}
                    color="rose"
                />
            </div>

            {/* Recorder Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <User className="h-3.5 w-3.5" />
                    ผู้บันทึก
                </div>
                <div className="text-base font-medium text-slate-800">
                    {detailReport.user?.name ?? (
                        <span className="italic text-slate-400">ไม่ระบุ</span>
                    )}
                </div>
            </div>
        </div>
    </div>
</div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={closeModal} />
                    <div ref={modalRef} className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
                        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                                        editingId
                                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20'
                                            : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20'
                                    }`}
                                >
                                    {editingId ? <Pencil className="h-6 w-6 text-white" /> : <Plus className="h-6 w-6 text-white" />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{editingId ? 'แก้ไขข้อมูลน้ำ' : 'บันทึกข้อมูลน้ำ'}</h3>
                                    <p className="mt-1 text-sm text-slate-500">กรอกเลขมิเตอร์ก่อน-หลัง ระบบคำนวณปริมาณให้อัตโนมัติ</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submit}>
                            <div className="max-h-[65vh] overflow-y-auto px-8 py-6">
                                <div className="space-y-6">
                                    <div>
                                        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <CalendarDays className="h-4 w-4 text-slate-400" />
                                            วันที่บันทึก
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={data.report_date}
                                            onChange={(event) => setData('report_date', event.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                            required
                                        />
                                        {errors.report_date && <p className="mt-2 text-xs text-red-500">{errors.report_date}</p>}
                                        {!editingId && latestMeterReading && (
                                            <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 p-3">
                                                <Clock className="h-4 w-4 text-blue-500" />
                                                <p className="text-xs text-blue-700">
                                                    ดึงเลขมิเตอร์หลังจากวันที่ {formatDate(latestMeterReading.report_date)} มาเป็นมิเตอร์ก่อนแล้ว
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <MeterCard
                                            title="Water Treatment"
                                            icon={Droplets}
                                            color="emerald"
                                            calculatedValue={calculatedTreatmentVolume}
                                            beforeValue={data.water_treatment_meter_before}
                                            afterValue={data.water_treatment_meter_after}
                                            beforeError={errors.water_treatment_meter_before}
                                            afterError={errors.water_treatment_meter_after}
                                            onBeforeChange={(value) => setData('water_treatment_meter_before', value)}
                                            onAfterChange={(value) => setData('water_treatment_meter_after', value)}
                                        />
                                        <MeterCard
                                            title="น้ำเสีย"
                                            icon={Waves}
                                            color="rose"
                                            calculatedValue={calculatedWastewaterVolume}
                                            beforeValue={data.wastewater_meter_before}
                                            afterValue={data.wastewater_meter_after}
                                            beforeError={errors.wastewater_meter_before}
                                            afterError={errors.wastewater_meter_after}
                                            onBeforeChange={(value) => setData('wastewater_meter_before', value)}
                                            onAfterChange={(value) => setData('wastewater_meter_after', value)}
                                        />
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                        <h4 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                                            <FlaskConical className="h-5 w-5" />
                                            สารช่วยบำบัดและตะกอน
                                        </h4>
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <MeterInput
                                                label="ตะกอนลงบ่อ (Kg)"
                                                value={data.sludge_weight_kg}
                                                onChange={(value) => setData('sludge_weight_kg', value)}
                                                error={errors.sludge_weight_kg}
                                                required={false}
                                                color="amber"
                                            />
                                            <MeterInput
                                                label="EM (ลิตร)"
                                                value={data.em_usage_liter}
                                                onChange={(value) => setData('em_usage_liter', value)}
                                                error={errors.em_usage_liter}
                                                required={false}
                                                color="purple"
                                            />
                                            <MeterInput
                                                label="กากน้ำตาล (ลิตร)"
                                                value={data.molasses_usage_liter}
                                                onChange={(value) => setData('molasses_usage_liter', value)}
                                                error={errors.molasses_usage_liter}
                                                required={false}
                                                color="purple"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <FileText className="h-4 w-4 text-slate-400" />
                                            หมายเหตุ
                                        </label>
                                        <textarea
                                            value={data.note}
                                            onChange={(event) => setData('note', event.target.value)}
                                            rows={3}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                            placeholder="เพิ่มหมายเหตุ (ถ้ามี)..."
                                        />
                                        {errors.note && <p className="mt-2 text-xs text-red-500">{errors.note}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-8 py-5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200/50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60 ${
                                        editingId
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/25 hover:shadow-amber-500/30'
                                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/25 hover:shadow-blue-500/30'
                                    }`}
                                >
                                    {processing ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {editingId ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function showToast(title: string, text: string) {
    Swal.fire({
        icon: 'success',
        title,
        text,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
    });
}

function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <div>
            <label className="mb-2 block text-xs font-medium tracking-wider text-slate-500 uppercase">{label}</label>
            <input
                type="date"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
        </div>
    );
}

function WaterUsageTable({
    reports,
    openDetailModal,
    openEditModal,
    destroy,
}: {
    reports: PaginatedReports;
    openDetailModal: (report: WaterUsageReport) => void;
    openEditModal: (report: WaterUsageReport) => void;
    destroy: (report: WaterUsageReport) => void;
}) {
    return (
        <>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <TableHeader icon={CalendarDays} label="วันที่" />
                            <TableHeader icon={TrendingUp} label="น้ำเข้า Treatment" align="right" />
                            <TableHeader icon={Waves} label="น้ำเสียเข้าระบบ" align="right" />
                            <TableHeader icon={FlaskConical} label="สารช่วยบำบัด" align="right" />
                            <TableHeader icon={FileText} label="หมายเหตุ" />
                            <TableHeader icon={User} label="ผู้บันทึก" />
                            <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-slate-500 uppercase">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {reports.data.map((report) => (
                            <tr
                                key={report.id}
                                className="group transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50"
                            >
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900">{formatDate(report.report_date)}</div>
                                            <div className="text-xs text-slate-400">
                                                {new Date(report.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <VolumeCell
                                    before={report.water_treatment_meter_before}
                                    after={report.water_treatment_meter_after}
                                    volume={report.water_treatment_volume}
                                    color="emerald"
                                />
                                <VolumeCell
                                    before={report.wastewater_meter_before}
                                    after={report.wastewater_meter_after}
                                    volume={report.wastewater_volume}
                                    color="rose"
                                />
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex justify-end gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                            <FlaskConical className="h-3 w-3" />
                                            {formatNumber(report.sludge_weight_kg)} Kg
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                                            {formatNumber(report.em_usage_liter)}/{formatNumber(report.molasses_usage_liter)} ล.
                                        </span>
                                    </div>
                                </td>
                                <td className="max-w-xs px-6 py-5">
                                    {report.note ? (
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                                            <p className="line-clamp-2 text-sm text-slate-600">{report.note}</p>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-300">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="text-sm text-slate-600">{report.user?.name ?? '-'}</span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            onClick={() => openDetailModal(report)}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-100 hover:text-blue-800"
                                            title="รายละเอียด"
                                        >
                                            <Eye className="h-4 w-4" />
                                            รายละเอียด
                                        </button>
                                        <button
                                            onClick={() => openEditModal(report)}
                                            className="rounded-xl p-2 text-amber-600 transition-all hover:bg-amber-50 hover:text-amber-700"
                                            title="แก้ไข"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => destroy(report)}
                                            className="rounded-xl p-2 text-red-500 transition-all hover:bg-red-50 hover:text-red-600"
                                            title="ลบ"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {reports.data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
                        <Droplets className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-600">ยังไม่มีข้อมูล</h3>
                    <p className="mt-2 text-sm text-slate-400">คลิก "บันทึกข้อมูลใหม่" เพื่อเริ่มต้น</p>
                </div>
            )}

            {reports.data.length > 0 && (
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                    <span className="text-sm text-slate-500">
                        แสดง {reports.from ?? 0}-{reports.to ?? 0} จาก {reports.total.toLocaleString('th-TH')} รายการ
                    </span>
                    <div className="flex gap-1">
                        {reports.links.map((link, index) =>
                            link.url ? (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url}
                                    preserveScroll
                                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-medium transition-all ${
                                        link.active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span
                                    key={`${link.label}-${index}`}
                                    className="inline-flex h-10 min-w-10 items-center justify-center px-3 text-sm text-slate-300"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ),
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

function DetailMetric({ icon: Icon, label, value, color }: { icon: typeof Droplets; label: string; value: string; color: 'emerald' | 'rose' }) {
    const colorClass = color === 'emerald' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-rose-100 bg-rose-50 text-rose-700';

    return (
        <div className={`rounded-2xl border p-5 ${colorClass}`}>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
}

function TableHeader({ icon: Icon, label, align = 'left' }: { icon: typeof CalendarDays; label: string; align?: 'left' | 'right' }) {
    return (
        <th className={`px-6 py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase ${align === 'right' ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
        </th>
    );
}

function VolumeCell({
    before,
    after,
    volume,
    color,
}: {
    before: string | number;
    after: string | number;
    volume: string | number;
    color: 'emerald' | 'rose';
}) {
    const colorClass = color === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700';
    const unitClass = color === 'emerald' ? 'text-emerald-600' : 'text-rose-600';

    return (
        <td className="px-6 py-5 text-right whitespace-nowrap">
            <div className="space-y-1">
                <div className="text-xs text-slate-400">
                    {formatNumber(before)} &rarr; {formatNumber(after)}
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${colorClass}`}>
                    {formatNumber(volume)}
                    <span className={`text-xs font-normal ${unitClass}`}>ลบ.ม.</span>
                </span>
            </div>
        </td>
    );
}

function MeterCard({
    title,
    icon: Icon,
    color,
    calculatedValue,
    beforeValue,
    afterValue,
    beforeError,
    afterError,
    onBeforeChange,
    onAfterChange,
}: {
    title: string;
    icon: typeof Droplets;
    color: 'emerald' | 'rose';
    calculatedValue: number;
    beforeValue: string;
    afterValue: string;
    beforeError?: string;
    afterError?: string;
    onBeforeChange: (value: string) => void;
    onAfterChange: (value: string) => void;
}) {
    const colorClasses =
        color === 'emerald'
            ? 'border-emerald-100 from-emerald-50/50 text-emerald-800 bg-emerald-100 text-emerald-700'
            : 'border-rose-100 from-rose-50/50 text-rose-800 bg-rose-100 text-rose-700';
    const [borderClass, fromClass, titleClass, badgeBgClass, badgeTextClass] = colorClasses.split(' ');

    return (
        <div className={`rounded-2xl border-2 ${borderClass} bg-gradient-to-br ${fromClass} to-white p-6`}>
            <div className="mb-4 flex items-center justify-between">
                <h4 className={`flex items-center gap-2 font-semibold ${titleClass}`}>
                    <Icon className="h-5 w-5" />
                    {title}
                </h4>
                <span className={`rounded-xl ${badgeBgClass} px-3 py-1.5 text-sm font-bold ${badgeTextClass}`}>
                    {formatNumber(calculatedValue)} ลบ.ม.
                </span>
            </div>
            <div className="space-y-4">
                <MeterInput label="เลขมิเตอร์ก่อน" value={beforeValue} onChange={onBeforeChange} error={beforeError} color={color} />
                <MeterInput label="เลขมิเตอร์หลัง" value={afterValue} onChange={onAfterChange} error={afterError} color={color} />
            </div>
        </div>
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    accentColor,
}: {
    icon: typeof Droplets;
    label: string;
    value: string;
    accentColor: 'blue' | 'emerald' | 'rose' | 'amber' | 'purple';
}) {
    const colorMap = {
        blue: 'from-blue-500 to-blue-600',
        emerald: 'from-emerald-500 to-emerald-600',
        rose: 'from-rose-500 to-rose-600',
        amber: 'from-amber-500 to-amber-600',
        purple: 'from-purple-500 to-purple-600',
    };

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 opacity-50 transition-transform group-hover:scale-150" />
            <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${colorMap[accentColor]} shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                </div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
            </div>
        </div>
    );
}

function MeterInput({
    label,
    value,
    onChange,
    error,
    required = true,
    color = 'blue',
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
    color?: 'blue' | 'rose' | 'emerald' | 'amber' | 'purple';
}) {
    const colorClasses = {
        blue: 'focus:border-blue-500 focus:ring-blue-100',
        rose: 'focus:border-rose-500 focus:ring-rose-100',
        emerald: 'focus:border-emerald-500 focus:ring-emerald-100',
        amber: 'focus:border-amber-500 focus:ring-amber-100',
        purple: 'focus:border-purple-500 focus:ring-purple-100',
    };

    const formatWithCommas = (val: string) => {
        if (!val) return '';
        const parts = val.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (/^\d*\.?\d*$/.test(rawValue)) {
            onChange(rawValue);
        }
    };

    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <input
                type="text"
                inputMode="decimal"
                value={formatWithCommas(value)}
                onChange={handleTextChange}
                className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium transition-all hover:bg-white focus:bg-white focus:ring-2 focus:outline-none ${colorClasses[color]}`}
                placeholder="0.00"
                required={required}
            />
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>
    );
}
