// resources/js/Components/Preplo/components/SupportedFormatInfo.jsx
import React from 'react';

const SupportedFormatInfo = () => (
  <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <h3 className="font-semibold text-blue-800 mb-3">📋 รูปแบบข้อมูลที่รองรับ</h3>
    <div className="text-sm text-blue-700 space-y-2">
      <p>ระบบรองรับรูปแบบข้อมูลแบบยืดหยุ่น โดยจะตรวจสอบคอลัมน์อัตโนมัติ</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
        <div className="bg-white px-3 py-2 rounded border">คำนำหน้า</div>
        <div className="bg-white px-3 py-2 rounded border">ชื่อ</div>
        <div className="bg-white px-3 py-2 rounded border">สกุล</div>
        <div className="bg-white px-3 py-2 rounded border">บ้านเลขที่</div>
        <div className="bg-white px-3 py-2 rounded border">หมู่</div>
        <div className="bg-white px-3 py-2 rounded border">ตำบล</div>
        <div className="bg-white px-3 py-2 rounded border">อำเภอ</div>
        <div className="bg-white px-3 py-2 rounded border">จังหวัด</div>
        <div className="bg-white px-3 py-2 rounded border">หมายเหตุ</div>
      </div>
    </div>
  </div>
);

export default SupportedFormatInfo;
