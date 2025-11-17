// resources/js/pages/ERP/Overtime/components/OvertimeRequestForm.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Clock, Calendar } from "lucide-react";
import EmployeeSearchSelect from "./EmployeeSearchSelect";

interface OvertimeRequestFormProps {
  shifts: any[];
  employees: any[];
  onSubmitRequest: (request: any) => void;
}

const OvertimeRequestForm: React.FC<OvertimeRequestFormProps> = ({
  shifts,
  employees,
  onSubmitRequest
}) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    shiftId: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "16:30",
    endTime: "18:30",
    plannedHours: 2,
    reason: "",
    type: "auto"
  });

  // ฟังก์ชันคำนวณเวลาสิ้นสุด
  const calculateEndTime = (startTime: string, hours: number) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = startTotalMinutes + (hours * 60);
    let endHour = Math.floor(endTotalMinutes / 60) % 24;
    const endMinute = endTotalMinutes % 60;
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  };

  // ฟังก์ชันคำนวณประเภทโอที
  const calculateOvertimeType = (date: string, startTime: string, endTime: string) => {
    const day = new Date(date).getDay();
    const startHour = parseInt(startTime.split(':')[0]);

    if (day === 0 || day === 6) return "weekend";
    if (startHour >= 22 || startHour < 6) return "night";
    return "normal";
  };

  const handleStartTimeChange = (value: string) => {
    const newEndTime = calculateEndTime(value, formData.plannedHours);
    const newType = calculateOvertimeType(formData.date, value, newEndTime);

    setFormData(prev => ({
      ...prev,
      startTime: value,
      endTime: newEndTime,
      type: prev.type === "auto" ? "auto" : newType
    }));
  };

  const handleHoursChange = (hours: string) => {
    const newEndTime = calculateEndTime(formData.startTime, parseFloat(hours));
    const newType = calculateOvertimeType(formData.date, formData.startTime, newEndTime);

    setFormData(prev => ({
      ...prev,
      plannedHours: parseFloat(hours),
      endTime: newEndTime,
      type: prev.type === "auto" ? "auto" : newType
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.shiftId) {
      alert("กรุณาเลือกพนักงานและกะการทำงาน");
      return;
    }

    const employee = employees.find(emp => emp.id === formData.employeeId);
    const shift = shifts.find(s => s.id === formData.shiftId);

    const requestData = {
      id: Date.now(),
      employeeId: formData.employeeId,
      employeeName: employee?.name || "",
      department: employee?.department || "",
      departmentName: employee?.departmentName || "",
      shiftId: formData.shiftId,
      shiftName: shift?.shiftName || "",
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      plannedHours: parseFloat(formData.plannedHours),
      reason: formData.reason,
      status: "approved",
      type: formData.type === "auto" ? calculateOvertimeType(formData.date, formData.startTime, formData.endTime) : formData.type,
      rate: 1.5,
      overtimePay: 0,
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString()
    };

    onSubmitRequest(requestData);

    // รีเซ็ตฟอร์ม
    setFormData({
      employeeId: "",
      shiftId: "",
      date: new Date().toISOString().split('T')[0],
      startTime: "16:30",
      endTime: "18:30",
      plannedHours: 2,
      reason: "",
      type: "auto"
    });

    alert("บันทึกการทำโอทีเรียบร้อยแล้ว");
  };

  const formatThaiTime = (timeString: string) => {
    return `${timeString} น.`;
  };

  return (
    <Card className="border border-blue-200 shadow-sm">
      <CardHeader className="bg-blue-50 border-b border-blue-200">
        <CardTitle className="text-xl font-semibold text-blue-800 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          บันทึกการทำโอที
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">พนักงาน</Label>
              <EmployeeSearchSelect
                employees={employees}
                value={formData.employeeId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                placeholder="ค้นหาและเลือกพนักงาน"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift">กะการทำงาน</Label>
              <Select
                value={formData.shiftId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, shiftId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกกะ" />
                </SelectTrigger>
                <SelectContent>
                  {shifts
                    .filter(shift => shift.status === "active" && shift.overtimeAllowed)
                    .map(shift => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.shiftName} ({shift.startTime} - {shift.endTime} น.)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">วันที่ทำโอที</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
                <Calendar className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">เวลาเริ่มโอที</Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
              />
              <div className="text-xs text-gray-600">
                {formatThaiTime(formData.startTime)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">เวลาสิ้นสุดโอที</Label>
              <Input
                type="time"
                value={formData.endTime}
                disabled
                className="bg-gray-100 text-gray-600"
              />
              <div className="text-xs text-gray-600">
                {formatThaiTime(formData.endTime)}
                <span className="text-gray-400 ml-1">(คำนวณอัตโนมัติ)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plannedHours">จำนวนชั่วโมงที่ทำ</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={formData.plannedHours}
                  onChange={(e) => handleHoursChange(e.target.value)}
                  className="flex-1"
                />
                <span className="text-gray-600 whitespace-nowrap">ชั่วโมง</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ประเภทโอที</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภทโอที" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">คำนวณอัตโนมัติ</SelectItem>
                  <SelectItem value="normal">โอทีปกติ</SelectItem>
                  <SelectItem value="night">โอทีกะดึก</SelectItem>
                  <SelectItem value="weekend">โอทีวันหยุด</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">เหตุผล/รายละเอียด</Label>
            <Input
              placeholder="ระบุเหตุผลการทำโอที..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              บันทึกการทำโอที
            </Button>
            <Button type="button" variant="outline" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              ประวัติโอที
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default OvertimeRequestForm;
