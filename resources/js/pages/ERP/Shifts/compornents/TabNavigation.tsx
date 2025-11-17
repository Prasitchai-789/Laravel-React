// resources/js/pages/ERP/Shifts/components/TabNavigation.tsx
import React from "react";
import { Users, Settings, Calendar } from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "shifts", label: "จัดการกะการทำงาน", icon: Users },
    { id: "timeSettings", label: "การตั้งค่าเวลา", icon: Settings },
    { id: "holidayCalendar", label: "ตารางวันหยุด", icon: Calendar },
  ];

  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon className="w-4 h-4 inline mr-2" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;
