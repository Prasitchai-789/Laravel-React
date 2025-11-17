// resources/js/pages/ERP/Shifts/components/ShiftsTab.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import StatsCards from "./StatsCards";
import ShiftForm from "./ShiftForm";
import ShiftFilter from "./ShiftFilter";
import ShiftTable from "./ShiftTable";
import HolidayManagement from "./HolidayManagement";
import CommonHolidaysCard from "./CommonHolidaysCard";
import { shiftData, departments, commonHolidays } from "../data/mockData";

const ShiftsTab: React.FC = () => {
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("all");

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

  const handleEditShift = (shift: any) => {
    setEditingShift({ ...shift });
    setIsAddingNew(false);
  };

  const handleSaveShift = (updatedShift: any) => {
    console.log("บันทึกกะ:", updatedShift);
    setEditingShift(null);
    setIsAddingNew(false);
  };

  const handleCancelEdit = () => {
    setEditingShift(null);
    setIsAddingNew(false);
  };

  const handleDeleteShift = (id: number) => {
    if (confirm('คุณต้องการลบกะนี้ใช่หรือไม่?')) {
      console.log("ลบกะ:", id);
    }
  };

  const filteredShifts = selectedDepartment === "all"
    ? shiftData
    : shiftData.filter(shift => shift.department === selectedDepartment);

  return (
    <>
      <div className="flex justify-end">
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
          onClick={handleAddShift}
        >
          <Plus className="w-5 h-5" />
          เพิ่มกะใหม่
        </Button>
      </div>

      <StatsCards shiftData={shiftData} />

      {editingShift && (
        <ShiftForm
          shift={editingShift}
          isAddingNew={isAddingNew}
          departments={departments}
          onSave={handleSaveShift}
          onCancel={handleCancelEdit}
          onFieldChange={(field, value) => {
            setEditingShift((prev: any) => ({ ...prev, [field]: value }));
          }}
        />
      )}

      <ShiftFilter
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        departments={departments}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ShiftTable
            shifts={filteredShifts}
            departments={departments}
            onEditShift={handleEditShift}
            onDeleteShift={handleDeleteShift}
            onSelectShift={setSelectedShift}
          />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <HolidayManagement
            selectedShift={selectedShift}
            commonHolidays={commonHolidays}
            onDeselectShift={() => setSelectedShift(null)}
          />
          <CommonHolidaysCard commonHolidays={commonHolidays} />
        </div>
      </div>
    </>
  );
};

export default ShiftsTab;
