// resources/js/pages/ERP/Shifts/components/TimeSettingsTab.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Settings, Save } from "lucide-react";
import SimpleSwitch from "./SimpleSwitch";

const TimeSettingsTab: React.FC = () => {
  const [timeSettings, setTimeSettings] = useState({
    gracePeriod: 15,
    lateThreshold: 30,
    earlyLeaveThreshold: 15,
    autoDeductBreak: true,
    minWorkingHours: 4,
    maxWorkingHours: 12,
    notifyBeforeShift: true
  });

  const handleTimeSettingChange = (key: string, value: any) => {
    setTimeSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveTimeSettings = () => {
    console.log("บันทึกการตั้งค่าเวลา:", timeSettings);
    alert("บันทึกการตั้งค่าเรียบร้อยแล้ว");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            การตั้งค่าเวลาพื้นฐาน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gracePeriod">ระยะเวลาผ่อนผัน (นาที)</Label>
              <Input
                id="gracePeriod"
                type="number"
                value={timeSettings.gracePeriod}
                onChange={(e) => handleTimeSettingChange('gracePeriod', parseInt(e.target.value))}
                placeholder="15"
              />
              <p className="text-xs text-gray-500">อนุญาตให้มาสายได้โดยไม่นับเป็นสาย</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lateThreshold">เกณฑ์การมาสาย (นาที)</Label>
              <Input
                id="lateThreshold"
                type="number"
                value={timeSettings.lateThreshold}
                onChange={(e) => handleTimeSettingChange('lateThreshold', parseInt(e.target.value))}
                placeholder="30"
              />
              <p className="text-xs text-gray-500">หลังจากนี้ถือว่ามาสาย</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="earlyLeave">เกณฑ์การกลับก่อน (นาที)</Label>
              <Input
                id="earlyLeave"
                type="number"
                value={timeSettings.earlyLeaveThreshold}
                onChange={(e) => handleTimeSettingChange('earlyLeaveThreshold', parseInt(e.target.value))}
                placeholder="15"
              />
              <p className="text-xs text-gray-500">กลับก่อนกี่นาทีถือว่ากลับก่อน</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minWorkingHours">ชั่วโมงทำงานขั้นต่ำ</Label>
              <Input
                id="minWorkingHours"
                type="number"
                value={timeSettings.minWorkingHours}
                onChange={(e) => handleTimeSettingChange('minWorkingHours', parseInt(e.target.value))}
                placeholder="4"
              />
              <p className="text-xs text-gray-500">ชั่วโมงทำงานน้อยสุดที่ได้รับค่าจ้าง</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxWorkingHours">ชั่วโมงทำงานสูงสุด</Label>
              <Input
                id="maxWorkingHours"
                type="number"
                value={timeSettings.maxWorkingHours}
                onChange={(e) => handleTimeSettingChange('maxWorkingHours', parseInt(e.target.value))}
                placeholder="12"
              />
              <p className="text-xs text-gray-500">ชั่วโมงทำงานมากสุดต่อวัน</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Label htmlFor="autoDeductBreak" className="font-medium">หักเวลาพักอัตโนมัติ</Label>
              <p className="text-sm text-gray-500">หักเวลาพักกลางวันอัตโนมัติจากเวลาทำงาน</p>
            </div>
            <SimpleSwitch
              id="autoDeductBreak"
              defaultChecked={timeSettings.autoDeductBreak}
              onChange={(checked) => handleTimeSettingChange('autoDeductBreak', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-600" />
            การตั้งค่าการแจ้งเตือน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">การแจ้งเตือน</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <Label className="font-medium text-gray-900">แจ้งเตือนก่อนเริ่มกะ</Label>
                  <p className="text-sm text-gray-500 mt-1">แจ้งเตือนก่อนเริ่มงาน 15 นาที</p>
                </div>
                <SimpleSwitch
                  defaultChecked={timeSettings.notifyBeforeShift}
                  onChange={(checked) => handleTimeSettingChange('notifyBeforeShift', checked)}
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleSaveTimeSettings}
          >
            <Save className="w-4 h-4 mr-2" />
            บันทึกการตั้งค่า
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeSettingsTab;
