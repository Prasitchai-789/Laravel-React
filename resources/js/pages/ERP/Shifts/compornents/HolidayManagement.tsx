// resources/js/pages/ERP/Shifts/components/HolidayManagement.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Calendar } from "lucide-react";

interface HolidayManagementProps {
  selectedShift: any;
  commonHolidays: any[];
  onDeselectShift: () => void;
}

const HolidayManagement: React.FC<HolidayManagementProps> = ({
  selectedShift,
  commonHolidays,
  onDeselectShift
}) => {
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");

  const handleAddHoliday = () => {
    if (!newHolidayDate || !newHolidayName) {
      alert("กรุณากรอกวันที่และชื่อวันหยุด");
      return;
    }
    console.log("เพิ่มวันหยุด:", { date: newHolidayDate, name: newHolidayName });
    setNewHolidayDate("");
    setNewHolidayName("");
  };

  const handleRemoveHoliday = (holidayDate: string) => {
    console.log("ลบวันหยุด:", holidayDate);
  };

  const handleCommonHolidaySelect = (date: string) => {
    const holiday = commonHolidays.find(h => h.date === date);
    if (holiday) {
      setNewHolidayDate(holiday.date);
      setNewHolidayName(holiday.name);
    }
  };

  return (
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
                {selectedShift.holidays && selectedShift.holidays.length > 0 ? (
                  selectedShift.holidays.map((holiday: any, index: number) => (
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
                        onClick={() => handleRemoveHoliday(holiday.date)}
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
                <Select onValueChange={handleCommonHolidaySelect}>
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
                  <Input
                    type="date"
                    placeholder="วันที่"
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                  />
                  <Input
                    placeholder="ชื่อวันหยุด"
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleAddHoliday}
                >
                  เพิ่มวันหยุด
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-gray-300"
              onClick={onDeselectShift}
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
  );
};

export default HolidayManagement;
