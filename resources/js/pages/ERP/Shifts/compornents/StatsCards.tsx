// resources/js/pages/ERP/Shifts/components/StatsCards.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building, Clock, Calendar } from "lucide-react";

interface StatsCardsProps {
  shiftData: any[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ shiftData }) => {
  const stats = [
    {
      label: "จำนวนกะทั้งหมด",
      value: `${shiftData.length} กะ`,
      icon: Users,
      color: "blue"
    },
    {
      label: "ฝ่ายที่ใช้งาน",
      value: `${[...new Set(shiftData.map(shift => shift.department))].length} ฝ่าย`,
      icon: Building,
      color: "green"
    },
    {
      label: "พนักงานทั้งหมด",
      value: `${shiftData.reduce((sum, shift) => sum + shift.employees, 0)} คน`,
      icon: Clock,
      color: "purple"
    },
    {
      label: "วันหยุดทั้งหมด",
      value: `${shiftData.reduce((sum, shift) => sum + shift.holidays.length, 0)} วัน`,
      icon: Calendar,
      color: "orange"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      orange: "bg-orange-100 text-orange-600"
    };
    return colors[color] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${getColorClasses(stat.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;
