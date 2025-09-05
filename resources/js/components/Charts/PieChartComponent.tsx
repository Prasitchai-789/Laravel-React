import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

type PieChartProps = {
  data: { goodName: string; total_cost: number; percentage: number }[];
};

export default function PieChart({ data }: PieChartProps) {
  // สีสันที่ทันสมัยและเป็นระเบียบ
  const modernColors = [
    "rgba(79, 70, 229, 0.8)",  // Indigo
    "rgba(14, 165, 233, 0.8)", // Sky blue
    "rgba(139, 92, 246, 0.8)", // Violet
    "rgba(20, 184, 166, 0.8)", // Teal
    "rgba(245, 158, 11, 0.8)", // Amber
    "rgba(239, 68, 68, 0.8)",  // Red
    "rgba(16, 185, 129, 0.8)", // Emerald
    "rgba(99, 102, 241, 0.8)", // Indigo lighter
  ];

  const borderColors = [
    "rgba(79, 70, 229, 1)",
    "rgba(14, 165, 233, 1)",
    "rgba(139, 92, 246, 1)",
    "rgba(20, 184, 166, 1)",
    "rgba(245, 158, 11, 1)",
    "rgba(239, 68, 68, 1)",
    "rgba(16, 185, 129, 1)",
    "rgba(99, 102, 241, 1)",
  ];

  const chartData = {
    labels: data.map((item) => item.goodName),
    datasets: [
      {
        label: "ต้นทุนสินค้า",
        data: data.map((item) => item.total_cost),
        backgroundColor: modernColors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "40%", // ทำให้เป็น doughnut chart
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#4B5563",
          font: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: "500" as const,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#1F2937",
        bodyColor: "#4B5563",
        borderColor: "#E5E7EB",
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = ((value / context.dataset.data.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1);
            return `${label}: ฿${value.toLocaleString('th-TH')} (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000,
      easing: "easeOutQuart" as const,
    },
  };

  // คำนวณยอดรวม
  const totalCost = data.reduce((sum, item) => sum + item.total_cost, 0);

  return (
    <div className="relative h-80 w-full rounded-xl bg-gradient-to-br from-white to-gray-50/50 pt-10">
      <div className="relative h-56">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}