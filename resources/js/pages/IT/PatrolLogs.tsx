import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import axios from 'axios';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Filter,
    MapPin,
    Printer,
    QrCode,
    RefreshCw,
    ShieldCheck,
    XCircle,
} from 'lucide-react';

/* ─────────────── Types ─────────────── */
interface Checkpoint {
    id: number;
    code: string;
    name: string;
    area?: string | null;
    radius_meters: number;
    is_active: boolean;
    latitude?: number;
    longitude?: number;
}

interface PatrolLog {
    id: number;
    guard_name?: string | null;
    checkpoint_code: string;
    status: 'ok' | 'out_of_radius' | 'invalid_checkpoint' | 'inactive_checkpoint';
    distance_meters?: number | null;
    allowed_radius_meters?: number | null;
    checked_at: string;
    telegram_sent: boolean;
    scan_latitude?: number | null;
    scan_longitude?: number | null;
    checkpoint?: Pick<Checkpoint, 'id' | 'code' | 'name' | 'area' | 'latitude' | 'longitude'> | null;
    securityGuard?: { id: number; name: string; email?: string } | null;
}

const STATUS_CONFIG = {
    ok: {
        label: 'ผ่าน',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        icon: CheckCircle2,
    },
    out_of_radius: {
        label: 'นอกพื้นที่',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
        icon: AlertTriangle,
    },
    invalid_checkpoint: {
        label: 'QR ไม่ถูกต้อง',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500',
        icon: XCircle,
    },
    inactive_checkpoint: {
        label: 'ปิดใช้งาน',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
        dotClass: 'bg-slate-400',
        icon: XCircle,
    },
} as const;

const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));

const formatDistance = (value?: number | null, fractions = 1) => {
    if (typeof value !== 'number') return '-';
    return `${value.toLocaleString('th-TH', { maximumFractionDigits: fractions })} m`;
};

