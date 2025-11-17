// resources/js/pages/ERP/Overtime/components/AddOvertimeModal.tsx
import React, { useState } from 'react';

interface AddOvertimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (overtime: any) => void;
  employees: any[];
  shifts: any[];
}

const AddOvertimeModal: React.FC<AddOvertimeModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  employees,
  shifts
}) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    shiftId: '',
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedEmployee = employees.find(emp => emp.id === parseInt(formData.employeeId));
    const selectedShift = shifts.find(shift => shift.id === parseInt(formData.shiftId));

    const overtimeData = {
      ...formData,
      employee: selectedEmployee,
      shift: selectedShift,
      hours: calculateHours(formData.startTime, formData.endTime)
    };

    onAdd(overtimeData);
    setFormData({
      employeeId: '',
      shiftId: '',
      date: '',
      startTime: '',
      endTime: '',
      reason: '',
      description: ''
    });
  };

  const calculateHours = (start: string, end: string): number => {
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    const diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return Math.round(diff * 100) / 100;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">เพิ่มคำขอทำงานล่วงเวลา</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* พนักงาน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                พนักงาน
              </label>
              <select
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เลือกพนักงาน</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.department}
                  </option>
                ))}
              </select>
            </div>

            {/* กะทำงาน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                กะทำงาน
              </label>
              <select
                required
                value={formData.shiftId}
                onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เลือกกะทำงาน</option>
                {shifts.map(shift => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({shift.startTime} - {shift.endTime})
                  </option>
                ))}
              </select>
            </div>

            {/* วันที่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่ทำงานล่วงเวลา
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* เวลาเริ่ม - สิ้นสุด */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เวลาเริ่ม
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เวลาสิ้นสุด
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* เหตุผล */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เหตุผล
              </label>
              <select
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เลือกเหตุผล</option>
                <option value="workload">งานล้นมือ</option>
                <option value="urgent">งานด่วน</option>
                <option value="project">โครงการพิเศษ</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>

            {/* รายละเอียด */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รายละเอียดเพิ่มเติม
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="อธิบายรายละเอียดการทำงานล่วงเวลา..."
              />
            </div>

            {/* ปุ่ม actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                บันทึกคำขอ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddOvertimeModal;
