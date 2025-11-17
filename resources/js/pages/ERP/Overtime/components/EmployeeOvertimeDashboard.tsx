// resources/js/pages/ERP/Overtime/components/EmployeeOvertimeDashboard.tsx
import React from 'react';

interface EmployeeOvertimeDashboardProps {
  employeeId?: string;
  period?: string;
}

const EmployeeOvertimeDashboard: React.FC<EmployeeOvertimeDashboardProps> = ({
  employeeId,
  period = 'monthly'
}) => {
  // ข้อมูลพนักงาน
  const employeeInfo = {
    name: 'สมชาย ใจดี',
    position: 'Senior Developer',
    department: 'ทีมพัฒนา Software',
    employeeId: 'EMP001',
    avatar: '👨‍💻'
  };

  // สถิติโอที
  const stats = {
    totalHours: 12.5,
    pendingHours: 3.0,
    approvedHours: 9.5,
    overtimePay: 9375,
    efficiency: 92
  };

  // ประวัติโอทีล่าสุด
  const overtimeHistory = [
    {
      date: '15 พ.ย. 2566',
      hours: 2.0,
      project: 'Project Alpha',
      task: 'พัฒนา Feature Login',
      status: 'approved',
      pay: 1500
    },
    {
      date: '10 พ.ย. 2566',
      hours: 1.5,
      project: 'Project Beta',
      task: 'แก้ไข Bug Report',
      status: 'pending',
      pay: 1125
    },
    {
      date: '05 พ.ย. 2566',
      hours: 3.0,
      project: 'Project Gamma',
      task: 'ระบบ Dashboard',
      status: 'approved',
      pay: 3000
    }
  ];

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";

    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'อนุมัติแล้ว';
      case 'pending':
        return 'รออนุมัติ';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">{employeeInfo.avatar}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{employeeInfo.name}</h2>
              <p className="text-sm text-gray-600">
                {employeeInfo.position} • {employeeInfo.department}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">รหัสพนักงาน</p>
            <p className="text-sm font-medium text-gray-900">{employeeInfo.employeeId}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Overtime */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">โอทีทั้งหมด</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalHours} ชม.</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">⏱️</span>
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">รออนุมัติ</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.pendingHours} ชม.</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600">⏳</span>
              </div>
            </div>
          </div>

          {/* Approved */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{stats.approvedHours} ชม.</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">✅</span>
              </div>
            </div>
          </div>

          {/* Overtime Pay */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">ค่าล่วงเวลา</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">฿{stats.overtimePay.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Overtime History */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">ประวัติโอทีล่าสุด</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              ดูทั้งหมด →
            </button>
          </div>

          <div className="space-y-3">
            {overtimeHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-600">⏰</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.date}</p>
                    <p className="text-sm text-gray-600">
                      {item.project} - {item.task}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{item.hours} ชั่วโมง</p>
                    <p className="text-sm text-green-600">฿{item.pay.toLocaleString()}</p>
                  </div>
                  <span className={getStatusBadge(item.status)}>
                    {getStatusText(item.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">สรุปประสิทธิภาพ</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">📈</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">ระดับประสิทธิภาพ</p>
                <p className="text-lg font-semibold text-gray-900">{stats.efficiency}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">สถานะ</p>
              <p className="text-sm font-medium text-green-600">ดีมาก</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeOvertimeDashboard;
