// @ts-nocheck
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function TableTotalPalm() {
    const { props } = usePage<{
        pivot: Record<string, Record<number, number>>;
        years: number[];
        totals: Record<number, number>;
    }>();

    const { pivot, years, totals } = props;


    // 📌 เดือน 1–12 (แปลงเป็นชื่อเดือน)
    const monthNames = Array.from({ length: 12 }, (_, i) => new Date(2000, i).toLocaleString('default', { month: 'long' }));

    const colors = [
        { border: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }, // เขียว
        { border: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }, // แดง
        { border: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)' }, // ฟ้า
        { border: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }, // เหลือง
        { border: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }, // ม่วง
        { border: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }, // น้ำเงิน
        { border: '#ec4899', background: 'rgba(236, 72, 153, 0.1)' }, // ชมพู
        { border: '#f97316', background: 'rgba(249, 115, 22, 0.1)' }, // ส้ม
    ];

    const datasets = years.map((y, idx) => ({
        label: `ปี ${y.toString()}`,
        data: monthNames.map((month) => pivot[month]?.[y] ?? 0),
        borderColor: colors[idx % colors.length].border,
        backgroundColor: colors[idx % colors.length].background,
        borderWidth: 3,
        pointBackgroundColor: colors[idx % colors.length].border,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.3,
        fill: true,
    }));

    const chartData = {
        labels: monthNames,
        datasets,
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        family: 'Anuphan, sans-serif',
                        size: 12,
                        weight: 'bold',
                    },
                    color: '#374151',
                },
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1f2937',
                bodyColor: '#374151',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                usePointStyle: true,
                boxPadding: 6,
                callbacks: {
                    title: (context: any) => {
                        return `เดือน ${context[0].label}`;
                    },
                    label: (context: any) => {
                        return `${context.dataset.label}: ${Number(context.raw).toLocaleString('th-TH')} กิโลกรัม`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    font: {
                        family: 'Anuphan, sans-serif',
                        size: 12,
                    },
                    color: '#6b7280',
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false,
                },
                ticks: {
                    font: {
                        family: 'Anuphan, sans-serif',
                        size: 12,
                    },
                    color: '#6b7280',
                    callback: function (value: any) {
                        return value.toLocaleString('th-TH') + ' กก.';
                    },
                },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
        animations: {
            tension: {
                duration: 1000,
                easing: 'linear' as const,
                from: 0.5,
                to: 0.3,
                loop: false,
            },
        },
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'การรับซื้อผลปาล์ม', href: '/table.palm.index' },
    ];
    console.log(pivot);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="การรับซื้อผลปาล์ม" />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 py-2 font-anuphan">
                {/* Header Section */}
                <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-green-100 to-emerald-200 text-3xl text-white">
                            🌴
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Table Palm Purchase</h1>
                            <p className="text-gray-600">ข้อมูลการรับซื้อผลปาล์มรายเดือนแยกตามปี</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-6">
                    {years.map((year) => (
                        <div key={year} className="rounded-xl bg-white p-2 shadow-md">
                            <div className="flex items-center">
                                <div className="rounded-lg bg-green-100 p-1">
                                    <span className="text-sm">📊</span>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-sm font-medium text-gray-600">ปี {year}</h3>
                                    <p className="text-xl font-bold text-gray-800">
                                        {totals[year].toLocaleString()} <span className="text-sm">กิโลกรัม</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table Container */}
                <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                    <th className="px-6 py-4 text-left font-semibold">เดือน</th>
                                    {years.map((y) => (
                                        <th key={y} className="px-6 py-4 text-right font-semibold">
                                            {y}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {Object.entries(pivot).map(([month, row]) => (
                                    <tr key={month} className="transition-colors hover:bg-green-50">
                                        <td className="px-6 py-2 font-medium text-gray-700">{month}</td>
                                        {years.map((y) => {
                                            const value = Number(row[y]); // ✅ แปลงให้เป็น number
                                            return (
                                                <td key={y} className="px-6 py-2 text-right font-medium text-gray-900">
                                                    {value ? value.toLocaleString() : "-"}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}

                                {/* แสดงผลรวมแต่ละปี */}
                                <tr className="bg-gray-100 font-semibold">
                                    <td className="px-6 py-2 text-gray-700">รวมทั้งปี</td>
                                    {years.map((y) => (
                                        <td key={y} className="px-6 py-2 text-right text-gray-900">
                                            {totals[y]?.toLocaleString() ?? "-"}
                                        </td>
                                    ))}
                                </tr>

                            </tbody>
                        </table>
                    </div>
                </div>

                {/* กราฟ */}
                <div className="rounded-2xl bg-white p-6 shadow-lg mt-4">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">กราฟแสดงการรับซื้อปาล์มรายเดือน</h2>
                            <p className="text-gray-600">เปรียบเทียบข้อมูลรายปี</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                            📈
                        </div>
                    </div>
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>
        </AppLayout>
    );
}
