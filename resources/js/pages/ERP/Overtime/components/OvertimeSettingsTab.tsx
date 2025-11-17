// resources/js/pages/ERP/Overtime/components/OvertimeSettingsTab.tsx
import React, { useState } from "react";

interface OvertimeSettingsTabProps {
  shifts: any[];
  employees: any[];
}

const OvertimeSettingsTab: React.FC<OvertimeSettingsTabProps> = ({
  shifts,
  employees
}) => {
  const [settings, setSettings] = useState({
    // การตั้งค่าอัตราค่าล่วงเวลา
    overtimeRates: {
      weekday: {
        normal: 1.5,
        holiday: 3.0
      },
      weekend: {
        normal: 2.0,
        holiday: 3.0
      }
    },
    // เงื่อนไขการอนุมัติ
    approvalSettings: {
      autoApprove: false,
      requireManagerApproval: true,
      maxOvertimeHours: 36,
      notificationEnabled: true
    },
    // การตั้งค่าการคำนวณ
    calculationSettings: {
      roundToNearest: 0.25,
      includeBreakTime: false,
      minimumOvertime: 1.0
    }
  });

  const [activeSection, setActiveSection] = useState("rates");

  const handleSaveSettings = () => {
    // บันทึกการตั้งค่า (ในที่นี้เป็น mock)
    console.log("Saving settings:", settings);
    alert("บันทึกการตั้งค่าสำเร็จ");
  };

  const handleResetSettings = () => {
    if (confirm("คุณต้องการรีเซ็ตการตั้งค่าเป็นค่าเริ่มต้นหรือไม่?")) {
      setSettings({
        overtimeRates: {
          weekday: {
            normal: 1.5,
            holiday: 3.0
          },
          weekend: {
            normal: 2.0,
            holiday: 3.0
          }
        },
        approvalSettings: {
          autoApprove: false,
          requireManagerApproval: true,
          maxOvertimeHours: 36,
          notificationEnabled: true
        },
        calculationSettings: {
          roundToNearest: 0.25,
          includeBreakTime: false,
          minimumOvertime: 1.0
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* เมนูการตั้งค่า */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSection("rates")}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeSection === "rates"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            อัตราค่าล่วงเวลา
          </button>
          <button
            onClick={() => setActiveSection("approval")}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeSection === "approval"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            เงื่อนไขการอนุมัติ
          </button>
          <button
            onClick={() => setActiveSection("calculation")}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeSection === "calculation"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            การคำนวณ
          </button>
        </div>

        <div className="p-6">
          {/* อัตราค่าล่วงเวลา */}
          {activeSection === "rates" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">อัตราค่าล่วงเวลา</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* วันธรรมดา */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">วันธรรมดา (จันทร์ - ศุกร์)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        อัตราล่วงเวลาปกติ
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          step="0.1"
                          value={settings.overtimeRates.weekday.normal}
                          onChange={(e) => setSettings({
                            ...settings,
                            overtimeRates: {
                              ...settings.overtimeRates,
                              weekday: {
                                ...settings.overtimeRates.weekday,
                                normal: parseFloat(e.target.value)
                              }
                            }
                          })}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-600">เท่า</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        อัตราล่วงเวลาวันหยุด
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          step="0.1"
                          value={settings.overtimeRates.weekday.holiday}
                          onChange={(e) => setSettings({
                            ...settings,
                            overtimeRates: {
                              ...settings.overtimeRates,
                              weekday: {
                                ...settings.overtimeRates.weekday,
                                holiday: parseFloat(e.target.value)
                              }
                            }
                          })}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-600">เท่า</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* วันหยุดสุดสัปดาห์ */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">วันหยุดสุดสัปดาห์ (เสาร์ - อาทิตย์)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        อัตราล่วงเวลาปกติ
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          step="0.1"
                          value={settings.overtimeRates.weekend.normal}
                          onChange={(e) => setSettings({
                            ...settings,
                            overtimeRates: {
                              ...settings.overtimeRates,
                              weekend: {
                                ...settings.overtimeRates.weekend,
                                normal: parseFloat(e.target.value)
                              }
                            }
                          })}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-600">เท่า</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        อัตราล่วงเวลาวันหยุด
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          step="0.1"
                          value={settings.overtimeRates.weekend.holiday}
                          onChange={(e) => setSettings({
                            ...settings,
                            overtimeRates: {
                              ...settings.overtimeRates,
                              weekend: {
                                ...settings.overtimeRates.weekend,
                                holiday: parseFloat(e.target.value)
                              }
                            }
                          })}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-600">เท่า</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* เงื่อนไขการอนุมัติ */}
          {activeSection === "approval" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">เงื่อนไขการอนุมัติ</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">อนุมัติอัตโนมัติ</h4>
                    <p className="text-sm text-gray-600">อนุมัติคำขอโอทีโดยอัตโนมัติโดยไม่ต้องรอการยืนยัน</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.approvalSettings.autoApprove}
                      onChange={(e) => setSettings({
                        ...settings,
                        approvalSettings: {
                          ...settings.approvalSettings,
                          autoApprove: e.target.checked
                        }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">ต้องได้รับการอนุมัติจากผู้จัดการ</h4>
                    <p className="text-sm text-gray-600">ต้องได้รับการอนุมัติจากผู้จัดการก่อนจึงจะทำงานโอทีได้</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.approvalSettings.requireManagerApproval}
                      onChange={(e) => setSettings({
                        ...settings,
                        approvalSettings: {
                          ...settings.approvalSettings,
                          requireManagerApproval: e.target.checked
                        }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">จำนวนชั่วโมงโอทีสูงสุดต่อเดือน</h4>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={settings.approvalSettings.maxOvertimeHours}
                      onChange={(e) => setSettings({
                        ...settings,
                        approvalSettings: {
                          ...settings.approvalSettings,
                          maxOvertimeHours: parseInt(e.target.value)
                        }
                      })}
                      className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-600">ชั่วโมง/เดือน</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">การแจ้งเตือน</h4>
                    <p className="text-sm text-gray-600">ส่งการแจ้งเตือนเมื่อมีคำขอโอทีใหม่</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.approvalSettings.notificationEnabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        approvalSettings: {
                          ...settings.approvalSettings,
                          notificationEnabled: e.target.checked
                        }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* การคำนวณ */}
          {activeSection === "calculation" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">การคำนวณค่าล่วงเวลา</h3>

              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">ปัดเศษเวลาเป็น</h4>
                  <select
                    value={settings.calculationSettings.roundToNearest}
                    onChange={(e) => setSettings({
                      ...settings,
                      calculationSettings: {
                        ...settings.calculationSettings,
                        roundToNearest: parseFloat(e.target.value)
                      }
                    })}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0.25}>15 นาที (0.25 ชั่วโมง)</option>
                    <option value={0.5}>30 นาที (0.5 ชั่วโมง)</option>
                    <option value={1.0}>1 ชั่วโมง</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">รวมเวลาพัก</h4>
                    <p className="text-sm text-gray-600">รวมเวลาพักในการคำนวณค่าล่วงเวลา</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.calculationSettings.includeBreakTime}
                      onChange={(e) => setSettings({
                        ...settings,
                        calculationSettings: {
                          ...settings.calculationSettings,
                          includeBreakTime: e.target.checked
                        }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">จำนวนชั่วโมงโอทีขั้นต่ำ</h4>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.5"
                      value={settings.calculationSettings.minimumOvertime}
                      onChange={(e) => setSettings({
                        ...settings,
                        calculationSettings: {
                          ...settings.calculationSettings,
                          minimumOvertime: parseFloat(e.target.value)
                        }
                      })}
                      className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-600">ชั่วโมง</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ปุ่มดำเนินการ */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={handleResetSettings}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              รีเซ็ต
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OvertimeSettingsTab;
