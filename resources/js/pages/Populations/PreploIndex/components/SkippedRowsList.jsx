// resources/js/Components/Preplo/components/SkippedRowsList.jsx
import React from 'react';

const SkippedRowsList = ({ skippedRows }) => (
  <div>
    <h4 className="font-medium text-gray-800 mb-3">รายการที่ข้ามไป ({skippedRows.length} รายการ)</h4>
    <div className="border rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">แถว</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ-สกุล</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">เหตุผล</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {skippedRows.slice(0, 10).map((row, index) => (
            <tr key={index}>
              <td className="px-4 py-2 text-sm">{row.row_number}</td>
              <td className="px-4 py-2 text-sm">{row.name}</td>
              <td className="px-4 py-2 text-sm text-red-600">{row.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default SkippedRowsList;
