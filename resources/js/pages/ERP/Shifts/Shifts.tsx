// resources/js/pages/ERP/Shifts/Shifts.tsx
import React, { useState } from "react";
import { usePage } from "@inertiajs/react"; // ดึง props จาก Laravel
import AppLayout from "@/layouts/app-layout";
import ShiftsTab from "./compornents/ShiftsTab";
import TimeSettingsTab from "./compornents/TimeSettingsTab";
import HolidayCalendarTab from "./compornents/HolidayCalendarTab";
import TabNavigation from "./compornents/TabNavigation";

// กำหนด type ของ shifts เพื่อความปลอดภัย
interface Holiday {
  id: number;
  name: string;
  date: string;
}

interface Shift {
  id: number;
  shiftNumber: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  totalHours: number;
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

export default function Shifts() {
  const [activeTab, setActiveTab] = useState("shifts");

  // ดึง shifts จาก Laravel ผ่าน Inertia
  const { shifts } = usePage<{ shifts: Shift[] }>().props;

  const renderActiveTab = () => {
    switch (activeTab) {
      case "shifts":
        return <ShiftsTab shifts={shifts} />; // ส่ง props ไปยัง ShiftsTab
      case "timeSettings":
        return <TimeSettingsTab />;
      case "holidayCalendar":
        return <HolidayCalendarTab />;
      default:
        return <ShiftsTab shifts={shifts} />;
    }
  };

  return (
    <AppLayout title="จัดการกะการทำงาน (Shifts)">
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการกะการทำงาน</h1>
            <p className="text-gray-600 mt-2">
              บริหารจัดการกะการทำงาน เวลาทำงาน และวันหยุดของพนักงาน
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Active Tab Content */}
        {renderActiveTab()}
      </div>
    </AppLayout>
  );
}
