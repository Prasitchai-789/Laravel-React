import React from 'react';
import { EmployeeRecord } from './ImportExcel/Shifts';
import { StatusBadge } from './components/UI/StatusBadge';
import { ShiftBadge } from './components/UI/ShiftBadge';

interface DataTableProps {
  data: EmployeeRecord[];
  editingId: number | null;
  editForm: Partial<EmployeeRecord>;
  onEdit: (record: EmployeeRecord) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
  onDelete: (id: number) => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onEditFormChange: (field: keyof EmployeeRecord, value: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  editingId,
  editForm,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onSort,
  sortConfig,
  onEditFormChange
}) => {
  const SortableHeader: React.FC<{ field: string; children: React.ReactNode }> = ({ field, children }) => (
    <th
      className="text-left py-3 px-4 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center">
        {children}
        {sortConfig.key === field && (
          <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p className="text-gray-500 text-lg mb-2">ยังไม่มีข้อมูล</p>
        <p className="text-gray-400 text-sm">
          อัพโหลดไฟล์ Excel เพื่อแสดงตัวอย่างข้อมูล
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <SortableHeader field="employeeId">รหัสพนักงาน</SortableHeader>
            <SortableHeader field="employeeName">ชื่อพนักงาน</SortableHeader>
            <SortableHeader field="department">แผนก</SortableHeader>
            <SortableHeader field="date">วันที่</SortableHeader>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">กะที่กำหนด</th>
            <SortableHeader field="formattedTimeIn">เวลาเข้า</SortableHeader>
            <SortableHeader field="formattedTimeOut">เวลาออก</SortableHeader>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">ชั่วโมงทำงาน</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">สถานะ</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">การดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 50).map((item, index) => (
            <tr
              key={item.id}
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <td className="py-3 px-4">
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editForm.employeeId || ''}
                    onChange={(e) => onEditFormChange('employeeId', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    placeholder="รหัสพนักงาน"
                  />
                ) : (
                  <span className="font-mono text-sm text-gray-800">{item.employeeId}</span>
                )}
              </td>
              <td className="py-3 px-4">
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editForm.employeeName || ''}
                    onChange={(e) => onEditFormChange('employeeName', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="ชื่อพนักงาน"
                  />
                ) : (
                  <span className="text-gray-700">{item.employeeName}</span>
                )}
              </td>
              <td className="py-3 px-4">
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editForm.department || ''}
                    onChange={(e) => onEditFormChange('department', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="แผนก"
                  />
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                    {item.department}
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editForm.date || ''}
                    onChange={(e) => onEditFormChange('date', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="วันที่"
                  />
                ) : (
                  <span className="text-gray-700 whitespace-nowrap text-sm">{item.date}</span>
                )}
              </td>
              <td className="py-3 px-4">
                <ShiftBadge shiftName={item.assignedShift || ''} />
              </td>
              <td className="py-3 px-4">
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editForm.timeIn || ''}
                    onChange={(e) => onEditFormChange('timeIn', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    placeholder="เวลาเข้า"
                  />
                ) : (
                  <div className="text-sm text-gray-600 font-mono">
                    {item.formattedTimeIn}
                    {item.isOvernight && (
                      <span className="text-xs text-blue-500 ml-1">(ข้ามวัน)</span>
                    )}
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editForm.timeOut || ''}
                    onChange={(e) => onEditFormChange('timeOut', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    placeholder="เวลาออก"
                  />
                ) : (
                  <div className="text-sm text-gray-600 font-mono">
                    {item.formattedTimeOut}
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="text-xs text-gray-500 font-mono">
                  {item.workHours || '-'}
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <StatusBadge status={item.status} color={item.statusColor} />
              </td>
              <td className="py-3 px-4 text-center">
                {editingId === item.id ? (
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => onSaveEdit(item.id)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      บันทึก
                    </button>
                    <button
                      onClick={onCancelEdit}
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      ลบ
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.length > 50 && (
        <div className="mt-4 text-center text-sm text-gray-500 bg-gray-50 py-2 rounded-lg">
          แสดง 50 กะแรกจากทั้งหมด {data.length} กะ
        </div>
      )}
    </div>
  );
};
