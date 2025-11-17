// resources/js/pages/ERP/Shifts/Shifts.tsx
import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import ShiftsTab from "./compornents/ShiftsTab";
import TimeSettingsTab from "./compornents/TimeSettingsTab";
import HolidayCalendarTab from "./compornents/HolidayCalendarTab";
import TabNavigation from "./compornents/TabNavigation";




export default function Shifts() {
  const [activeTab, setActiveTab] = useState("shifts");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "shifts":
        return <ShiftsTab />;
      case "timeSettings":
        return <TimeSettingsTab />;
      case "holidayCalendar":
        return <HolidayCalendarTab />;
      default:
        return <ShiftsTab />;
    }
  };

  return (
    <AppLayout title="จัดการกะการทำงาน (Shifts)">
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการกะการทำงาน</h1>
            <p className="text-gray-600 mt-2">บริหารจัดการกะการทำงาน เวลาทำงาน และวันหยุดของพนักงาน</p>
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
