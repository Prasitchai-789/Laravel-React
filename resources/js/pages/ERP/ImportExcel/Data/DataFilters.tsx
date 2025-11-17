import React from 'react';
import { FilterState, UploadSummary } from './ImportExcel/Shifts';
import { SHIFTS } from './components/Shifts/ShiftUtils';

interface DataFiltersProps {
  filters: FilterState;
  summary: UploadSummary;
  showFilters: boolean;
  onFilterChange: (filters: FilterState) => void;
  onToggleFilters: () => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export const DataFilters: React.FC<DataFiltersProps> = ({
  filters,
  summary,
  showFilters,
  onFilterChange,
  onToggleFilters,
  onResetFilters,
  filteredCount,
  totalCount
}) => {
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">ตัวกรองข้อมูล</h3>
        <div className="flex space-x-2">
          <button
            onClick={onToggleFilters}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            {showFilters ? 'ซ่อนตัวกรอง' : 'แสดงตัวกรอง'}
          </button>
          <button
            onClick={onResetFilters}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
          >
            ล้างการกรอง
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">แผนก</label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              {summary.departments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">กะทำงาน</label>
            <select
              value={filters.shift}
              onChange={(e) => handleFilterChange('shift', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              {SHIFTS.map((shift) => (
                <option key={shift.id} value={shift.name}>
                  {shift.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
            <select
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              {summary.dates.map((date, index) => (
                <option key={index} value={date}>{date}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              <option value="present">มา work</option>
              <option value="late">สาย</option>
              <option value="incomplete">รอออก</option>
              <option value="absent">ขาด</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสพนักงาน</label>
            <input
              type="text"
              value={filters.employeeId}
              onChange={(e) => handleFilterChange('employeeId', e.target.value)}
              placeholder="ค้นหาด้วยรหัส..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อพนักงาน</label>
            <input
              type="text"
              value={filters.employeeName}
              onChange={(e) => handleFilterChange('employeeName', e.target.value)}
              placeholder="ค้นหาด้วยชื่อ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          แสดงผล <span className="font-bold text-blue-600">{filteredCount}</span> จาก {totalCount} กะ
          {Object.values(filters).some(filter => filter !== '') && (
            <span className="ml-2 text-green-600">(มีการกรองข้อมูล)</span>
          )}
        </div>
      </div>
    </div>
  );
};
