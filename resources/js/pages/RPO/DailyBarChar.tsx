import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
// Register ChartJS components
ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ChartDataLabels);

export default function DailyBarChart() {
    const { props } = usePage<{ dailyData: { Year: number; Month: number; Day: number; TotalQty: number }[] }>();
    const { dailyData } = props;

    // 📌 สร้าง list ของปีและเดือนจาก dailyData
    const years = [...new Set(dailyData.map((d) => Number(String(d.Year).trim())))]
        .sort((a, b) => a - b);

    const months = [...new Set(dailyData.map((d) => Number(String(d.Month).trim())))]
        .sort((a, b) => a - b);

    // ตั้งค่าเริ่มต้นเป็นเดือนและปีปัจจุบัน
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const [selectedYear, setSelectedYear] = useState(
        years.includes(currentYear) ? currentYear : years[years.length - 1],
    );
    const [selectedMonth, setSelectedMonth] = useState(months.includes(currentMonth) ? currentMonth : months[0]);

    // 📌 Filter ข้อมูลเฉพาะปี/เดือนที่เลือก
    const filtered = dailyData.filter(
        (d) =>
            Number(String(d.Year).trim()) === selectedYear &&
            Number(String(d.Month).trim()) === selectedMonth
    );

    // 📌 เตรียม labels และ data สำหรับกราฟแท่ง (รายวัน)
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const dayLabels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    const data = dayLabels.map((day) => {
        const dayData = dailyData.find(
            (d) =>
                Number(String(d.Year).trim()) === selectedYear &&
                Number(String(d.Month).trim()) === selectedMonth &&
                Number(String(d.Day).trim()) === parseInt(day)
        );
        return dayData ? dayData.TotalQty / 1000 : 0;
    });

    // 📌 เตรียมข้อมูลสำหรับกราฟเส้น (รายเดือน)
    const monthNames = [
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

    // ✅ คำนวณข้อมูลรายเดือน
    const monthlyData = years.map((year) => {
        return months.map((month) => {
            const monthlyTotal = dailyData
                .filter((item) => Number(String(item.Year).trim()) === year &&
                    Number(String(item.Month).trim()) === month)
                .reduce((sum, item) => sum + Number(item.TotalQty), 0);
            return monthlyTotal / 1000;
        });
    });


    // ✅ คำนวณข้อมูลรายวันเปรียบเทียบแต่ละปี
    const dailyComparisonData = years.map((year) => {
        const yearData = dailyData.filter(
            (item) => Number(String(item.Year).trim()) === year &&
                Number(String(item.Month).trim()) === selectedMonth
        );
        return dayLabels.map((day) => {
            const dayItem = yearData.find(
                (item) => Number(String(item.Day).trim()) === Number(day)
            );
            return dayItem ? Number(dayItem.TotalQty) / 1000 : 0;
        });
    });


    // ✅ สีสำหรับกราฟเส้นแต่ละปี
    const lineColors = [
        '#10b981',
        '#ec4899',
        '#3b82f6',
        '#f59e0b',
        '#8b5cf6',
        '#06b6d4',
        '#f97316',
        '#ef4444',
    ];

    // ✅ ข้อมูลสำหรับกราฟเส้นรายเดือน
    const lineChartData = {
        labels: monthNames,
        datasets: years.map((year, index) => ({
            label: `ปี ${year + 543}`,
            data: monthlyData[index],
            borderColor: lineColors[index % lineColors.length],
            backgroundColor: `${lineColors[index % lineColors.length]}20`,
            tension: 0.3,
            fill: false,
            pointBackgroundColor: lineColors[index % lineColors.length],
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
        })),
    };

    // ✅ ข้อมูลสำหรับกราฟเส้นรายวัน
    const dailyLineChartData = {
        labels: dayLabels,
        datasets: years.map((year, index) => ({
            label: `ปี ${year + 543}`,
            data: dailyComparisonData[index],
            borderColor: lineColors[index % lineColors.length],
            backgroundColor: `${lineColors[index % lineColors.length]}20`,
            tension: 0.3,
            fill: false,
            pointBackgroundColor: lineColors[index % lineColors.length],
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
        })),
    };

    // ✅ ตั้งค่า options สำหรับกราฟเส้นรายเดือน
    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    font: { family: 'Anuphan, sans-serif', size: 12, weight: 'bold' },
                    color: '#374151',
                    usePointStyle: true,
                    padding: 20,
                },
            },
            title: {
                display: true,
                text: 'เปรียบเทียบยอดรับซื้อปาล์มรายเดือนตามปี',
                font: { family: 'Anuphan, sans-serif', size: 16, weight: 'bold' },
                color: '#1f2937',
                padding: { top: 10, bottom: 5 },
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
                    label: (context: any) =>
                        `${context.dataset.label}: ${Number(context.raw).toLocaleString(
                            'th-TH'
                        )} ตัน`,
                },
            },
            datalabels: { display: false },
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: {
                    font: { family: 'Anuphan, sans-serif', size: 12, weight: 'bold' },
                    color: '#6b7280',
                },
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
                ticks: {
                    font: { family: 'Anuphan, sans-serif', size: 11 },
                    color: '#6b7280',
                    callback: (value: unknown) => {
                        const num =
                            typeof value === 'number' ? value : parseFloat(String(value));
                        return isNaN(num) ? '' : num.toLocaleString('th-TH');
                    },
                },
                title: {
                    display: true,
                    text: 'ปริมาณ (ตัน)',
                    font: { family: 'Anuphan, sans-serif', size: 12, weight: 'bold' },
                    color: '#374151',
                },
            },
        },
        interaction: { intersect: false, mode: 'index' as const },
    };

    // ✅ ตั้งค่า options สำหรับกราฟเส้นรายวัน
    const dailyLineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    font: { family: 'Anuphan, sans-serif', size: 12, weight: 'bold' },
                    color: '#374151',
                    usePointStyle: true,
                    padding: 20,
                },
            },
            title: {
                display: true,
                text: `เปรียบเทียบยอดรับซื้อปาล์มรายวัน เดือน${monthNames[selectedMonth - 1]
                    }`,
                font: { family: 'Anuphan, sans-serif', size: 16, weight: 'bold' },
                color: '#1f2937',
                padding: { top: 10, bottom: 5 },
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
                    title: (context: any) =>
                        `วันที่ ${context[0].label} ${monthNames[selectedMonth - 1]}`,
                    label: (context: any) =>
                        `${context.dataset.label}: ${Number(context.raw).toLocaleString(
                            'th-TH'
                        )} ตัน`,
                },
            },
            datalabels: { display: false },
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: {
                    font: { family: 'Anuphan, sans-serif', size: 11, weight: 'bold' },
                    color: '#6b7280',
                },
                title: {
                    display: true,
                    text: 'วันที่',
                    font: { family: 'Anuphan, sans-serif', size: 12, weight: 'bold' },
                    color: '#374151',
                },
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
                ticks: {
                    font: { family: 'Anuphan, sans-serif', size: 11 },
                    color: '#6b7280',
                    callback: (value: unknown) => {
                        const num =
                            typeof value === 'number' ? value : parseFloat(String(value));
                        return isNaN(num) ? '' : num.toLocaleString('th-TH');
                    },
                },
                title: {
                    display: true,
                    text: 'ปริมาณ (ตัน)',
                    font: { family: 'Anuphan, sans-serif', size: 12, weight: 'bold' },
                    color: '#374151',
                },
            },
        },
        interaction: { intersect: false, mode: 'index' as const },
    };

    // ✅ เตรียมข้อมูลกราฟแท่ง (รายวัน)
    const maxValue = Math.max(...data);

    const chartData = {
        labels: dayLabels,
        datasets: [
            {
                data,
                backgroundColor: (context: any) => {
                    const value = context.dataset.data[context.dataIndex];
                    const ratio = maxValue > 0 ? value / maxValue : 0;
                    return `rgba(37, 99, 235, ${0.4 + ratio * 0.6})`;
                },
                borderColor: '#2563eb',
                borderWidth: 1,
                borderRadius: 6,
                hoverBackgroundColor: '#1e40af',
                hoverBorderColor: '#1e3a8a',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: `กราฟแสดงยอดรับซื้อปาล์มรายวัน - เดือน${monthNames[selectedMonth - 1]
                    } ${selectedYear + 543}`,
                font: { family: 'Anuphan, sans-serif', size: 16, weight: 'bold' },
                color: '#1f2937',
                padding: { top: 10, bottom: 20 },
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
                    title: (context: any) =>
                        `วันที่ ${context[0].label} ${monthNames[selectedMonth - 1]}`,
                    label: (context: any) =>
                        `ยอดรับซื้อ: ${Number(context.raw).toLocaleString('th-TH')} ตัน`,
                },
            },
            datalabels: {
                anchor: 'end',
                align: 'end',
                formatter: (value: number) =>
                    value > 0
                        ? value.toLocaleString('th-TH', { maximumFractionDigits: 1 })
                        : '',
                color: '#111827',
                font: { family: 'Anuphan, sans-serif', weight: 'bold' as const, size: 10 },
                padding: { top: 4 },
            },
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: {
                    font: { family: 'Anuphan, sans-serif', size: 11, weight: 'bold' },
                    color: '#6b7280',
                },
                title: {
                    display: true,
                    text: 'วันที่',
                    font: { family: 'Anuphan, sans-serif', size: 12, weight: 'bold' },
                    color: '#374151',
                },
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
                ticks: {
                    font: { family: 'Anuphan, sans-serif', size: 11 },
                    color: '#6b7280',
                    callback: (value: unknown) => {
                        const num =
                            typeof value === 'number' ? value : parseFloat(String(value));
                        return isNaN(num) ? '' : num.toLocaleString('th-TH');
                    },
                },
                title: {
                    display: true,
                    text: 'ปริมาณ (ตัน)',
                    font: { family: 'Anuphan, sans-serif', size: 12, weight: 'bold' },
                    color: '#374151',
                },
            },
        },
        interaction: { intersect: false, mode: 'index' as const },
        animation: { duration: 1000, easing: 'easeOutQuart' },
    };

    // ✅ breadcrumbs
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Table Palm Purchase', href: '/table.palm.index' },
    ];

    // ✅ คำนวณค่าสถิติ
    const daysWithData = data.filter((value) => value > 0).length;
    const TotalQty = data.reduce((sum, value) => sum + value, 0);
    const maxDaily = Math.max(...data);

    // ✅ สร้างตารางข้อมูลสำหรับกราฟเส้นรายวัน
    const dailyComparisonTableData = years.map((year, index) => ({
        year: year + 543,
        data: dailyComparisonData[index],
        color: lineColors[index % lineColors.length],
    }));


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="กราฟยอดรับซื้อปาล์มรายวัน" />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-4 font-anuphan">
                {/* Header Section */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-3xl text-white">
                            📊
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">กราฟยอดรับซื้อปาล์ม</h1>
                            <p className="text-gray-600">
                                ข้อมูล ณ วันที่ {currentDate.getDate()} {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="mb-4 rounded-2xl bg-white px-6 py-2 pb-6 shadow-md">
                    <div className="flex items-center justify-between">
                        <h2 className="p-0 text-lg font-semibold text-gray-700">เลือกช่วงเวลาที่ต้องการดู</h2>
                        <div className="text-sm text-gray-500">
                            {selectedMonth === currentMonth && selectedYear === currentYear ? '(แสดงข้อมูลเดือนปัจจุบัน)' : '(แสดงข้อมูลย้อนหลัง)'}
                        </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-4">
                        <div className="min-w-[200px] flex-1">
                            <label className="mb-2 block text-sm font-medium text-gray-600">ปี</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y + 543}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="min-w-[200px] flex-1">
                            <label className="mb-2 block text-sm font-medium text-gray-600">เดือน</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            >
                                {months.map((m) => (
                                    <option key={m} value={m}>
                                        {monthNames[m - 1]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white shadow-lg">
                        <div className="flex items-center">
                            <div className="rounded-lg bg-blue-400/20 p-3">
                                <span className="text-2xl">📅</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium">จำนวนวันที่มีข้อมูล</h3>
                                <p className="text-xl font-bold">{daysWithData} วัน</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-r from-green-500 to-green-600 p-5 text-white shadow-lg">
                        <div className="flex items-center">
                            <div className="rounded-lg bg-green-400/20 p-3">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium">ยอดรวมของเดือน</h3>
                                <p className="text-xl font-bold">{TotalQty.toLocaleString('th-TH')} ตัน</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 p-5 text-white shadow-lg">
                        <div className="flex items-center">
                            <div className="rounded-lg bg-purple-400/20 p-3">
                                <span className="text-2xl">📈</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium">ยอดสูงสุดรายวัน</h3>
                                <p className="text-xl font-bold">{maxDaily.toLocaleString('th-TH')} ตัน</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* กราฟแท่งรายวัน */}
                <div className="mb-8 rounded-2xl bg-white p-4 shadow-lg">
                    <div className="h-96">
                        <Bar data={chartData} options={options} />
                    </div>
                </div>

                {/* กราฟเส้นรายวัน (เปรียบเทียบแต่ละปี) */}
                <div className="mb-1 rounded-2xl bg-white p-4 shadow-lg">
                    <div className="h-96">
                        <Line data={dailyLineChartData} options={dailyLineChartOptions} />
                    </div>
                </div>

                {/* ตารางข้อมูลกราฟเส้นรายวัน */}
                <div className="mb-6 rounded-2xl bg-white p-4 py-1 shadow-lg">
                    <h3 className="mb-4 text-sm font-semibold text-gray-800">
                        ตารางข้อมูลยอดรับซื้อปาล์มรายวัน เดือน{monthNames[selectedMonth - 1]} (หน่วย: ตัน)
                    </h3>
                    <div className="overflow-x-auto text-[11px]">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-1 text-center text-[11px]">ปี</th>
                                    {dayLabels.map((day) => (
                                        <th key={day} className="border p-1 text-center text-[11px]">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dailyComparisonTableData.map((row, index) => (
                                    <tr key={row.year} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="border p-1 text-[11px] font-medium">
                                            <div className="flex items-center justify-center">
                                                <div className="mr-1 h-2 w-2 rounded-full" style={{ backgroundColor: row.color }}></div>
                                                <span className="text-[11px]">{row.year}</span>
                                            </div>
                                        </td>
                                        {row.data.map((value, dayIndex) => (
                                            <td key={dayIndex} className="border p-1 text-right text-[11px]">
                                                {value > 0 ? value.toLocaleString('th-TH', { maximumFractionDigits: 1 }) : '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* กราฟเส้นรายเดือน */}
                <div className="rounded-2xl bg-white p-6 shadow-lg">
                    <div className="h-96">
                        <Line data={lineChartData} options={lineChartOptions} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
