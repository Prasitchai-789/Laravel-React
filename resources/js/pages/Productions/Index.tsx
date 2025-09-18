import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Bar, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    Filler
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    Filler
);

export default function Index({ summary, production, dailyData, monthlyData }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Palm Purchase Dashboard', href: '/roles' },
    ];

    // กราฟแท่ง (รายวัน)
    const dailyChartData = {
        labels: dailyData.map((d) => d.date),
        datasets: [
            {
                label: "ปริมาณรับซื้อ (ตัน)",
                data: dailyData.map((d) => d.volume),
                backgroundColor: "rgba(34, 197, 94, 0.7)",
                borderColor: "rgba(34, 197, 94, 1)",
                borderWidth: 1,
                borderRadius: 6,
                hoverBackgroundColor: "rgba(34, 197, 94, 0.9)",
            },
        ],
    };

    const dailyChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'ปริมาณรับซื้อรายวัน',
                font: {
                    family: "'Anuphan', sans-serif",
                    size: 16,
                    weight: 'bold'
                },
                color: '#1f2937'
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1f2937',
                bodyColor: '#374151',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                titleFont: {
                    family: "'Anuphan', sans-serif",
                    size: 14,
                    weight: 'bold'
                },
                bodyFont: {
                    family: "'Anuphan', sans-serif",
                    size: 12
                },
                callbacks: {
                    title: function(context) {
                        return `วันที่ ${context[0].label}`;
                    },
                    label: function(context) {
                        return `ปริมาณรับซื้อ: ${context.parsed.y.toLocaleString('th-TH')} ตัน`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    font: {
                        family: "'Anuphan', sans-serif",
                        size: 12,
                    },
                    color: '#6b7280',
                },
                title: {
                    display: true,
                    text: 'วันที่',
                    font: {
                        family: "'Anuphan', sans-serif",
                        size: 14,
                        weight: 'bold'
                    },
                    color: '#374151',
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false,
                },
                ticks: {
                    font: {
                        family: "'Anuphan', sans-serif",
                        size: 12,
                    },
                    color: '#6b7280',
                    callback: function(value) {
                        return value.toLocaleString('th-TH');
                    },
                },
                title: {
                    display: true,
                    text: 'ปริมาณ (ตัน)',
                    font: {
                        family: "'Anuphan', sans-serif",
                        size: 14,
                        weight: 'bold'
                    },
                    color: '#374151',
                }
            },
        }
    };

    // กราฟเส้น (รายเดือน)
    const monthlyChartData = {
        labels: monthlyData.map((m) => m.month),
        datasets: [
            {
                label: "การผลิตจริง (ตัน)",
                data: monthlyData.map((m) => m.production),
                borderColor: "rgba(59, 130, 246, 1)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                tension: 0.3,
                fill: true,
            },
            {
                label: "ค่าที่ควรได้ (ตัน)",
                data: monthlyData.map((m) => m.expected),
                borderColor: "rgba(239, 68, 68, 1)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderDash: [5, 5],
                tension: 0.3,
                fill: true,
            },
        ],
    };

    const monthlyChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    font: {
                        family: "'Anuphan', sans-serif",
                        size: 12,
                        weight: 'bold'
                    },
                    color: '#374151'
                }
            },
            title: {
                display: true,
                text: 'ปริมาณการผลิตรายเดือน',
                font: {
                    family: "'Anuphan', sans-serif",
                    size: 16,
                    weight: 'bold'
                },
                color: '#1f2937'
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1f2937',
                bodyColor: '#374151',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                titleFont: {
                    family: "'Anuphan', sans-serif",
                    size: 14,
                    weight: 'bold'
                },
                bodyFont: {
                    family: "'Anuphan', sans-serif",
                    size: 12
                },
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y.toLocaleString('th-TH')} ตัน`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    font: {
                        family: "'Anuphan', sans-serif",
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
                        family: "'Anuphan', sans-serif",
                        size: 12,
                    },
                    color: '#6b7280',
                    callback: function(value) {
                        return value.toLocaleString('th-TH');
                    },
                },
                title: {
                    display: true,
                    text: 'ปริมาณ (ตัน)',
                    font: {
                        family: "'Anuphan', sans-serif",
                        size: 14,
                        weight: 'bold'
                    },
                    color: '#374151',
                }
            },
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    };

    // คำนวณเปอร์เซ็นต์สำหรับการ์ดรูปแบบใหม่
    const totalVolume = 1334650; // 1,334,650 kg
    const carryOver = 586470; // 586,470 kg
    const newPurchase = 748180; // 748,180 kg
    const percentage = ((carryOver + newPurchase) / totalVolume * 100).toFixed(1);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard ปาล์ม" />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-anuphan">
                {/* Header */}
                <div className="mb-3">
                    <h1 className="text-3xl font-bold text-gray-800">🌴 Dashboard ปาล์ม</h1>
                    <p className="text-gray-600">ระบบติดตามการรับซื้อและผลิตปาล์มน้ำมัน</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-6 mb-4 md:grid-cols-2 lg:grid-cols-5">
                    {/* การ์ดรูปแบบใหม่ตามที่ต้องการ */}
                    <div className="col-span-1 lg:col-span-2 rounded-2xl bg-white p-6 shadow-lg">
                        <div className="mb-2">
                            <span className="flex items-center float-end">
                                <span className="text-sm text-gray-400">{percentage}%</span>
                                <i className="fa-solid fa-arrow-up text-green-500 ms-2"></i>
                            </span>
                            <h5 className="truncate card-title font-semibold text-gray-800">ปริมาณผลปาล์ม</h5>
                        </div>

                        <div className="mb-1">
                            <h2 className="text-3xl font-medium text-center text-gray-800">
                                1,334,650
                                <span className="text-sm"> kg.</span>
                            </h2>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <div className="mx-6 text-center">
                                <p className="text-xl font-bold text-gray-900">
                                    <span className="text-sm">586,470</span>
                                </p>
                                <p className="text-sm text-gray-500">ยอดยกมา</p>
                            </div>
                            <div className="w-[1px] h-8 bg-gray-400"></div>
                            <div className="mx-6 text-center">
                                <p className="text-xl font-bold text-gray-900">
                                    <span className="text-sm">748,180</span>
                                </p>
                                <p className="text-sm text-gray-500">ผลปาล์มรับเข้า</p>
                            </div>
                        </div>

                        <div className="flex w-full h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-sm">
                            <div
                                className="flex flex-col justify-center overflow-hidden rounded-full bg-green-500"
                                role="progressbar"
                                aria-valuenow={percentage}
                                aria-valuemin="0"
                                aria-valuemax="100"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Card 1 */}
                    <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
                        <div className="flex items-center">
                            <div className="rounded-lg bg-white/20 p-3">
                                <span className="text-2xl">📦</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium">รับซื้อผลปาล์มวันนี้</h3>
                                <p className="text-2xl font-bold">{summary.purchase_volume} ตัน</p>
                                <p className="text-sm opacity-90">ยอดเงิน: {summary.purchase_amount.toLocaleString()} บาท</p>
                                <p className="text-sm opacity-90">ราคาเฉลี่ย: {summary.avg_price} บาท/ตัน</p>
                            </div>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg">
                        <div className="flex items-center">
                            <div className="rounded-lg bg-white/20 p-3">
                                <span className="text-2xl">🏭</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium">ยอดคงเหลือบนลานเท</h3>
                                <p className="text-2xl font-bold">{summary.remaining_volume} ตัน</p>
                                <p className="text-sm opacity-90">ยอดยกมา: {summary.carry_over} ตัน</p>
                            </div>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
                        <div className="flex items-center">
                            <div className="rounded-lg bg-white/20 p-3">
                                <span className="text-2xl">🚚</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium">กะบะที่ยกไปผลิต</h3>
                                <p className="text-2xl font-bold">{summary.truck_count} คัน</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* กราฟ */}
                <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
                    {/* กราฟแท่งรายวัน */}
                    <div className="rounded-2xl bg-white p-6 shadow-lg">
                        <h2 className="mb-4 text-xl font-bold text-gray-800">ปริมาณรับซื้อรายวัน</h2>
                        <div className="h-80">
                            <Bar data={dailyChartData} options={dailyChartOptions} />
                        </div>
                    </div>

                    {/* กราฟเส้นรายเดือน */}
                    <div className="rounded-2xl bg-white p-6 shadow-lg">
                        <h2 className="mb-4 text-xl font-bold text-gray-800">ปริมาณการผลิตรายเดือน</h2>
                        <div className="h-80">
                            <Line data={monthlyChartData} options={monthlyChartOptions} />
                        </div>
                    </div>
                </div>

                {/* ตารางสรุปการผลิต */}
                <div className="rounded-2xl bg-white p-6 shadow-lg">
                    <h2 className="mb-6 text-xl font-bold text-gray-800">ตารางข้อมูลการผลิต</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                                    <th className="p-4 text-left font-semibold text-gray-700">ผลิตภัณฑ์</th>
                                    <th className="p-4 text-right font-semibold text-gray-700">ปริมาณ (ตัน)</th>
                                    <th className="p-4 text-right font-semibold text-gray-700">คิดเป็น %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {production.map((item, index: number) => (
                                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-800">{item.name}</td>
                                        <td className="p-4 text-right text-gray-700">{item.volume}</td>
                                        <td className="p-4 text-right">
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                                {item.percent}%
                                            </span>
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
