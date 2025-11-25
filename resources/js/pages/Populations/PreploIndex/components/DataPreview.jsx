// resources/js/Components/Preplo/components/DataPreview.jsx
import React from 'react';

const DataPreview = ({ parsedData, incompleteData, submitting, onReset, onSubmit }) => {
  if (parsedData.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          ข้อมูลจากไฟล์ ({parsedData.length} รายการ)
        </h3>
        <div className="flex space-x-3">
          <button
            onClick={onReset}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={submitting}
          >
            ล้างข้อมูล
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || parsedData.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                กำลังนำเข้า...
              </>
            ) : (
              `นำเข้าข้อมูล (${parsedData.length} รายการ)`
            )}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">คำนำหน้า</th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ</th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">สกุล</th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">บ้านเลขที่</th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">หมู่</th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ตำบล</th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">อำเภอ</th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">จังหวัด</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {parsedData.slice(0, 10).map((person, index) => {
              const isIncomplete = incompleteData.some(incomplete =>
                incomplete.first_name === person.first_name &&
                incomplete.last_name === person.last_name
              );

              return (
                <tr key={index} className={isIncomplete ? 'bg-yellow-50' : ''}>
                  <td className="px-3 py-2 text-sm text-gray-900">{person.title || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">{person.first_name || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">{person.last_name || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">{person.house_no || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">{person.village_no || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">{person.subdistrict_name || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">{person.district_name || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">{person.province_name || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {parsedData.length > 10 && (
        <p className="text-sm text-gray-500 mt-2">
          แสดง 10 รายการแรกจากทั้งหมด {parsedData.length} รายการ
        </p>
      )}
    </div>
  );
};

export default DataPreview;
