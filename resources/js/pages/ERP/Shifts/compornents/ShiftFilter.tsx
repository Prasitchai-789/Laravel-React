// resources/js/pages/ERP/Shifts/components/ShiftFilter.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface ShiftFilterProps {
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  departments: any[];
}

const ShiftFilter: React.FC<ShiftFilterProps> = ({
  selectedDepartment,
  onDepartmentChange,
  departments
}) => {
  return (
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
            <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
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
  );
};

export default ShiftFilter;
