// resources/js/Components/Preplo/components/ReportSummary.jsx
import React from 'react';

const ReportSummary = ({ report }) => (
  <div className="grid grid-cols-3 gap-4 mb-6">
    <div className="bg-green-50 p-4 rounded-lg text-center">
      <div className="text-2xl font-bold text-green-600">{report.imported}</div>
      <div className="text-green-800">นำเข้าสำเร็จ</div>
    </div>
    <div className="bg-yellow-50 p-4 rounded-lg text-center">
      <div className="text-2xl font-bold text-yellow-600">{report.duplicate}</div>
      <div className="text-yellow-800">ข้อมูลซ้ำ</div>
    </div>
    <div className="bg-red-50 p-4 rounded-lg text-center">
      <div className="text-2xl font-bold text-red-600">{report.skipped}</div>
      <div className="text-red-800">ข้ามไป</div>
    </div>
  </div>
);

export default ReportSummary;
