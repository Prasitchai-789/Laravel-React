import React, { useRef, useEffect, useState } from 'react';
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
  Filler,
  TimeScale,
  Decimation,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  Decimation
);

const SalesChart = ({
  data,
  height = 400,
  theme = 'light',
  animated = true,
  showGrid = true,
  gradientFill = true
}) => {
  const chartRef = useRef();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Gradient functions
  const createGradient = (ctx, color, opacity = 0.2) => {
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);

    if (color === 'blue') {
      gradient.addColorStop(0, `rgba(59, 130, 246, ${opacity})`);
      gradient.addColorStop(1, `rgba(59, 130, 246, 0)`);
    } else if (color === 'green') {
      gradient.addColorStop(0, `rgba(16, 185, 129, ${opacity})`);
      gradient.addColorStop(1, `rgba(16, 185, 129, 0)`);
    } else if (color === 'purple') {
      gradient.addColorStop(0, `rgba(139, 92, 246, ${opacity})`);
      gradient.addColorStop(1, `rgba(139, 92, 246, 0)`);
    }

    return gradient;
  };

  // Theme configurations
  const getThemeConfig = () => {
    if (theme === 'dark') {
      return {
        textColor: '#E5E7EB',
        gridColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        bgColor: 'rgba(17, 24, 39, 0.8)',
        tooltipBg: 'rgba(31, 41, 55, 0.95)'
      };
    }

    return {
      textColor: '#374151',
      gridColor: 'rgba(0, 0, 0, 0.05)',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      bgColor: 'rgba(255, 255, 255, 0.8)',
      tooltipBg: 'rgba(255, 255, 255, 0.95)'
    };
  };

  const themeConfig = getThemeConfig();

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'ยอดขาย (บาท)',
        data: data.sales,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: gradientFill
          ? (ctx) => createGradient(ctx.chart.ctx, 'blue', 0.3)
          : 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'rgb(59, 130, 246)',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
      },
      {
        label: 'ปริมาณขาย (ตัน)',
        data: data.volume,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: gradientFill
          ? (ctx) => createGradient(ctx.chart.ctx, 'green', 0.3)
          : 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'rgb(16, 185, 129)',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animated ? {
      duration: 2000,
      easing: 'easeOutQuart'
    } : false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: themeConfig.textColor,
          font: {
            size: 12,
            weight: '600',
            family: "'Inter', sans-serif"
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'แนวโน้มการขายรายเดือน',
        color: themeConfig.textColor,
        font: {
          size: 18,
          weight: 'bold',
          family: "'Inter', sans-serif"
        },
        padding: {
          bottom: 30
        }
      },
      tooltip: {
        backgroundColor: themeConfig.tooltipBg,
        titleColor: themeConfig.textColor,
        bodyColor: themeConfig.textColor,
        borderColor: themeConfig.borderColor,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.datasetIndex === 0) {
                label += new Intl.NumberFormat('th-TH', {
                  style: 'currency',
                  currency: 'THB',
                  minimumFractionDigits: 0
                }).format(context.parsed.y);
              } else {
                label += new Intl.NumberFormat('th-TH').format(context.parsed.y) + ' ตัน';
              }
            }
            return label;
          }
        }
      },
      decimation: {
        enabled: true,
        algorithm: 'min-max',
      }
    },
    scales: {
      x: {
        grid: {
          display: showGrid,
          color: themeConfig.gridColor,
          drawBorder: false,
        },
        ticks: {
          color: themeConfig.textColor,
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          maxRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: showGrid,
          color: themeConfig.gridColor,
          drawBorder: false,
        },
        ticks: {
          color: themeConfig.textColor,
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          callback: function(value) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'K';
            }
            return value;
          }
        }
      },
    },
    elements: {
      line: {
        borderWidth: 3,
        tension: 0.4
      },
      point: {
        radius: 5,
        hoverRadius: 8,
        hitRadius: 10
      }
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      }
    }
  };

  return (
    <div className={`
      relative rounded-2xl p-6 transition-all duration-500
      ${theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl'
        : 'bg-white/80 backdrop-blur-sm shadow-lg border border-gray-100'
      }
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}>
      {/* Background Pattern */}
      <div className={`
        absolute inset-0 rounded-2xl opacity-5
        ${theme === 'dark' ? 'bg-gradient-to-r from-blue-500 to-green-500' : 'bg-gradient-to-r from-blue-200 to-green-200'}
      `}></div>

      {/* Chart Container */}
      <div style={{ height: `${height}px` }} className="relative z-10">
        <Line
          ref={chartRef}
          data={chartData}
          options={options}
        />
      </div>

      {/* Chart Stats */}
      <div className={`
        flex flex-wrap gap-4 mt-6 pt-6 border-t
        ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
      `}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            ยอดขายรวม: <span className="font-bold text-blue-600">{(data.sales.reduce((a, b) => a + b, 0) / 1000000).toFixed(1)}M บาท</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            ปริมาณรวม: <span className="font-bold text-green-600">{data.volume.reduce((a, b) => a + b, 0)} ตัน</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// Variants สำหรับการใช้งานที่แตกต่าง
export const SalesChartVariants = {
  Default: (props) => <SalesChart {...props} />,

  Dark: (props) => (
    <SalesChart
      {...props}
      theme="dark"
      gradientFill={true}
    />
  ),

  Minimal: (props) => (
    <SalesChart
      {...props}
      showGrid={false}
      gradientFill={false}
      animated={false}
    />
  ),

  Animated: (props) => (
    <SalesChart
      {...props}
      animated={true}
      gradientFill={true}
      height={450}
    />
  )
};

export default SalesChart;
