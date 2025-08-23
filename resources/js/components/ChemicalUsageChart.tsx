// components/ChemicalUsageChart.tsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface ChemicalUsageChartProps {
  data: any;
  type: 'bar' | 'doughnut' | 'line';
  title: string;
  description?: React.ReactNode;
}

const ChemicalUsageChart: React.FC<ChemicalUsageChartProps> = ({ 
  data, 
  type, 
  title, 
  description 
}) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16
        }
      },
    },
    scales: type === 'bar' || type === 'line' ? {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'ปริมาณ (กก.)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'วัน'
        }
      }
    } : undefined
  };

  const renderChart = () => {
    const chartComponent = () => {
      switch (type) {
        case 'bar':
          return <Bar options={options} data={data} />;
        case 'doughnut':
          return <Doughnut options={options} data={data} />;
        case 'line':
          return <Line options={options} data={data} />;
        default:
          return <Bar options={options} data={data} />;
      }
    };

    return (
      <div className="h-80">
        {chartComponent()}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {renderChart()}
      {description && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          {description}
        </div>
      )}
    </div>
  );
};

export default ChemicalUsageChart;