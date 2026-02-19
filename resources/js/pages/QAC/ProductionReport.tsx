
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Droplets, Package, Sprout, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/* ------------------------------------------
   Breadcrumb
------------------------------------------- */
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Report Productions', href: '#' },
];

/* ------------------------------------------
   Helper แสดงตัวเลขแบบมีทศนิยม
------------------------------------------- */
const fmt = (v: any, digits: number = 3): string => {
    if (v === null || v === undefined || v === '' || isNaN(Number(v)) || Number(v) === 0) return '-';
    return Number(v).toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
};

/* ------------------------------------------
   Helper สี FFA / DOBI
------------------------------------------- */
const getQualityColor = (type: 'ffa' | 'dobi', value: number | string): string => {
    const num = Number(value);
    if (isNaN(num)) return 'text-gray-600';
    if (type === 'ffa') return num > 5 ? 'text-red-600 font-bold' : 'text-gray-600';
    return num < 2 ? 'text-red-600 font-bold' : 'text-gray-600';
};

export default function ProductionReport() {
    const [prod, setProd] = useState<any | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [ffbTrend, setFfbTrend] = useState<any[]>([]);

    /* ------------------------------------------
       Convert Date → YYYY-MM-DD
    ------------------------------------------- */
    const toISODate = (input: any): string => {
        if (!input) return '';
        try {
            if (input === 'latest') return 'latest';
            if (typeof input === 'string' && input.includes('Nov')) {
                const d = new Date(input.replace(' 12:00:00:AM', ''));
                if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
            }
            const d = new Date(input);
            return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    /* ------------------------------------------
       Fetch Summary + Trend 7 วัน
    ------------------------------------------- */
    const fetchSummary = async (dateParam?: string, isLatest = false) => {
        try {
            setLoading(true);

            // query
            const query = dateParam && dateParam !== 'latest' ? `?date=${encodeURIComponent(dateParam)}` : '?date=latest';

            const res = await fetch(`/report/productions/summary${query}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();

            if (json.success) {
                setProd(json);
                if (json.date) setSelectedDate(toISODate(json.date));
                setFfbTrend(json.ffb_trend_7days ?? []);
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'ไม่พบข้อมูล',
                    text: json.message || 'ไม่พบข้อมูล',
                });
                setProd(null);
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'โหลดข้อมูลล้มเหลว' });
            setProd(null);
        } finally {
            setLoading(false);
        }
    };

    // โหลดครั้งแรก
    useEffect(() => {
        fetchSummary('latest', true);
    }, []);

    const handleLoadLatest = () => fetchSummary('latest', true);

    const maxTrendValue = React.useMemo(() => {
        if (!ffbTrend || ffbTrend.length === 0) return 1;
        let max = 0;
        ffbTrend.forEach((d) => {
            max = Math.max(max, d.ffb_purchase ?? 0, d.ffb_good_qty ?? 0);
        });
        return max || 1;
    }, [ffbTrend]);

    // -------------------------------------------------------------
    // BEGIN LAYOUT
    // -------------------------------------------------------------
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {/* -------------------- MOBILE VIEW (sm:hidden) -------------------- */}
            <div className="space-y-2 p-2 font-anuphan sm:hidden">
                {/* Header Mobile */}
                <div className="mb-1 flex flex-row items-start justify-between border-b border-blue-200/50 pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
                            รายงานการผลิต
                        </h2>
                        <p className="mt-0.5 flex items-center text-xs text-gray-500">
                            <BarChart3 size={12} className="mr-1" />
                            ข้อมูลการผลิตประจำวัน
                        </p>
                    </div>

                    {/* Date Picker */}
                    <div className="mt-2 flex items-center space-x-2 sm:mt-0">
                        <div className="flex items-center space-x-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1">
                            <Calendar size={14} className="text-blue-600" />
                            <input
                                type="date"
                                value={selectedDate || ''}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    fetchSummary(e.target.value);
                                }}
                                className="bg-blue-50 text-xs font-semibold text-blue-700 outline-none"
                            />
                        </div>

                        <button
                            onClick={handleLoadLatest}
                            disabled={loading}
                            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs text-white hover:bg-emerald-600"
                        >
                            โหลดล่าสุด
                        </button>
                    </div>
                </div>

                <div className="mb-1 grid grid-cols-2 gap-2">
                    {/* FFB Card Mobile */}
                    <MobileSectionCardA
                        icon={<Package size={16} className="text-teal-600" />}
                        title="ปริมาณผลปาล์ม"
                        rows={[
                            { label: 'ยอดยกมา', value: fmt(prod?.ffb_forward), className: 'bg-white/70' },
                            { label: 'รับเข้า', value: fmt(prod?.ffb_purchase), className: 'bg-teal-100/70 text-teal-800 font-bold' },
                            { label: 'เบิกผลิต', value: fmt(prod?.ffb_good_qty), className: 'bg-emerald-100/70 text-emerald-800 font-bold' },
                            { label: 'ยกไป', value: fmt(prod?.ffb_remain), className: 'bg-cyan-100/70 text-cyan-800 font-bold' },
                        ]}
                        wrapperTone="from-teal-50/80 to-cyan-50/80 border-teal-200"
                    />
                    <div className="grid grid-cols-1 gap-2">
                        {/* Trend Chart Mobile */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-1 shadow-sm"
                        >
                            <div className="mb-2 flex items-center space-x-1">
                                <TrendingUp size={16} className="text-emerald-600" />
                                <p className="text-[13px] font-bold text-gray-700">แนวโน้มการผลิต</p>
                            </div>

                            <div className="flex h-20 w-full flex-col px-1 py-1">
                                {(!ffbTrend || ffbTrend.length === 0) && (
                                    <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                                        ยังไม่มีข้อมูลแนวโน้ม 7 วันย้อนหลัง
                                    </div>
                                )}

                                {ffbTrend && ffbTrend.length > 0 && (
                                    <>
                                        <div className="flex flex-1 items-end space-x-1 overflow-x-auto">
                                            {ffbTrend.map((d) => {
                                                const purchase = d.ffb_purchase ?? 0;
                                                const good = d.ffb_good_qty ?? 0;
                                                const purchaseHeight = (purchase / maxTrendValue) * 100;
                                                const goodHeight = (good / maxTrendValue) * 100;

                                                const label = d.date
                                                    ? new Date(d.date).toLocaleDateString('th-TH', {
                                                          day: '2-digit',
                                                      })
                                                    : '';

                                                return (
                                                    <div key={d.date} className="flex flex-col items-center text-[9px] text-gray-500">
                                                        <div className="flex h-14 w-5 items-end space-x-[1px]">
                                                            <div
                                                                className="w-1/2 rounded-t bg-emerald-500/80"
                                                                style={{ height: `${purchaseHeight}%` }}
                                                            />
                                                            <div className="w-1/2 rounded-t bg-sky-500/80" style={{ height: `${goodHeight}%` }} />
                                                        </div>
                                                        <span className="mt-1 text-[8px]">{label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                    </>
                                )}
                            </div>
                        </motion.div>
                                <div className="grid grid-cols-2 gap-2">
                        {/* Monthly Summary Mobile */}
                        <MobileCardNumberVertical title="ยอดรับเข้า" value={fmt(prod?.ffb_purchase_month, 2)} tone="emerald" />
                        <MobileCardNumberVertical title="ยอดเบิกผลิต" value={fmt(prod?.ffb_good_qty_month, 2)} tone="teal" />
                        </div>
                    </div>
                </div>
                <div className="mb-1 grid grid-cols-2 gap-2">
                    {/* CPO Mobile */}
                    <MobileSectionCard
                        icon={<Droplets size={16} className="text-amber-600" />}
                        title="น้ำมันปาล์มดิบ (CPO)"
                        rows={[
                            { label: 'ยอดยกมา', value: fmt(prod?.previous_total_cpo), className: 'bg-white/70' },
                            { label: 'ผลิตได้', value: fmt(prod?.result?.cpo_today), className: 'bg-amber-100/70 text-amber-800 font-bold' },
                            { label: 'Skim', value: fmt(prod?.skim), className: 'bg-red-100/60 text-red-700 font-bold' },
                            { label: 'ขาย', value: fmt(prod?.sales_cpo_tons), className: 'bg-emerald-100/70 text-emerald-800 font-bold' },
                            { label: 'ยกไป', value: fmt(prod?.total_cpo), className: 'bg-amber-100/70 text-amber-800 font-bold' },
                        ]}
                        metrics={[
                            { label: '%Yield', value: fmt(prod?.yield_percent, 2), color: 'text-amber-700 font-bold', bg: 'bg-amber-100/70' },
                            { label: '%FFA', value: fmt(prod?.ffa_cpo, 2), color: getQualityColor('ffa', prod?.ffa_cpo), bg: 'bg-yellow-100/70' },
                            { label: 'DOBI', value: fmt(prod?.dobi_cpo, 2), color: getQualityColor('dobi', prod?.dobi_cpo), bg: 'bg-orange-100/70' },
                        ]}
                        wrapperTone="from-amber-50/80 to-yellow-50/80 border-amber-200"
                    />

                    {/* Kernel Mobile */}
                    <MobileSectionCard
                        icon={<Sprout size={16} className="text-emerald-600" />}
                        title="เมล็ดในปาล์ม (Kernel)"
                        rows={[
                            { label: 'ยอดยกมา', value: fmt(prod?.previous_total_kn), className: 'bg-white/70' },
                            { label: 'ผลิตได้', value: fmt(prod?.result?.kernel_today), className: 'bg-emerald-100/70 text-emerald-800 font-bold' },
                            { label: 'ขาย', value: fmt(prod?.sales_kn_tons), className: 'bg-green-100/70 text-green-800 font-bold' },
                            { label: 'ยกไป', value: fmt(prod?.total_kn), className: 'bg-teal-100/70 text-teal-800 font-bold' },
                        ]}
                        metrics={[
                            { label: '%Yield', value: fmt(prod?.result?.kn_yield, 2), color: 'text-emerald-700 font-bold', bg: 'bg-emerald-100/70' },
                            { label: '%Moist', value: fmt(prod?.moisture_percent, 2), color: 'text-teal-700 font-bold', bg: 'bg-teal-100/70' },
                            { label: '%Dirt', value: fmt(prod?.dirt_percent, 2), color: 'text-cyan-700 font-bold', bg: 'bg-cyan-100/70' },
                        ]}
                        wrapperTone="from-emerald-50/80 to-teal-50/80 border-emerald-200"
                    />
                </div>
                <div className="mb-1 grid grid-cols-2 gap-2">
                    {/* Stock CPO Mobile */}
                    <MobileSectionCardB
                        icon={<Droplets size={16} className="text-amber-600" />}
                        title="Stock CPO"
                        rows={[
                            {
                                label: 'Tank',
                                value: 'ปริมาณ',
                                ffa: '%FFA',
                                dobi: 'DOBI',
                                className: 'bg-gray-200/70 font-bold text-gray-800 py-1 text-[10px]',
                            },
                            {
                                label: 'T1',
                                value: fmt(prod?.cpo_data_tank?.t1?.volume),
                                ffa: fmt(prod?.cpo_data_tank?.t1?.ffa, 2),
                                dobi: fmt(prod?.cpo_data_tank?.t1?.dobi, 2),
                                className: 'bg-amber-50/70',
                                ffaColor: getQualityColor('ffa', prod?.cpo_data_tank?.t1?.ffa),
                                dobiColor: getQualityColor('dobi', prod?.cpo_data_tank?.t1?.dobi),
                            },
                            {
                                label: 'T2',
                                value: fmt(prod?.cpo_data_tank?.t2?.volume),
                                ffa: fmt(prod?.cpo_data_tank?.t2?.ffa, 2),
                                dobi: fmt(prod?.cpo_data_tank?.t2?.dobi, 2),
                                className: 'bg-amber-50/70',
                                ffaColor: getQualityColor('ffa', prod?.cpo_data_tank?.t2?.ffa),
                                dobiColor: getQualityColor('dobi', prod?.cpo_data_tank?.t2?.dobi),
                            },
                            {
                                label: 'T3',
                                value: fmt(prod?.cpo_data_tank?.t3?.volume),
                                ffa: fmt(prod?.cpo_data_tank?.t3?.ffa, 2),
                                dobi: fmt(prod?.cpo_data_tank?.t3?.dobi, 2),
                                className: 'bg-amber-50/70',
                                ffaColor: getQualityColor('ffa', prod?.cpo_data_tank?.t3?.ffa),
                                dobiColor: getQualityColor('dobi', prod?.cpo_data_tank?.t3?.dobi),
                            },
                            {
                                label: 'T4',
                                value: fmt(prod?.cpo_data_tank?.t4?.volume),
                                ffa: fmt(prod?.cpo_data_tank?.t4?.ffa, 2),
                                dobi: fmt(prod?.cpo_data_tank?.t4?.dobi, 2),
                                className: 'bg-amber-50/70',
                                ffaColor: getQualityColor('ffa', prod?.cpo_data_tank?.t4?.ffa),
                                dobiColor: getQualityColor('dobi', prod?.cpo_data_tank?.t4?.dobi),
                            },
                            {
                                label: 'รวม',
                                value: fmt(prod?.cpo_data_tank?.summary?.total_cpo),
                                ffa: fmt(prod?.cpo_data_tank?.summary?.ffa_cpo, 2),
                                dobi: fmt(prod?.cpo_data_tank?.summary?.dobi_cpo, 2),
                                className: 'bg-amber-200/70 font-bold text-amber-900',
                                ffaColor: getQualityColor('ffa', prod?.cpo_data_tank?.summary?.ffa_cpo),
                                dobiColor: getQualityColor('dobi', prod?.cpo_data_tank?.summary?.dobi_cpo),
                            },
                        ]}
                        wrapperTone="from-amber-50/80 to-orange-50/80 border-amber-200"
                    />

                    {/* Stock By Products Mobile */}
                    <MobileSectionCardA
                        icon={<Package size={16} className="text-emerald-600" />}
                        title="Stock By Products"
                        rows={[
                            { label: 'Kernel (Silo)', value: fmt(prod?.total_kn), className: 'bg-emerald-100/70 text-emerald-800 font-bold' },
                            { label: 'EFB Fiber', value: fmt(prod?.efb_fiber), className: 'bg-teal-100/70 text-teal-800 font-bold' },
                            { label: 'Shell', value: fmt(prod?.shell), className: 'bg-green-100/70 text-green-800 font-bold' },
                            { label: 'NUT (Silo)', value: fmt(prod?.nut), className: 'bg-gray-100/70 text-gray-800 font-bold' },
                            { label: 'NUT กองนอก', value: fmt(prod?.nut_out), className: 'bg-gray-100/70 text-gray-800 font-bold' },
                            { label: 'Silo อบ 1', value: fmt(prod?.silo_1), className: 'bg-cyan-100/70 text-cyan-800 font-bold' },
                            { label: 'Silo อบ 2', value: fmt(prod?.silo_2), className: 'bg-cyan-100/70 text-cyan-800 font-bold' },
                        ]}
                        wrapperTone="from-emerald-50/80 to-teal-50/80 border-emerald-200"
                    />
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-8xl mx-auto hidden rounded-xl border border-blue-100/50 bg-gradient-to-br from-white to-blue-50/30 p-2 font-anuphan shadow-lg sm:block sm:p-3"
            >
                {/* -------------------- HEADER -------------------- */}
                <div className="mb-1 flex flex-row items-start justify-between border-b border-blue-200/50 pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
                            รายงานการผลิต
                        </h2>
                        <p className="mt-0.5 flex items-center text-xs text-gray-500">
                            <BarChart3 size={12} className="mr-1" />
                            ข้อมูลการผลิตประจำวัน
                        </p>
                    </div>

                    {/* Date Picker */}
                    <div className="mt-2 flex items-center space-x-2 sm:mt-0">
                        <div className="flex items-center space-x-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1">
                            <Calendar size={14} className="text-blue-600" />
                            <input
                                type="date"
                                value={selectedDate || ''}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    fetchSummary(e.target.value);
                                }}
                                className="bg-blue-50 text-xs font-semibold text-blue-700 outline-none"
                            />
                        </div>

                        <button
                            onClick={handleLoadLatest}
                            disabled={loading}
                            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs text-white hover:bg-emerald-600"
                        >
                            โหลดล่าสุด
                        </button>
                    </div>
                </div>

                {/* -------------------- ROW 1 (FFB + Trend + Monthly) -------------------- */}
                <div className="mb-1 grid grid-cols-3 gap-2 sm:grid-cols-2 md:grid-cols-6 xl:grid-cols-12">
                    {/* FFB Card */}
                    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="sm:col-span-2 md:col-span-2 xl:col-span-4">
                        <SectionCardA
                            icon={<Package size={16} className="text-teal-600" />}
                            title="ปริมาณผลปาล์ม (FFB)"
                            rows={[
                                { label: 'ยอดยกมา', value: fmt(prod?.ffb_forward), className: 'bg-white/70' },
                                { label: 'รับเข้า', value: fmt(prod?.ffb_purchase), className: 'bg-teal-100/70 text-teal-800 font-bold' },
                                { label: 'เบิกผลิต', value: fmt(prod?.ffb_good_qty), className: 'bg-emerald-100/70 text-emerald-800 font-bold' },
                                { label: 'ยกไป', value: fmt(prod?.ffb_remain), className: 'bg-cyan-100/70 text-cyan-800 font-bold' },
                            ]}
                            wrapperTone="from-teal-50/80 to-cyan-50/80 border-teal-200"
                        />
                    </motion.div>
                    {/* -------------------- TREND CHART -------------------- */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 }}
                        className="flex flex-col justify-center rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-2 shadow-sm sm:col-span-2 md:col-span-3 xl:col-span-5"
                    >
                        <div className="mb-2 flex items-center space-x-1">
                            <TrendingUp size={16} className="text-emerald-600" />
                            <p className="text-sm font-bold text-gray-700">แนวโน้มการผลิต</p>
                        </div>

                        <div className="flex h-32 w-full flex-col px-1 py-1 sm:h-36">
                            {/* ไม่มีข้อมูล */}
                            {(!ffbTrend || ffbTrend.length === 0) && (
                                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                    ยังไม่มีข้อมูลแนวโน้ม 7 วันย้อนหลัง
                                </div>
                            )}

                            {/* มีข้อมูล */}
                            {ffbTrend && ffbTrend.length > 0 && (
                                <>
                                    <div className="flex flex-1 items-end space-x-1 overflow-x-auto">
                                        {ffbTrend.map((d) => {
                                            const purchase = d.ffb_purchase ?? 0;
                                            const good = d.ffb_good_qty ?? 0;

                                            const purchaseHeight = (purchase / maxTrendValue) * 100;
                                            const goodHeight = (good / maxTrendValue) * 100;

                                            const label = d.date
                                                ? new Date(d.date).toLocaleDateString('th-TH', {
                                                      day: '2-digit',
                                                      month: '2-digit',
                                                  })
                                                : '';

                                            return (
                                                <div key={d.date} className="flex flex-col items-center text-[10px] text-gray-500">
                                                    <div className="flex h-12 w-6 items-end space-x-[1px] sm:h-14">
                                                        <div className="w-1/2 rounded-t bg-emerald-500/80" style={{ height: `${purchaseHeight}%` }} />
                                                        <div className="w-1/2 rounded-t bg-sky-500/80" style={{ height: `${goodHeight}%` }} />
                                                    </div>
                                                    <span className="mt-1 text-[9px]">{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Legend */}
                                    <div className="mt-2 flex items-center justify-center space-x-3 text-[10px] text-gray-500">
                                        <div className="flex items-center space-x-1">
                                            <span className="h-2 w-3 rounded bg-emerald-500/80"></span>
                                            <span>รับเข้า</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <span className="h-2 w-3 rounded bg-sky-500/80"></span>
                                            <span>เบิกผลิต</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* -------------------- MONTHLY SUMMARY -------------------- */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 xl:col-span-3">
                        <CardNumberVertical title="ยอดรับเข้าทั้งเดือน" value={fmt(prod?.ffb_purchase_month, 2)} tone="emerald" />

                        <CardNumberVertical title="ยอดเบิกผลิต" value={fmt(prod?.ffb_good_qty_month, 2)} tone="teal" />
                    </div>
                </div>

                {/* ---------------------------------------------------
                   ROW 2 : CPO + Kernel (Responsive)
                --------------------------------------------------- */}
                <div className="mb-1 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-12">
                    {/* -------------------- CPO -------------------- */}
                    <div className="sm:col-span-2 lg:col-span-1 xl:col-span-6">
                        <SectionCard
                            icon={<Droplets size={16} className="text-amber-600" />}
                            title="น้ำมันปาล์มดิบ (CPO)"
                            rows={[
                                { label: 'ยอดยกมา', value: fmt(prod?.previous_total_cpo), className: 'bg-white/70' },
                                { label: 'ผลิตได้', value: fmt(prod?.result?.cpo_today), className: 'bg-amber-100/70 text-amber-800 font-bold' },
                                { label: 'Skim', value: fmt(prod?.skim), className: 'bg-red-100/60 text-red-700 font-bold' },
                                { label: 'ขาย', value: fmt(prod?.sales_cpo_tons), className: 'bg-emerald-100/70 text-emerald-800 font-bold' },
                                { label: 'ยกไป', value: fmt(prod?.total_cpo), className: 'bg-amber-100/70 text-amber-800 font-bold' },
                            ]}
                            metrics={[
                                { label: '%Yield', value: fmt(prod?.yield_percent, 2), color: 'text-amber-700 font-bold', bg: 'bg-amber-100/70' },
                                { label: '%FFA', value: fmt(prod?.ffa_cpo, 2), color: getQualityColor('ffa', prod?.ffa_cpo), bg: 'bg-yellow-100/70' },
                                {
                                    label: 'DOBI',
                                    value: fmt(prod?.dobi_cpo, 2),
                                    color: getQualityColor('dobi', prod?.dobi_cpo),
                                    bg: 'bg-orange-100/70',
                                },
                            ]}
                            wrapperTone="from-amber-50/80 to-yellow-50/80 border-amber-200"
                        />
                    </div>

                    {/* -------------------- KERNEL -------------------- */}
                    <div className="sm:col-span-2 lg:col-span-1 xl:col-span-6">
                        <SectionCard
                            icon={<Sprout size={16} className="text-emerald-600" />}
                            title="เมล็ดในปาล์ม (Kernel)"
                            rows={[
                                { label: 'ยอดยกมา', value: fmt(prod?.previous_total_kn), className: 'bg-white/70' },
                                {
                                    label: 'ผลิตได้',
                                    value: fmt(prod?.result?.kernel_today),
                                    className: 'bg-emerald-100/70 text-emerald-800 font-bold',
                                },
                                { label: 'ขาย', value: fmt(prod?.sales_kn_tons), className: 'bg-green-100/70 text-green-800 font-bold' },
                                { label: 'ยกไป', value: fmt(prod?.total_kn), className: 'bg-teal-100/70 text-teal-800 font-bold' },
                            ]}
                            metrics={[
                                {
                                    label: '%Yield',
                                    value: fmt(prod?.result?.kn_yield, 2),
                                    color: 'text-emerald-700 font-bold',
                                    bg: 'bg-emerald-100/70',
                                },
                                { label: '%Moist', value: fmt(prod?.moisture_percent, 2), color: 'text-teal-700 font-bold', bg: 'bg-teal-100/70' },
                                { label: '%Dirt', value: fmt(prod?.dirt_percent, 2), color: 'text-cyan-700 font-bold', bg: 'bg-cyan-100/70' },
                            ]}
                            wrapperTone="from-emerald-50/80 to-teal-50/80 border-emerald-200"
                        />
                    </div>
                </div>
                {/* ---------------------------------------------------
                   ROW 3 : STOCK INFORMATION
                --------------------------------------------------- */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-12">
                    {/* -------------------- STOCK CPO -------------------- */}
                    <div className="sm:col-span-2 md:col-span-1 xl:col-span-6">
                        <SectionCardB
                            icon={<Droplets size={16} className="text-amber-600" />}
                            title="Stock CPO"
                            rows={[
                                {
                                    label: 'Tank',
                                    value: 'ปริมาณ',
                                    ffa: '%FFA',
                                    dobi: 'DOBI',
                                    className: 'bg-gray-200/70 font-bold text-gray-800 py-1 text-xs',
                                },
                                {
                                    label: 'T1',
                                    value: fmt(prod?.cpo_data_tank?.t1?.volume),
                                    ffa: fmt(prod?.cpo_data_tank?.t1?.ffa, 2),
                                    dobi: fmt(prod?.cpo_data_tank?.t1?.dobi, 2),
                                    className: 'bg-amber-50/70',
                                    ffaColor: getQualityColor('ffa', prod?.cpo_data_tank?.t1?.ffa),
                                    dobiColor: getQualityColor('dobi', prod?.cpo_data_tank?.t1?.dobi),
                                },
                                {
                                    label: 'T2',
                                    value: fmt(prod?.cpo_data_tank?.t2?.volume),
                                    ffa: fmt(prod?.cpo_data_tank?.t2?.ffa, 2),
                                    dobi: fmt(prod?.cpo_data_tank?.t2?.dobi, 2),
                                    className: 'bg-amber-50/70',
                                    ffaColor: getQualityColor('ffa', prod?.cpo_data_tank?.t2?.ffa),
                                    dobiColor: getQualityColor('dobi', prod?.cpo_data_tank?.t2?.dobi),
                                },
                                {
                                    label: 'T3',
                                    value: fmt(prod?.cpo_data_tank?.t3?.volume),
                                    ffa: fmt(prod?.cpo_data_tank?.t3?.ffa, 2),
                                    dobi: fmt(prod?.cpo_data_tank?.t3?.dobi, 2),
                                    className: 'bg-amber-50/70',
                                    ffaColor: getQualityColor('ffa', prod?.cpo_data_tank?.t3?.ffa),
                                    dobiColor: getQualityColor('dobi', prod?.cpo_data_tank?.t3?.dobi),
                                },
                                {
                                    label: 'T4',
                                    value: fmt(prod?.cpo_data_tank?.t4?.volume),
                                    ffa: fmt(prod?.cpo_data_tank?.t4?.ffa, 2),
                                    dobi: fmt(prod?.cpo_data_tank?.t4?.dobi, 2),
                                    className: 'bg-amber-50/70',
                                    ffaColor: getQualityColor('ffa', prod?.cpo_data_tank?.t4?.ffa),
                                    dobiColor: getQualityColor('dobi', prod?.cpo_data_tank?.t4?.dobi),
                                },
                                {
                                    label: 'รวม',
                                    value: fmt(prod?.cpo_data_tank?.summary?.total_cpo),
                                    ffa: fmt(prod?.cpo_data_tank?.summary?.ffa_cpo, 2),
                                    dobi: fmt(prod?.cpo_data_tank?.summary?.dobi_cpo, 2),
                                    className: 'bg-amber-200/70 font-bold text-red-500 text-lg',
                                    ffaColor: getQualityColor('ffa', prod?.cpo_data_tank?.summary?.ffa_cpo),
                                    dobiColor: getQualityColor('dobi', prod?.cpo_data_tank?.summary?.dobi_cpo),
                                },
                            ]}
                            wrapperTone="from-amber-50/80 to-orange-50/80 border-amber-200"
                        />
                    </div>

                    {/* -------------------- STOCK BY PRODUCTS -------------------- */}
                    <div className="sm:col-span-2 md:col-span-1 xl:col-span-6">
                        <SectionCardA
                            icon={<Package size={16} className="text-emerald-600" />}
                            title="Stock By Products"
                            rows={[
                                {
                                    label: 'Kernel (Silo)',
                                    value: fmt(prod?.total_kn),
                                    className: 'bg-emerald-100/70 text-emerald-800 font-bold',
                                },
                                {
                                    label: 'EFB Fiber',
                                    value: fmt(prod?.efb_fiber),
                                    className: 'bg-teal-100/70 text-teal-800 font-bold',
                                },
                                {
                                    label: 'Shell',
                                    value: fmt(prod?.shell),
                                    className: 'bg-green-100/70 text-green-800 font-bold',
                                },
                                {
                                    label: 'NUT (Silo)',
                                    value: fmt(prod?.nut),
                                    className: 'bg-gray-100/70 text-gray-800 font-bold',
                                },
                                {
                                    label: 'NUT กองนอก',
                                    value: fmt(prod?.nut_out),
                                    className: 'bg-gray-100/70 text-gray-800 font-bold',
                                },
                                {
                                    label: 'Silo อบ 1',
                                    value: fmt(prod?.silo_1),
                                    className: 'bg-cyan-100/70 text-cyan-800 font-bold',
                                },
                                {
                                    label: 'Silo อบ 2',
                                    value: fmt(prod?.silo_2),
                                    className: 'bg-cyan-100/70 text-cyan-800 font-bold',
                                },
                            ]}
                            wrapperTone="from-emerald-50/80 to-teal-50/80 border-emerald-200"
                        />
                    </div>
                </div>
            </motion.div>
        </AppLayout>
    );
}

/* ---------------------------------------------------
   CARD COMPONENTS
--------------------------------------------------- */

/* -------------------- CardNumberVertical -------------------- */
function CardNumberVertical({ title, value, tone = 'emerald' }: { title: string; value: string; tone?: 'emerald' | 'teal' }) {
    const map = {
        emerald: {
            wrap: 'from-emerald-50 to-green-50 border-emerald-200',
            text: 'text-emerald-700',
            value: 'text-emerald-800',
        },
        teal: {
            wrap: 'from-teal-50 to-cyan-50 border-teal-200',
            text: 'text-teal-700',
            value: 'text-teal-800',
        },
    }[tone];

    return (
        <div className={`bg-gradient-to-br ${map.wrap} flex flex-col justify-center rounded-lg border p-1 text-center shadow-sm`}>
            <p className={`font-bold ${map.text} mb-1 text-[11px] sm:text-xs`}>{title}</p>
            <p className={`rounded-md  py-2 text-lg font-black sm:text-xl ${map.value} `}>{value}</p>
        </div>
    );
}

/* -------------------- SectionCard (CPO / Kernel) -------------------- */
function SectionCard({
    icon,
    title,
    rows,
    metrics,
    wrapperTone,
}: {
    icon: React.ReactNode;
    title: string;
    rows: { label: string; value: string; className?: string }[];
    metrics: { label: string; value: string; color: string; bg: string }[];
    wrapperTone: string;
}) {
    return (
        <div className={`bg-gradient-to-br ${wrapperTone} rounded-xl border p-2 shadow-sm`}>
            <div className="mb-2 flex items-center space-x-1">
                {icon}
                <p className="text-sm font-bold text-gray-800">{title}</p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
                {/* LEFT */}
                <div className="grid grid-cols-1 gap-1 md:col-span-2">
                    {rows.map((r) => (
                        <div
                            key={r.label}
                            className={`flex items-center justify-between rounded-lg border border-white/60 p-2 text-xs ${r.className ?? 'bg-white/70'} `}
                        >
                            <span className="text-xs font-medium text-gray-700">{r.label}</span>
                            <span className="text-sm font-black">{r.value}</span>
                        </div>
                    ))}
                </div>

                {/* RIGHT Metrics */}
                <div className="flex flex-col justify-between space-y-1.5 md:col-span-1">
                    {metrics.map((m) => (
                        <div key={m.label} className={`${m.bg} rounded-lg border border-white/60 p-2 text-center`}>
                            <p className={`text-xs font-semibold ${m.color}`}>{m.label}</p>
                            <p className={`mt-1 text-base font-black ${m.color}`}>{m.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* -------------------- SectionCardA -------------------- */
function SectionCardA({
    icon,
    title,
    rows,
    wrapperTone,
}: {
    icon: React.ReactNode;
    title: string;
    rows: { label: string; value: string; className?: string }[];
    wrapperTone: string;
}) {
    return (
        <div className={`bg-gradient-to-br ${wrapperTone} rounded-xl border p-2 shadow-sm`}>
            <div className="mb-1 flex items-center space-x-1">
                {icon}
                <p className="text-sm font-bold text-gray-800">{title}</p>
            </div>

            <div className="grid grid-cols-1">
                {rows.map((r) => (
                    <div
                        key={r.label}
                        className={`flex items-center justify-between rounded-lg border border-white/60 p-2 text-xs ${r.className ?? 'bg-white/70'} `}
                    >
                        <span className="text-xs font-medium text-gray-700">{r.label}</span>
                        <span className="text-sm font-black">{r.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* -------------------- SectionCardB (Stock CPO) -------------------- */
function SectionCardB({
    icon,
    title,
    rows,
    wrapperTone,
}: {
    icon: React.ReactNode;
    title: string;
    rows: {
        label: string;
        value: string;
        ffa: string;
        dobi: string;
        className?: string;
        ffaColor?: string;
        dobiColor?: string;
    }[];
    wrapperTone: string;
}) {
    return (
        <div className={`bg-gradient-to-br ${wrapperTone} rounded-xl border p-2 shadow-sm`}>
            <div className="mb-1 flex items-center space-x-1">
                {icon}
                <p className="text-sm font-bold text-gray-800">{title}</p>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
                {rows.map((r) => (
                    <div
                        key={r.label}
                        className={`grid grid-cols-4 gap-2 rounded-lg border border-white/60 p-2.5 text-xs ${r.className ?? 'bg-white/70'} `}
                    >
                        <span className="text-xs font-medium text-gray-700">{r.label}</span>

                        <span className="text-right text-sm font-black">{r.value}</span>

                        <span className={`text-right text-sm font-black ${r.ffaColor || 'text-gray-600'}`}>{r.ffa}</span>

                        <span className={`text-right text-sm font-black ${r.dobiColor || 'text-gray-600'}`}>{r.dobi}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MobileCardNumberVertical({ title, value, tone = 'emerald' }: { title: string; value: string; tone?: 'emerald' | 'teal' }) {
    const map = {
        emerald: {
            wrap: 'from-emerald-50 to-green-50 border-emerald-200',
            text: 'text-emerald-700',
            value: 'text-emerald-800',
        },
        teal: {
            wrap: 'from-teal-50 to-cyan-50 border-teal-200',
            text: 'text-teal-700',
            value: 'text-teal-800',
        },
    }[tone];

    return (
        <div className={`bg-gradient-to-br ${map.wrap} flex flex-col justify-center rounded-lg border p-2 text-center shadow-sm`}>
            <p className={`font-bold ${map.text} mb-1 text-[11px]`}>{title}</p>
            <p className={`rounded text-sm font-bold ${map.value}`}>{value}</p>
        </div>
    );
}

function MobileSectionCard({
    icon,
    title,
    rows,
    metrics,
    wrapperTone,
}: {
    icon: React.ReactNode;
    title: string;
    rows: { label: string; value: string; className?: string }[];
    metrics: { label: string; value: string; color: string; bg: string }[];
    wrapperTone: string;
}) {
    return (
        <div className={`bg-gradient-to-br ${wrapperTone} rounded-xl border p-2 shadow-sm`}>
            <div className="mb-1 flex items-center space-x-1">
                {icon}
                <p className="text-[13px] font-bold text-gray-800">{title}</p>
            </div>

            <div className="grid grid-cols-3 gap-1">
                {/* LEFT: Rows (span 2 columns on desktop) */}
                <div className="col-span-2 grid gap-1">
                    {rows.map((r) => (
                        <div
                            key={r.label}
                            className={`flex items-center justify-between rounded-sm border border-white/60 p-1 text-[11px] ${r.className ?? 'bg-white/70'}`}
                        >
                            <span className="text-[11px] font-medium text-gray-700">{r.label}</span>
                            <span className="text-[12px] font-semibold">{r.value}</span>
                        </div>
                    ))}
                </div>

                {/* RIGHT: Metrics (1 column on desktop) */}
                <div className="col-span-1 grid gap-1">
                    {metrics.map((m) => (
                        <div key={m.label} className={`${m.bg} rounded-lg border border-white/60 p-1 text-center`}>
                            <p className={`text-[10px] font-bold ${m.color}`}>{m.label}</p>
                            <p className={`mt-1 text-sm font-black ${m.color}`}>{m.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MobileSectionCardA({
    icon,
    title,
    rows,
    wrapperTone,
}: {
    icon: React.ReactNode;
    title: string;
    rows: { label: string; value: string; className?: string }[];
    wrapperTone: string;
}) {
    return (
        <div className={`bg-gradient-to-br ${wrapperTone} rounded-xl border p-1 shadow-sm`}>
            <div className="mb-1 flex items-center space-x-1">
                {icon}
                <p className="text-[13px] font-bold text-gray-800">{title}</p>
            </div>

            <div className="grid grid-cols-1 gap-1">
                {rows.map((r) => (
                    <div
                        key={r.label}
                        className={`flex items-center justify-between rounded-lg border border-white/60 p-2 text-[11px] ${r.className ?? 'bg-white/70'}`}
                    >
                        <span className="text-[11px] font-medium text-gray-700">{r.label}</span>
                        <span className="text-[12px] font-black">{r.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MobileSectionCardB({
    icon,
    title,
    rows,
    wrapperTone,
}: {
    icon: React.ReactNode;
    title: string;
    rows: {
        label: string;
        value: string;
        ffa: string;
        dobi: string;
        className?: string;
        ffaColor?: string;
        dobiColor?: string;
    }[];
    wrapperTone: string;
}) {
    return (
        <div className={`bg-gradient-to-br ${wrapperTone} rounded-xl border p-3 shadow-sm`}>
            <div className="mb-2 flex items-center space-x-1">
                {icon}
                <p className="text-[13px] font-bold text-gray-800">{title}</p>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
                {rows.map((r) => (
                    <div
                        key={r.label}
                        className={`grid grid-cols-4 gap-2 rounded-lg border border-white/60 p-2 text-[11px] ${r.className ?? 'bg-white/70'}`}
                    >
                        <span className="text-[9px] font-medium text-gray-700">{r.label}</span>
                        <span className="text-right text-[10px] font-black">{r.value}</span>
                        <span className={`text-right text-[9px] font-black ${r.ffaColor || 'text-gray-600'}`}>{r.ffa}</span>
                        <span className={`text-right text-[9px] font-black ${r.dobiColor || 'text-gray-600'}`}>{r.dobi}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
