// resources/js/pages/ERP/Overtime/components/OvertimeHistoryTab.tsx
import React, { useState } from "react";

interface OvertimeHistoryTabProps {
  requests?: any[];
}

const OvertimeHistoryTab: React.FC<OvertimeHistoryTabProps> = ({ requests = [] }) => {
  const [filter, setFilter] = useState({
    status: "all",
    dateRange: "all",
    department: "all"
  });

  // สร้าง departments จากข้อมูลพนักงานที่มีอยู่
  const departments = Array.from(new Set(requests.map(request => request.employee.department)));

  const filteredRequests = requests.filter(request => {
    if (filter.status !== "all" && request.status !== filter.status) return false;
    if (filter.department !== "all" && request.employee.department !== filter.department) return false;

    // กรองตามช่วงวันที่ (ตัวอย่างง่ายๆ)
    if (filter.dateRange !== "all") {
      const requestDate = new Date(request.date);
      const today = new Date();

      if (filter.dateRange === "week") {
        const weekAgo = new Date(today.setDate(today.getDate() - 7));
        return requestDate >= weekAgo;
      } else if (filter.dateRange === "month") {
        const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
        return requestDate >= monthAgo;
      }
    }

    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "อนุมัติแล้ว";
      case "pending":
        return "รออนุมัติ";
      case "rejected":
        return "ปฏิเสธแล้ว";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* ฟิลเตอร์ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* สถานะ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              สถานะ
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="pending">รออนุมัติ</option>
              <option value="rejected">ปฏิเสธแล้ว</option>
            </select>
          </div>

          {/* ช่วงวันที่ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ช่วงวันที่
            </label>
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter({ ...filter, dateRange: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="week">1 สัปดาห์</option>
              <option value="month">1 เดือน</option>
            </select>
          </div>

          {/* แผนก */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              แผนก
            </label>
            <select
              value={filter.department}
              onChange={(e) => setFilter({ ...filter, department: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* ปุ่มรีเซ็ต */}
          <div className="flex items-end">
            <button
              onClick={() => setFilter({ status: "all", dateRange: "all", department: "all" })}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              รีเซ็ตฟิลเตอร์
            </button>
          </div>
        </div>
      </div>

      {/* สรุปสถิติ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">ทั้งหมด</div>
          <div className="text-2xl font-bold text-gray-900">{filteredRequests.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
          <div className="text-sm text-green-600">อนุมัติแล้ว</div>
          <div className="text-2xl font-bold text-green-900">
            {filteredRequests.filter(r => r.status === "approved").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4">
          <div className="text-sm text-yellow-600">รออนุมัติ</div>
          <div className="text-2xl font-bold text-yellow-900">
            {filteredRequests.filter(r => r.status === "pending").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
          <div className="text-sm text-red-600">ปฏิเสธแล้ว</div>
          <div className="text-2xl font-bold text-red-900">
            {filteredRequests.filter(r => r.status === "rejected").length}
          </div>
        </div>
      </div>

      {/* ตารางประวัติ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            ประวัติการทำงานล่วงเวลา ({filteredRequests.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  พนักงาน/แผนก
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่ขอ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เวลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชั่วโมง
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เหตุผล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่ส่งคำขอ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.employee.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.employee.department}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.date).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.startTime} - {request.endTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.hours} ชม.
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.reason === "workload" && "งานล้นมือ"}
                      {request.reason === "urgent" && "งานด่วน"}
                      {request.reason === "project" && "โครงการพิเศษ"}
                      {request.reason === "other" && "อื่นๆ"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.submittedAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-lg mb-2">ไม่พบข้อมูล</div>
                      <div className="text-sm">ลองเปลี่ยนเงื่อนไขการกรองดูอีกครั้ง</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OvertimeHistoryTab;
