import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Trash2, Users, Clock, Building, Calendar, Settings, Save, X, Check, XCircle } from "lucide-react";

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

export default function Shifts() {
  const [selectedShift, setSelectedShift] = useState(null);
  const [activeTab, setActiveTab] = useState("shifts");
  const [editingShift, setEditingShift] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [timeSettings, setTimeSettings] = useState({
    gracePeriod: 15,
    lateThreshold: 30,
    earlyLeaveThreshold: 15,
    autoDeductBreak: true,
    minWorkingHours: 4,
    maxWorkingHours: 12,
    notifyBeforeShift: true
  });

  // ข้อมูลตัวอย่างแบบ state เพื่อให้สามารถแก้ไขได้
  const [shiftData, setShiftData] = useState([
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
      holidays: [
        { date: "2024-01-01", name: "วันขึ้นปีใหม่" },
        { date: "2024-04-13", name: "วันสงกรานต์" }
      ]
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
      holidays: [
        { date: "2024-01-01", name: "วันขึ้นปีใหม่" },
        { date: "2024-12-31", name: "วันสิ้นปี" }
      ]
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

  const departments = [
    { id: "it", name: "ฝ่าย IT", color: "blue" },
    { id: "hr", name: "ฝ่ายบุคคล", color: "green" },
    { id: "store", name: "คลังสินค้า", color: "orange" },
    { id: "account", name: "ฝ่ายบัญชี", color: "purple" },
    { id: "production", name: "ฝ่ายผลิต", color: "red" }
  ];

  const commonHolidays = [
    { date: "2024-01-01", name: "วันขึ้นปีใหม่" },
    { date: "2024-04-13", name: "วันสงกรานต์" },
    { date: "2024-05-01", name: "วันแรงงาน" },
    { date: "2024-12-05", name: "วันพ่อ" },
    { date: "2024-12-10", name: "วันรัฐธรรมนูญ" },
    { date: "2024-12-31", name: "วันสิ้นปี" }
  ];

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const years = [2023, 2024, 2025];

  const getDepartmentColor = (color) => {
    const colors = {
      blue: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      green: "bg-green-100 text-green-800 hover:bg-green-200",
      orange: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      purple: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      red: "bg-red-100 text-red-800 hover:bg-red-200"
    };
    return colors[color] || "bg-gray-100 text-gray-800 hover:bg-gray-200";
  };

  const getTimeColor = (timeRange) => {
    const colors = {
      "กลางวัน": "text-green-600",
      "บ่ายถึงดึก": "text-orange-600",
      "ดึกถึงเช้า": "text-purple-600"
    };
    return colors[timeRange] || "text-gray-600";
  };

  // ฟังก์ชันสร้างตารางวันในเดือน
  const generateCalendarDays = (month, year) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // เพิ่มวันว่างก่อนวันแรกของเดือน
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // เพิ่มวันในเดือน
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push(date);
    }

    return days;
  };

  // ตรวจสอบว่าวันนี้เป็นวันหยุดของกะหรือไม่
  const isHoliday = (date, shift) => {
    if (!shift || !shift.holidays) return false;
    const dateString = date.toISOString().split('T')[0];
    return shift.holidays.some(holiday => holiday.date === dateString);
  };

  // ตรวจสอบว่าวันนี้เป็นวันหยุดทั่วไปหรือไม่
  const isCommonHoliday = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return commonHolidays.some(holiday => holiday.date === dateString);
  };

  // ฟังก์ชันจัดการกะ
  const handleAddShift = () => {
    const newShift = {
      id: Math.max(...shiftData.map(s => s.id), 0) + 1,
      department: "it",
      departmentName: "ฝ่าย IT",
      shiftName: "กะใหม่",
      timeRange: "กลางวัน",
      startTime: "09:00",
      endTime: "17:00",
      breakStart: "12:00",
      breakEnd: "13:00",
      totalHours: 8,
      employees: 0,
      status: "active",
      overtimeAllowed: true,
      holidays: []
    };
    setEditingShift(newShift);
    setIsAddingNew(true);
  };

  const handleEditShift = (shift) => {
    setEditingShift({ ...shift });
    setIsAddingNew(false);
  };

  const handleSaveShift = () => {
    if (isAddingNew) {
      setShiftData(prev => [...prev, editingShift]);
    } else {
      setShiftData(prev => prev.map(shift =>
        shift.id === editingShift.id ? editingShift : shift
      ));
    }
    setEditingShift(null);
    setIsAddingNew(false);
  };

  const handleDeleteShift = (id) => {
    if (confirm('คุณต้องการลบกะนี้ใช่หรือไม่?')) {
      setShiftData(prev => prev.filter(shift => shift.id !== id));
      if (selectedShift?.id === id) {
        setSelectedShift(null);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingShift(null);
    setIsAddingNew(false);
  };

  const handleShiftFieldChange = (field, value) => {
    setEditingShift(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ฟังก์ชันจัดการวันหยุด
  const handleAddHoliday = (shiftId, date, name) => {
    const dateString = date.toISOString().split('T')[0];
    setShiftData(prev => prev.map(shift => {
      if (shift.id === shiftId) {
        const holidayExists = shift.holidays.some(h => h.date === dateString);
        if (!holidayExists) {
          return {
            ...shift,
            holidays: [...shift.holidays, { date: dateString, name }]
          };
        }
      }
      return shift;
    }));
  };

  const handleRemoveHoliday = (shiftId, date) => {
    const dateString = date.toISOString().split('T')[0];
    setShiftData(prev => prev.map(shift => {
      if (shift.id === shiftId) {
        return {
          ...shift,
          holidays: shift.holidays.filter(h => h.date !== dateString)
        };
      }
      return shift;
    }));
  };

  const handleToggleHoliday = (shiftId, date) => {
    const dateString = date.toISOString().split('T')[0];
    const shift = shiftData.find(s => s.id === shiftId);

    if (shift) {
      const isHoliday = shift.holidays.some(h => h.date === dateString);
      if (isHoliday) {
        handleRemoveHoliday(shiftId, date);
      } else {
        const commonHoliday = commonHolidays.find(h => h.date === dateString);
        const holidayName = commonHoliday ? commonHoliday.name : "วันหยุด";
        handleAddHoliday(shiftId, date, holidayName);
      }
    }
  };

  // คำนวณจำนวนชั่วโมงทำงานอัตโนมัติ
  const calculateTotalHours = (startTime, endTime, breakStart, breakEnd) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const breakS = new Date(`2000-01-01T${breakStart}`);
    const breakE = new Date(`2000-01-01T${breakEnd}`);

    let totalMs = end - start;
    if (breakStart && breakEnd) {
      totalMs -= (breakE - breakS);
    }

    return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
  };

  // อัพเดท totalHours เมื่อเวลาเปลี่ยนแปลง
  useEffect(() => {
    if (editingShift) {
      const totalHours = calculateTotalHours(
        editingShift.startTime,
        editingShift.endTime,
        editingShift.breakStart,
        editingShift.breakEnd
      );
      if (totalHours !== editingShift.totalHours) {
        handleShiftFieldChange('totalHours', totalHours);
      }
    }
  }, [editingShift?.startTime, editingShift?.endTime, editingShift?.breakStart, editingShift?.breakEnd]);

  const handleTimeSettingChange = (key, value) => {
    setTimeSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveTimeSettings = () => {
    console.log("บันทึกการตั้งค่าเวลา:", timeSettings);
    alert("บันทึกการตั้งค่าเรียบร้อยแล้ว");
  };

  // กรองกะตามฝ่ายที่เลือก
  const filteredShifts = selectedDepartment === "all"
    ? shiftData
    : shiftData.filter(shift => shift.department === selectedDepartment);

  const calendarDays = generateCalendarDays(selectedMonth, selectedYear);

  return (
    <AppLayout title="จัดการกะการทำงาน (Shifts)">
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการกะการทำงาน</h1>
            <p className="text-gray-600 mt-2">บริหารจัดการกะการทำงาน เวลาทำงาน และวันหยุดของพนักงาน</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              จัดการวันหยุด
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
              onClick={handleAddShift}
            >
              <Plus className="w-5 h-5" />
              เพิ่มกะใหม่
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "shifts"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("shifts")}
          >
            <Users className="w-4 h-4 inline mr-2" />
            จัดการกะการทำงาน
          </button>
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "timeSettings"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("timeSettings")}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            การตั้งค่าเวลา
          </button>
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "holidayCalendar"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("holidayCalendar")}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            ตารางวันหยุด
          </button>
        </div>

        {activeTab === "shifts" ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">จำนวนกะทั้งหมด</p>
                      <p className="text-2xl font-bold text-gray-900">{shiftData.length} กะ</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Building className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">ฝ่ายที่ใช้งาน</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {[...new Set(shiftData.map(shift => shift.department))].length} ฝ่าย
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">พนักงานทั้งหมด</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {shiftData.reduce((sum, shift) => sum + shift.employees, 0)} คน
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">วันหยุดทั้งหมด</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {shiftData.reduce((sum, shift) => sum + shift.holidays.length, 0)} วัน
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form เพิ่ม/แก้ไข กะ */}
            {editingShift && (
              <Card className="border border-blue-200 shadow-lg">
                <CardHeader className="bg-blue-50 border-b border-blue-200">
                  <CardTitle className="text-xl font-semibold text-blue-800 flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    {isAddingNew ? "เพิ่มกะใหม่" : "แก้ไขกะ"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>ชื่อกะ</Label>
                      <Input
                        value={editingShift.shiftName}
                        onChange={(e) => handleShiftFieldChange('shiftName', e.target.value)}
                        placeholder="ชื่อกะ"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>ฝ่าย</Label>
                      <Select
                        value={editingShift.department}
                        onValueChange={(value) => {
                          const dept = departments.find(d => d.id === value);
                          handleShiftFieldChange('department', value);
                          handleShiftFieldChange('departmentName', dept?.name || value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>ช่วงเวลา</Label>
                      <Select
                        value={editingShift.timeRange}
                        onValueChange={(value) => handleShiftFieldChange('timeRange', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="กลางวัน">กลางวัน</SelectItem>
                          <SelectItem value="บ่ายถึงดึก">บ่ายถึงดึก</SelectItem>
                          <SelectItem value="ดึกถึงเช้า">ดึกถึงเช้า</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>เวลาเริ่มงาน</Label>
                      <Input
                        type="time"
                        value={editingShift.startTime}
                        onChange={(e) => handleShiftFieldChange('startTime', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>เวลาเลิกงาน</Label>
                      <Input
                        type="time"
                        value={editingShift.endTime}
                        onChange={(e) => handleShiftFieldChange('endTime', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>จำนวนพนักงาน</Label>
                      <Input
                        type="number"
                        value={editingShift.employees}
                        onChange={(e) => handleShiftFieldChange('employees', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>เริ่มพัก</Label>
                      <Input
                        type="time"
                        value={editingShift.breakStart}
                        onChange={(e) => handleShiftFieldChange('breakStart', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>สิ้นสุดพัก</Label>
                      <Input
                        type="time"
                        value={editingShift.breakEnd}
                        onChange={(e) => handleShiftFieldChange('breakEnd', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>ชั่วโมงทำงานทั้งหมด</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editingShift.totalHours}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>

                    <div className="flex items-center gap-4 col-span-full">
                      <div className="flex items-center gap-2">
                        <Label>สถานะ</Label>
                        <Select
                          value={editingShift.status}
                          onValueChange={(value) => handleShiftFieldChange('status', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">ใช้งาน</SelectItem>
                            <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label>อนุญาต OT</Label>
                        <SimpleSwitch
                          defaultChecked={editingShift.overtimeAllowed}
                          onChange={(checked) => handleShiftFieldChange('overtimeAllowed', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                      onClick={handleSaveShift}
                    >
                      <Save className="w-4 h-4" />
                      บันทึก
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-4 h-4" />
                      ยกเลิก
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filter and Search */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Search className="w-5 h-5 text-gray-500" />
                  ค้นหาและกรองข้อมูล
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">ค้นหาชื่อกะ</label>
                    <Input
                      placeholder="ค้นหาด้วยชื่อกะ..."
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">เลือกฝ่าย</label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="w-full">
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
                    <label className="text-sm font-medium text-gray-700">สถานะ</label>
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="ทั้งหมด" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        <SelectItem value="active">ใช้งานอยู่</SelectItem>
                        <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">เรียงลำดับ</label>
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เรียงตามชื่อ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">เรียงตามชื่อ</SelectItem>
                        <SelectItem value="department">เรียงตามฝ่าย</SelectItem>
                        <SelectItem value="time">เรียงตามเวลา</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Table */}
              <div className="lg:col-span-2">
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      ตารางกะการทำงาน
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr className="text-gray-700">
                            <th className="p-4 text-left font-semibold text-gray-900">#</th>
                            <th className="p-4 text-left font-semibold text-gray-900">ฝ่าย</th>
                            <th className="p-4 text-left font-semibold text-gray-900">ชื่อกะ</th>
                            <th className="p-4 text-left font-semibold text-gray-900">ช่วงเวลา</th>
                            <th className="p-4 text-left font-semibold text-gray-900">เวลาทำงาน</th>
                            <th className="p-4 text-left font-semibold text-gray-900">พัก</th>
                            <th className="p-4 text-left font-semibold text-gray-900">พนักงาน</th>
                            <th className="p-4 text-left font-semibold text-gray-900">วันหยุด</th>
                            <th className="p-4 text-left font-semibold text-gray-900">สถานะ</th>
                            <th className="p-4 text-center font-semibold text-gray-900">การจัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredShifts.map((shift, index) => {
                            const dept = departments.find(d => d.id === shift.department);
                            return (
                              <tr
                                key={shift.id}
                                className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                                onClick={() => setSelectedShift(shift)}
                              >
                                <td className="p-4 font-medium text-gray-900">{index + 1}</td>
                                <td className="p-4">
                                  <Badge variant="secondary" className={getDepartmentColor(dept?.color)}>
                                    {shift.departmentName}
                                  </Badge>
                                </td>
                                <td className="p-4 font-medium text-gray-900">{shift.shiftName}</td>
                                <td className="p-4 text-gray-600">{shift.timeRange}</td>
                                <td className="p-4">
                                  <div className={`flex items-center gap-2 font-medium ${getTimeColor(shift.timeRange)}`}>
                                    <Clock className="w-4 h-4" />
                                    <div>
                                      <div>{shift.startTime} - {shift.endTime}</div>
                                      <div className="text-xs text-gray-500">{shift.totalHours} ชม.</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="text-sm text-gray-600">
                                    {shift.breakStart} - {shift.breakEnd}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-700">{shift.employees} คน</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-700">{shift.holidays.length} วัน</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="space-y-1">
                                    <Badge className={
                                      shift.status === "active"
                                        ? "bg-green-100 text-green-800 hover:bg-green-200 border-0"
                                        : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-0"
                                    }>
                                      {shift.status === "active" ? "ใช้งานอยู่" : "ไม่ใช้งาน"}
                                    </Badge>
                                    {shift.overtimeAllowed && (
                                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0 text-xs">
                                        OT
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex justify-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 flex items-center gap-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditShift(shift);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                      แก้ไข
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 flex items-center gap-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteShift(shift.id);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
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
                  </CardContent>
                </Card>
              </div>

              {/* Holiday Management Sidebar */}
              <div className="lg:col-span-1">
                <Card className="border border-gray-200 shadow-sm sticky top-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      จัดการวันหยุด
                      {selectedShift && (
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                          {selectedShift.shiftName}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedShift ? (
                      <div className="space-y-4">
                        {/* Shift Info */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">ข้อมูลกะ</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>ฝ่าย: {selectedShift.departmentName}</div>
                            <div>เวลา: {selectedShift.startTime} - {selectedShift.endTime}</div>
                            <div>พัก: {selectedShift.breakStart} - {selectedShift.breakEnd}</div>
                            <div>พนักงาน: {selectedShift.employees} คน</div>
                          </div>
                        </div>

                        {/* Current Holidays */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">วันหยุดของกะนี้</h4>
                          <div className="space-y-2">
                            {selectedShift.holidays.length > 0 ? (
                              selectedShift.holidays.map((holiday, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <div>
                                    <div className="font-medium text-yellow-800">{holiday.name}</div>
                                    <div className="text-sm text-yellow-600">
                                      {new Date(holiday.date).toLocaleDateString('th-TH')}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                    onClick={() => handleRemoveHoliday(selectedShift.id, new Date(holiday.date))}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                ยังไม่มีวันหยุดที่กำหนด
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Add Holiday */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">เพิ่มวันหยุด</h4>
                          <div className="space-y-3">
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกวันหยุดทั่วไป" />
                              </SelectTrigger>
                              <SelectContent>
                                {commonHolidays.map((holiday, index) => (
                                  <SelectItem key={index} value={holiday.date}>
                                    {holiday.name} ({new Date(holiday.date).toLocaleDateString('th-TH')})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <div className="grid grid-cols-2 gap-2">
                              <Input type="date" placeholder="วันที่" />
                              <Input placeholder="ชื่อวันหยุด" />
                            </div>

                            <Button className="w-full bg-green-600 hover:bg-green-700">
                              เพิ่มวันหยุด
                            </Button>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full border-gray-300"
                          onClick={() => setSelectedShift(null)}
                        >
                          ย้อนกลับ
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">เลือกกะการทำงานเพื่อจัดการวันหยุด</p>
                        <p className="text-sm text-gray-400">
                          คลิกที่แถวข้อมูลในตารางเพื่อดูและจัดการวันหยุดของกะนั้น
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Common Holidays Card */}
                <Card className="border border-gray-200 shadow-sm mt-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      วันหยุดทั่วไป
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {commonHolidays.slice(0, 3).map((holiday, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                          <div className="text-sm">
                            <div className="font-medium text-blue-800">{holiday.name}</div>
                            <div className="text-blue-600">
                              {new Date(holiday.date).toLocaleDateString('th-TH')}
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            ทุกกะ
                          </Badge>
                        </div>
                      ))}
                      {commonHolidays.length > 3 && (
                        <div className="text-center pt-2">
                          <Button variant="link" className="text-blue-600 text-sm">
                            ดูทั้งหมด {commonHolidays.length} วัน
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : activeTab === "timeSettings" ? (
          /* Time Settings Tab */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  การตั้งค่าเวลาพื้นฐาน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gracePeriod">ระยะเวลาผ่อนผัน (นาที)</Label>
                    <Input
                      id="gracePeriod"
                      type="number"
                      value={timeSettings.gracePeriod}
                      onChange={(e) => handleTimeSettingChange('gracePeriod', parseInt(e.target.value))}
                      placeholder="15"
                    />
                    <p className="text-xs text-gray-500">อนุญาตให้มาสายได้โดยไม่นับเป็นสาย</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lateThreshold">เกณฑ์การมาสาย (นาที)</Label>
                    <Input
                      id="lateThreshold"
                      type="number"
                      value={timeSettings.lateThreshold}
                      onChange={(e) => handleTimeSettingChange('lateThreshold', parseInt(e.target.value))}
                      placeholder="30"
                    />
                    <p className="text-xs text-gray-500">หลังจากนี้ถือว่ามาสาย</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="earlyLeave">เกณฑ์การกลับก่อน (นาที)</Label>
                    <Input
                      id="earlyLeave"
                      type="number"
                      value={timeSettings.earlyLeaveThreshold}
                      onChange={(e) => handleTimeSettingChange('earlyLeaveThreshold', parseInt(e.target.value))}
                      placeholder="15"
                    />
                    <p className="text-xs text-gray-500">กลับก่อนกี่นาทีถือว่ากลับก่อน</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minWorkingHours">ชั่วโมงทำงานขั้นต่ำ</Label>
                    <Input
                      id="minWorkingHours"
                      type="number"
                      value={timeSettings.minWorkingHours}
                      onChange={(e) => handleTimeSettingChange('minWorkingHours', parseInt(e.target.value))}
                      placeholder="4"
                    />
                    <p className="text-xs text-gray-500">ชั่วโมงทำงานน้อยสุดที่ได้รับค่าจ้าง</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxWorkingHours">ชั่วโมงทำงานสูงสุด</Label>
                    <Input
                      id="maxWorkingHours"
                      type="number"
                      value={timeSettings.maxWorkingHours}
                      onChange={(e) => handleTimeSettingChange('maxWorkingHours', parseInt(e.target.value))}
                      placeholder="12"
                    />
                    <p className="text-xs text-gray-500">ชั่วโมงทำงานมากสุดต่อวัน</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <Label htmlFor="autoDeductBreak" className="font-medium">หักเวลาพักอัตโนมัติ</Label>
                    <p className="text-sm text-gray-500">หักเวลาพักกลางวันอัตโนมัติจากเวลาทำงาน</p>
                  </div>
                  <SimpleSwitch
                    id="autoDeductBreak"
                    defaultChecked={timeSettings.autoDeductBreak}
                    onChange={(checked) => handleTimeSettingChange('autoDeductBreak', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-green-600" />
                  การตั้งค่าการแจ้งเตือน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">การแจ้งเตือน</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <Label className="font-medium text-gray-900">แจ้งเตือนก่อนเริ่มกะ</Label>
                        <p className="text-sm text-gray-500 mt-1">แจ้งเตือนก่อนเริ่มงาน 15 นาที</p>
                      </div>
                      <SimpleSwitch
                        defaultChecked={timeSettings.notifyBeforeShift}
                        onChange={(checked) => handleTimeSettingChange('notifyBeforeShift', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveTimeSettings}
                >
                  <Save className="w-4 h-4 mr-2" />
                  บันทึกการตั้งค่า
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Holiday Calendar Tab */
          <div className="space-y-6">
            {/* Filter Controls */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  ตารางวันหยุดตามฝ่ายและกะ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>เลือกฝ่าย</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
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
                    <Label>เลือกเดือน</Label>
                    <Select value={selectedMonth} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>เลือกปี</Label>
                    <Select value={selectedYear} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>ตัวเลือก</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        ส่งออกรายงาน
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar Table */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-3 border bg-gray-50 font-semibold text-gray-700 text-left sticky left-0 bg-white z-10">
                          กะ / วันที่
                        </th>
                        {calendarDays.map((day, index) => (
                          day && (
                            <th
                              key={index}
                              className={`p-3 border text-center text-sm font-medium min-w-16 ${
                                day.getDay() === 0 || day.getDay() === 6
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-gray-50 text-gray-700'
                              } ${
                                isCommonHoliday(day) ? 'bg-yellow-50 text-yellow-700' : ''
                              }`}
                            >
                              <div>{day.getDate()}</div>
                              <div className="text-xs font-normal">
                                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][day.getDay()]}
                              </div>
                            </th>
                          )
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShifts.map((shift, shiftIndex) => {
                        const dept = departments.find(d => d.id === shift.department);
                        return (
                          <tr key={shift.id} className="hover:bg-gray-50">
                            <td className="p-3 border bg-white sticky left-0 z-10 min-w-48">
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className={getDepartmentColor(dept?.color)}>
                                  {shift.departmentName}
                                </Badge>
                                <div>
                                  <div className="font-medium text-gray-900">{shift.shiftName}</div>
                                  <div className="text-xs text-gray-500">
                                    {shift.startTime} - {shift.endTime}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {calendarDays.map((day, dayIndex) => (
                              day ? (
                                <td
                                  key={dayIndex}
                                  className={`p-2 border text-center relative group ${
                                    isHoliday(day, shift)
                                      ? 'bg-red-100 hover:bg-red-200 cursor-pointer'
                                      : 'hover:bg-gray-100 cursor-pointer'
                                  } ${
                                    isCommonHoliday(day) ? 'bg-yellow-50' : ''
                                  }`}
                                  onClick={() => handleToggleHoliday(shift.id, day)}
                                >
                                  <div className="flex flex-col items-center justify-center h-12">
                                    {isHoliday(day, shift) ? (
                                      <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                                    )}
                                  </div>

                                  {/* Tooltip for holiday info */}
                                  {isHoliday(day, shift) && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
                                      {shift.holidays.find(h => h.date === day.toISOString().split('T')[0])?.name}
                                    </div>
                                  )}
                                </td>
                              ) : (
                                <td key={dayIndex} className="p-2 border bg-gray-50"></td>
                              )
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-4 items-center justify-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-200"></div>
                    <span>วันหยุดของกะ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-50 border border-yellow-200"></div>
                    <span>วันหยุดทั่วไป</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-50 border border-red-100"></div>
                    <span>วันหยุดสุดสัปดาห์</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>กำหนดวันหยุดแล้ว</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">วันหยุดทั้งหมด</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredShifts.reduce((sum, shift) => sum + shift.holidays.length, 0)} วัน
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">กะที่แสดง</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredShifts.length} กะ
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">วันทำงานในเดือน</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {calendarDays.filter(day => day && day.getDay() !== 0 && day.getDay() !== 6).length} วัน
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
