// import React, { useState, useMemo } from "react";
// import EmployeeSearchSelect from "./employee-search-select";
// import { thaiDateUtils } from "@/utils/thai-date-utils";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Plus, Save, Clock, Calendar } from "lucide-react";

// const OvertimeRequestForm = ({ shifts, employees, onSubmitRequest }) => {
//   const [formData, setFormData] = useState({
//     employeeId: "",
//     shiftId: "",
//     date: new Date().toISOString().split('T')[0],
//     startTime: "16:30",
//     endTime: "18:30",
//     plannedHours: 2,
//     reason: "",
//     type: "auto"
//   });

//   // คำนวณเวลาสิ้นสุดจากเวลาเริ่มต้นและจำนวนชั่วโมง
//   const calculateEndTime = (startTime, hours) => {
//     const [startHour, startMinute] = startTime.split(':').map(Number);
//     const startTotalMinutes = startHour * 60 + startMinute;
//     const endTotalMinutes = startTotalMinutes + (hours * 60);
//     let endHour = Math.floor(endTotalMinutes / 60) % 24;
//     const endMinute = endTotalMinutes % 60;
//     return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
//   };

//   // คำนวณประเภทโอทีอัตโนมัติ
//   const calculateOvertimeType = (date, startTime, endTime) => {
//     if (thaiDateUtils.isHoliday(date)) {
//       return "holiday";
//     } else if (thaiDateUtils.isWeekend(date)) {
//       return "weekend";
//     } else if (thaiDateUtils.isNightShift(startTime, endTime)) {
//       return "night";
//     } else {
//       return "normal";
//     }
//   };

//   const handleStartTimeChange = (value) => {
//     const newEndTime = calculateEndTime(value, formData.plannedHours);
//     const newType = calculateOvertimeType(formData.date, value, newEndTime);

//     setFormData(prev => ({
//       ...prev,
//       startTime: value,
//       endTime: newEndTime,
//       type: prev.type === "auto" ? "auto" : newType
//     }));
//   };

//   const handleHoursChange = (hours) => {
//     const newEndTime = calculateEndTime(formData.startTime, parseFloat(hours));
//     const newType = calculateOvertimeType(formData.date, formData.startTime, newEndTime);

//     setFormData(prev => ({
//       ...prev,
//       plannedHours: parseFloat(hours),
//       endTime: newEndTime,
//       type: prev.type === "auto" ? "auto" : newType
//     }));
//   };

//   const handleDateChange = (date) => {
//     const newType = calculateOvertimeType(date, formData.startTime, formData.endTime);

//     setFormData(prev => ({
//       ...prev,
//       date,
//       type: prev.type === "auto" ? "auto" : newType
//     }));
//   };

