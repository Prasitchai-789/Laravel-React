import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register chart.js modules
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChartComponent = ({ data }) => {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "ยอดขาย",
        data: data.map((d) => d.total_sales),
        backgroundColor: "rgba(79, 70, 229, 0.8)", // Indigo
        borderColor: "rgba(79, 70, 229, 1)",
        borderWidth: 1,
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 0,
        },
        borderSkipped: false,
        barPercentage: 0.8, // เพิ่มให้แท่งกว้างขึ้น
        categoryPercentage: 0.9, // ลดช่องว่างระหว่าง category
      },
      {
        label: "ต้นทุน",
        data: data.map((d) => d.total_cost),
        backgroundColor: "rgba(239, 68, 68, 0.8)", // Red
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 1,
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 0,
        },
        borderSkipped: false,
        barPercentage: 0.8, // เพิ่มให้แท่งกว้างขึ้น
        categoryPercentage: 0.9, // ลดช่องว่างระหว่าง category
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
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
          label: function(context) {
            return `${context.dataset.label}: ฿${context.raw.toLocaleString()}`;
          },
          title: function(context) {
            return `เดือน${context[0].label}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            family: "'Inter', sans-serif",
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(229, 231, 235, 0.8)",
          drawBorder: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            family: "'Inter', sans-serif",
            size: 11,
          },
          callback: function(value) {
            if (value >= 1000000) {
              return '฿' + (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return '฿' + (value / 1000).toFixed(0) + 'K';
            }
            return '฿' + value;
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    animation: {
      duration: 1000,
      easing: "easeOutQuart" as const,
    },
    // เพิ่มการจัดเรียงแท่งให้ชิดกันมากขึ้น
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }
    },
    // ลดช่องว่างระหว่างกลุ่มแท่ง
    datasets: {
      bar: {
        categoryPercentage: 0.8,
        barPercentage: 0.9,
      }
    }
  };

  return (
    <div className="h-72 w-full rounded-xl bg-gradient-to-br from-white to-gray-50/50 p-5"> 
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BarChartComponent;