import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { User, Calendar, Gauge, TrendingUp, RefreshCw, Briefcase, FileDown, Search, ArrowRight, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

dayjs.extend(buddhistEra);
dayjs.locale('th');

// ... interface UserUsageData, Summary, ApiResponse เหมือนเดิม ...

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'รายงานการใช้รถตามผู้ใช้', href: '#' },
];

const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function UserCarUsageReport() {
    const [data, setData] = useState<UserUsageData[]>([]);
    const [summary, setSummary] = useState<Summary>({ total_users: 0, total_trips: 0, total_distance: 0 });
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get<ApiResponse>('/user-car-usage-report/api', {
                params: { year, month }
            });
            if (response.data.success) {
                setData(response.data.data);
                setSummary(response.data.summary);
            }
        } catch (error) {
            console.error('Error fetching user car usage data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [year, month]);

    const formatNumber = (num: number) => num.toLocaleString('th-TH');
    const formatDate = (dateStr: string) => dateStr ? dayjs(dateStr).format('D MMM BBBB') : '-';

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-slate-50 p-4 lg:p-8 font-anuphan text-gray-800">
                <div className="mx-auto max-w-7xl space-y-6">

                    {/* Header Card */}
                    <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-100">
                                    <UserCheck className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">รายงานตามผู้ใช้</h1>
                                    <p className="text-gray-500">สรุปการใช้รถแยกตามรายชื่อพนักงานและแผนก</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center rounded-2xl bg-emerald-50 px-6 py-3 border border-emerald-100">
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">รอบรายงาน</span>
                                <span className="text-lg font-bold text-emerald-900">{monthNames[month - 1]} {year + 543}</span>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-600 flex items-center gap-2 ml-1">
                                    <Calendar className="h-4 w-4" /> เลือกเดือน
                                </label>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                    className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                                >
                                    {monthNames.map((name, index) => (
                                        <option key={index + 1} value={index + 1}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-600 flex items-center gap-2 ml-1">
                                    <Calendar className="h-4 w-4" /> เลือกปี พ.ศ.
                                </label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                                >
                                    {yearOptions.map((y) => (
                                        <option key={y} value={y}>{y + 543}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end gap-2 lg:col-span-2">
                                <button
                                    onClick={fetchData}
                                    disabled={loading}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-md shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                                    {loading ? 'กำลังโหลด...' : 'ค้นหาข้อมูล'}
                                </button>
                                <a
                                    href={`/user-car-usage-report/export?year=${year}&month=${month}`}
                                    className="flex items-center justify-center rounded-xl bg-white border border-emerald-200 px-6 py-3 font-bold text-emerald-600 shadow-sm hover:bg-emerald-50 active:scale-[0.98] transition-all"
                                >
                                    <FileDown className="h-5 w-5" />
                                    <span className="ml-2 hidden sm:inline">Excel</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 p-6 text-white shadow-lg shadow-emerald-100 transition-transform hover:scale-[1.01]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-emerald-100 text-sm font-medium">พนักงานที่ใช้รถ</p>
                                    <p className="mt-2 text-4xl font-bold">{formatNumber(summary.total_users)}</p>
                                    <p className="mt-1 text-xs text-emerald-100/80">คน ในเดือนนี้</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                    <User className="h-7 w-7" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white shadow-lg shadow-blue-100 transition-transform hover:scale-[1.01]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">จำนวนเที่ยวรวม</p>
                                    <p className="mt-2 text-4xl font-bold">{formatNumber(summary.total_trips)}</p>
                                    <p className="mt-1 text-xs text-blue-100/80">เที่ยวสะสมทั้งหมด</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                    <TrendingUp className="h-7 w-7" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-lg shadow-indigo-100 transition-transform hover:scale-[1.01]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-indigo-100 text-sm font-medium">ระยะทางรวม</p>
                                    <p className="mt-2 text-4xl font-bold">{formatNumber(summary.total_distance)}</p>
                                    <p className="mt-1 text-xs text-indigo-100/80">กิโลเมตร</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                    <Gauge className="h-7 w-7" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                        <div className="border-b border-gray-50 px-6 py-5 flex items-center justify-between bg-white">
                            <h2 className="text-xl font-bold text-gray-800">รายละเอียดพนักงาน</h2>
                            <div className="text-sm font-medium text-gray-400">พนักงาน {data.length} ท่าน</div>
                        </div>

                        {loading ? (
                            <div className="flex h-80 flex-col items-center justify-center bg-white">
                                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                                <p className="mt-4 font-medium text-gray-500">กำลังรวบรวมรายชื่อ...</p>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="flex h-80 flex-col items-center justify-center text-center">
                                <div className="bg-gray-50 p-6 rounded-full">
                                    <Search className="h-10 w-10 text-gray-300" />
                                </div>
                                <p className="mt-4 font-bold text-gray-800 text-lg">ไม่พบประวัติการใช้งาน</p>
                                <p className="text-gray-500">ยังไม่มีพนักงานบันทึกการใช้รถในรอบเดือนนี้</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-16">#</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left">พนักงาน</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left">แผนก / ตำแหน่ง</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">จำนวนเที่ยว</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">ระยะทางรวม</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">ใช้งานครั้งล่าสุด</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.map((item, index) => (
                                            <tr key={item.emp_id} className="hover:bg-emerald-50/40 transition-colors group">
                                                <td className="px-6 py-4 text-center text-sm font-medium text-gray-400">{index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold border-2 border-white shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                            <User className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 leading-tight">{item.emp_name}</p>
                                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight mt-1">ID: {item.emp_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                                            <Briefcase className="h-3.5 w-3.5 text-emerald-500" />
                                                            {item.emp_dept}
                                                        </div>
                                                        <p className="text-xs text-gray-400 ml-5">{item.emp_position || '-'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center px-4 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">
                                                        {formatNumber(item.trip_count)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end leading-none">
                                                        <span className="text-lg font-black text-emerald-600">{formatNumber(item.total_distance)}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">กม.</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{formatDate(item.last_date)}</span>
                                                        <span className="text-[10px] text-gray-400 mt-1">เริ่มเมื่อ: {formatDate(item.first_date)}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-emerald-600 text-white">
                                            <td colSpan={3} className="px-6 py-5 font-bold text-lg">สรุปผลรวมพนักงานทั้งหมด</td>
                                            <td className="px-6 py-5 text-center font-bold text-xl border-l border-emerald-500/50">
                                                <p className="text-[10px] text-emerald-200 uppercase tracking-widest font-bold">รวมทั้งสิ้น</p>
                                                {formatNumber(summary.total_trips)}
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-2xl">
                                                <p className="text-[10px] text-emerald-200 uppercase tracking-widest font-bold">ระยะทางรวม</p>
                                                {formatNumber(summary.total_distance)}
                                            </td>
                                            <td className="px-6 py-5 border-l border-emerald-500/50"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-400 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <RefreshCw className="h-3 w-3" />
                            <span>อัพเดทล่าสุด: {dayjs().format('D MMM BBBB HH:mm')} น.</span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}