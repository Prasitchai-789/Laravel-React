// resources/js/pages/ERP/Overtime/components/OvertimeStats.tsx
import React from 'react';

interface OvertimeStatsProps {
  stats: {
    totalRequests?: number;
    approved?: number;
    pending?: number;
    rejected?: number;
    totalHours?: number;
    monthlyHours?: number;
    requests?: any[];
  };
  shifts: any[];
}

const OvertimeStats: React.FC<OvertimeStatsProps> = ({ stats, shifts }) => {
  // ตั้งค่า default values เพื่อป้องกัน error
  const safeStats = {
    totalRequests: stats?.totalRequests || 0,
    approved: stats?.approved || 0,
    pending: stats?.pending || 0,
    rejected: stats?.rejected || 0,
    totalHours: stats?.totalHours || 0,
    monthlyHours: stats?.monthlyHours || 0,
    requests: stats?.requests || []
  };

  // คำนวณเปอร์เซ็นต์
  const approvalRate = safeStats.totalRequests > 0
    ? ((safeStats.approved / safeStats.totalRequests) * 100)
    : 0;

  const pendingRate = safeStats.totalRequests > 0
    ? ((safeStats.pending / safeStats.totalRequests) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* คำขอทั้งหมด */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">คำขอทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {safeStats.totalRequests.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <span>ทั้งหมดที่ได้รับในระบบ</span>
        </div>
      </div>

      {/* อนุมัติแล้ว */}
      <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600">อนุมัติแล้ว</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {safeStats.approved.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-green-600 mb-1">
            <span>อัตราการอนุมัติ</span>
            <span>{approvalRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${approvalRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* รออนุมัติ */}
      <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-600">รออนุมัติ</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">
              {safeStats.pending.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-lg">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-yellow-600 mb-1">
            <span>รอการตรวจสอบ</span>
            <span>{pendingRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full"
              style={{ width: `${pendingRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* ชั่วโมงโอที */}
      <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600">ชั่วโมงโอที</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">
              {safeStats.totalHours.toLocaleString('th-TH', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
              })}
            </p>
            <p className="text-sm text-purple-500 mt-1">
              {safeStats.monthlyHours.toLocaleString('th-TH', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
              })} ชม. ในเดือนนี้
            </p>
          </div>
          <div className="p-3 bg-purple-100 rounded-lg">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-purple-500">
          <span>ทั้งหมดที่ทำงานไป</span>
        </div>
      </div>
    </div>
  );
};

export default OvertimeStats;
