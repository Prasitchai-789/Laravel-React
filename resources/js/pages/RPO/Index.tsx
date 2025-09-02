import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import React, { useState } from 'react';

export default function Index() {
    const { props } = usePage<{
        startDate: string;
        endDate: string;
        total: number;
        items: { Province: string; GoodName: string; TotalQty: number ; VendorCount: number }[];
    }>();

    const { startDate, endDate, total, items } = props;

    // สร้าง state สำหรับ input date
    const [dates, setDates] = useState({ start: startDate, end: endDate });

    // handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDates({ ...dates, [e.target.name]: e.target.value });
    };

    // handle filter button
    const handleFilter = () => {
        const query = new URLSearchParams();
        if (dates.start) query.append('start_date', dates.start);
        if (dates.end) query.append('end_date', dates.end);
        window.location.href = `/purchases/summary?${query.toString()}`;
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Palm Purchase Dashboard', href: '/roles' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Palm Purchase Dashboard" />
            <div className="min-h-screen bg-gray-50 p-6 font-anuphan">
            {/* Header Section */}
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-2xl text-white">
                        🌴
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Palm Purchase Dashboard</h1>
                </div>
            </div>

            {/* Filter Section */}
            <div className="mb-4 rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-2 text-lg font-semibold text-gray-700">ช่วงวันที่ต้องการดูข้อมูล</h2>
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="mb-2 block text-sm font-medium text-gray-600">วันที่เริ่มต้น</label>
                        <input
                            type="date"
                            name="start"
                            value={dates.start}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="mb-2 block text-sm font-medium text-gray-600">วันที่สิ้นสุด</label>
                        <input
                            type="date"
                            name="end"
                            value={dates.end}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        />
                    </div>
                    <button
                        onClick={handleFilter}
                        className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-medium text-white transition-all hover:from-green-600 hover:to-emerald-700 hover:shadow-lg"
                    >
                        แสดงข้อมูล
                    </button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="mb-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white shadow-lg">
                <h2 className="mb-2 text-lg font-semibold">ปริมาณการรับซื้อทั้งหมด</h2>
                <p className="text-4xl font-bold">{total.toLocaleString()} Kg.</p>
                <p className="mt-2 text-green-100">ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH')}</p>
            </div>

            {/* Data Table */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-md">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-xl font-semibold text-gray-800">รายละเอียดการรับซื้อแยกตามจังหวัด</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600">
                                <th className="px-6 py-4 text-left font-semibold">จังหวัด</th>
                                <th className="px-6 py-4 text-right font-semibold">จำนวนผู้ขาย</th>
                                <th className="px-6 py-4 text-right font-semibold">ปริมาณ (กก.)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {items.map((item, idx) => (
                                <tr key={idx} className="transition-colors hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-700">{item.Province}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                            {item.VendorCount} ราย
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                                        {item.TotalQty.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </AppLayout>
    );
}
