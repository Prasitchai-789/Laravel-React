// resources/js/pages/ERP/Shifts/components/HolidayCalendarTab.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, XCircle, Calendar, Users, Clock } from "lucide-react";
import { shiftData, departments, commonHolidays } from "../data/mockData";

const HolidayCalendarTab: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const years = [2023, 2024, 2025];

  const generateCalendarDays = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push(date);
    }

    return days;
  };

  const isHoliday = (date: Date, shift: any) => {
    if (!shift || !shift.holidays) return false;
    const dateString = date.toISOString().split('T')[0];
    return shift.holidays.some((holiday: any) => holiday.date === dateString);
  };

  const isCommonHoliday = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return commonHolidays.some(holiday => holiday.date === dateString);
  };

  const getDepartmentColor = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    const colors: { [key: string]: string } = {
      blue: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      green: "bg-green-100 text-green-800 hover:bg-green-200",
      orange: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      purple: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      red: "bg-red-100 text-red-800 hover:bg-red-200"
    };
    return colors[dept?.color] || "bg-gray-100 text-gray-800 hover:bg-gray-200";
  };

  const filteredShifts = selectedDepartment === "all"
    ? shiftData
    : shiftData.filter(shift => shift.department === selectedDepartment);

  const calendarDays = generateCalendarDays(selectedMonth, selectedYear);

  return (
    <div className="space-y-6">
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
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
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
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
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
                          <Badge variant="secondary" className={getDepartmentColor(shift.department)}>
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
                          >
                            <div className="flex flex-col items-center justify-center h-12">
                              {isHoliday(day, shift) ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                              )}
                            </div>
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
  );
};

export default HolidayCalendarTab;
