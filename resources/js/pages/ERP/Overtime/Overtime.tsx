// resources/js/pages/ERP/Overtime/Overtime.tsx
import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import OvertimeRequestsTab from "./components/OvertimeRequestsTab";
import OvertimeHistoryTab from "./components/OvertimeHistoryTab";
import OvertimeSettingsTab from "./components/OvertimeSettingsTab";
import TabNavigation from "./components/TabNavigation";
import OvertimeStats from "./components/OvertimeStats";
import AddOvertimeModal from "./components/AddOvertimeModal";
import { shifts, employees, overtimeStats as initialStats, overtimeRequests as initialRequests } from "./data/mockData";

export default function Overtime() {
  const [activeTab, setActiveTab] = useState("requests");
  const [overtimeStats, setOvertimeStats] = useState(initialStats);
  const [overtimeRequests, setOvertimeRequests] = useState(initialRequests);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ฟังก์ชันเพิ่มโอทีใหม่
  const handleAddOvertime = (newOvertime: any) => {
    const newRequest = {
      id: overtimeRequests.length + 1,
      ...newOvertime,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    setOvertimeRequests([...overtimeRequests, newRequest]);

    // อัพเดทสถิติ
    setOvertimeStats(prev => ({
      ...prev,
      totalRequests: prev.totalRequests + 1,
      pending: prev.pending + 1
    }));

    setIsAddModalOpen(false);
  };

  // ฟังก์ชันอัพเดทสถานะโอที
  const handleUpdateOvertimeStatus = (requestId: number, status: string) => {
    setOvertimeRequests(prev =>
      prev.map(request =>
        request.id === requestId ? { ...request, status } : request
      )
    );

    // อัพเดทสถิติ
    setOvertimeStats(prev => {
      const request = prev.requests.find(r => r.id === requestId);
      const updatedStats = { ...prev };

      if (request) {
        // ลดจำนวนจากสถานะเดิม
        if (request.status === 'pending') updatedStats.pending--;
        else if (request.status === 'approved') updatedStats.approved--;
        else if (request.status === 'rejected') updatedStats.rejected--;

        // เพิ่มจำนวนไปยังสถานะใหม่
        if (status === 'pending') updatedStats.pending++;
        else if (status === 'approved') updatedStats.approved++;
        else if (status === 'rejected') updatedStats.rejected++;
      }

      return updatedStats;
    });
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "requests":
        return (
          <OvertimeRequestsTab
            shifts={shifts}
            employees={employees}
            stats={overtimeStats}
            requests={overtimeRequests}
            onStatsUpdate={setOvertimeStats}
            onUpdateStatus={handleUpdateOvertimeStatus}
            onAddOvertime={() => setIsAddModalOpen(true)}
          />
        );
      case "history":
        return <OvertimeHistoryTab requests={overtimeRequests} />;
      case "settings":
        return (
          <OvertimeSettingsTab
            shifts={shifts}
            employees={employees}
          />
        );
      default:
        return (
          <OvertimeRequestsTab
            shifts={shifts}
            employees={employees}
            stats={overtimeStats}
            requests={overtimeRequests}
            onStatsUpdate={setOvertimeStats}
            onUpdateStatus={handleUpdateOvertimeStatus}
            onAddOvertime={() => setIsAddModalOpen(true)}
          />
        );
    }
  };

  return (
    <AppLayout title="จัดการการทำงานล่วงเวลา (Overtime)">
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการการทำงานล่วงเวลา</h1>
            <p className="text-gray-600 mt-2">บริหารจัดการการทำงานล่วงเวลา และการคำนวณค่าล่วงเวลา</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <span>+</span>
            <span>เพิ่มคำขอโอที</span>
          </button>
        </div>

        {/* สถิติโอที */}
        <OvertimeStats stats={overtimeStats} shifts={shifts} />

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Active Tab Content */}
        {renderActiveTab()}

        {/* Modal เพิ่มโอที */}
        <AddOvertimeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddOvertime}
          employees={employees}
          shifts={shifts}
        />
      </div>
    </AppLayout>
  );
}
