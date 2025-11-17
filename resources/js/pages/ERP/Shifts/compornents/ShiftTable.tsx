// resources/js/pages/ERP/Shifts/components/ShiftTable.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users, Clock, Calendar } from "lucide-react";

interface ShiftTableProps {
  shifts: any[];
  departments: any[];
  onEditShift: (shift: any) => void;
  onDeleteShift: (id: number) => void;
  onSelectShift: (shift: any) => void;
}

const ShiftTable: React.FC<ShiftTableProps> = ({
  shifts,
  departments,
  onEditShift,
  onDeleteShift,
  onSelectShift
}) => {
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

  const getTimeColor = (timeRange: string) => {
    const colors: { [key: string]: string } = {
      "กลางวัน": "text-green-600",
      "บ่ายถึงดึก": "text-orange-600",
      "ดึกถึงเช้า": "text-purple-600"
    };
    return colors[timeRange] || "text-gray-600";
  };

  return (
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
              {shifts.map((shift, index) => {
                const dept = departments.find(d => d.id === shift.department);
                return (
                  <tr
                    key={shift.id}
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => onSelectShift(shift)}
                  >
                    <td className="p-4 font-medium text-gray-900">{index + 1}</td>
                    <td className="p-4">
                      <Badge variant="secondary" className={getDepartmentColor(shift.department)}>
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
                            onEditShift(shift);
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
                            onDeleteShift(shift.id);
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
  );
};

export default ShiftTable;
