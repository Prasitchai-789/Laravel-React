import React from 'react';

const FileInfo = ({ fileName, rows, parsedData, errors = [] }) => (
  <div className="mt-3 p-3 bg-blue-50 rounded-lg space-y-2">
    <p className="text-sm text-blue-700">
      <strong>ไฟล์ที่เลือก:</strong> {fileName}
    </p>
    <p className="text-sm text-blue-600">
      <strong>จำนวนแถวในไฟล์:</strong> {rows.length} แถว
    </p>
    {parsedData.length > 0 && (
      <p className="text-sm text-green-600">
        <strong>สามารถนำเข้าได้:</strong> {parsedData.length} รายการ
      </p>
    )}
    {rows.length > 0 && parsedData.length === 0 && (
      <p className="text-sm text-yellow-600">
        <strong>กำลังวิเคราะห์โครงสร้างข้อมูล...</strong>
      </p>
    )}

    {/* แสดง errors ถ้ามี */}
    {errors.length > 0 && (
      <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-lg">
        <p className="text-sm text-red-700 font-semibold">พบข้อผิดพลาดในแถว:</p>
        <ul className="text-sm text-red-600 list-disc list-inside">
          {errors.map((err, idx) => (
            <li key={idx}>
              แถว {err.row}: {err.message}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export default FileInfo;
