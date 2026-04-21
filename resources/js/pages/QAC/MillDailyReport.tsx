import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Printer, Calendar, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface ReportData {
    date: string;
    ffb: {
        balance: number;
        received: number;
        milled: number;
        carry_forward: number;
        mtd_received: number;
        mtd_milled: number;
    };
    production: {
        oil: { tons: number; yield: number; ffa: number; moisture: number; dobi: number; mtd_tons: number; mtd_yield: number };
        kernel: { tons: number; yield: number; moisture: number; dirt: number; mtd_tons: number; mtd_yield: number };
        efb: { tons: number; yield: number; mtd_tons: number; mtd_yield: number };
        shell: { tons: number; yield: number; mtd_tons: number; mtd_yield: number };
    };
    despatch: {
        oil: { tons: number; mtd_tons: number };
        kernel: { tons: number; mtd_tons: number };
        efb: { tons: number; mtd_tons: number };
        shell: { tons: number; mtd_tons: number };
    };
    storage: {
        tanks: Array<{ name: string; tons: number; ffa: number; moisture: number; dobi: number }>;
        silos: Array<{ name: string; tons: number }>;
        by_products: Array<{ name: string; tons: number }>;
    };
    remark: {
        buckets: number;
        ton_per_bucket: number;
    };
    additional_metrics: {
        feed_production: string;
        despatch_oil: string;
        despatch_tank: string;
    };
}

