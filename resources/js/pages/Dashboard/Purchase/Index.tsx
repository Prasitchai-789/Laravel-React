import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface PurchaseData {
    DeptID: number;
    DeptName: string;
    TotalBase: number;
    TotalVAT: number;
    TotalNet: number;
}

export default function Index() {
    const { dashboard: initialDashboard } = usePage().props as { dashboard: PurchaseData[] };
    const [dashboard, setDashboard] = useState<PurchaseData[]>(initialDashboard || []);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [loading, setLoading] = useState(false);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/purchase/dashboard-json', { params: { year, month } });
            const apiData: PurchaseData[] = res.data.dashboard || [];
            setDashboard(apiData);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, [year, month]);
    console.log(dashboard);
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = [
        { value: 0, label: 'ทั้งหมด' },
        ...Array.from({ length: 12 }, (_, i) => ({
            value: i + 1,
            label: `${i + 1}`.padStart(2, '0'),
        })),
    ];

    const getThaiMonthName = (month: number): string => {
        const thaiMonths = [
            'มกราคม',
            'กุมภาพันธ์',
            'มีนาคม',
            'เมษายน',
            'พฤษภาคม',
            'มิถุนายน',
            'กรกฎาคม',
            'สิงหาคม',
            'กันยายน',
            'ตุลาคม',
            'พฤศจิกายน',
            'ธันวาคม',
        ];
        return `${thaiMonths[month - 1] || ''}`;
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Expense Documents', href: '/memo/documents' },
    ];

    // เรียงข้อมูลจากมากไปน้อยก่อนคำนวณ total
    const sortedDashboard = [...dashboard].sort((a, b) => b.TotalBase - a.TotalBase);
    const totalNet = sortedDashboard.reduce((sum, item) => sum + Number(item.TotalNet), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gray-50/30 p-6 font-anuphan">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="mb-2 text-2xl font-bold text-gray-900">สรุปค่าใช้จ่ายตามหน่วยงาน</h1>
                        <p className="text-gray-600">ข้อมูลสรุปยอดค่าใช้จ่ายแยกตามหน่วยงาน</p>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-medium text-gray-700">ปี</label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-medium text-gray-700">เดือน</label>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(parseInt(e.target.value))}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                >
                                    {months.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.value === 0 ? m.label : getThaiMonthName(m.value)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={fetchDashboard}
                                disabled={loading}
                                className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
                            </button>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
                        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-lg lg:col-span-4">
                            <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
                                <div>
                                    <p className="text-sm font-medium text-blue-100">
                                        ยอดรวมทั้งหมด ประจำ{month === 0 ? `ปี ${year}` : `${getThaiMonthName(month)} ${year}`}
                                    </p>
                                    <p className="mt-1 text-3xl font-bold">
                                        {totalNet
                                            ? ` ${parseFloat(totalNet.toString())
                                                  .toFixed(2)
                                                  .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                                            : '-'}{' '}
                                        บาท
                                    </p>
                                </div>
                                {/* <div className="mt-4 sm:mt-0">
                                    <span className="inline-flex items-center rounded-full bg-blue-500 px-3 py-1 text-sm font-medium text-blue-100">
                                        {month === 0 ? `ปี ${year}` : `${getThaiMonthName(month)} ${year}`}
                                    </span>
                                </div> */}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white font-anuphan shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase">ลำดับ</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">หน่วยงาน</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-gray-600 uppercase">ยอดก่อน VAT</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-gray-600 uppercase">VAT</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-gray-600 uppercase">ยอดสุทธิ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {sortedDashboard.length > 0 ? (
                                        sortedDashboard.map((d, index) => (
                                            <tr key={d.DeptID} className="transition-colors duration-150 hover:bg-gray-50">
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="mr-3 h-2 w-2 rounded-full bg-blue-500"></div>
                                                        <span className="text-sm font-medium text-gray-900">{d.DeptName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    {Number(d.TotalBase).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    {Number(d.TotalVAT).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    {Number(d.TotalNet).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลสำหรับช่วงเวลาที่เลือก'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>

                                {sortedDashboard.length > 0 && (
                                    <tfoot className="border-t border-gray-200 bg-gray-50">
                                        <tr>
                                            <td className="px-6 py-4 font-semibold text-gray-900" colSpan={2}>
                                                รวมทั้งหมด
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                {sortedDashboard
                                                    .reduce((s, i) => s + Number(i.TotalBase), 0)
                                                    .toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                {sortedDashboard
                                                    .reduce((s, i) => s + Number(i.TotalVAT), 0)
                                                    .toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                {sortedDashboard
                                                    .reduce((s, i) => s + Number(i.TotalNet), 0)
                                                    .toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
