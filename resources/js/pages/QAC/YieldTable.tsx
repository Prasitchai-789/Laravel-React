import { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, CalendarRange, ScrollText, FileDown } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface YieldData {
    date: string;
    ffb_purchase: number;
    ffb_good_qty: number;
    product_cpo: number;
    yield_cpo: number;
    product_kn: number;
    yield_kn: number;
    sales_cpo: number;
    sales_kn: number;
}

export default function YieldTable() {
    const today = new Date();
    const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    const [data, setData] = useState<YieldData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [month]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(route('yield-table.api', { month }));
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const exportUrl = route('yield-table.export', { month });
        window.open(exportUrl, '_blank');
    };

    // Formatter functions
    const dObj = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const fN = (num: number, dec = 3) => {
        if (!num || num === 0) return '-';
        return num.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'QAC', href: '#' }, { title: 'รายงาน % Yield (ตาราง)', href: '#' }]}>
            <div className="min-h-screen bg-slate-50/50 p-4 md:p-4 lg:p-4 font-anuphan">
                
                {/* HEAD CARD */}
                <div className="relative overflow-hidden p-2 pb-4">
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-10">
                        <div className="flex items-start md:items-center gap-5">
                            <div className="flex-shrink-0 p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-xl shadow-blue-500/20 text-white transform transition-transform duration-300 hover:scale-105 hover:rotate-3">
                                <Table className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
                                    รายงานแสดงข้อมูล % Yield
                                </h1>
                                <p className="text-slate-500 font-medium text-lg flex items-center gap-2">
                                    <ScrollText className="w-5 h-5 text-indigo-400" />
                                    แสดงข้อมูลปริมาณการผลิต Yield และยอดขายแบบรายวัน
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-4 bg-slate-50/80 p-2 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-xl">
                                <div className="flex items-center gap-3 pl-3">
                                    <CalendarRange className="w-5 h-5 text-slate-400" />
                                    <span className="font-semibold text-slate-700 hidden sm:inline">เดือน :</span>
                                </div>
                                <input
                                    type="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="bg-white border-0 rounded-xl px-4 py-2.5 text-slate-700 font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all hover:bg-slate-50"
                                />
                            </div>

                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 group"
                            >
                                <FileDown className="w-5 h-5 group-hover:bounce" />
                                <span className="hidden sm:inline">Export Excel</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* TABLE SECTION */}
                <div className="rounded-[2.5rem] bg-white/80">
                    
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="border-b-2 border-indigo-500"></div>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/50 shadow-sm">
                            <div className="overflow-auto custom-scrollbar max-h-[75vh]">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 z-20 shadow-md">
                                        <tr className="bg-slate-800">
                                            <th className="py-4 px-4 text-center font-bold text-white text-[15px] whitespace-nowrap">วันที่</th>
                                            <th className="py-4 px-4 text-right font-bold text-white text-[15px] whitespace-nowrap">ซื้อผลปาล์ม</th>
                                            <th className="py-4 px-4 text-right font-bold text-white text-[15px] whitespace-nowrap">ผลิต FFB</th>
                                            <th className="py-4 px-4 text-right font-bold text-blue-300 text-[15px] whitespace-nowrap">CPO ผลิตได้</th>
                                            <th className="py-4 px-4 text-right font-bold text-blue-300 text-[15px] whitespace-nowrap">% Yield CPO</th>
                                            <th className="py-4 px-4 text-right font-bold text-emerald-300 text-[15px] whitespace-nowrap">KN ผลิตได้</th>
                                            <th className="py-4 px-4 text-right font-bold text-emerald-300 text-[15px] whitespace-nowrap">% Yield KN</th>
                                            <th className="py-4 px-4 text-right font-bold text-amber-300 text-[15px] whitespace-nowrap">Sale CPO</th>
                                            <th className="py-4 px-4 text-right font-bold text-amber-300 text-[15px] whitespace-nowrap">Sale KN</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="py-3 px-4 text-center text-slate-700 whitespace-nowrap font-medium group-hover:text-indigo-600 transition-colors">
                                                    {dObj(row.date)}
                                                </td>
                                                <td className="py-3 px-4 text-right text-slate-600 whitespace-nowrap font-medium">
                                                    {fN(row.ffb_purchase)}
                                                </td>
                                                <td className="py-3 px-4 text-right text-slate-600 whitespace-nowrap font-medium">
                                                    {fN(row.ffb_good_qty)}
                                                </td>
                                                
                                                <td className="py-3 px-4 text-right text-blue-700 whitespace-nowrap font-bold bg-blue-50/30">
                                                    {fN(row.product_cpo)}
                                                </td>
                                                <td className="py-3 px-4 text-right text-blue-900 whitespace-nowrap font-black bg-blue-50/50">
                                                    {fN(row.yield_cpo, 2)}
                                                </td>

                                                <td className="py-3 px-4 text-right text-emerald-700 whitespace-nowrap font-bold bg-emerald-50/30">
                                                    {fN(row.product_kn)}
                                                </td>
                                                <td className="py-3 px-4 text-right text-emerald-900 whitespace-nowrap font-black bg-emerald-50/50">
                                                    {fN(row.yield_kn, 2)}
                                                </td>

                                                <td className="py-3 px-4 text-right text-amber-700 whitespace-nowrap font-bold bg-amber-50/30">
                                                    {fN(row.sales_cpo)}
                                                </td>
                                                <td className="py-3 px-4 text-right text-orange-600 whitespace-nowrap font-bold bg-amber-50/50">
                                                    {fN(row.sales_kn)}
                                                </td>
                                            </tr>
                                        ))}
                                        {data.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan={9} className="py-12 text-center text-slate-500">
                                                    ไม่พบข้อมูลการผลิตสำหรับเดือนนี้
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}

