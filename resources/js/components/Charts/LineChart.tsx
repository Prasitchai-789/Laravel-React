import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LineChart({ data }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#4B5563',
          font: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: '500'
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ฿${context.raw.toLocaleString('th-TH')}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(229, 231, 235, 0.8)',
          drawBorder: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          callback: function(value) {
            if (value >= 1000000) {
              return '฿' + (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return '฿' + (value / 1000).toFixed(0) + 'K';
            }
            return '฿' + value;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    elements: {
      line: {
        tension: 0.3,
        fill: true
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: '#FFFFFF',
        borderWidth: 2
      }
    }
  };

  // ปรับข้อมูลให้มี gradient fill
  const chartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      borderWidth: 2,
      pointBackgroundColor: '#FFFFFF',
      pointBorderColor: dataset.borderColor,
      pointHoverBackgroundColor: '#FFFFFF',
      pointHoverBorderColor: dataset.borderColor,
      pointHoverBorderWidth: 3,
      fill: true,
      backgroundColor: function(context) {
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        if (!chartArea) {
          return null;
        }
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, `${dataset.backgroundColor.slice(0, -1)}, 0.1)`);
        gradient.addColorStop(1, `${dataset.backgroundColor.slice(0, -1)}, 0.4)`);
        return gradient;
      }
    }))
  };

  return (
    <div className="h-72 w-full rounded-xl bg-gradient-to-br from-white to-gray-50/50 p-5 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">แนวโน้มยอดขายรายเดือน</h3>
        <div className="flex items-center space-x-2 text-xs">
          {data.datasets.map((dataset, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="mr-1.5 h-3 w-3 rounded-full" 
                style={{ backgroundColor: dataset.borderColor }}
              ></div>
              <span className="text-gray-600">{dataset.label}</span>
            </div>
          ))}
        </div>
      </div>
      <Line data={chartData} options={options} />
    </div>
  );
}