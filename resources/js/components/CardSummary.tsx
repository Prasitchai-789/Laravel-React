// components/CardSummary.jsx
import React from 'react';

const CardSummary = ({
  title,
  mainValue,
  unit,
  percentage,
  trend,
  value1,
  label1,
  value2,
  label2,
  progressValue,
  progressColor = 'green',
  titleColor = 'gray-800',
  mainValueColor = 'gray-800',
  showDivider = true,
  className = ''
}) => {
  // ฟังก์ชันกำหนดสี progress bar
  const getProgressColorClass = (color) => {
    const colorMap = {
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      indigo: 'bg-indigo-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      gray: 'bg-gray-500',
      orange: 'bg-orange-500'
    };
    return colorMap[color] || 'bg-green-500';
  };

  // ฟังก์ชันกำหนดสีข้อความ title
  const getTitleColorClass = (color) => {
    const colorMap = {
      'gray-800': 'text-gray-800',
      'blue-800': 'text-blue-800',
      'red-800': 'text-red-800',
      'green-800': 'text-green-800',
      'orange-800': 'text-orange-800',
      'purple-800': 'text-purple-800'
    };
    return colorMap[color] || 'text-gray-800';
  };

  // ฟังก์ชันกำหนดสีข้อความค่าหลัก
  const getMainValueColorClass = (color) => {
    const colorMap = {
      'gray-800': 'text-gray-800',
      'blue-700': 'text-blue-700',
      'red-700': 'text-red-700',
      'green-700': 'text-green-700',
      'orange-700': 'text-orange-700',
      'purple-700': 'text-purple-700'
    };
    return colorMap[color] || 'text-gray-800';
  };

  // ฟังก์ชันกำหนดสีลูกศรเทรนด์
  const getTrendIcon = (trend) => {
    if (trend === 'up') {
      return <i className="fa-solid fa-arrow-up ms-2 text-green-500"></i>;
    } else if (trend === 'down') {
      return <i className="fa-solid fa-arrow-down ms-2 text-red-500"></i>;
    } else if (trend === 'stable') {
      return <i className="fa-solid fa-minus ms-2 text-gray-500"></i>;
    }
    return null;
  };

  return (
    <div className={`rounded-2xl bg-white p-4 shadow-lg ${className}`}>
      <div className="mb-2">
        <span className="float-end flex items-center">
          <span className="text-sm text-gray-400">{percentage}%</span>
          {getTrendIcon(trend)}
        </span>
        <h5 className={`card-title truncate font-semibold ${getTitleColorClass(titleColor)}`}>
          {title}
        </h5>
      </div>

      <div className="mb-1">
        <h2 className={`text-center text-3xl font-bold ${getMainValueColorClass(mainValueColor)}`}>
          {typeof mainValue === 'number' ? mainValue.toLocaleString() : mainValue}
          {unit && <span className="text-sm"> {unit}</span>}
        </h2>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="mx-6 text-center">
          <p className="text-xl font-medium text-gray-900">
            <span className="text-sm">
              {typeof value1 === 'number' ? value1.toLocaleString() : value1}
            </span>
          </p>
          <p className="text-sm text-gray-500">{label1}</p>
        </div>

        {showDivider && <div className="h-8 w-[1px] bg-gray-400"></div>}

        <div className="mx-6 text-center">
          <p className="text-xl font-medium text-gray-900">
            <span className="text-sm">
              {typeof value2 === 'number' ? value2.toLocaleString() : value2}
            </span>
          </p>
          <p className="text-sm text-gray-500">{label2}</p>
        </div>
      </div>

      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200 shadow-sm">
        <div
          className={`flex flex-col justify-center overflow-hidden rounded-full ${getProgressColorClass(progressColor)}`}
          role="progressbar"
          aria-valuenow={progressValue || percentage}
          aria-valuemin="0"
          aria-valuemax="100"
          style={{ width: `${progressValue || percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default CardSummary;