//   const handleTypeChange = (type) => {
//     setFormData(prev => ({
//       ...prev,
//       type
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (!formData.employeeId || !formData.shiftId) {
//       alert("กรุณาเลือกพนักงานและกะการทำงาน");
//       return;
//     }

//     // คำนวณประเภทโอทีสุดท้ายก่อนบันทึก
//     let finalType = formData.type;
//     if (formData.type === "auto") {
//       finalType = calculateOvertimeType(formData.date, formData.startTime, formData.endTime);
//     }

//     // ค้นหาข้อมูลพนักงานและกะ
//     const employee = employees.find(emp => emp.id === formData.employeeId);
//     const shift = shifts.find(s => s.id === formData.shiftId);

//     const requestData = {
//       id: Date.now(),
//       employeeId: formData.employeeId,
//       employeeName: employee?.name || "",
//       department: employee?.department || "",
//       departmentName: employee?.departmentName || "",
//       shiftId: formData.shiftId,
//       shiftName: shift?.shiftName || "",
//       date: formData.date,
//       startTime: formData.startTime,
//       endTime: formData.endTime,
//       plannedHours: parseFloat(formData.plannedHours),
//       reason: formData.reason,
//       status: "approved",
//       type: finalType,
//       rate: getOvertimeRate(finalType),
//       overtimePay: 0,
//       createdAt: new Date().toISOString(),
//       approvedAt: new Date().toISOString(),
//       thaiDate: thaiDateUtils.formatThaiDate(formData.date),
//       thaiDay: thaiDateUtils.getThaiDayName(formData.date)
//     };

//     onSubmitRequest(requestData);

//     // รีเซ็ตฟอร์ม
//     setFormData({
//       employeeId: "",
//       shiftId: "",
//       date: new Date().toISOString().split('T')[0],
//       startTime: "16:30",
//       endTime: "18:30",
//       plannedHours: 2,
//       reason: "",
//       type: "auto"
//     });
//   };

//   // ฟังก์ชันคำนวณอัตราค่าโอที
//   const getOvertimeRate = (type) => {
//     const rates = {
//       'normal': 1.5,
//       'night': 1.25,
//       'weekend': 2.0,
//       'holiday': 3.0
//     };
//     return rates[type] || 1.5;
//   };

//   const getTypeInfo = (type) => {
//     const types = {
//       'auto': { text: 'คำนวณอัตโนมัติ', color: 'text-gray-600', bg: 'bg-gray-50' },
//       'normal': { text: 'โอทีปกติ', color: 'text-blue-600', bg: 'bg-blue-50' },
//       'night': { text: 'โอทีกะดึก', color: 'text-purple-600', bg: 'bg-purple-50' },
//       'weekend': { text: 'โอทีวันหยุด', color: 'text-orange-600', bg: 'bg-orange-50' },
//       'holiday': { text: 'โอทีวันนักขัตฤกษ์', color: 'text-red-600', bg: 'bg-red-50' }
//     };
//     return types[type] || types.normal;
//   };

//   const typeInfo = getTypeInfo(formData.type);
//   const calculatedType = calculateOvertimeType(formData.date, formData.startTime, formData.endTime);
//   const calculatedTypeInfo = getTypeInfo(calculatedType);

//   return (
//     <Card className="border border-blue-200 shadow-sm">
//       <CardHeader className="bg-blue-50 border-b border-blue-200">
//         <CardTitle className="text-xl font-semibold text-blue-800 flex items-center gap-2">
//           <Plus className="w-5 h-5" />
//           บันทึกการทำโอที
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="p-6">
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="employee">พนักงาน</Label>
//               <EmployeeSearchSelect
//                 employees={employees}
//                 value={formData.employeeId}
//                 onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
//                 placeholder="ค้นหาและเลือกพนักงาน"
//                 required
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="shift">กะการทำงาน</Label>
//               <Select
//                 value={formData.shiftId}
//                 onValueChange={(value) => setFormData(prev => ({ ...prev, shiftId: value }))}
//                 required
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="เลือกกะ" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {shifts
//                     .filter(shift => shift.status === "active" && shift.overtimeAllowed)
//                     .map(shift => (
//                     <SelectItem key={shift.id} value={shift.id}>
//                       {shift.shiftName} ({shift.startTime} - {shift.endTime} น.)
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="date">วันที่ทำโอที</Label>
//               <div className="relative">
//                 <Input
//                   type="date"
//                   value={formData.date}
//                   onChange={(e) => handleDateChange(e.target.value)}
//                   required
//                 />
//                 <Calendar className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
//               </div>
//               <div className="text-xs text-gray-600 mt-1">
//                 {formData.date && (
//                   <>
//                     {thaiDateUtils.formatThaiDate(formData.date)}
//                     <span className="ml-2">({thaiDateUtils.getThaiDayName(formData.date)})</span>
//                     {thaiDateUtils.isHoliday(formData.date) && (
//                       <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 text-xs">
//                         วันหยุดนักขัตฤกษ์
//                       </Badge>
//                     )}
//                   </>
//                 )}
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="startTime">เวลาเริ่มโอที</Label>
//               <Input
//                 type="time"
//                 value={formData.startTime}
//                 onChange={(e) => handleStartTimeChange(e.target.value)}
//                 required
//               />
//               <div className="text-xs text-gray-600">
//                 {thaiDateUtils.formatThaiTime(formData.startTime)}
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="endTime">เวลาสิ้นสุดโอที</Label>
//               <Input
//                 type="time"
//                 value={formData.endTime}
//                 disabled
//                 className="bg-gray-100 text-gray-600"
//               />
//               <div className="text-xs text-gray-600">
//                 {thaiDateUtils.formatThaiTime(formData.endTime)}
//                 <span className="text-gray-400 ml-1">(คำนวณอัตโนมัติ)</span>
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="plannedHours">จำนวนชั่วโมงที่ทำ</Label>
//               <div className="flex items-center gap-2">
//                 <Input
//                   type="number"
//                   step="0.5"
//                   min="0.5"
//                   max="12"
//                   value={formData.plannedHours}
//                   onChange={(e) => handleHoursChange(e.target.value)}
//                   className="flex-1"
//                 />
//                 <span className="text-gray-600 whitespace-nowrap">ชั่วโมง</span>
//               </div>
//               <p className="text-xs text-gray-500">
//                 เวลาทำโอที: {thaiDateUtils.formatThaiTime(formData.startTime)} - {thaiDateUtils.formatThaiTime(formData.endTime)}
//               </p>
//             </div>

//             <div className="space-y-2">
//               <Label>ประเภทโอที</Label>
//               <Select
//                 value={formData.type}
//                 onValueChange={handleTypeChange}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="เลือกประเภทโอที" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="auto">
//                     <div className="flex flex-col">
//                       <span>คำนวณอัตโนมัติ</span>
//                       <span className="text-xs text-gray-500">
//                         ({calculatedTypeInfo.text} - อัตรา {getOvertimeRate(calculatedType)} เท่า)
//                       </span>
//                     </div>
//                   </SelectItem>
//                   <SelectItem value="normal">
//                     <div className="flex flex-col">
//                       <span>โอทีปกติ</span>
//                       <span className="text-xs text-gray-500">อัตรา 1.5 เท่า</span>
//                     </div>
//                   </SelectItem>
//                   <SelectItem value="night">
//                     <div className="flex flex-col">
//                       <span>โอทีกะดึก</span>
//                       <span className="text-xs text-gray-500">อัตรา 1.25 เท่า</span>
//                     </div>
//                   </SelectItem>
//                   <SelectItem value="weekend">
//                     <div className="flex flex-col">
//                       <span>โอทีวันหยุด</span>
//                       <span className="text-xs text-gray-500">อัตรา 2.0 เท่า</span>
//                     </div>
//                   </SelectItem>
//                   <SelectItem value="holiday">
//                     <div className="flex flex-col">
//                       <span>โอทีวันนักขัตฤกษ์</span>
//                       <span className="text-xs text-gray-500">อัตรา 3.0 เท่า</span>
//                     </div>
//                   </SelectItem>
//                 </SelectContent>
//               </Select>

//               {formData.type === "auto" && (
//                 <div className={`p-2 rounded-lg border ${calculatedTypeInfo.bg} mt-2`}>
//                   <div className={`text-sm font-medium ${calculatedTypeInfo.color}`}>
//                     คำนวณได้: {calculatedTypeInfo.text}
//                   </div>
//                   <div className="text-xs text-gray-600 mt-1">
//                     อัตราค่าโอที: {getOvertimeRate(calculatedType)} เท่า
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="reason">เหตุผล/รายละเอียด</Label>
//             <Input
//               placeholder="ระบุเหตุผลการทำโอที..."
//               value={formData.reason}
//               onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
//               required
//             />
//           </div>

//           <div className="flex gap-3 pt-4">
//             <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
//               <Save className="w-4 h-4 mr-2" />
//               บันทึกการทำโอที
//             </Button>
//             <Button
//               type="button"
//               variant="outline"
//               className="flex items-center gap-2"
//               onClick={() => {
//                 setFormData({
//                   employeeId: "",
//                   shiftId: "",
//                   date: new Date().toISOString().split('T')[0],
//                   startTime: "16:30",
//                   endTime: "18:30",
//                   plannedHours: 2,
//                   reason: "",
//                   type: "auto"
//                 });
//               }}
//             >
//               <Clock className="w-4 h-4" />
//               ล้างฟอร์ม
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   );
// };

// export default OvertimeRequestForm;
