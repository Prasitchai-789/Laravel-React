import React from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { palmData } from '../../data/palmData';

// ต้อง register components ของ Chart.js ก่อนใช้งาน
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title
);

export default function PalmDashboard() {
  const totalVolume = palmData.reduce((sum, item) => sum + item.companyVolume, 0);
  const avgPrice = (
    palmData.reduce((sum, item) => sum + item.companyAvg, 0) / palmData.length
  ).toFixed(2);

  // กราฟแท่ง: ปริมาณรับซื้อรายเดือน
  const volumeData = {
    labels: palmData.map((d) => d.month),
    datasets: [
      {
        label: "ปริมาณบริษัท (ตัน)",
        data: palmData.map((d) => d.companyVolume),
        backgroundColor: "rgba(34,197,94,0.6)", // เขียว Tailwind (green-500)
        borderRadius: 8,
      },
    ],
  };

  // กราฟเส้น: เทียบราคาบริษัท vs ตลาด
  const priceData = {
    labels: palmData.map((d) => d.month),
    datasets: [
      {
        label: "ราคาบริษัท (บาท/กก.)",
        data: palmData.map((d) => d.companyAvg),
        borderColor: "#2563eb", // blue-600
        tension: 0.4,
        fill: false,
      },
      {
        label: "ราคาตลาดประเทศ (บาท/กก.)",
        data: palmData.map((d) => d.nationalAvg),
        borderColor: "#f59e0b", // yellow-500
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: false },
    },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          🌴 Dashboard การรับซื้อผลปาล์มทะลาย
        </h1>
        <div className="flex gap-2 mt-3 sm:mt-0">
          <select className="border rounded-lg px-3 py-1 text-sm">
            <option>ปี 2025</option>
            <option>ปี 2024</option>
          </select>
          <select className="border rounded-lg px-3 py-1 text-sm">
            <option>ทุกสาขา</option>
            <option>สาขาหลัก</option>
            <option>สาขาย่อย</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-100 p-4 rounded-2xl shadow">
          <h2 className="text-gray-600 text-sm">ปริมาณรวม</h2>
          <p className="text-2xl font-bold text-green-700">
            {totalVolume.toLocaleString()} ตัน
          </p>
        </div>
        <div className="bg-blue-100 p-4 rounded-2xl shadow">
          <h2 className="text-gray-600 text-sm">ราคาซื้อเฉลี่ยบริษัท</h2>
          <p className="text-2xl font-bold text-blue-700">{avgPrice} บาท/กก.</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-2xl shadow">
          <h2 className="text-gray-600 text-sm">เทียบกับราคาตลาด</h2>
          <p className="text-2xl font-bold text-yellow-700">
            {(
              palmData[palmData.length - 1].companyAvg -
              palmData[palmData.length - 1].nationalAvg
            ).toFixed(2)}{" "}
            บาท/กก.
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="font-semibold text-gray-700 mb-3">
          ปริมาณรับซื้อรายเดือน (ตัน)
        </h3>
        <Bar data={volumeData} options={commonOptions} height={120} />
      </div>

      {/* Line Chart */}
      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="font-semibold text-gray-700 mb-3">
          เทียบราคาซื้อเฉลี่ย: บริษัท vs ตลาดประเทศ
        </h3>
        <Line data={priceData} options={commonOptions} height={120} />
      </div>
    </div>
  );
}
