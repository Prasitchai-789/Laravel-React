import React, { useState, useMemo } from "react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Trash2, Users, Clock, DollarSign, AlertTriangle, Filter, Check, X, Save, Download, Upload, Building, Send, Calendar } from "lucide-react";

// สร้าง Switch component อย่างง่าย
const SimpleSwitch = ({ defaultChecked = false, onChange, ...props }) => {
  const [checked, setChecked] = useState(defaultChecked);

  const handleToggle = () => {
    const newChecked = !checked;
    setChecked(newChecked);
    if (onChange) {
      onChange(newChecked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
      onClick={handleToggle}
      {...props}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

// ฟังก์ชันช่วยเหลือสำหรับวันที่ไทย
const thaiDateUtils = {
  // แปลงวันที่เป็นรูปแบบไทย
  formatThaiDate: (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear() + 543; // แปลงเป็นพ.ศ.
    return `${day}/${month}/${year}`;
  },

  // แปลงเวลาเป็นรูปแบบไทย (13:00 -> 13:00 น.)
  formatThaiTime: (timeString) => {
    if (!timeString) return '';
    return `${timeString} น.`;
  },

  // แปลงวันที่เป็นชื่อวันภาษาไทย
  getThaiDayName: (dateString) => {
    const date = new Date(dateString);
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    return days[date.getDay()];
  },

  // ตรวจสอบว่าเป็นวันหยุดนักขัตฤกษ์หรือไม่ (ตัวอย่าง)
  isHoliday: (dateString) => {
    const date = new Date(dateString);
    const holidays = [
      '01-01', // ขึ้นปีใหม่
      '04-06', // วันจักรี
      '05-01', // วันแรงงาน
      '12-05', // วันพ่อ
      '12-10', // วันรัฐธรรมนูญ
      '12-31', // วันสิ้นปี
    ];
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays.includes(monthDay);
  },

  // ตรวจสอบว่าเป็นวันหยุดสุดสัปดาห์หรือไม่
  isWeekend: (dateString) => {
    const date = new Date(dateString);
    return date.getDay() === 0 || date.getDay() === 6; // 0=อาทิตย์, 6=เสาร์
  },

  // ตรวจสอบว่าเป็นกะดึก (22:00-06:00)
  isNightShift: (startTime, endTime) => {
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);

    // ถ้าเริ่มหรือสิ้นสุดระหว่าง 22:00-06:00 ถือเป็นกะดึก
    return (startHour >= 22 || startHour < 6) || (endHour >= 22 || endHour < 6);
  }
};

// Component สำหรับค้นหาพนักงาน
const EmployeeSearchSelect = ({ employees, value, onValueChange, placeholder = "เลือกพนักงาน" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // กรองพนักงานตามคำค้นหา
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;

    return employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.departmentName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const selectedEmployee = employees.find(emp => emp.id === value);

  return (
    <div className="relative">
      <Select
        value={value}
        onValueChange={onValueChange}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedEmployee && (
              <div className="flex flex-col text-left">
                <span className="font-medium">{selectedEmployee.name}</span>
                <span className="text-sm text-gray-500">
                  {selectedEmployee.employeeId} • {selectedEmployee.departmentName}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="ค้นหาพนักงาน..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Employee List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                ไม่พบพนักงานที่ค้นหา
              </div>
            ) : (
              filteredEmployees.map(employee => (
                <SelectItem key={employee.id} value={employee.id} className="py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{employee.name}</span>
                    <span className="text-sm text-gray-500">
                      {employee.employeeId} • {employee.departmentName}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};

// Component บันทึกโอทีแบบไทย
const OvertimeRequestForm = ({ shifts, employees, onSubmitRequest }) => {
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

  // คำนวณเวลาสิ้นสุดจากเวลาเริ่มต้นและจำนวนชั่วโมง
  const calculateEndTime = (startTime, hours) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);

    // แปลงเวลาเริ่มต้นเป็นนาที
    const startTotalMinutes = startHour * 60 + startMinute;

    // คำนวณเวลาสิ้นสุด (นาที)
    const endTotalMinutes = startTotalMinutes + (hours * 60);

    // แปลงกลับเป็นชั่วโมงและนาที
    let endHour = Math.floor(endTotalMinutes / 60) % 24;
    const endMinute = endTotalMinutes % 60;

    // จัดรูปแบบเวลา
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  };

  // คำนวณประเภทโอทีอัตโนมัติเมื่อข้อมูลเปลี่ยน
  const calculateOvertimeType = (date, startTime, endTime) => {
    if (thaiDateUtils.isHoliday(date)) {
      return "holiday";
    } else if (thaiDateUtils.isWeekend(date)) {
      return "weekend";
    } else if (thaiDateUtils.isNightShift(startTime, endTime)) {
      return "night";
    } else {
      return "normal";
    }
  };

  const handleStartTimeChange = (value) => {
    const newEndTime = calculateEndTime(value, formData.plannedHours);
    const newType = calculateOvertimeType(formData.date, value, newEndTime);

    setFormData(prev => ({
      ...prev,
      startTime: value,
      endTime: newEndTime,
      type: prev.type === "auto" ? "auto" : newType
    }));
  };

  const handleHoursChange = (hours) => {
    const newEndTime = calculateEndTime(formData.startTime, parseFloat(hours));
    const newType = calculateOvertimeType(formData.date, formData.startTime, newEndTime);

    setFormData(prev => ({
      ...prev,
      plannedHours: parseFloat(hours),
      endTime: newEndTime,
      type: prev.type === "auto" ? "auto" : newType
    }));
  };

  const handleDateChange = (date) => {
    const newType = calculateOvertimeType(date, formData.startTime, formData.endTime);

    setFormData(prev => ({
      ...prev,
      date,
      type: prev.type === "auto" ? "auto" : newType
    }));
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.shiftId) {
      alert("กรุณาเลือกพนักงานและกะการทำงาน");
      return;
    }

    // คำนวณประเภทโอทีสุดท้ายก่อนบันทึก
    let finalType = formData.type;
    if (formData.type === "auto") {
      finalType = calculateOvertimeType(formData.date, formData.startTime, formData.endTime);
    }

    // ค้นหาข้อมูลพนักงานและกะอัตโนมัติ
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
      type: finalType,
      rate: getOvertimeRate(finalType),
      overtimePay: 0, // ระบบจะคำนวณอัตโนมัติ
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      thaiDate: thaiDateUtils.formatThaiDate(formData.date),
      thaiDay: thaiDateUtils.getThaiDayName(formData.date)
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

  // ฟังก์ชันคำนวณอัตราค่าโอที
  const getOvertimeRate = (type) => {
    const rates = {
      'normal': 1.5,
      'night': 1.25,
      'weekend': 2.0,
      'holiday': 3.0
    };
    return rates[type] || 1.5;
  };

  const getTypeInfo = (type) => {
    const types = {
      'auto': { text: 'คำนวณอัตโนมัติ', color: 'text-gray-600', bg: 'bg-gray-50' },
      'normal': { text: 'โอทีปกติ', color: 'text-blue-600', bg: 'bg-blue-50' },
      'night': { text: 'โอทีกะดึก', color: 'text-purple-600', bg: 'bg-purple-50' },
      'weekend': { text: 'โอทีวันหยุด', color: 'text-orange-600', bg: 'bg-orange-50' },
      'holiday': { text: 'โอทีวันนักขัตฤกษ์', color: 'text-red-600', bg: 'bg-red-50' }
    };
    return types[type] || types.normal;
  };

  const typeInfo = getTypeInfo(formData.type);
  const calculatedType = calculateOvertimeType(formData.date, formData.startTime, formData.endTime);
  const calculatedTypeInfo = getTypeInfo(calculatedType);

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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift">กะการทำงาน</Label>
              <Select
                value={formData.shiftId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, shiftId: value }))}
                required
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
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
                <Calendar className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {formData.date && (
                  <>
                    {thaiDateUtils.formatThaiDate(formData.date)}
                    <span className="ml-2">({thaiDateUtils.getThaiDayName(formData.date)})</span>
                    {thaiDateUtils.isHoliday(formData.date) && (
                      <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 text-xs">
                        วันหยุดนักขัตฤกษ์
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">เวลาเริ่มโอที</Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                required
              />
              <div className="text-xs text-gray-600">
                {thaiDateUtils.formatThaiTime(formData.startTime)}
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
                {thaiDateUtils.formatThaiTime(formData.endTime)}
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
              <p className="text-xs text-gray-500">
                เวลาทำโอที: {thaiDateUtils.formatThaiTime(formData.startTime)} - {thaiDateUtils.formatThaiTime(formData.endTime)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>ประเภทโอที</Label>
              <Select
                value={formData.type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภทโอที" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    <div className="flex flex-col">
                      <span>คำนวณอัตโนมัติ</span>
                      <span className="text-xs text-gray-500">
                        ({calculatedTypeInfo.text} - อัตรา {getOvertimeRate(calculatedType)} เท่า)
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="normal">
                    <div className="flex flex-col">
                      <span>โอทีปกติ</span>
                      <span className="text-xs text-gray-500">อัตรา 1.5 เท่า</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="night">
                    <div className="flex flex-col">
                      <span>โอทีกะดึก</span>
                      <span className="text-xs text-gray-500">อัตรา 1.25 เท่า</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="weekend">
                    <div className="flex flex-col">
                      <span>โอทีวันหยุด</span>
                      <span className="text-xs text-gray-500">อัตรา 2.0 เท่า</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="holiday">
                    <div className="flex flex-col">
                      <span>โอทีวันนักขัตฤกษ์</span>
                      <span className="text-xs text-gray-500">อัตรา 3.0 เท่า</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* แสดงประเภทโอทีที่คำนวณได้ */}
              {formData.type === "auto" && (
                <div className={`p-2 rounded-lg border ${calculatedTypeInfo.bg} mt-2`}>
                  <div className={`text-sm font-medium ${calculatedTypeInfo.color}`}>
                    คำนวณได้: {calculatedTypeInfo.text}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    อัตราค่าโอที: {getOvertimeRate(calculatedType)} เท่า
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">เหตุผล/รายละเอียด</Label>
            <Input
              placeholder="ระบุเหตุผลการทำโอที..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              required
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

// Component สถิติสำหรับพนักงาน
const EmployeeOvertimeDashboard = ({ employeeRequests }) => {
  const approvedCount = employeeRequests.filter(r => r.status === 'approved').length;
  const totalOvertimeHours = employeeRequests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (r.hours || r.plannedHours), 0);

  const currentMonthHours = employeeRequests
    .filter(r => r.status === 'approved' && new Date(r.date).getMonth() === new Date().getMonth())
    .reduce((sum, r) => sum + (r.hours || r.plannedHours), 0);

  // คำนวณค่าโอทีประมาณการ (ใช้ฐานเงินเดือน 15,000 บาท)
  const estimatedPay = currentMonthHours * (15000 / 30 / 8) * 1.5;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">โอทีทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{totalOvertimeHours} ชม.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">รายการโอที</p>
              <p className="text-2xl font-bold text-gray-900">{approvedCount} รายการ</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">โอทีเดือนนี้</p>
              <p className="text-2xl font-bold text-gray-900">{currentMonthHours} ชม.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">ค่าโอทีประมาณการ</p>
              <p className="text-2xl font-bold text-gray-900">
                ฿{estimatedPay.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Component ตารางคำขอโอที
const OvertimeRequestTable = ({ requests, shifts, onEdit }) => {
  const getStatusColor = (status) => {
    const colors = {
      'approved': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'approved': 'บันทึกแล้ว'
    };
    return texts[status] || status;
  };

  const getTypeText = (type) => {
    const texts = {
      'normal': 'ปกติ',
      'night': 'กะดึก',
      'weekend': 'วันหยุด',
      'holiday': 'วันหยุดนักขัตฤกษ์'
    };
    return texts[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      'normal': 'bg-blue-100 text-blue-800',
      'night': 'bg-purple-100 text-purple-800',
      'weekend': 'bg-orange-100 text-orange-800',
      'holiday': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getDepartmentColor = (department) => {
    const colors = {
      'it': 'bg-blue-100 text-blue-800',
      'hr': 'bg-green-100 text-green-800',
      'store': 'bg-orange-100 text-orange-800',
      'account': 'bg-purple-100 text-purple-800',
      'production': 'bg-red-100 text-red-800'
    };
    return colors[department] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr className="text-gray-700">
            <th className="p-4 text-left font-semibold text-gray-900">พนักงาน</th>
            <th className="p-4 text-left font-semibold text-gray-900">แผนก/กะ</th>
            <th className="p-4 text-left font-semibold text-gray-900">วันที่</th>
            <th className="p-4 text-left font-semibold text-gray-900">ช่วงเวลาโอที</th>
            <th className="p-4 text-left font-semibold text-gray-900">ชั่วโมงโอที</th>
            <th className="p-4 text-left font-semibold text-gray-900">ประเภท</th>
            <th className="p-4 text-left font-semibold text-gray-900">ค่าล่วงเวลา</th>
            <th className="p-4 text-left font-semibold text-gray-900">เหตุผล</th>
            <th className="p-4 text-left font-semibold text-gray-900">สถานะ</th>
            <th className="p-4 text-center font-semibold text-gray-900">การจัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {requests.map(request => {
            const shift = shifts.find(s => s.id === request.shiftId);
            return (
              <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="p-4">
                  <div>
                    <div className="font-medium text-gray-900">{request.employeeName}</div>
                    <div className="text-sm text-gray-500">{request.employeeId}</div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <Badge className={getDepartmentColor(request.department)}>
                      {request.departmentName}
                    </Badge>
                    {shift && (
                      <div className="text-xs text-gray-500">
                        {shift.shiftName} ({shift.startTime} - {shift.endTime} น.)
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4 text-gray-600">
                  <div>{request.thaiDate || thaiDateUtils.formatThaiDate(request.date)}</div>
                  <div className="text-xs text-gray-500">({request.thaiDay || thaiDateUtils.getThaiDayName(request.date)})</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-gray-900">
                    {thaiDateUtils.formatThaiTime(request.startTime)} - {thaiDateUtils.formatThaiTime(request.endTime)}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-gray-900">{request.hours || request.plannedHours} ชม.</div>
                  <div className="text-sm text-gray-500">x{request.rate} rate</div>
                </td>
                <td className="p-4">
                  <Badge className={getTypeColor(request.type)}>
                    {getTypeText(request.type)}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="font-medium text-green-600">
                    ฿{request.overtimePay?.toLocaleString('th-TH') || "รอคำนวณ"}
                  </div>
                </td>
                <td className="p-4 text-gray-600 max-w-xs">
                  {request.reason}
                </td>
                <td className="p-4">
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusText(request.status)}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                      onClick={() => onEdit(request.id)}
                    >
                      <Edit className="w-3 h-3" />
                      แก้ไข
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      ลบ
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Component สถิติโอที
const OvertimeStats = ({ stats, shifts }) => {
  const activeShifts = shifts.filter(shift => shift.status === "active" && shift.overtimeAllowed);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">โอทีเดือนนี้</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHours} ชม.</p>
              <p className="text-xs text-green-600 mt-1">↑ {stats.changePercent}% จากเดือนก่อน</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">พนักงานทำโอที</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees} คน</p>
              <p className="text-xs text-gray-500 mt-1">จากทั้งหมด {stats.totalAllEmployees} คน</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">ค่าโอทีรวม</p>
              <p className="text-2xl font-bold text-gray-900">฿{stats.totalCost.toLocaleString('th-TH')}</p>
              <p className="text-xs text-orange-600 mt-1">ประมาณการ</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Building className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">กะที่อนุญาต OT</p>
              <p className="text-2xl font-bold text-gray-900">{activeShifts.length} กะ</p>
              <p className="text-xs text-gray-500 mt-1">จากทั้งหมด {shifts.length} กะ</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Component การตั้งค่าโอที
const OvertimeSettings = ({ settings, onSettingsChange, onSave, shifts }) => {
  const activeShifts = shifts.filter(shift => shift.status === "active" && shift.overtimeAllowed);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <h4 className="font-medium text-gray-900 text-lg">อัตราค่าล่วงเวลา</h4>

          <div className="space-y-2">
            <Label htmlFor="overtimeRate" className="font-medium">โอทีปกติ (จันทร์-ศุกร์)</Label>
            <Input
              id="overtimeRate"
              type="number"
              step="0.1"
              value={settings.overtimeRate}
              onChange={(e) => onSettingsChange('overtimeRate', parseFloat(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">เท่าของค่าแรงปกติ</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nightShiftRate" className="font-medium">โอทีกะดึก (22:00-06:00 น.)</Label>
            <Input
              id="nightShiftRate"
              type="number"
              step="0.1"
              value={settings.nightShiftRate}
              onChange={(e) => onSettingsChange('nightShiftRate', parseFloat(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">เท่าของค่าแรงปกติ</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekendRate" className="font-medium">โอทีวันหยุดสุดสัปดาห์</Label>
            <Input
              id="weekendRate"
              type="number"
              step="0.1"
              value={settings.weekendRate}
              onChange={(e) => onSettingsChange('weekendRate', parseFloat(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">เท่าของค่าแรงปกติ</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="holidayRate" className="font-medium">โอทีวันหยุดนักขัตฤกษ์</Label>
            <Input
              id="holidayRate"
              type="number"
              step="0.1"
              value={settings.holidayRate}
              onChange={(e) => onSettingsChange('holidayRate', parseFloat(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">เท่าของค่าแรงปกติ</p>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="font-medium text-gray-900 text-lg">เงื่อนไขโอที</h4>

          <div className="space-y-2">
            <Label htmlFor="minOvertime" className="font-medium">โอทีขั้นต่ำต่อครั้ง</Label>
            <Input
              id="minOvertime"
              type="number"
              step="0.1"
              value={settings.minOvertime}
              onChange={(e) => onSettingsChange('minOvertime', parseFloat(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">ชั่วโมง (น้อยสุดที่คำนวณค่าโอที)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxDailyOT" className="font-medium">โอทีสูงสุดต่อวัน</Label>
            <Input
              id="maxDailyOT"
              type="number"
              step="0.1"
              value={settings.maxDailyOT}
              onChange={(e) => onSettingsChange('maxDailyOT', parseFloat(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">ชั่วโมง (มากสุดที่อนุญาตต่อวัน)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxMonthlyOT" className="font-medium">โอทีสูงสุดต่อเดือน</Label>
            <Input
              id="maxMonthlyOT"
              type="number"
              value={settings.maxMonthlyOT}
              onChange={(e) => onSettingsChange('maxMonthlyOT', parseInt(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">ชั่วโมง (มากสุดที่อนุญาตต่อเดือน)</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Label className="font-medium text-gray-900">คำนวณโอทีอัตโนมัติ</Label>
              <p className="text-sm text-gray-500 mt-1">คำนวณโอทีจากเวลาทำงานจริงอัตโนมัติ</p>
            </div>
            <SimpleSwitch
              defaultChecked={settings.autoCalculateOvertime}
              onChange={(checked) => onSettingsChange('autoCalculateOvertime', checked)}
            />
          </div>
        </div>
      </div>

      {/* กะที่อนุญาตโอที */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            กะที่อนุญาตการทำงานล่วงเวลา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeShifts.map(shift => (
              <div key={shift.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <div className="font-medium text-green-800">{shift.shiftName}</div>
                  <div className="text-sm text-green-600">{shift.departmentName}</div>
                  <div className="text-xs text-green-500">{shift.startTime} - {shift.endTime} น.</div>
                </div>
                <Badge className="bg-green-100 text-green-700">อนุญาต OT</Badge>
              </div>
            ))}
            {activeShifts.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>ไม่มีกะที่อนุญาตการทำงานล่วงเวลา</p>
                <p className="text-sm">กรุณาไปที่หน้าจัดการกะการทำงานเพื่อเปิดใช้งาน</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" className="border-gray-300">
          <X className="w-4 h-4 mr-2" />
          ยกเลิก
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={onSave}
        >
          <Save className="w-4 h-4 mr-2" />
          บันทึกการตั้งค่า
        </Button>
      </div>
    </div>
  );
};

export default function Overtime() {
  const [activeTab, setActiveTab] = useState("requests");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [employeeSearch, setEmployeeSearch] = useState("");

  // ข้อมูลกะจากหน้า shifts (จำลองข้อมูล)
  const [shifts, setShifts] = useState([
    {
      id: 1,
      department: "it",
      departmentName: "ฝ่าย IT",
      shiftName: "กะ A",
      timeRange: "กลางวัน",
      startTime: "08:00",
      endTime: "16:00",
      breakStart: "12:00",
      breakEnd: "13:00",
      totalHours: 8,
      employees: 24,
      status: "active",
      overtimeAllowed: true,
      holidays: []
    },
    {
      id: 2,
      department: "store",
      departmentName: "คลังสินค้า",
      shiftName: "กะ B",
      timeRange: "บ่ายถึงดึก",
      startTime: "16:00",
      endTime: "00:00",
      breakStart: "20:00",
      breakEnd: "20:30",
      totalHours: 8,
      employees: 18,
      status: "active",
      overtimeAllowed: true,
      holidays: []
    },
    {
      id: 3,
      department: "production",
      departmentName: "ฝ่ายผลิต",
      shiftName: "กะ C",
      timeRange: "ดึกถึงเช้า",
      startTime: "00:00",
      endTime: "08:00",
      breakStart: "04:00",
      breakEnd: "04:30",
      totalHours: 8,
      employees: 12,
      status: "inactive",
      overtimeAllowed: false,
      holidays: []
    }
  ]);

  // ข้อมูลพนักงาน
  const [employees] = useState([
    {
      id: "EMP001",
      name: "สมชาย ใจดี",
      department: "it",
      departmentName: "ฝ่าย IT",
      baseSalary: 15000
    },
    {
      id: "EMP002",
      name: "สุนิสา มาดี",
      department: "store",
      departmentName: "คลังสินค้า",
      baseSalary: 16000
    },
    {
      id: "EMP003",
      name: "ประยุทธ ทำงาน",
      department: "production",
      departmentName: "ฝ่ายผลิต",
      baseSalary: 17000
    },
    {
      id: "EMP004",
      name: "วรรณา สวยงาม",
      department: "it",
      departmentName: "ฝ่าย IT",
      baseSalary: 18000
    },
    {
      id: "EMP005",
      name: "อนุชา กล้าหาญ",
      department: "store",
      departmentName: "คลังสินค้า",
      baseSalary: 15500
    }
  ]);

  const departments = [
    { id: "it", name: "ฝ่าย IT" },
    { id: "store", name: "คลังสินค้า" },
    { id: "production", name: "ฝ่ายผลิต" },
    { id: "hr", name: "ฝ่ายบุคคล" },
    { id: "account", name: "ฝ่ายบัญชี" }
  ];

  // ข้อมูลสถิติโอที
  const [overtimeStats, setOvertimeStats] = useState({
    totalHours: 342,
    totalEmployees: 45,
    totalAllEmployees: 120,
    totalCost: 125680,
    changePercent: 8.5
  });

  // การตั้งค่าโอที
  const [overtimeSettings, setOvertimeSettings] = useState({
    overtimeRate: 1.5,
    nightShiftRate: 1.25,
    weekendRate: 2.0,
    holidayRate: 3.0,
    minOvertime: 0.5,
    maxDailyOT: 4,
    maxMonthlyOT: 36,
    autoCalculateOvertime: true
  });

  // ข้อมูลคำขอโอที (อิงจากกะ)
  const [overtimeRequests, setOvertimeRequests] = useState([
    {
      id: 1,
      employeeId: "EMP001",
      employeeName: "สมชาย ใจดี",
      department: "it",
      departmentName: "ฝ่าย IT",
      shiftId: 1,
      date: "2024-01-15",
      startTime: "16:30",
      endTime: "19:00",
      hours: 2.5,
      type: "normal",
      rate: 1.5,
      overtimePay: 1875,
      reason: "ทำงานไม่เสร็จตามกำหนดเนื่องจากระบบขัดข้อง",
      status: "approved",
      thaiDate: "15/1/2567",
      thaiDay: "จันทร์"
    },
    {
      id: 2,
      employeeId: "EMP002",
      employeeName: "สุนิสา มาดี",
      department: "store",
      departmentName: "คลังสินค้า",
      shiftId: 2,
      date: "2024-01-16",
      startTime: "00:30",
      endTime: "03:30",
      hours: 3,
      type: "night",
      rate: 1.25,
      overtimePay: 1500,
      reason: "สต็อกสินค้ามากกว่าปกติ ต้องจัดการเพิ่มเติม",
      status: "approved",
      thaiDate: "16/1/2567",
      thaiDay: "อังคาร"
    },
    {
      id: 3,
      employeeId: "EMP003",
      employeeName: "ประยุทธ ทำงาน",
      department: "production",
      departmentName: "ฝ่ายผลิต",
      shiftId: 2,
      date: "2024-01-14",
      startTime: "16:00",
      endTime: "20:30",
      hours: 4.5,
      type: "weekend",
      rate: 2.0,
      overtimePay: 4500,
      reason: "โปรเจคด่วนต้องส่งลูกค้าวันจันทร์",
      status: "approved",
      thaiDate: "14/1/2567",
      thaiDay: "อาทิตย์"
    },
    {
      id: 4,
      employeeId: "EMP004",
      employeeName: "วรรณา สวยงาม",
      department: "it",
      departmentName: "ฝ่าย IT",
      shiftId: 1,
      date: "2024-01-13",
      startTime: "16:00",
      endTime: "18:00",
      hours: 2,
      type: "holiday",
      rate: 3.0,
      overtimePay: 3000,
      reason: "ปิดงบประจำเดือนเร่งด่วน",
      status: "approved",
      thaiDate: "13/1/2567",
      thaiDay: "เสาร์"
    }
  ]);

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const years = [2566, 2567, 2568]; // พ.ศ.

  // ฟังก์ชันส่งคำขอทำโอที
  const handleSubmitRequest = (requestData) => {
    setOvertimeRequests(prev => [...prev, requestData]);

    // อัพเดทสถิติ
    setOvertimeStats(prev => ({
      ...prev,
      totalHours: prev.totalHours + requestData.plannedHours,
      totalEmployees: Math.max(prev.totalEmployees,
        new Set([...prev.totalEmployees, requestData.employeeId]).size)
    }));
  };

  // ฟังก์ชันคำนวณค่าล่วงเวลา
  const calculateOvertimePay = (request) => {
    const employee = employees.find(emp => emp.id === request.employeeId);
    const baseSalary = employee?.baseSalary || 15000;
    const hourlyRate = baseSalary / 30 / 8;
    return request.plannedHours * hourlyRate * request.rate;
  };

  const handleEditRequest = (requestId) => {
    // เปิด modal แก้ไขคำขอโอที
    console.log("แก้ไขคำขอโอที:", requestId);
  };

  // ฟังก์ชันจัดการการตั้งค่า
  const handleSettingsChange = (key, value) => {
    setOvertimeSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    console.log("บันทึกการตั้งค่าโอที:", overtimeSettings);
    alert("บันทึกการตั้งค่าโอทีเรียบร้อยแล้ว");
  };

  // กรองคำขอตามสถานะและแผนก
  const filteredRequests = overtimeRequests.filter(request => {
    const statusMatch = statusFilter === "all" || request.status === statusFilter;
    const departmentMatch = departmentFilter === "all" || request.department === departmentFilter;
    const employeeMatch = !employeeSearch ||
      request.employeeName.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      request.employeeId.toLowerCase().includes(employeeSearch.toLowerCase());

    return statusMatch && departmentMatch && employeeMatch;
  });

  return (
    <AppLayout title="จัดการการทำงานล่วงเวลา (Overtime)">
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการการทำงานล่วงเวลา</h1>
            <p className="text-gray-600 mt-2">บริหารจัดการการทำงานล่วงเวลา และการคำนวณค่าล่วงเวลา</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              ส่งออกรายงาน
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "requests"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("requests")}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            บันทึกการทำโอที
          </button>
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("history")}
          >
            <Search className="w-4 h-4 inline mr-2" />
            ประวัติโอที
          </button>
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "settings"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            <Save className="w-4 h-4 inline mr-2" />
            การตั้งค่าโอที
          </button>
        </div>

        {/* สถิติโอที */}
        <OvertimeStats stats={overtimeStats} shifts={shifts} />

        {activeTab === "requests" ? (
          <div className="space-y-6">
            {/* ฟอร์มบันทึกโอที */}
            <OvertimeRequestForm
              shifts={shifts}
              employees={employees}
              onSubmitRequest={handleSubmitRequest}
            />

            {/* Dashboard สำหรับพนักงาน */}
            <EmployeeOvertimeDashboard
              employeeRequests={overtimeRequests}
            />

            {/* Filter Controls */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  กรองรายการโอที
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>ค้นหาพนักงาน</Label>
                    <Input
                      placeholder="ค้นหาด้วยชื่อหรือรหัสพนักงาน..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>แผนก</Label>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="ทั้งหมด" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>ประเภทโอที</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="ทั้งหมด" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        <SelectItem value="normal">โอทีปกติ</SelectItem>
                        <SelectItem value="weekend">โอทีวันหยุด</SelectItem>
                        <SelectItem value="holiday">โอทีวันนักขัตฤกษ์</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>ตัวเลือก</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setEmployeeSearch("");
                          setDepartmentFilter("all");
                          setStatusFilter("all");
                        }}
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        ล้างการกรอง
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overtime Requests Table */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800">
                  รายการทำโอทีทั้งหมด ({filteredRequests.length} รายการ)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OvertimeRequestTable
                  requests={filteredRequests}
                  shifts={shifts}
                  onEdit={handleEditRequest}
                />
              </CardContent>
            </Card>
          </div>
        ) : activeTab === "history" ? (
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  ประวัติการทำโอที
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">กำลังพัฒนาระบบประวัติโอที</h3>
                  <p className="text-gray-500">
                    ระบบประวัติการทำโอทีกำลังอยู่ในขั้นตอนการพัฒนา
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Settings Tab */
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  การตั้งค่าระบบโอที
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OvertimeSettings
                  settings={overtimeSettings}
                  onSettingsChange={handleSettingsChange}
                  onSave={handleSaveSettings}
                  shifts={shifts}
                />
              </CardContent>
            </Card>

            {/* Additional Settings */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  การส่งออกและนำเข้าข้อมูล
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">ส่งออกข้อมูลโอที</h4>
                    <p className="text-sm text-gray-600">ส่งออกข้อมูลโอทีเป็นไฟล์ Excel หรือ PDF</p>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Excel
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">นำเข้าข้อมูลโอที</h4>
                    <p className="text-sm text-gray-600">นำเข้าข้อมูลโอทีจากไฟล์ Excel</p>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      อัพโหลดไฟล์ Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
