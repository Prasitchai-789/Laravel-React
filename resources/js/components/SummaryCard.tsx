import React from "react";

export default function SummaryCard({
  title,
  value,
  icon: Icon,
  color = "blue",
  trend,
  description = "",
  isLoading = false
}) {
  // Color mapping for consistent theme
  const colorMap = {
    blue: { bg: 'bg-blue-100', icon: 'bg-blue-500', text: 'text-blue-700', accent: 'bg-blue-500' },
    green: { bg: 'bg-green-100', icon: 'bg-green-500', text: 'text-green-700', accent: 'bg-green-500' },
    yellow: { bg: 'bg-yellow-100', icon: 'bg-yellow-500', text: 'text-yellow-700', accent: 'bg-yellow-500' },
    purple: { bg: 'bg-purple-100', icon: 'bg-purple-500', text: 'text-purple-700', accent: 'bg-purple-500' },
    red: { bg: 'bg-red-100', icon: 'bg-red-500', text: 'text-red-700', accent: 'bg-red-500' },
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  if (isLoading) {
    return (
      <div className="p-5 bg-white rounded-xl shadow-md animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-300 rounded w-2/3 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
          <p className={`text-2xl font-bold ${selectedColor.text} mb-2`}>{value}</p>

          {trend && (
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${trend.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
              <span className="ml-1">{trend.isPositive ? 'เพิ่มขึ้น' : 'ลดลง'}</span>
              <span className="ml-1">{description}</span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-lg ${selectedColor.bg}`}>
          {Icon && <Icon size={24} className={selectedColor.text} />}
        </div>
      </div>
    </div>
  );
}