export default function MillDailyReport() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [localFeed, setLocalFeed] = useState('');
    const [localDespatch, setLocalDespatch] = useState('');
    const [localTankNo, setLocalTankNo] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/qac/mill-daily-data?date=${selectedDate}`);
            setData(response.data);
            setLocalFeed(response.data.additional_metrics.feed_production?.toString() || '');
            setLocalDespatch(response.data.additional_metrics.despatch_oil?.toString() || '');
            setLocalTankNo(response.data.additional_metrics.despatch_tank || '');
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const handlePrint = () => {
        window.print();
    };

    const fN = (v: number | null | undefined, dec = 3) => 
        (v !== null && v !== undefined && Number(v) !== 0) ? v.toLocaleString('th-TH', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '-';

    const handleSave = async (field: 'feed_production' | 'despatch_oil' | 'despatch_tank', value: string) => {
        if (!data) return;
        setIsSaving(true);
        try {
            await axios.post('/api/qac/mill-daily-additional', {
                date: selectedDate,
                field,
                value: value === '' ? null : value
            });
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppLayout>
            <Head title="รายงานการผลิต (Mill Daily Report)" />
            
            <div className="p-4 bg-slate-100 min-h-screen font-anuphan print:bg-white print:p-0">
                {/* Control Panel - Hidden on Print */}
                <div className="max-w-[800px] mx-auto mb-6 flex items-center justify-between bg-white p-4 rounded-xl shadow-sm print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="border-slate-200 rounded-lg text-sm"
                            />
                        </div>
                        <button 
                            onClick={fetchData}
                            disabled={loading}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                    >
                        <Printer className="w-4 h-4" />
                        <span>พิมพ์รายงาน (PDF)</span>
                    </button>
                </div>

                {/* Report Content - Styled for A4 */}
                <div className="report-container bg-white mx-auto shadow-2xl relative overflow-hidden print:shadow-none print:w-full print:mx-0">
                    <style dangerouslySetInnerHTML={{ __html: `
                        @media screen {
                            .report-container {
                                width: 210mm;
                                min-height: 297mm;
                                padding: 10mm;
                            }
                        }
                        @media print {
                            @page {
                                size: A4;
                                margin: 5mm;
                            }
                            body {
                                margin: 0;
                                -webkit-print-color-adjust: exact;
                            }
                            /* Hide Navbar, Sidebar and Control Panel */
                            header, 
                            aside, 
                            [data-sidebar="sidebar"], 
                            .sidebar-trigger,
                            .print-hidden {
                                display: none !important;
                            }
                            /* Ensure main content takes full width */
                            main, .report-container {
                                width: 100% !important;
                                max-width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                position: static !important;
                            }
                            /* Reset any layout offsets from the shell */
                            .report-container {
                                border: none !important;
                            }
                        }
                    ` }} />

                    {/* Document Header Table */}
                    <table className="w-full border-collapse border-1 border-black text-[12px] mb-4">
                        <tbody>
                            <tr>
                                <td rowSpan={3} className="w-[20%] border-1 border-black p-1 text-center align-middle">
                                    <div className="flex flex-col items-center">
                                        <img src="/images/isp-touch-icon.png" alt="ISP Logo" className="h-13 object-contain" />
                                       <span className="text-[10px] font-bold">บริษัท อีสานปาล์ม จำกัด</span>
                                    </div>
                                </td>
                                <td className="w-[30%] px-2 py-1 font-bold">ประเภเทเอกสาร : แบบฟอร์ม</td>
                                <td colSpan={2} className="px-2 py-1"></td>
                            </tr>
                            <tr>
                                <td className="border-1 border-black px-2 py-1 font-bold">ชื่อเอกสาร : MILL DAILY REPORT</td>
                                <td className="w-[25%] border-1 border-black px-2 py-1 font-bold">วันที่บังคับใช้ : 05-01-2569</td>
                            </tr>
                            <tr>
                                <td className="border-1 border-black px-2 py-1 font-bold">รหัสเอกสาร : FM-QAC-59-0014</td>
                                <td className="border-1 border-black px-2 py-1 font-bold">แก้ไขครั้งที่ : 03</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="text-right text-[12px] font-bold mb-2">
                        Date: {data?.date || '-'}
                    </div>

                    {/* Section A: FFB */}
                    <div className="mb-2">
                        <div className="grid grid-cols-12 items-center mb-1">
                            <h4 className="col-span-2 font-bold text-[13px] underline">A. FFB</h4>
                            <div className="col-span-3 text-[12px] font-bold text-center">น้ำหนักผ่านตราชั่งโรงงาน</div>
                            <div className="col-span-4 text-[12px] font-bold text-center"></div>
                            <div className="col-span-3 text-[11px] font-bold text-center italic text-slate-400">สะสม (TONS.)</div>
                        </div>
                        
                        <div className="space-y-px">
                            <div className="grid grid-cols-12 items-center text-[12px] h-6">
                                <div className="col-span-3">1. BALANCE</div>
                                <div className="col-span-2 border-b border-black text-end pr-2 bg-orange-50/50 mr-8 tabular-nums">{fN(data?.ffb.balance)}</div>
                                <div className="col-span-2"></div>
                                <div className="col-span-3"></div>
                            </div>
                            <div className="grid grid-cols-12 items-center text-[12px] h-6">
                                <div className="col-span-3">2. RECEIVED</div>
                                <div className="col-span-2 border-b border-black text-end pr-2 mr-8 tabular-nums">{fN(data?.ffb.received)}</div>
                                <div className="col-span-4"></div>
                                <div className="col-span-3 border border-black-50 text-center bg-orange-50 font-bold ml-1 py-1.5 -mt-2 -mb-2 tabular-nums">{fN(data?.ffb.mtd_received)}</div>
                            </div>
                            <div className="grid grid-cols-12 items-center text-[12px] h-6">
                                <div className="col-span-3">3. MILLED</div>
                                <div className="col-span-2 border-b border-black text-end pr-2 mr-8 tabular-nums">{fN(data?.ffb.milled)}</div>
                                <div className="col-span-4"></div>
                                <div className="col-span-3 border border-black-50 text-center bg-orange-50 font-bold ml-1 py-1 -mt-2 -mb-2 tabular-nums">{fN(data?.ffb.mtd_milled)}</div>
                            </div>
                            <div className="grid grid-cols-12 items-center text-[12px] h-6">
                                <div className="col-span-3">4. CARRY FORWARD</div>
                                <div className="col-span-2 border-b border-black text-end pr-2 bg-emerald-50/50 mr-8 tabular-nums">{fN(data?.ffb.carry_forward)}</div>
                                <div className="col-span-4"></div>
                                <div className="col-span-3 text-center text-[10px] italic"></div>
                            </div>
                        </div>
                    </div>

                    {/* Section B: PRODUCTION */}
                    <div className="mb-4">
                        <div className="grid grid-cols-12 items-end mb-1 text-[11px] font-bold">
                            <h4 className="col-span-2 text-[13px] underline">B. PRODUCTION</h4>
                            <div className="col-span-1 text-center">TONS.</div>
                            <div className="col-span-1 text-center">%</div>
                            <div className="col-span-1 text-center">St. นอก</div>
                            <div className="col-span-1 text-center">% FFA</div>
                            <div className="col-span-2 text-center">% Moisture</div>
                            <div className="col-span-1 text-center">DOBI</div>
                            <div className="col-span-3 text-center italic bg-yellow-50/50 ml-1 py-0.5">
                                สะสม
                                <div className="grid grid-cols-2 border-t border-black/10 text-[9px]">
                                    <span>TONS.</span>
                                    <span>%</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-px">
                            {[
                                { label: '1. OIL', tons: data?.production.oil.tons, yield: data?.production.oil.yield, ffa: data?.production.oil.ffa, moisture: data?.production.oil.moisture, dobi: data?.production.oil.dobi, mtdTons: data?.production.oil.mtd_tons, mtdYield: data?.production.oil.mtd_yield },
                                { label: '2. KERNEL', tons: data?.production.kernel.tons, yield: data?.production.kernel.yield, moisture: data?.production.kernel.moisture, mtdTons: data?.production.kernel.mtd_tons, mtdYield: data?.production.kernel.mtd_yield },
                                { label: '3. EFB', tons: data?.production.efb.tons, yield: data?.production.efb.yield, mtdTons: data?.production.efb.mtd_tons, mtdYield: data?.production.efb.mtd_yield },
                                { label: '4. SHELL', tons: data?.production.shell.tons, yield: data?.production.shell.yield, mtdTons: data?.production.shell.mtd_tons, mtdYield: data?.production.shell.mtd_yield },
                            ].map((row, idx) => (
                                <div key={idx} className="grid grid-cols-12 items-center text-[11px] h-6 border-b border-slate-50 last:border-0">
                                    <div className="col-span-2 font-medium">{row.label}</div>
                                    <div className="col-span-1 text-right pr-2 tabular-nums">{fN(row.tons)}</div>
                                    <div className="col-span-1 text-right pr-2 tabular-nums">{fN(row.yield, 2)}</div>
                                    <div className={`col-span-1 h-4 mx-1 ${row.label === '1. OIL' ? '' : row.label === '2. KERNEL' ? '' : ''}`}></div>
                                    <div className="col-span-1 text-right pr-1 tabular-nums">{fN(row.ffa as any, 2)}</div>
                                    <div className="col-span-2 text-right pr-1 tabular-nums">{fN(row.moisture as any, 2)}</div>
                                    <div className="col-span-1 text-right pr-1 tabular-nums">{fN(row.dobi as any, 2)}</div>
                                    <div className="col-span-3 grid grid-cols-2 border border-black text-end py-0.5 bg-orange-50 ml-1 font-bold pr-2">
                                        <span className={row.label === '1. OIL' ? 'bg-yellow-200' : ''}>{fN(row.mtdTons)}</span>
                                        <span className={row.label === '1. OIL' ? 'bg-yellow-200' : ''}>{fN(row.mtdYield, 2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section C: DESPATCH */}
                    <div className="mb-4">
                        <div className="grid grid-cols-12 items-end mb-1 text-[11px] font-bold">
                            <h4 className="col-span-2 text-[13px] underline">C. DESPATCH</h4>
                            <div className="col-span-1 text-center">TONS.</div>
                            <div className="col-span-1 text-center">ผลิตใช้</div>
                            <div className="col-span-1 text-center">St. นอก</div>
                            <div className="col-span-1 text-center">% FFA</div>
                            <div className="col-span-2 text-center">% Moisture</div>
                            <div className="col-span-1 text-center">DOBI</div>
                            <div className="col-span-3 text-center bg-yellow-50/50 ml-1 py-0.5 italic text-[10px]">TONS. (สะสม)</div>
                        </div>
                        <div className="space-y-px">
                            {[
                                { label: '1. OIL', tons: data?.despatch.oil.tons, ffa: 4.03, moisture: 0.13, dobi: 2.17, mtdTons: data?.despatch.oil.mtd_tons },
                                { label: '2. KERNEL', tons: data?.despatch.kernel.tons, moisture: 4.03, mtdTons: data?.despatch.kernel.mtd_tons },
                                { label: '3. EFB', tons: data?.despatch.efb.tons, mtdTons: data?.despatch.efb.mtd_tons },
                                { label: '4. SHELL', tons: data?.despatch.shell.tons, mtdTons: data?.despatch.shell.mtd_tons },
                            ].map((row, idx) => (
                                <div key={idx} className="grid grid-cols-12 items-center text-[11px] h-6 border-b border-slate-50 last:border-0">
                                    <div className="col-span-2 font-medium">{row.label}</div>
                                    <div className="col-span-1 text-right pr-2 tabular-nums">{fN(row.tons)}</div>
                                    <div className="col-span-1"></div>
                                    <div className={`col-span-1 h-4 mx-1 ${row.label === '1. OIL' ? '' : row.label === '2. KERNEL' ? '' : row.label === '4. SHELL' ? '' : ''}`}></div>
                                    <div className="col-span-1 text-right pr-1 tabular-nums">{fN(row.ffa as any, 2)}</div>
                                    <div className="col-span-2 text-right pr-4 tabular-nums">{fN(row.moisture as any, 2)}</div>
                                    <div className="col-span-1 text-right pr-2 text-[9px] italic tabular-nums">{row.label === '2. KERNEL' ? '%dirt=4.82' : fN(row.dobi as any, 2)}</div>
                                    <div className="col-span-3 border border-black text-end py-0.5 bg-blue-50/50 ml-1 font-bold pr-2">
                                        {fN(row.mtdTons)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section D: STORAGE */}
                    <div className="mb-6">
                        <h4 className="font-bold text-[13px] underline mb-1">D. STORAGE</h4>

                        {/* Row 1: Oil & Kernel */}
                        <div className="grid grid-cols-2 gap-x-12 mb-4 items-start">
                            {/* Left: Oil Storage */}
                            <div>
                                <div className="flex text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-tight">
                                    <div className="w-[45%]">1. OIL</div>
                                    <div className="w-[18%] text-center">TONS</div>
                                    <div className="w-[18%] text-center">% FFA</div>
                                    <div className="w-[18%] text-center">% Moist.</div>
                                    <div className="w-[18%] text-center">DOBI</div>
                                </div>
                                <div className="space-y-px text-[11px]">
                                    {data?.storage.tanks.map((tank, idx) => (
                                        <div key={idx} className="flex border-b border-dotted border-slate-200 py-1 items-baseline">
                                            <div className="w-[45%] font-medium text-slate-700">{tank.name}</div>
                                            <div className="w-[18%] flex-grow font-bold text-end pr-3">{fN(tank.tons)}</div>
                                            <div className="w-[18%] text-center opacity-80">{fN(tank.ffa as any, 2)}</div>
                                            <div className="w-[18%] text-center opacity-80">{fN(tank.moisture as any, 2)}</div>
                                            <div className="w-[18%] text-center opacity-80">{fN(tank.dobi as any, 2)}</div>
                                        </div>
                                    ))}
                                    <div className="flex border-t border-black mt-1 pt-1 font-bold">
                                        <div className="w-[45%] text-right pr-4 italic text-[10px]">TOTAL OIL.</div>
                                        <div className="w-[18%] text-end pr-3 tabular-nums">{fN(data?.storage.tanks.reduce((s, t) => s + (t.tons || 0), 0))}</div>
                                        <div className="w-[18%] text-center text-indigo-700">{fN(data?.storage.tanks[1]?.ffa, 2)}</div>
                                        <div className="w-[18%] text-center text-slate-400">0.00</div>
                                        <div className="w-[18%] text-center text-indigo-700">{fN(data?.storage.tanks[1]?.dobi, 2)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Kernel Storage */}
                            <div>
                                <div className="flex text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-tight mt-[18px]">
                                    <div className="w-[70%]">2. KERNEL</div>
                                    <div className="w-[30%] text-right pr-4">LEVEL</div>
                                </div>
                                <div className="space-y-px text-[11px]">
                                    {data?.storage.silos.map((silo, idx) => (
                                        <div key={idx} className="flex border-b border-dotted border-slate-200 py-1 items-baseline">
                                            <div className="w-[70%] text-slate-600">{silo.name}</div>
                                            <div className="w-[30%] text-right pr-4 font-black text-indigo-700 tabular-nums">{fN(silo.tons, 0)}</div>
                                        </div>
                                    ))}
                                    <div className="flex border-t-2 border-black mt-1 py-1 font-bold">
                                        <div className="w-[70%] text-right pr-4 italic">TOTAL (TONS).</div>
                                        <div className="w-[30%] text-center border-2 border-black bg-orange-100/50 font-black text-lg leading-none shadow-sm h-7 flex items-center justify-center tabular-nums">
                                            {fN(data?.storage.silos.reduce((acc, s) => acc + (s.tons || 0), 0))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: By-Products & Tank Card */}
                        <div className="grid grid-cols-2 gap-x-12 mb-6 items-start">
                            {/* Left: By-Products */}
                            <div>
                                <div className="flex text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-tight">
                                    <div className="w-[70%]">3. BY-PRODUCTS</div>
                                    <div className="w-[30%] text-right pr-4">TONS.</div>
                                </div>
                                <div className="space-y-px text-[11px]">
                                    {data?.storage.by_products.map((item, idx) => (
                                        <div key={idx} className="flex border-b border-dotted border-slate-200 py-0.5 items-baseline">
                                            <div className="w-[70%] text-slate-700">{idx+1}. {item.name}</div>
                                            <div className="w-[30%] text-right pr-4 font-bold tabular-nums">{fN(item.tons)}</div>
                                        </div>
                                    ))}
                                    <div className="flex border-b border-dotted border-slate-200 py-0.5 items-baseline">
                                        <div className="w-[70%] text-slate-700">3. FIBER</div>
                                        <div className="w-[30%] text-right pr-4 font-bold tabular-nums">-</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Additional Operations Info Card */}
                            <div className="border border-black rounded shadow-sm p-2 bg-indigo-50/20 space-y-3">
                                <h4 className="text-[10px] font-bold text-indigo-800 uppercase flex items-center gap-2">
                                    <div className="w-1 h-3 bg-indigo-600"></div>
                                    STORAGE TANK NO.
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">FEED PRODUCTION</label>
                                        <div className="relative group">
                                            <input 
                                                type="text"
                                                value={localFeed}
                                                onChange={(e) => setLocalFeed(e.target.value)}
                                                onBlur={() => handleSave('feed_production', localFeed)}
                                                className="w-full h-8 border border-slate-300 rounded px-2 text-[12px] font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all print:border-none print:px-0 bg-white"
                                            />
                                            {isSaving && <div className="absolute right-2 top-2.5 w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div>}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">DESPATCH OIL</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={localDespatch}
                                                onChange={(e) => setLocalDespatch(e.target.value)}
                                                onBlur={() => handleSave('despatch_oil', localDespatch)}
                                                className="w-full h-8 border border-slate-300 rounded px-2 text-[12px] font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all print:border-none print:px-0 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="mt-2 text-[11px]">
                        <div className="flex items-center gap-6 pb-1">
                           <span className="font-bold whitespace-nowrap">REMARK : จำนวนกะบะผลิต</span>
                           <div className="border-b-2 border-black min-w-[100px] text-center font-black text-lg">
                               {data?.remark.buckets || '-'} 
                           </div>
                           <span className="font-medium text-slate-500 italic">กะบะ</span>
                           <div className="border-b-2 border-black min-w-[100px] text-center font-black text-lg">
                               {fN(data?.remark.ton_per_bucket)}
                           </div>
                           <span className="font-medium text-slate-500 italic">ton/กะบะ</span>
                        </div>
                        
                        <div className="mt-10 flex flex-col items-end pr-8">
                            <div className="text-center">
                                <div className="font-bold mb-1">REVIEWED BY: ....................................................</div>
                                <div className="font-bold italic text-slate-800 text-sm">Lab supervisor</div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-2 left-4 text-[9px] text-slate-400">หน้า 1/1</div>
                    <div className="absolute bottom-2 right-4 text-[9px] text-slate-400">FM-QAC-59-0014-Rev.03</div>
                </div>
            </div>
        </AppLayout>
    );
}
