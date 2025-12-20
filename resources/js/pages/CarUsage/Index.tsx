import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { Car, Calendar, MapPin, Gauge, TrendingUp, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

dayjs.extend(buddhistEra);
dayjs.locale('th');

interface CarUsageData {
    car_id: string;
    car_number: string;
    province_name: string;
    full_car_name: string;
    car_brand: string;
    car_model: string;
    trip_count: number;
    first_date: string;
    last_date: string;
    mileage_start: number;
    mileage_end: number;
    total_distance: number;
}

interface Summary {
    total_vehicles: number;
    total_trips: number;
    total_distance: number;
}

interface ApiResponse {
    success: boolean;
    year: number;
    month: number;
    data: CarUsageData[];
    summary: Summary;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'รายงานการใช้รถ', href: '#' },
];

const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function CarUsageIndex() {
    const [data, setData] = useState<CarUsageData[]>([]);
    const [summary, setSummary] = useState<Summary>({ total_vehicles: 0, total_trips: 0, total_distance: 0 });
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get<ApiResponse>('/car-usage-report/api', {
                params: { year, month }
            });
            if (response.data.success) {
                setData(response.data.data);
                setSummary(response.data.summary);
            }
        } catch (error) {
            console.error('Error fetching car usage data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [year, month]);

    const formatNumber = (num: number): string => {
        return num.toLocaleString('th-TH');
    };

    const formatDate = (dateStr: string): string => {
        if (!dateStr) return '-';
        return dayjs(dateStr).format('D MMM BBBB HH:mm');
    };

    // Generate year options (5 years back + current year)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 font-anuphan">
                <div className="mx-auto max-w-7xl">

                    {/* Header Section */}
                    <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            {/* Title */}
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                    <Car className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800 lg:text-3xl">รายงานการใช้รถ</h1>
                                    <p className="mt-1 text-gray-600">สรุประยะทางการใช้รถประจำเดือน</p>
                                </div>
                            </div>

                            {/* Current Period Display */}
                            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                                <div className="text-center">
                                    <p className="mb-1 text-sm font-medium text-blue-700">ช่วงเวลาที่แสดง</p>
                                    <p className="font-semibold text-blue-800">
                                        {monthNames[month - 1]} {year + 543}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        เดือน
                                    </div>
                                </label>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                >
                                    {monthNames.map((name, index) => (
                                        <option key={index + 1} value={index + 1}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        ปี (พ.ศ.)
                                    </div>
                                </label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                >
                                    {yearOptions.map((y) => (
                                        <option key={y} value={y}>
                                            {y + 543}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-gray-700 opacity-0">Actions</label>
                                <button
                                    onClick={fetchData}
                                    disabled={loading}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 font-medium text-white shadow-lg transition-all hover:scale-[1.02] hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                                    {loading ? 'กำลังโหลด...' : 'โหลดข้อมูล'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100">จำนวนรถที่ใช้งาน</p>
                                    <p className="mt-2 text-3xl font-bold">{formatNumber(summary.total_vehicles)}</p>
                                    <p className="mt-1 text-blue-100">คัน</p>
                                </div>
                                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                                    <Car className="h-8 w-8" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100">จำนวนเที่ยวทั้งหมด</p>
                                    <p className="mt-2 text-3xl font-bold">{formatNumber(summary.total_trips)}</p>
                                    <p className="mt-1 text-green-100">เที่ยว</p>
                                </div>
                                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                                    <TrendingUp className="h-8 w-8" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100">ระยะทางรวม</p>
                                    <p className="mt-2 text-3xl font-bold">{formatNumber(summary.total_distance)}</p>
                                    <p className="mt-1 text-purple-100">กิโลเมตร</p>
                                </div>
                                <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                                    <Gauge className="h-8 w-8" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-800">
                                รายละเอียดการใช้รถแต่ละคัน
                            </h2>
                            <span className="text-sm text-gray-500">
                                {data.length} รายการ
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex h-64 items-center justify-center">
                                <div className="flex flex-col items-center">
                                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
                                    <p className="mt-4 text-gray-500">กำลังโหลดข้อมูล...</p>
                                </div>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="flex h-64 items-center justify-center">
                                <div className="text-center">
                                    <Car className="mx-auto h-16 w-16 text-gray-300" />
                                    <p className="mt-4 text-gray-500">ไม่พบข้อมูลการใช้รถในเดือนที่เลือก</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ลำดับ</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">หมายเลขรถ</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">จำนวนเที่ยว</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">เลขไมล์เริ่มต้น</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">เลขไมล์สิ้นสุด</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">ระยะทางรวม (กม.)</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">วันที่ใช้แรก</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">วันที่ใช้ล่าสุด</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.map((item, index) => (
                                            <tr key={item.car_id} className="hover:bg-blue-50/50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                                            <Car className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <span className="font-medium text-gray-800">{item.full_car_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-medium text-emerald-800">
                                                        {formatNumber(item.trip_count)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-sm text-gray-600">
                                                    {formatNumber(item.mileage_start)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-sm text-gray-600">
                                                    {formatNumber(item.mileage_end)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-bold text-indigo-600">
                                                        {formatNumber(item.total_distance)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-gray-600">
                                                    {formatDate(item.first_date)}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-gray-600">
                                                    {formatDate(item.last_date)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-semibold">
                                            <td colSpan={2} className="px-4 py-3 text-gray-700">รวมทั้งหมด</td>
                                            <td className="px-4 py-3 text-center text-emerald-700">
                                                {formatNumber(summary.total_trips)}
                                            </td>
                                            <td colSpan={2} className="px-4 py-3 text-right text-gray-500">-</td>
                                            <td className="px-4 py-3 text-right text-lg text-indigo-700">
                                                {formatNumber(summary.total_distance)}
                                            </td>
                                            <td colSpan={2} className="px-4 py-3"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            ข้อมูลอัพเดทล่าสุด: {dayjs().format('D MMMM BBBB HH:mm')} น.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
