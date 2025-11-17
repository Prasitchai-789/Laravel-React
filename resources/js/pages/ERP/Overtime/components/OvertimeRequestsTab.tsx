// resources/js/pages/ERP/Overtime/components/OvertimeRequestsTab.tsx
import React, { useState } from 'react';
import EmployeeOvertimeDashboard from './EmployeeOvertimeDashboard';

interface OvertimeRequestsTabProps {
  shifts: any[];
  employees: any[];
  stats: any;
  requests: any[];
  onStatsUpdate: (stats: any) => void;
  onUpdateStatus: (requestId: number, status: string) => void;
  onAddOvertime: () => void;
}

const OvertimeRequestsTab: React.FC<OvertimeRequestsTabProps> = ({
  shifts,
  employees,
  stats,
  requests,
  onStatsUpdate,
  onUpdateStatus,
  onAddOvertime
}) => {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filters, setFilters] = useState({
    department: 'all',
    status: 'all',
    search: ''
  });

  // กรองข้อมูลตามเงื่อนไข
  const filteredRequests = requests.filter(request => {
    // กรองตามฝ่าย
    if (filters.department !== 'all' && request.employee.department !== filters.department) {
      return false;
    }

    // กรองตามสถานะ
    if (filters.status !== 'all' && request.status !== filters.status) {
      return false;
    }

    // กรองตามคำค้นหา
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        request.employee.name.toLowerCase().includes(searchTerm) ||
        (request.employee.department && request.employee.department.toLowerCase().includes(searchTerm)) ||
        (request.project && request.project.toLowerCase().includes(searchTerm)) ||
        (request.task && request.task.toLowerCase().includes(searchTerm))
      );
    }

    return true;
  });

  // ดึงรายการฝ่ายทั้งหมดจากข้อมูลพนักงาน
  const departments = Array.from(new Set(
    requests
      .map(request => request.employee.department)
      .filter(Boolean) // กรองค่า null/undefined
  ));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'อนุมัติแล้ว';
      case 'pending':
        return 'รออนุมัติ';
      case 'rejected':
        return 'ปฏิเสธแล้ว';
      default:
        return status;
    }
  };

  const handleApprove = (requestId: number) => {
    onUpdateStatus(requestId, 'approved');
    setIsActionModalOpen(false);
    setSelectedRequest(null);
  };

  const handleReject = (requestId: number) => {
    onUpdateStatus(requestId, 'rejected');
    setIsActionModalOpen(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const openActionModal = (request: any) => {
    setSelectedRequest(request);
    setIsActionModalOpen(true);
  };

  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const getActionButton = (request: any) => {
    if (request.status === 'pending') {
      return (
        <button
          onClick={() => openActionModal(request)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          ดำเนินการ
        </button>
      );
    }

    return (
      <button
        onClick={() => openActionModal(request)}
        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
      >
        ดูรายละเอียด
      </button>
    );
  };

  const clearFilters = () => {
    setFilters({
      department: 'all',
      status: 'all',
      search: ''
    });
  };

  // ฟังก์ชันช่วยในการแสดงข้อมูล
  const displayValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value); // แปลง object เป็น string
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Employee Overtime Dashboard */}
      <EmployeeOvertimeDashboard />

      {/* คำขอทำงานล่วงเวลา */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">คำขอทำงานล่วงเวลา</h3>
              <p className="text-sm text-gray-600 mt-1">จัดการและติดตามสถานะคำขอทำงานล่วงเวลาของพนักงาน</p>
            </div>
            <div className="text-sm text-gray-500">
              แสดง {filteredRequests.length} จาก {requests.length} รายการ
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* กรองตามฝ่าย */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">ฝ่าย</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">ทุกฝ่าย</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* กรองตามสถานะ */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="pending">รออนุมัติ</option>
                  <option value="approved">อนุมัติแล้ว</option>
                  <option value="rejected">ปฏิเสธแล้ว</option>
                </select>
              </div>

              {/* ค้นหา */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหา</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="ค้นหาชื่อพนักงาน, ฝ่าย, โปรเจค..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                ล้างตัวกรอง
              </button>
              <button
                onClick={onAddOvertime}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                + เพิ่มคำขอ
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          {(filters.department !== 'all' || filters.status !== 'all' || filters.search) && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <span>ตัวกรอง:</span>
              {filters.department !== 'all' && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  ฝ่าย: {filters.department}
                </span>
              )}
              {filters.status !== 'all' && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  สถานะ: {getStatusText(filters.status)}
                </span>
              )}
              {filters.search && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                  ค้นหา: "{filters.search}"
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  พนักงาน / แผนก
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  โปรเจค / งาน
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  วันที่ / กะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  ชั่วโมง
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {displayValue(request.employee?.name)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {displayValue(request.employee?.department)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {displayValue(request.employee?.position)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {displayValue(request.project)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {displayValue(request.task)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {displayValue(request.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {displayValue(request.shift?.name || request.shift)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {displayValue(request.hours)} ชม.
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        ฿{(request.pay || 0).toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getActionButton(request)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <p className="text-gray-500 text-lg">ไม่พบคำขอที่ตรงกับเงื่อนไข</p>
              <p className="text-gray-400 text-sm mt-1">ลองเปลี่ยนตัวกรองหรือเพิ่มคำขอใหม่</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              แสดง {filteredRequests.length} รายการ
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <span className="w-3 h-3 bg-green-100 border border-green-200 rounded-full mr-2"></span>
                อนุมัติแล้ว
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded-full mr-2"></span>
                รออนุมัติ
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 bg-red-100 border border-red-200 rounded-full mr-2"></span>
                ปฏิเสธแล้ว
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {isActionModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-gray-300 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedRequest.status === 'pending' ? 'ดำเนินการคำขอโอที' : 'รายละเอียดคำขอโอที'}
                </h3>
                <button
                  onClick={closeActionModal}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Request Details */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">พนักงาน:</span>
                    <p className="font-medium text-gray-900">{displayValue(selectedRequest.employee?.name)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">แผนก:</span>
                    <p className="font-medium text-gray-900">{displayValue(selectedRequest.employee?.department)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">วันที่:</span>
                    <p className="font-medium text-gray-900">{displayValue(selectedRequest.date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">กะงาน:</span>
                    <p className="font-medium text-gray-900">{displayValue(selectedRequest.shift?.name || selectedRequest.shift)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">ชั่วโมงโอที:</span>
                    <p className="font-medium text-gray-900">{displayValue(selectedRequest.hours)} ชม.</p>
                  </div>
                  <div>
                    <span className="text-gray-600">ค่าล่วงเวลา:</span>
                    <p className="font-medium text-green-600">฿{(selectedRequest.pay || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">เหตุผล:</span>
                  <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">{displayValue(selectedRequest.reason)}</p>
                </div>

                {selectedRequest.rejectionReason && (
                  <div>
                    <span className="text-gray-600 text-sm">เหตุผลการปฏิเสธ:</span>
                    <p className="text-red-600 mt-1 bg-red-50 p-3 rounded-lg">{displayValue(selectedRequest.rejectionReason)}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เหตุผลการปฏิเสธ (หากต้องการปฏิเสธ)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ระบุเหตุผลการปฏิเสธ..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
                    >
                      อนุมัติ
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
                    >
                      ปฏิเสธ
                    </button>
                  </div>
                </div>
              )}

              {selectedRequest.status !== 'pending' && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={closeActionModal}
                    className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    ปิด
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OvertimeRequestsTab;
