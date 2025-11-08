// import React, { useState } from "react";
// import AppLayout from "@/layouts/app-layout";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { ArrowLeft, History, Plus } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// export default function CreateOT() {
//   const navigate = useNavigate();

//   const [shifts] = useState([
//     {
//       id: 1,
//       department: "it",
//       departmentName: "ฝ่าย IT",
//       shiftName: "กะ A",
//       timeRange: "กลางวัน",
//       startTime: "08:00",
//       endTime: "16:00",
//       breakStart: "12:00",
//       breakEnd: "13:00",
//       totalHours: 8,
//       employees: 24,
//       status: "active",
//       overtimeAllowed: true,
//       holidays: [],
//     },
//     {
//       id: 2,
//       department: "store",
//       departmentName: "คลังสินค้า",
//       shiftName: "กะ B",
//       timeRange: "บ่ายถึงดึก",
//       startTime: "16:00",
//       endTime: "00:00",
//       breakStart: "20:00",
//       breakEnd: "20:30",
//       totalHours: 8,
//       employees: 18,
//       status: "active",
//       overtimeAllowed: true,
//       holidays: [],
//     },
//   ]);

//   const [employees] = useState([
//     {
//       id: "EMP001",
//       name: "สมชาย ใจดี",
//       department: "it",
//       departmentName: "ฝ่าย IT",
//       baseSalary: 15000,
//     },
//     {
//       id: "EMP002",
//       name: "สุนิสา มาดี",
//       department: "store",
//       departmentName: "คลังสินค้า",
//       baseSalary: 16000,
//     },
//     {
//       id: "EMP003",
//       name: "ประยุทธ ทำงาน",
//       department: "production",
//       departmentName: "ฝ่ายผลิต",
//       baseSalary: 17000,
//     },
//   ]);

//   const handleSubmitRequest = (requestData: any) => {
//     console.log("บันทึกการทำโอที:", requestData);
//     alert("บันทึกการทำโอทีเรียบร้อยแล้ว");
//     navigate("/overtime");
//   };

//   return (
//     <AppLayout title="บันทึกการทำโอทีใหม่">
//       <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//           <div className="flex items-center gap-4">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => navigate("/overtime")}
//               className="flex items-center gap-2"
//             >
//               <ArrowLeft className="w-4 h-4" />
//               กลับ
//             </Button>
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">
//                 บันทึกการทำโอทีใหม่
//               </h1>
//               <p className="text-gray-600 mt-2">
//                 บันทึกการทำงานล่วงเวลาของพนักงาน
//               </p>
//             </div>
//           </div>
//           <div className="flex gap-2">
//             <Button
//               variant="outline"
//               className="flex items-center gap-2"
//               onClick={() => navigate("/overtime/history")}
//             >
//               <History className="w-4 h-4" />
//               ดูประวัติโอที
//             </Button>
//           </div>
//         </div>

//         {/* Form Section */}
//         <OvertimeForm
//           shifts={shifts}
//           employees={employees}
//           onSubmitRequest={handleSubmitRequest}
//         />

//         {/* Suggestion Section */}
//         <Card className="border border-blue-100 bg-blue-50">
//           <CardHeader className="pb-3">
//             <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
//               <Plus className="w-5 h-5" />
//               คำแนะนำการบันทึกโอที
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <ul className="space-y-2 text-sm text-blue-700">
//               <li>• เลือกพนักงานและกะการทำงานที่ต้องการบันทึกโอที</li>
//               <li>
//                 • ระบบจะคำนวณเวลาสิ้นสุดอัตโนมัติจากเวลาเริ่มต้นและจำนวนชั่วโมง
//               </li>
//               <li>
//                 • ประเภทโอทีจะถูกคำนวณอัตโนมัติตามวันที่และช่วงเวลา
//               </li>
//               <li>• ระบุเหตุผลการทำโอทีให้ชัดเจน</li>
//             </ul>
//           </CardContent>
//         </Card>
//       </div>
//     </AppLayout>
//   );
// }

// /* ---------------------------
//    🔹 Subcomponent: Overtime Form
// --------------------------- */
// function OvertimeForm({
//   shifts,
//   employees,
//   onSubmitRequest,
// }: {
//   shifts: any[];
//   employees: any[];
//   onSubmitRequest: (data: any) => void;
// }) {
//   const [employee, setEmployee] = useState("");
//   const [shift, setShift] = useState("");
//   const [hours, setHours] = useState(2);
//   const [reason, setReason] = useState("");

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSubmitRequest({ employee, shift, hours, reason });
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-100"
//     >
//       <div>
//         <label className="block text-gray-700 mb-1">พนักงาน</label>
//         <select
//           value={employee}
//           onChange={(e) => setEmployee(e.target.value)}
//           className="w-full border rounded-md p-2"
//         >
//           <option value="">-- เลือกพนักงาน --</option>
//           {employees.map((emp) => (
//             <option key={emp.id} value={emp.id}>
//               {emp.name} ({emp.departmentName})
//             </option>
//           ))}
//         </select>
//       </div>

//       <div>
//         <label className="block text-gray-700 mb-1">กะการทำงาน</label>
//         <select
//           value={shift}
//           onChange={(e) => setShift(e.target.value)}
//           className="w-full border rounded-md p-2"
//         >
//           <option value="">-- เลือกกะ --</option>
//           {shifts.map((s) => (
//             <option key={s.id} value={s.id}>
//               {s.shiftName} ({s.timeRange})
//             </option>
//           ))}
//         </select>
//       </div>

//       <div>
//         <label className="block text-gray-700 mb-1">จำนวนชั่วโมง OT</label>
//         <input
//           type="number"
//           min="1"
//           value={hours}
//           onChange={(e) => setHours(Number(e.target.value))}
//           className="w-full border rounded-md p-2"
//         />
//       </div>

//       <div>
//         <label className="block text-gray-700 mb-1">เหตุผลการทำโอที</label>
//         <textarea
//           value={reason}
//           onChange={(e) => setReason(e.target.value)}
//           rows={3}
//           className="w-full border rounded-md p-2"
//         ></textarea>
//       </div>

//       <Button type="submit" className="w-full">
//         บันทึกโอที
//       </Button>
//     </form>
//   );
// }
