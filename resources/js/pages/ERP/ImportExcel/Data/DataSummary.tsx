import React from 'react';
import { UploadSummary } from './ImportExcel/Shifts';
import { SHIFTS } from './components/Shifts/ShiftUtils';

interface DataSummaryProps {
  summary: UploadSummary;
}

export const DataSummary: React.FC<DataSummaryProps> = ({ summary }) => {
  const getShiftColor = (shiftName: string): string => {
    const shift = SHIFTS.find(s => s.name === shiftName);
    if (!shift) return 'bg-gray-100 text-gray-800 border border-gray-200';

    switch (shift.color) {
      case 'blue': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'green': return 'bg-green-100 text-green-800 border border-green-200';
      case 'purple': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'orange': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'red': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">สรุปข้อมูล</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-sm text-blue-600">ทั้งหมด</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{summary.present}</div>
            <div className="text-sm text-green-600">มา work</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-yellow-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-yellow-600">{summary.late}</div>
            <div className="text-xs text-yellow-600">สาย</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-orange-600">{summary.incomplete}</div>
            <div className="text-xs text-orange-600">รอออก</div>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-red-600">{summary.absent}</div>
            <div className="text-xs text-red-600">ขาด</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-sm text-gray-600 mb-2">แผนกที่พบ</div>
          <div className="flex flex-wrap gap-2">
            {summary.departments.map((dept, index) => (
              <span key={index} className="px-2 py-1 bg-white rounded-lg text-xs text-gray-700 border">
                {dept}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-sm text-gray-600 mb-2">กะที่พบ</div>
          <div className="flex flex-wrap gap-2">
            {summary.shifts.map((shift, index) => {
              const shiftInfo = SHIFTS.find(s => s.name === shift);
              return (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-lg text-xs border ${getShiftColor(shift)}`}
                >
                  {shiftInfo?.description || shift}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
