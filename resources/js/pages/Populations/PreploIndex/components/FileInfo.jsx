// resources/js/Components/Preplo/components/FileInfo.jsx
import React from 'react';

const FileInfo = ({ fileName, rows, parsedData }) => (
  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
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
  </div>
);

export default FileInfo;
