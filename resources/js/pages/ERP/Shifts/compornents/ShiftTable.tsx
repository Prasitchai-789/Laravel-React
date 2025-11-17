// resources/js/pages/ERP/Shifts/components/ShiftTable.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users, Clock, Calendar } from "lucide-react";

// Define shift structure
interface Holiday {
  id: number;
  name: string;
  date: string;
}

interface Shift {
  id: number;
  shiftNumber?: string;
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  breakStart?: string;
  breakEnd?: string;
  department?: string | number;
  departmentName?: string;
  employees?: number;
  holidays?: Holiday[];
  timeRange?: string;
  status?: string;
  overtimeAllowed?: boolean;
}

interface Department {
  id: string | number;
  name: string;
  color?: string;
}

interface ShiftTableProps {
  shifts: Shift[];
  departments?: Department[];
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (id: number) => void;
  onSelectShift: (shift: Shift) => void;
}

const ShiftTable: React.FC<ShiftTableProps> = ({
  shifts = [],
  departments = [],
  onEditShift,
  onDeleteShift,
  onSelectShift,
}) => {

  const getDepartmentColor = (deptId?: string | number) => {
    if (!deptId) return "bg-gray-100 text-gray-800 hover:bg-gray-200";

    const dept = departments.find(d => d.id == deptId);

    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      green: "bg-green-100 text-green-800 hover:bg-green-200",
      orange: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      purple: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      red: "bg-red-100 text-red-800 hover:bg-red-200",
      pink: "bg-pink-100 text-pink-800 hover:bg-pink-200",
      indigo: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
    };

    return colors[dept?.color || ""] || "bg-gray-100 text-gray-800 hover:bg-gray-200";
  };

  const getTimeColor = (timeRange?: string) => {
    const colors: Record<string, string> = {
      "กลางวัน": "text-green-600",
      "บ่ายถึงดึก": "text-orange-600",
      "ดึกถึงเช้า": "text-purple-600",
      "กลางวัน-เย็น": "text-blue-600",
      "ยืดหยุ่น": "text-indigo-600",
      "ด่วน": "text-pink-600",
    };
    return colors[timeRange || ""] || "text-gray-600";
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
                <th className="p-4 text-left font-semibold">#</th>
                <th className="p-4 text-left font-semibold">ฝ่าย</th>
                <th className="p-4 text-left font-semibold">ชื่อกะ</th>
                <th className="p-4 text-left font-semibold">ช่วงเวลา</th>
                <th className="p-4 text-left font-semibold">เวลาทำงาน</th>
                <th className="p-4 text-left font-semibold">พัก</th>
                <th className="p-4 text-left font-semibold">พนักงาน</th>
                <th className="p-4 text-left font-semibold">วันหยุด</th>
                <th className="p-4 text-left font-semibold">สถานะ</th>
                <th className="p-4 text-center font-semibold">การจัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">

              {shifts.map((shift, index) => (
                <tr
                  key={shift.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onSelectShift(shift)}
                >
                  <td className="p-4 font-medium">{index + 1}</td>

                  <td className="p-4">
                    <Badge className={getDepartmentColor(shift.department)}>
                      {shift.departmentName || "-"}
                    </Badge>
                  </td>

                  <td className="p-4 font-medium text-gray-900">
                    {shift.shiftName || "-"}
                  </td>

                  <td className="p-4 text-gray-700">
                    {shift.timeRange || "-"}
                  </td>

                  <td className="p-4">
                    <div className={`flex items-center gap-2 font-medium ${getTimeColor(shift.timeRange)}`}>
                      <Clock className="w-4 h-4" />
                      <div>
                        <div>{shift.startTime || "-"} - {shift.endTime || "-"}</div>
                        <div className="text-xs text-gray-500">{shift.totalHours ?? 0} ชม.</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-gray-700">
                    {shift.breakStart || "-"} - {shift.breakEnd || "-"}
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{shift.employees ?? 0} คน</span>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{shift.holidays?.length ?? 0} วัน</span>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="space-y-1">
                      <Badge className={
                        shift.status === "active"
                          ? "bg-green-100 text-green-800 border-0"
                          : "bg-gray-100 text-gray-700 border-0"
                      }>
                        {shift.status === "active" ? "ใช้งานอยู่" : "ไม่ใช้งาน"}
                      </Badge>

                      {shift.overtimeAllowed && (
                        <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">
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
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
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
                        className="border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-1"
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
              ))}

            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShiftTable;
