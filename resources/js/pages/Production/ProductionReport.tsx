import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, Factory, Target, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// ─── Types (คงเดิม) ───────────────────────────────────────────────────────
interface Production {
    Date: string;
    FFBPurchase: string | number;
    FFBForward: string | number;
    ShiftA: string | number;
    ShiftB: string | number;
    Shift3: string | number;
    FFBGoodQty: string | number;
    AvgPickup: string | number;
    StuckIn: string | number;
    Steam: string | number;
    RawFFB: string | number;
    FFBRemain: string | number;
    PickupRemain: string | number;
    RamRemain: string | number;
    RamRemain2: string | number;
    TotalFFB: string | number;
}

interface PageProps {
    date: string;
    production: Production | null;
    cs: { CS1: number | null; CS2: number | null };
    summary: {
        total_ffb_good_qty: number;
        total_shift_a: number;
        total_shift_b: number;
        total_shift_3: number;
        total_shift_all: number;
        avgPickupMonth: number;
        maxValue: number;
        maxDate: string | null;
        maxYearValue: number;
        maxYearDate: string | null;
    };
    chart: {
        labels: string[];
        values: number[];
    };
}

export default function ProductionReport({ date, production, cs, summary, chart }: PageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'ฝ่ายผลิตและวิศวกรรม', href: '#' },
        { title: 'รายงานข้อมูลการผลิต', href: '/pro/production-report' },
    ];

    const [selectedDate, setSelectedDate] = useState(date);

    const handleDateChange = (newDate: string) => {
        setSelectedDate(newDate);
        router.get('/pro/production-report', { date: newDate }, { preserveState: true, replace: true });
    };

    const n = (v: any) => Number(String(v).replace(/,/g, '')) || 0;
    const fN = (v: any, dec = 2) => v ? Number(v).toLocaleString('th-TH', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '';
    const fInt = (v: any) => v ? Number(v).toLocaleString('th-TH', { maximumFractionDigits: 0 }) : '';

    const p = production;
    const avg = n(p?.AvgPickup);

    // การคำนวณแบบ Livewire
    const tonShiftA = n(p?.ShiftA) > 0 ? n(p?.ShiftA) * avg : null;
    const tonShift3 = n(p?.Shift3) > 0 ? n(p?.Shift3) * avg : null;
    
    // TonShiftB = FFBGood - (tonA + ton3)
    const ffbGoodRaw = n(p?.FFBGoodQty);
    const tonShiftB = (tonShiftA !== null || tonShift3 !== null) ? ffbGoodRaw - (tonShiftA || 0) - (tonShift3 || 0) : null;
    
    const sumShiftPickUp = n(p?.ShiftA) + n(p?.ShiftB) + n(p?.Shift3);
    const sumPickUpRemain = n(p?.FFBRemain) - n(p?.RamRemain2);

    const chartOptions: ApexOptions = {
        chart: { 
            type: 'area', 
            sparkline: { enabled: true },
            animations: { enabled: false }
        },
        stroke: { curve: 'smooth', width: 2 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        colors: ['#10b981'],
        tooltip: { enabled: false },
        grid: { show: false },
        xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { show: false } }
    };

    // Format Thai Date
    const dateObj = new Date(selectedDate);
    const currentYearBE = dateObj.getFullYear() + 543;
    const thaiDate = selectedDate ? dateObj.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
    const thaiMonth = selectedDate ? dateObj.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long'
    }) : '';

    const percent = summary.maxValue > 0 ? (summary.total_ffb_good_qty / summary.maxValue) * 100 : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="รายงานข้อมูลการผลิต" />
            <div className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
                <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

                    {/* Date Selector - Top Bar */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-xl">
                                <Calendar className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-700">รายงานการผลิต</h2>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200">
                            <label htmlFor="selectedDate" className="text-sm font-semibold text-slate-600">
                                เลือกวันที่
                            </label>
                            <input 
                                type="date" 
                                id="selectedDate"
                                value={selectedDate}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className="bg-slate-50 font-medium text-emerald-700 rounded-xl border-slate-200 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer px-3 py-1.5"
                            />
                        </div>
                    </div>

                    {!p && (
                        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-700 shadow-sm animate-in fade-in zoom-in duration-300">
                            <div className="p-2 bg-amber-100 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-semibold">ไม่พบข้อมูลการผลิต</p>
                                <p className="text-sm">วันที่ {thaiDate} ยังไม่มีการบันทึกข้อมูล</p>
                            </div>
                        </div>
                    )}

                    {/* 3 Columns Grid - Each 4 cols */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
                        
                        {/* ─── COLUMN 1: Monthly Statistics ─── */}
                        <div className="lg:col-span-4 space-y-5">
                            {/* Max Production Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 overflow-hidden">
                                <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-4 text-white">
                                    <div className="flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        <h3 className="font-bold">สถิติการผลิตสูงสุด</h3>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    {/* ALL TIME MAX */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 shadow-sm">
                                                <Factory className="w-6 h-6 text-rose-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] mb-0.5">รวมสูงสุดที่เคยทำได้</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black text-rose-600 leading-none">{fN(summary.maxValue)}</span>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">ตัน</span>
                                                </div>
                                                {summary.maxDate && (
                                                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                                                        เมื่อ {new Date(summary.maxDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100 w-full"></div>

                                    {/* YEARLY MAX */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                                                <TrendingUp className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] mb-0.5">สูงสุดประจำปี {currentYearBE}</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black text-emerald-600 leading-none">{fN(summary.maxYearValue)}</span>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">ตัน</span>
                                                </div>
                                                {summary.maxYearDate && (
                                                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                                                        เมื่อ {new Date(summary.maxYearDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MTD Production Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        <h3 className="font-bold">ปริมาณผลิตประจำเดือน</h3>
                                    </div>
                                    <p className="text-emerald-100 text-sm mt-0.5">{thaiMonth}</p>
                                </div>
                                <div className="p-5">
                                    <div className="h-16 -ml-7 -mr-7 -mt-7">
                                        <ReactApexChart 
                                            options={chartOptions} 
                                            series={[{ name: 'FFB', data: chart.values }]} 
                                            type="area" 
                                            height={90} 
                                        />
                                    </div>
                                    <div className="flex items-end justify-between mt-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-emerald-50 rounded-xl">
                                                <Factory className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium">ยอดสะสม</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black text-emerald-600">{fN(summary.total_ffb_good_qty)}</span>
                                                    <span className="text-sm font-medium text-slate-500">ตัน</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                    </div>
                                </div>
                            </div>

                            {/* Performance Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5" />
                                        <h3 className="font-bold">ประสิทธิภาพการผลิต</h3>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">ค่าเฉลี่ย/กะบะ</p>
                                            <p className="text-2xl font-black text-blue-600">{fN(summary.avgPickupMonth)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 font-medium mb-1">จำนวนกะบะ</p>
                                            <p className="text-2xl font-bold text-slate-700">{fN(summary.total_shift_all, 0)}</p>
                                        </div>
                                    </div>
                                    {/* <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-slate-500">ความคืบหน้ารายเดือน</span>
                                            <span className="text-blue-600 font-bold">{percent.toFixed(2)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(percent, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div> */}
                                </div>
                            </div>
                        </div>

                        {/* ─── COLUMN 2: Daily Production Report Table ─── */}
                        <div className="lg:col-span-5">
                            <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden flex flex-col mx-auto max-w-2xl">
                                
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white text-center">
                                    <h3 className="font-bold text-2xl tracking-wide mb-1">รายงานการผลิต</h3>
                                    <p className="text-white/90 text-md font-medium">วันที่ {thaiDate}</p>
                                </div>

                                <div className="grid grid-cols-3 bg-[#eaf4ec] lg:text-lg text-sm">
                                    <div className="py-3 text-center">
                                        <p className="text-2xl font-bold text-slate-800 lg:text-xl text-[20px]">
                                            {n(p?.FFBForward) === 0 ? '-' : fN(p?.FFBForward)} <span className="lg:text-sm text-[12px] font-normal text-slate-600">ตัน</span>
                                        </p>
                                        <p className="text-sm text-slate-700 font-medium">ยอดยกมา</p>
                                    </div>
                                    <div className="py-3 text-center">
                                        <p className="text-2xl font-bold text-slate-800 lg:text-xl text-[20px]">
                                            {n(p?.FFBPurchase) === 0 ? '-' : fN(p?.FFBPurchase)} <span className="lg:text-sm text-[12px] font-normal text-slate-600">ตัน</span>
                                        </p>
                                        <p className="text-sm text-slate-700 font-medium">ปาล์มรับเข้า</p>
                                    </div>
                                    <div className="py-3 text-center">
                                        <p className="text-2xl font-bold text-slate-800 lg:text-xl text-[20px]">
                                            {n(p?.TotalFFB) === 0 ? '-' : fN(p?.TotalFFB)} <span className="lg:text-sm text-[12px] font-normal text-slate-600">ตัน</span>
                                        </p>
                                        <p className="text-sm text-slate-700 font-medium">รวมผลปาล์ม</p>
                                    </div>
                                </div>

                                <div className="w-full">
                                    <table className="w-full text-[15px]">
                                        <tbody>
                                            <tr className="bg-[#fce4ec] text-[#d32f2f] border-b border-white lg:text-lg text-sm">
                                                <td className="py-2 px-4 font-bold w-[37%] lg:w-[36%]">ผลปาล์มเข้าผลิต</td>
                                                <td className="py-2 px-4 font-bold text-center w-auto lg:w-[25%]">จำนวน</td>
                                                <td className="py-2 px-4 font-bold text-center w-[38%] lg:w-[39%]">ปริมาณ</td>
                                            </tr>
                                            <tr className="bg-[#e8f0fe] border-b border-white">
                                                <td className="py-2 px-4 font-bold text-slate-800">กะ A</td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className="font-bold text-lg text-slate-800">{n(p?.ShiftA) === 0 ? '-' : fInt(p?.ShiftA)}</span> <span className="text-slate-500 lg:text-sm text-[12px] ml-1">กะบะ</span>
                                                </td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className="font-bold text-lg text-slate-800">{n(tonShiftA) === 0 ? '-' : fN(tonShiftA)}</span> <span className="text-slate-500 lg:text-sm text-[12px] ml-1">ตัน</span>
                                                </td>
                                            </tr>
                                            <tr className="bg-[#e8f0fe] border-b border-white">
                                                <td className="py-2 px-4 font-bold text-slate-800">กะ B</td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className="font-bold text-lg text-slate-800">{n(p?.ShiftB) === 0 ? '-' : fInt(p?.ShiftB)}</span> <span className="text-slate-500 lg:text-sm text-[12px] ml-1">กะบะ</span>
                                                </td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className="font-bold text-lg text-slate-800">{n(tonShiftB) === 0 ? '-' : fN(tonShiftB)}</span> <span className="text-slate-500 lg:text-sm text-[12px] ml-1">ตัน</span>
                                                </td>
                                            </tr>
                                            <tr className="bg-[#e8f0fe] border-b border-white">
                                                <td className="py-2 px-4 font-bold text-slate-800">กะ 3</td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className="font-bold text-lg text-slate-800">{n(p?.Shift3) === 0 ? '-' : fInt(p?.Shift3)}</span> <span className="text-slate-500 lg:text-sm text-[12px] ml-1">กะบะ</span>
                                                </td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className="font-bold text-lg text-slate-800">{n(tonShift3) === 0 ? '-' : fN(tonShift3)}</span> <span className="text-slate-500 lg:text-sm text-[12px] ml-1">ตัน</span>
                                                </td>
                                            </tr>
                                            <tr className="bg-[#dae6fb] border-b border-white font-bold">
                                                <td className="py-2 px-4 text-blue-900 lg:text-lg text-sm">ผลรวมการผลิต</td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className="text-xl text-blue-900">{n(sumShiftPickUp) === 0 ? '-' : fInt(sumShiftPickUp)}</span> <span className="text-blue-500 lg:text-sm text-[0px] font-normal ml-1">กะบะ</span>
                                                </td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className="text-xl text-blue-900 lg:text-2xl text-[22px]">{n(p?.FFBGoodQty) === 0 ? '-' : fN(p?.FFBGoodQty)}</span> <span className="text-blue-500 lg:text-sm text-[0px] font-normal ml-1">ตัน</span>
                                                </td>
                                            </tr>
                                            
                                            <tr className="bg-[#fff9c4] font-bold border-b border-white">
                                                <td className="py-2 px-4 text-slate-800 lg:text-lg text-sm">ผลปาล์มคงค้าง</td>
                                                <td className="py-2 px-4 text-right text-red-600 lg:text-md lg:text-lg text-[14px]" colSpan={2}>(ค่าเฉลี่ย {fN(avg)} ตัน/กะบะ)</td>
                                            </tr>
                                            <tr className="bg-[#fffde7] border-b border-[#f5f5dc]/50">
                                                <td className="py-2 px-4 font-bold text-slate-800">อบ</td>
                                                <td className="py-2 px-4 text-right border-b border-slate-200/50">
                                                    <span className="font-bold text-lg text-slate-800">{n(p?.Steam) === 0 ? '-' : fInt(p?.Steam)}</span> <span className="text-slate-500 lg:text-sm text-[12px] ml-1">กะบะ</span>
                                                </td>
                                                <td className="py-2 px-4 text-right align-middle" rowSpan={2}>
                                                    <span className="font-bold text-xl text-slate-800">{n(sumPickUpRemain) === 0 ? '-' : fN(sumPickUpRemain)}</span> <span className="text-slate-500 lg:text-sm text-[12px] ml-1">ตัน</span>
                                                </td>
                                            </tr>
                                            <tr className="bg-[#fffde7] border-b border-white">
                                                <td className="py-2 px-4 font-bold text-slate-800">บรรจุ</td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className="font-bold text-lg text-slate-800">{n(p?.StuckIn) === 0 ? '-' : fInt(p?.StuckIn)}</span> <span className="text-slate-500 lg:text-sm text-[12px] ml-1">กะบะ</span>
                                                </td>
                                            </tr>
                                            <tr className="bg-[#fffde7] border-b-2 border-white">
                                                <td className="py-2 px-4 font-bold text-slate-800">ลานเท</td>
                                                <td className="py-2 px-4 text-right"></td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className="font-bold text-lg text-slate-800">{n(p?.RamRemain2) === 0 ? '-' : fN(p?.RamRemain2)}</span> <span className="text-slate-500 lg:text-sm text-[12px] ml-1">ตัน</span>
                                                </td>
                                            </tr>
                                            <tr className="bg-[#fffde7] font-bold text-red-600">
                                                <td className="py-2 px-4 text-[#e53935] lg:text-lg text-[14px]">รวมปาล์มคงค้าง</td>
                                                <td className="py-2 px-4 text-right"></td>
                                                <td className="py-2 px-4 text-right">
                                                    <span className="text-lg text-[#e53935] lg:text-2xl text-[22px]">{n(p?.FFBRemain) === 0 ? '-' : fN(p?.FFBRemain)}</span> <span className="text-[#e53935]/70 lg:text-sm text-[0px] font-normal ml-1">ตัน</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="grid grid-cols-3 bg-[#f8f9fa] border-t-2 border-slate-100 border-dashed border-t-[#dcdcdc] border-t-[3px]">
                                    <div className="py-2 text-center">
                                        <p className="text-lg font-bold text-[#374151]">{n(p?.RawFFB) === 0 ? '-' : fN(p?.RawFFB)} <span className="text-sm font-normal text-[#6b7280]">ตัน</span></p>
                                        <p className="text-sm text-[#9ca3af] font-medium mt-0.5">ปาล์มดิบ</p>
                                    </div>
                                    <div className="py-2 text-center">
                                        <p className="font-bold text-[#374151] text-[15px]">{n(cs.CS1) === 0 ? '0' : fN(cs.CS1, 1)} <span className="text-[13px] font-normal text-[#6b7280]">cm.</span></p>
                                        <p className="font-bold text-[#374151] text-[15px]">{n(cs.CS1) === 0 ? '0.00' : fN(n(cs.CS1) * 0.1689)} <span className="text-[13px] font-normal text-[#6b7280]">ตัน</span></p>
                                        <p className="text-sm text-[#9ca3af] font-medium mt-0.5">CS 1</p>
                                    </div>
                                    <div className="py-2 text-center">
                                        <p className="font-bold text-[#374151] text-[15px]">{n(cs.CS2) === 0 ? '0' : fN(cs.CS2, 1)} <span className="text-[13px] font-normal text-[#6b7280]">cm.</span></p>
                                        <p className="font-bold text-[#374151] text-[15px]">{n(cs.CS2) === 0 ? '0.00' : fN(n(cs.CS2) * 0.1689)} <span className="text-[13px] font-normal text-[#6b7280]">ตัน</span></p>
                                        <p className="text-sm text-[#9ca3af] font-medium mt-0.5">CS 2</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
