// EmployeeList.tsx
import EmployeeRow from "./EmployeeRow";

export default function EmployeeList({ employees, onViewDetail }) {
    const getStatusColor = (status) => ({
        "เข้างาน": "bg-emerald-50 text-emerald-700 border-emerald-200",
        "มาสาย": "bg-amber-50 text-amber-700 border-amber-200",
        "ขาดงาน": "bg-rose-50 text-rose-700 border-rose-200",
        "ลาป่วย": "bg-blue-50 text-blue-700 border-blue-200",
        "ลากิจ": "bg-violet-50 text-violet-700 border-violet-200",
    }[status] || "bg-gray-50 text-gray-700 border-gray-200");

    const getShiftColor = (shift) => ({
        "กะเช้า": "bg-sky-50 text-sky-700",
        "กะบ่าย": "bg-orange-50 text-orange-700",
        "กะดึก": "bg-indigo-50 text-indigo-700",
        "เต็มวัน": "bg-emerald-50 text-emerald-700",
    }[shift] || "bg-gray-50 text-gray-700");

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden transition-all duration-300 hover:shadow-md">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-gray-100/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 tracking-tight">รายชื่อพนักงาน</h2>
                        <p className="text-sm text-gray-600 mt-1">แสดงสถานะการทำงานและกะประจำวัน</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/60 px-3 py-1.5 rounded-lg border border-gray-200/50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{employees.length} คน</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="border-b border-gray-200/60 bg-gray-50/30">
                            {["พนักงาน", "ฝ่าย", "เวลาเข้างาน", "กะ", "สถานะ", "การดำเนินการ"].map((th, i) => (
                                <th
                                    key={i}
                                    className="text-left py-4 px-6 font-medium text-gray-700 text-sm uppercase tracking-wider"
                                >
                                    {th}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200/30">
                        {employees.length > 0 ? (
                            employees.map((emp, idx) => (
                                <tr
                                    key={emp.EmpID || idx}
                                    className="group hover:bg-gray-50/50 transition-all duration-200 border-b border-gray-200/30 last:border-b-0"
                                >
                                    <EmployeeRow
                                        employee={emp}
                                        onViewDetail={onViewDetail}
                                        getStatusColor={getStatusColor}
                                        getShiftColor={getShiftColor}
                                    />
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center py-16">
                                    <div className="flex flex-col items-center text-gray-400">
                                        <div className="relative mb-4">
                                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                                                <svg
                                                    className="w-8 h-8 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="1.5"
                                                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-lg font-medium text-gray-500 mb-2">ไม่พบข้อมูลพนักงาน</div>
                                        <div className="text-sm text-gray-400 max-w-xs text-center">
                                            ลองเปลี่ยนเงื่อนไขการค้นหาหรือปรับฟิลเตอร์เพื่อดูข้อมูล
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {employees.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200/60 bg-gray-50/30">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>แสดง {employees.length} รายการ</span>
                        <div className="flex items-center gap-4">
                            <span>อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
