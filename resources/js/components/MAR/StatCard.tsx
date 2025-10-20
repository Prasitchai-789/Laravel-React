import React from 'react';

const StatCard = ({ title, value, change, changeType, icon }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <div className={`flex items-center mt-2 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-sm font-medium">
              {changeType === 'positive' ? '↑' : '↓'} {change}
            </span>
            <span className="text-xs ml-1">จากช่วงก่อนหน้า</span>
          </div>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
};

export default StatCard;
