import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Droplets, Package, Sprout, TrendingUp } from 'lucide-react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Fertilizer Productions', href: '/fertilizer/productions' },
];

export default function ProductionReport() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-8xl rounded-2xl border border-blue-100/50 bg-gradient-to-br from-white to-blue-50/30 p-2 shadow-lg sm:p-4 font-anuphan"
            >
                {/* Header */}
                <div className="mb-2 flex flex-col items-start justify-between border-b border-blue-200/50 pb-2 sm:mb-4 sm:flex-row sm:items-center sm:pb-4">
                    <div>
                        <h2 className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-2xl font-bold text-transparent">
                            รายงานการผลิต
                        </h2>
                        <p className="mt-1 flex items-center text-sm text-gray-500">
                            <BarChart3 size={14} className="mr-1" />
                            ข้อมูลการผลิตประจำวัน
                        </p>
                    </div>
                    <div className="mt-3 flex items-center space-x-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 sm:mt-0">
                        <Calendar size={18} className="text-blue-600" />
                        <p className="text-sm font-semibold text-blue-700 sm:text-lg">21 ตุลาคม 2025</p>
                    </div>
                </div>

                {/* แถวแรก: ปริมาณผลปาล์มและแนวโน้มการผลิต */}
                <div className="mb-2 grid grid-cols-1 gap-2 lg:grid-cols-12">
                    {/* ปริมาณผลปาล์ม */}
                    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4">
                        <div className="">
                            <SectionCardA
                                icon={<Package size={18} className="text-teal-600" />}
                                title="ปริมาณผลปาล์ม (FFB)"
                                rows={[
                                    { label: 'ยอดยกมา', value: '-', className: 'bg-white/60' },
                                    { label: 'รับเข้า', value: '708.610', className: 'bg-teal-100/50 text-teal-700' },
                                    { label: 'เบิกผลิต', value: '565.340', className: 'bg-emerald-100/50 text-emerald-700' },
                                    { label: 'ยกไป', value: '143.270', className: 'bg-cyan-100/50 text-cyan-700' },
                                ]}
                                wrapperTone="from-teal-50 to-cyan-50 border-teal-200/50"
                            />
                        </div>
                    </motion.div>

                    {/* แนวโน้มการผลิต */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 }}
                        className="flex flex-col justify-center rounded-2xl border border-gray-200/60 bg-gradient-to-br from-gray-50 to-white shadow-sm lg:col-span-5"
                    >
                        <div className="flex items-center space-x-2">
                            <TrendingUp size={18} className="text-emerald-600" />
                            <p className="font-bold text-gray-700">แนวโน้มการผลิต</p>
                        </div>
                        <div className="grid h-28 w-full place-content-center rounded-lg border border-emerald-200/40 bg-gradient-to-t from-emerald-200/25 via-emerald-100/15 to-transparent sm:h-32">
                            <BarChart3 size={28} className="mx-auto text-emerald-600" />
                            <p className="mt-1 text-center text-xs text-gray-400">Production Chart</p>
                        </div>
                    </motion.div>
                    {/* ยอดค้าง/เบิก (แนวตั้ง) */}
                    <div className="grid grid-cols-1 gap-2 lg:col-span-3">
                        <CardNumberVertical title="ยอดรับเข้าทั้งเดือน" value="15,022.37" tone="emerald" />
                        <CardNumberVertical title="ยอดเบิกผลิต" value="14,870.42" tone="teal" />
                    </div>
                </div>

                {/* แถวที่สอง: ยอดค้างและเบิก (แนวตั้ง) + น้ำมันปาล์มดิบ + เมล็ดในปาล์ม */}
                <div className="mb-2 grid grid-cols-1 gap-2 lg:grid-cols-12">
                    {/* น้ำมันปาล์มดิบ (CPO) - ซ้าย */}
                    <div className="lg:col-span-6">
                        <SectionCard
                            icon={<Droplets size={18} className="text-yellow-600" />}
                            title="น้ำมันปาล์มดิบ (CPO)"
                            rows={[
                                { label: 'ยอดยกมา', value: '184.680', className: 'bg-white/60' },
                                { label: 'ผลิตได้', value: '78.540', className: 'bg-yellow-100/50 text-green-800' },
                                { label: 'Skim', value: '10.007', className: 'bg-white/60 text-red-700' },
                                { label: 'ขาย', value: '15.000', className: 'bg-emerald-100/50 text-emerald-700' },
                                { label: 'ยกไป', value: '161.030', className: 'bg-amber-100/50 text-amber-700' },
                            ]}
                            metrics={[
                                { label: '%Yield', value: '13.89', color: 'text-yellow-700', bg: 'bg-yellow-100/60' },
                                { label: '%FFA', value: '4.03', color: 'text-amber-700', bg: 'bg-amber-100/60' },
                                { label: 'DOBI', value: '2.33', color: 'text-orange-700', bg: 'bg-orange-100/60' },
                            ]}
                            wrapperTone="from-yellow-50 to-amber-50 border-yellow-200/50"
                        />
                    </div>

                    {/* เมล็ดในปาล์ม (Kernel) - ขวา */}
                    <div className="lg:col-span-6">
                        <SectionCard
                            icon={<Sprout size={18} className="text-teal-600" />}
                            title="เมล็ดในปาล์ม (Kernel)"
                            rows={[
                                { label: 'ยอดยกมา', value: '62.616', className: 'bg-white/60' },
                                { label: 'ผลิตได้', value: '30.106', className: 'bg-teal-100/50 text-teal-700' },
                                { label: 'ขาย', value: '15.360', className: 'bg-emerald-100/50 text-emerald-700' },
                                { label: 'ยกไป', value: '31.362', className: 'bg-cyan-100/50 text-cyan-700' },
                            ]}
                            metrics={[
                                { label: '%Yield', value: '5.33', color: 'text-teal-700', bg: 'bg-teal-100/60' },
                                { label: '%Moist', value: '6.94', color: 'text-cyan-700', bg: 'bg-cyan-100/60' },
                                { label: '%Dirt', value: '6.21', color: 'text-sky-700', bg: 'bg-sky-100/60' },
                            ]}
                            wrapperTone="from-teal-50 to-cyan-50 border-teal-200/50"
                        />
                    </div>
                </div>

                {/* แถวที่สาม: Stock Information */}
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
                    {/* Silo Stock - ซ้าย */}
                    {/* <div className="lg:col-span-6">
                        <div className="h-full rounded-2xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-slate-50 p-4 shadow-sm">
                            <div className="mb-3 flex items-center space-x-2">
                                <Warehouse size={18} className="text-gray-600" />
                                <p className="font-bold text-gray-700">Silo Stock</p>
                            </div>
                            <div className="space-y-3">
                                <div className="mb-3 grid grid-cols-2 gap-3">
                                    <div className="text-center">
                                        <div className="rounded-lg border border-slate-200 bg-white/60 p-3">
                                            <p className="text-sm text-slate-600">Silo 1</p>
                                            <p className="text-lg font-bold text-slate-800">14.504</p>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="rounded-lg border border-slate-200 bg-white/60 p-3">
                                            <p className="text-sm text-slate-600">Silo 2</p>
                                            <p className="text-lg font-bold text-slate-800">4.440</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-lg border border-yellow-200/50 bg-yellow-100/70 p-3 text-center">
                                    <p className="font-semibold text-yellow-800">NUT กองนอก = 0.00 ตัน</p>
                                </div>
                            </div>
                        </div>
                    </div> */}
                    <div className="lg:col-span-6">
                        <SectionCardB
                            icon={<Droplets size={18} className="text-yellow-600" />}
                            title="Stock CPO"
                            rows={[
                                { label: 'Tank', value: '-', ffa:'%FFA', dobi:'DOBI', className: 'bg-white/60 py-0' },
                                { label: 'T1', value: '708.610', ffa:'18.38', dobi:'0.73', className: 'bg-gray-200/50 text-teal-700' },
                                { label: 'T2', value: '565.340', ffa:'4.49', dobi:'2.24', className: 'bg-gray-200/50 text-emerald-700' },
                                { label: 'T3', value: '-', ffa:'-', dobi:'-', className: 'bg-gray-200/50 text-cyan-700' },
                                { label: 'T4', value: '-', ffa:'-', dobi:'-', className: 'bg-gray-200/50 text-cyan-700' },
                                { label: 'รวม', value: '1,450.360', ffa:'', dobi:'', className: 'bg-gray-200/50 text-red-700 font-bold text-lg' },
                            ]}
                            wrapperTone="from-gray-50 to-cyan-50 border-gray-200/50"
                        />
                    </div>

                    {/* Stock By Products - ขวา */}
                    {/* <div className="lg:col-span-6">
                        <div className="h-full rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50/30 p-4 shadow-sm">
                            <div className="mb-3 flex items-center space-x-2">
                                <Warehouse size={18} className="text-blue-600" />
                                <p className="font-bold text-gray-700">Stock By Products</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="text-center">
                                    <div className="rounded-lg border border-blue-200 bg-white/60 p-3">
                                        <p className="text-sm text-blue-600">Kernel (ใน Silo)</p>
                                        <p className="text-lg font-bold text-blue-800">61.362</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="rounded-lg border border-blue-200 bg-white/60 p-3">
                                        <p className="text-sm text-blue-600">EFB FIBER</p>
                                        <p className="text-lg font-bold text-blue-800">182.948</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="rounded-lg border border-blue-200 bg-white/60 p-3">
                                        <p className="text-sm text-blue-600">Shell</p>
                                        <p className="text-lg font-bold text-blue-800">413.239</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="rounded-lg border border-blue-200 bg-white/60 p-3">
                                        <p className="text-sm text-blue-600">NUT (Silo)</p>
                                        <p className="text-lg font-bold text-blue-800">33.103</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> */}

                    <div className="lg:col-span-6">
                        <SectionCardA
                            icon={<Package size={18} className="text-teal-600" />}
                            title="Stock By Products"
                            rows={[
                                { label: 'Kernel (Silo)', value: '-', className: 'bg-teal-100/50 text-teal-700' },
                                { label: 'EFB Fiber', value: '708.610', className: 'bg-teal-100/50 text-teal-700' },
                                { label: 'Shell', value: '565.340', className: 'bg-emerald-100/50 text-emerald-700' },
                                { label: 'NUT (Silo)', value: '143.270', className: 'bg-gray-200/50 text-cyan-700' },
                                { label: 'NUT กองนอก', value: '143.270', className: 'bg-gray-200/50 text-cyan-700' },
                                { label: 'Silo อบ 1', value: '143.270', className: 'bg-cyan-100/50 text-cyan-700' },
                                { label: 'Silo อบ 2', value: '143.270', className: 'bg-cyan-100/50 text-cyan-700' },
                            ]}
                            wrapperTone="from-gray-50 to-cyan-50 border-gray-200/50"
                        />
                    </div>
                </div>
            </motion.div>
        </AppLayout>
    );
}

