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
import { commonHolidays } from "../data/mockData";

interface Holiday {
  id: number;
  name: string;
  date: string;
}

interface Shift {
  id: number;
  shiftNumber?: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
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

interface ShiftsTabProps {
  shifts: Shift[];
  departments: Department[];
}

const ShiftsTab: React.FC<ShiftsTabProps> = ({ shifts, departments }) => {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const handleAddShift = () => {
    const newShift: Shift = {
      id: Math.max(...shifts.map(s => s.id), 0) + 1,
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
      holidays: [],
    };
    setEditingShift(newShift);
    setIsAddingNew(true);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift({ ...shift });
    setIsAddingNew(false);
  };

  const handleSaveShift = (updatedShift: Shift) => {
    console.log("บันทึกกะ:", updatedShift);
    setEditingShift(null);
    setIsAddingNew(false);
    // TODO: ส่งข้อมูลไป backend ผ่าน API หรือ Inertia
  };

  const handleCancelEdit = () => {
    setEditingShift(null);
    setIsAddingNew(false);
  };

  const handleDeleteShift = (id: number) => {
    if (confirm("คุณต้องการลบกะนี้ใช่หรือไม่?")) {
      console.log("ลบกะ:", id);
      // TODO: ลบข้อมูลจาก backend
    }
  };

  const filteredShifts = selectedDepartment === "all"
    ? shifts
    : shifts.filter(shift => shift.department === selectedDepartment);

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

      <StatsCards shiftData={shifts} />

      {editingShift && (
        <ShiftForm
          shift={editingShift}
          isAddingNew={isAddingNew}
          departments={departments}
          onSave={handleSaveShift}
          onCancel={handleCancelEdit}
          onFieldChange={(field, value) => {
            setEditingShift(prev => prev ? { ...prev, [field]: value } : null);
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