/* ─────────────── Leaflet Map subcomponent ─────────────── */
function PatrolMap({ logs, checkpoints }: { logs: PatrolLog[]; checkpoints: Checkpoint[] }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersGroupRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || typeof window === 'undefined') return;

        // Dynamically load Leaflet CSS & JS
        const loadLeaflet = async () => {
            if (!(window as any).L) {
                await new Promise<void>((resolve, reject) => {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    document.head.appendChild(link);

                    const script = document.createElement('script');
                    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                    script.onload = () => resolve();
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            return (window as any).L;
        };

        loadLeaflet().then((L) => {
            if (!mapRef.current) return;

            // Create map if not exists
            if (!mapInstance.current) {
                mapInstance.current = L.map(mapRef.current, {
                    center: [15.0, 100.0],
                    zoom: 6,
                    zoomControl: true,
                });
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                }).addTo(mapInstance.current);
            }

            const map = mapInstance.current;

            // Clear previous markers
            if (markersGroupRef.current) {
                markersGroupRef.current.clearLayers();
            } else {
                markersGroupRef.current = L.layerGroup().addTo(map);
            }

            const bounds: [number, number][] = [];

            // Checkpoint markers (blue)
            checkpoints.forEach((cp) => {
                if (!cp.latitude || !cp.longitude) return;
                const icon = L.divIcon({
                    className: '',
                    html: `<div style="width:14px;height:14px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                });
                const marker = L.marker([cp.latitude, cp.longitude], { icon });
                marker.bindPopup(`<b>${cp.name}</b><br>${cp.area ?? ''}<br>Radius: ${cp.radius_meters}m`);
                markersGroupRef.current.addLayer(marker);

                // Radius circle
                L.circle([cp.latitude, cp.longitude], {
                    radius: cp.radius_meters,
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.08,
                    weight: 1.5,
                }).addTo(markersGroupRef.current);

                bounds.push([cp.latitude, cp.longitude]);
            });

            // Log scan markers (colored by status)
            const colorMap: Record<string, string> = {
                ok: '#10b981',
                out_of_radius: '#f59e0b',
                invalid_checkpoint: '#f43f5e',
                inactive_checkpoint: '#94a3b8',
            };

            logs.slice(0, 100).forEach((log) => {
                if (!log.scan_latitude || !log.scan_longitude) return;
                const color = colorMap[log.status] ?? '#94a3b8';
                const icon = L.divIcon({
                    className: '',
                    html: `<div style="width:10px;height:10px;background:${color};border:1.5px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);opacity:0.85"></div>`,
                    iconSize: [10, 10],
                    iconAnchor: [5, 5],
                });
                const marker = L.marker([log.scan_latitude, log.scan_longitude], { icon });
                marker.bindPopup(
                    `<b>${log.checkpoint?.name ?? log.checkpoint_code}</b><br>` +
                    `${log.securityGuard?.name ?? log.guard_name ?? 'ไม่ระบุ'}<br>` +
                    `${formatDateTime(log.checked_at)}`
                );
                markersGroupRef.current.addLayer(marker);
                bounds.push([log.scan_latitude, log.scan_longitude]);
            });

            if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
            }
        }).catch(console.error);

        return () => {
            // don't destroy on re-render, only on unmount
        };
    }, [logs, checkpoints]);

    return (
        <div
            ref={mapRef}
            style={{ height: 380, width: '100%', borderRadius: '0 0 0.75rem 0.75rem' }}
            className="z-0"
        />
    );
}

/* ─────────────── Main Component ─────────────── */
const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'ฝ่ายสารสนเทศและเทคโนโลยี', href: '#' },
    { title: 'ตรวจพื้นที่ รปภ. QR', href: '/it/patrol' },
];

export default function PatrolLogs() {
    const [logs, setLogs] = useState<PatrolLog[]>([]);
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterCheckpointId, setFilterCheckpointId] = useState<string>('');
    const [filterDateFrom, setFilterDateFrom] = useState<string>('');
    const [filterDateTo, setFilterDateTo] = useState<string>('');
    const [showFilter, setShowFilter] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string | number> = { per_page: 100 };
            if (filterStatus) params.status = filterStatus;
            if (filterCheckpointId) params.checkpoint_id = filterCheckpointId;
            if (filterDateFrom) params.date_from = filterDateFrom;
            if (filterDateTo) params.date_to = filterDateTo;

            const [logsRes, checkpointsRes] = await Promise.all([
                axios.get('/api/patrol/logs', { params }),
                axios.get('/api/patrol/checkpoints'),
            ]);
            setLogs(logsRes.data.data ?? []);
            setCheckpoints(checkpointsRes.data.data ?? []);
        } catch {
            setError('ไม่สามารถโหลดข้อมูลตรวจพื้นที่ได้');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterCheckpointId, filterDateFrom, filterDateTo]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const summary = useMemo(() => {
        const ok = logs.filter((l) => l.status === 'ok').length;
        const issue = logs.length - ok;
        return { ok, issue, total: logs.length, checkpoints: checkpoints.length };
    }, [logs, checkpoints]);

    const activeFilters =
        [filterStatus, filterCheckpointId, filterDateFrom, filterDateTo].filter(Boolean).length;

    const clearFilters = () => {
        setFilterStatus('');
        setFilterCheckpointId('');
        setFilterDateFrom('');
        setFilterDateTo('');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ตรวจพื้นที่ รปภ. QR" />

            <div className="min-h-screen bg-slate-50 p-4 font-anuphan text-slate-900 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-6">

                    {/* ── Header ── */}
                    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                                <QrCode className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">ตรวจพื้นที่ รปภ. ด้วย QR Code</h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    ประวัติการสแกน QR · GPS radius · Telegram alert
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => router.visit('/it/patrol/checkpoints')}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                                <MapPin className="h-4 w-4" />
                                จัดการจุดตรวจ
                            </button>
                            <button
                                type="button"
                                onClick={() => router.visit('/it/patrol/qr-generator')}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                                <Printer className="h-4 w-4" />
                                สร้าง QR จุดตรวจ
                            </button>
                            <button
                                type="button"
                                onClick={() => router.visit('/it/patrol/scan')}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-500"
                            >
                                <QrCode className="h-4 w-4" />
                                สแกน QR ใหม่
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowFilter((v) => !v)}
                                className={`relative inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition ${
                                    showFilter || activeFilters > 0
                                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <Filter className="h-4 w-4" />
                                ตัวกรอง
                                {activeFilters > 0 && (
                                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">
                                        {activeFilters}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={fetchData}
                                disabled={loading}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                รีเฟรช
                            </button>
                        </div>
                    </div>

                    {/* ── Filter Panel ── */}
                    {showFilter && (
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="font-black text-slate-700">ตัวกรองข้อมูล</h3>
                                {activeFilters > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="text-xs font-bold text-red-500 hover:text-red-700"
                                    >
                                        ล้างตัวกรองทั้งหมด
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-500">สถานะ</label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-400 focus:outline-none"
                                    >
                                        <option value="">ทั้งหมด</option>
                                        <option value="ok">ผ่าน</option>
                                        <option value="out_of_radius">นอกพื้นที่</option>
                                        <option value="invalid_checkpoint">QR ไม่ถูกต้อง</option>
                                        <option value="inactive_checkpoint">ปิดใช้งาน</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-500">จุดตรวจ</label>
                                    <select
                                        value={filterCheckpointId}
                                        onChange={(e) => setFilterCheckpointId(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-400 focus:outline-none"
                                    >
                                        <option value="">ทั้งหมด</option>
                                        {checkpoints.map((cp) => (
                                            <option key={cp.id} value={cp.id}>
                                                {cp.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-500">จากวันที่</label>
                                    <input
                                        type="date"
                                        value={filterDateFrom}
                                        onChange={(e) => setFilterDateFrom(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-500">ถึงวันที่</label>
                                    <input
                                        type="date"
                                        value={filterDateTo}
                                        onChange={(e) => setFilterDateTo(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-400 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={fetchData}
                                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-black text-white transition hover:bg-blue-500"
                                >
                                    ค้นหา
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Error ── */}
                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                            {error}
                        </div>
                    )}

                    {/* ── Summary Cards ── */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[
                            { title: 'ผ่าน', value: summary.ok, icon: CheckCircle2, card: 'border-emerald-100 bg-emerald-50', icon_cls: 'text-emerald-600 bg-emerald-100', num: 'text-emerald-700' },
                            { title: 'ต้องตรวจสอบ', value: summary.issue, icon: AlertTriangle, card: 'border-amber-100 bg-amber-50', icon_cls: 'text-amber-600 bg-amber-100', num: 'text-amber-700' },
                            { title: 'Log ทั้งหมด', value: summary.total, icon: Clock, card: 'border-blue-100 bg-blue-50', icon_cls: 'text-blue-600 bg-blue-100', num: 'text-blue-700' },
                            { title: 'Checkpoint', value: summary.checkpoints, icon: MapPin, card: 'border-slate-200 bg-slate-50', icon_cls: 'text-slate-600 bg-slate-100', num: 'text-slate-700' },
                        ].map(({ title, value, icon: Icon, card, icon_cls, num }) => (
                            <div key={title} className={`rounded-xl border p-5 shadow-sm ${card}`}>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</p>
                                    <div className={`rounded-lg p-2 ${icon_cls}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                </div>
                                <p className={`mt-3 text-3xl font-black tabular-nums ${num}`}>
                                    {value.toLocaleString('th-TH')}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* ── Main Grid: Table + Sidebar ── */}
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">

                        {/* Table */}
                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 p-5">
                                <h2 className="font-black text-slate-800">ประวัติการตรวจ</h2>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    {loading ? 'กำลังโหลด...' : `${logs.length.toLocaleString('th-TH')} รายการ`}
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[780px] text-left">
                                    <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-400">
                                        <tr>
                                            <th className="px-5 py-3">เวลา</th>
                                            <th className="px-5 py-3">รปภ.</th>
                                            <th className="px-5 py-3">จุดตรวจ</th>
                                            <th className="px-5 py-3 text-right">ระยะ</th>
                                            <th className="px-5 py-3 text-center">สถานะ</th>
                                            <th className="px-5 py-3 text-center">Telegram</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                                                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-slate-300" />
                                                    กำลังโหลดข้อมูล...
                                                </td>
                                            </tr>
                                        ) : logs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                                                    ยังไม่มีประวัติการตรวจ
                                                </td>
                                            </tr>
                                        ) : (
                                            logs.map((log) => {
                                                const cfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.invalid_checkpoint;
                                                const StatusIcon = cfg.icon;
                                                return (
                                                    <tr key={log.id} className="transition-colors hover:bg-slate-50">
                                                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-600 whitespace-nowrap">
                                                            {formatDateTime(log.checked_at)}
                                                        </td>
                                                        <td className="px-5 py-3.5 text-sm font-bold text-slate-900">
                                                            {log.securityGuard?.name ?? log.guard_name ?? '-'}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <p className="text-sm font-bold text-slate-900">
                                                                {log.checkpoint?.name ?? log.checkpoint_code}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {log.checkpoint?.area ?? log.checkpoint_code}
                                                            </p>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-right text-sm font-bold tabular-nums text-slate-700">
                                                            {formatDistance(log.distance_meters)}
                                                            <span className="text-slate-400"> / {formatDistance(log.allowed_radius_meters)}</span>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-center">
                                                            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${cfg.className}`}>
                                                                <StatusIcon className="h-3.5 w-3.5" />
                                                                {cfg.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-center">
                                                            <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold ${log.telegram_sent ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                {log.telegram_sent ? 'ส่งแล้ว' : 'ยังไม่ส่ง'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Sidebar: Checkpoints */}
                        <aside className="space-y-6">
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                                    <h2 className="font-black text-slate-800">Checkpoint ที่เปิดใช้งาน</h2>
                                </div>
                                <div className="space-y-2.5">
                                    {checkpoints.length === 0 ? (
                                        <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-400">ยังไม่มี checkpoint</p>
                                    ) : (
                                        checkpoints.map((cp) => (
                                            <div key={cp.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-black text-slate-900">{cp.name}</p>
                                                        <p className="text-xs text-slate-500">{cp.area ?? 'ไม่ระบุพื้นที่'}</p>
                                                    </div>
                                                    <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-black text-blue-700 ring-1 ring-slate-200">
                                                        {cp.code}
                                                    </span>
                                                </div>
                                                <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                                                    <MapPin className="h-3 w-3" />
                                                    Radius {cp.radius_meters.toLocaleString('th-TH')} m
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="mb-3 text-sm font-black text-slate-700">ตำนาน (Map)</h3>
                                <div className="space-y-2">
                                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                        <div key={key} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <span className={`h-3 w-3 rounded-full ${cfg.dotClass}`} />
                                            {cfg.label}
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                        <span className="h-3 w-3 rounded-full bg-blue-500" />
                                        จุดตรวจ (Checkpoint)
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>

                    {/* ── Map Section ── */}
                    {(logs.some((l) => l.scan_latitude) || checkpoints.some((c) => c.latitude)) && (
                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 p-5">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                    <h2 className="font-black text-slate-800">แผนที่ตำแหน่งการตรวจ</h2>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    แสดงจุดที่สแกนและ checkpoint ทั้งหมด
                                </p>
                            </div>
                            <PatrolMap logs={logs} checkpoints={checkpoints} />
                        </section>
                    )}

                </div>
            </div>
        </AppLayout>
    );
}