/* ---------- Sub Components ---------- */

function CardNumberVertical({ title, value, tone = 'emerald' }: { title: string; value: string; tone?: 'emerald' | 'teal' }) {
    const map = {
        emerald: {
            wrap: 'from-green-50 to-emerald-50 border-green-200/50',
            text: 'text-green-700',
            value: 'text-green-800',
        },
        teal: {
            wrap: 'from-emerald-50 to-teal-50 border-emerald-200/50',
            text: 'text-emerald-700',
            value: 'text-emerald-800',
        },
    }[tone];

    return (
        <div className={`bg-gradient-to-br ${map.wrap} flex h-full flex-col justify-center rounded-2xl border p-2 text-center shadow-sm`}>
            <p className={`font-bold ${map.text} mb-2 text-sm`}>{title}</p>
            <p className={`text-xl font-bold ${map.value} rounded-lg bg-white/50 py-3`}>{value}</p>
            {/* <p className={`${map.text} mt-1 text-xs`}>ตัน</p> */}
        </div>
    );
}

/** การ์ดสำหรับส่วนน้ำมันปาล์มดิบและเมล็ดในปาล์ม */
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
        <div className={`bg-gradient-to-br ${wrapperTone} h-full rounded-2xl border p-2 shadow-sm`}>
            <div className="mb-2 flex items-center space-x-2">
                {icon}
                <p className="font-bold text-gray-700">{title}</p>
            </div>

            <div className="grid h-[calc(100%-3rem)] grid-cols-1 gap-2 md:grid-cols-3">
                {/* LEFT: รายการตัวเลข */}
                <div className="grid grid-cols-1 gap-1 md:col-span-2">
                    {rows.map((r) => (
                        <div
                            key={r.label}
                            className={`flex items-center justify-between rounded-lg border border-white/40 p-2 ${r.className ?? 'bg-white/60'}`}
                        >
                            <span className="text-sm text-gray-600">{r.label}</span>
                            <span className="font-semibold">{r.value}</span>
                        </div>
                    ))}
                </div>

                {/* RIGHT: การ์ดสรุปค่า (%) */}
                <div className="flex flex-col justify-between space-y-2 md:col-span-1">
                    {metrics.map((m) => (
                        <div
                            key={m.label}
                            className={`text-center ${m.bg} flex flex-1 flex-col justify-center rounded-xl border border-white/50 p-3`}
                        >
                            <p className={`text-xs font-semibold ${m.color}`}>{m.label}</p>
                            <p className={`text-lg font-bold ${m.color} mt-1`}>{m.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

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
        <div className={`bg-gradient-to-br ${wrapperTone} h-full rounded-2xl border p-2 shadow-sm`}>
            <div className="mb-2 flex items-center space-x-2">
                {icon}
                <p className="font-bold text-gray-700">{title}</p>
            </div>

            <div className="grid h-[calc(100%-3rem)] grid-cols-1 gap-1 md:grid-cols-2">
                {/* LEFT: รายการตัวเลข */}
                <div className="grid grid-cols-1 gap-1 md:col-span-3">
                    {rows.map((r) => (
                        <div
                            key={r.label}
                            className={`flex items-center justify-between rounded-lg border border-white/40 p-2 ${r.className ?? 'bg-white/60'}`}
                        >
                            <span className="text-sm text-gray-600">{r.label}</span>
                            <span className="font-semibold">{r.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SectionCardB({
    icon,
    title,
    rows,
    wrapperTone,
}: {
    icon: React.ReactNode;
    title: string;
    rows: { label: string; value: string; ffa: string; dobi: string; className?: string }[];
    wrapperTone: string;
}) {
    return (
        <div className={`bg-gradient-to-br ${wrapperTone} h-full rounded-2xl border p-2 shadow-sm`}>
            <div className="mb-2 flex items-center space-x-2">
                {icon}
                <p className="font-bold text-gray-700">{title}</p>
            </div>

            <div className="grid h-[calc(100%-3rem)] grid-cols-1 gap-1 md:grid-cols-2">
                {/* LEFT: รายการตัวเลข */}
                <div className="grid grid-cols-1 gap-1 md:col-span-3">
                    {rows.map((r) => (
                        <div
                            key={r.label}
                            className={`flex items-center justify-between rounded-lg border border-white/40 p-2 ${r.className ?? 'bg-white/60'}`}
                        >
                            <span className="text-sm text-gray-600">{r.label}</span>
                            <span className="font-semibold">{r.value}</span>
                            <span className="font-semibold">{r.ffa}</span>
                            <span className="font-semibold">{r.dobi}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
