import React from "react";
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, Title);

export default function ScatterChart({ data }) {
  // แปลงข้อมูลให้อยู่ในรูปแบบที่ Chart.js ใช้
  const chartData = {
    datasets: [
      {
        label: "Margin vs Quantity",
        data: data.map((item) => ({
          x: item.totalQtySold,
          y: item.marginPercent,
          goodName: item.goodName,
        })),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        pointRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const d = context.raw;
            return `${d.goodName}: Qty ${d.x}, Margin ${d.y}%`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "จำนวนขาย (Qty)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Margin (%)",
        },
        min: 0,
        max: 50,
      },
    },
  };

  return (
    <div className="h-64">
      <Scatter data={chartData} options={options} />
    </div>
  );
}
