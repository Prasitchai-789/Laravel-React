// resources/js/Components/Preplo/components/NoDataWarning.jsx
import React from 'react';

const NoDataWarning = ({ rows, parsedData, loading }) => {
  if (!(rows.length > 0 && parsedData.length === 0 && !loading)) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center">
        <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div>
          <h3 className="text-sm font-medium text-red-800">
            ไม่พบข้อมูลที่สามารถนำเข้าได้
          </h3>
          <p className="text-sm text-red-700 mt-1">
            ไฟล์มี {rows.length} แถว แต่ไม่สามารถประมวลผลได้ กรุณาตรวจสอบรูปแบบไฟล์
          </p>
          <p className="text-sm text-red-600 mt-1">
            <strong>โครงสร้างข้อมูลที่พบ:</strong> {JSON.stringify(rows[0])}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoDataWarning;
