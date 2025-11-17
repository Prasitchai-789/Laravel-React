// components/CalendarView.tsx
import { useState, useMemo } from "react";
import CalendarModal from "./CalendarModal/CalendarModal";

interface Employee {
    id: number;
    name: string;
    date: string; // YYYY-MM-DD
    status: string;
}

interface CalendarViewProps {
    employees?: Employee[];
    onEmployeeClick: (emps: Employee[]) => void;
}

interface DayData {
    date: Date;
    dateString: string;
    day: number;
    employees: Employee[];
    employeesByStatus: Record<string, Employee[]>;
    statusCount: Record<string, number>;
    totalEmployees: number;
}

export default function CalendarView({ employees = [], onEmployeeClick }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
    const [modalDayData, setModalDayData] = useState<DayData | null>(null);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);

    // ▶️ เปลี่ยนเดือน
    const navigateMonth = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    // ▶️ สร้างข้อมูลปฏิทิน
    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();

        const days: (DayData | null)[] = [];

        // ช่องว่างก่อนวันแรกของเดือน
        for (let i = 0; i < startDay; i++) days.push(null);

        // วันในเดือน
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split("T")[0];
            const dayEmployees = employees.filter(emp => emp.date === dateString);

            const employeesByStatus: Record<string, Employee[]> = {
                "เข้างาน": dayEmployees.filter(e => e.status === "เข้างาน"),
                "มาสาย": dayEmployees.filter(e => e.status === "มาสาย"),
                "ขาดงาน": dayEmployees.filter(e => e.status === "ขาดงาน"),
                "ลาป่วย": dayEmployees.filter(e => e.status === "ลาป่วย"),
                "ลากิจ": dayEmployees.filter(e => e.status === "ลากิจ"),
            };

            const statusCount: Record<string, number> = {};
            Object.entries(employeesByStatus).forEach(([status, arr]) => {
                statusCount[status] = arr.length;
            });

            days.push({
                date,
                dateString,
                day,
                employees: dayEmployees,
                employeesByStatus,
                statusCount,
                totalEmployees: dayEmployees.length,
            });
        }
        return days;
    }, [currentDate, employees]);

    // ▶️ แปลเดือน-ปี ไทย
    const monthYear = currentDate.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
    });
    const weekDays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

    // ▶️ สี / ไอคอน
    const getStatusColor = (status: string) =>
        ({
            "เข้างาน": "bg-emerald-100 border-emerald-300 text-emerald-800",
            "มาสาย": "bg-amber-100 border-amber-300 text-amber-800",
            "ขาดงาน": "bg-rose-100 border-rose-300 text-rose-800",
            "ลาป่วย": "bg-blue-100 border-blue-300 text-blue-800",
            "ลากิจ": "bg-violet-100 border-violet-300 text-violet-800",
        }[status] || "bg-gray-100 border-gray-300 text-gray-800");

    const getStatusIcon = (status: string) =>
        ({
            "เข้างาน": "✅",
            "มาสาย": "⏰",
            "ขาดงาน": "❌",
            "ลาป่วย": "🏥",
            "ลากิจ": "📅",
        }[status] || "❓");

    // ▶️ เมื่อคลิกวันที่
    const handleDayClick = (day: DayData | null) => {
        if (day && day.employees.length > 0) {
            setModalDayData(day);
            setShowEmployeeModal(true);
        }
    };

    // ▶️ เปลี่ยนสถานะ
    const handleStatusChange = (empId: number, newStatus: string) => {
        console.log(`อัพเดทพนักงาน ${empId} เป็นสถานะ: ${newStatus}`);
    };

    const handleSaveAll = () => {
        console.log("บันทึกข้อมูลทั้งหมด");
        alert("บันทึกข้อมูลเรียบร้อยแล้ว");
    };

    return (
        <>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-gray-800">ปฏิทินการเข้างาน</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{monthYear}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            {["month", "week", "day"].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode as "month" | "week" | "day")}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                        viewMode === mode ? "bg-white text-gray-800 shadow-sm" : "text-gray-600 hover:text-gray-800"
                                    }`}
                                >
                                    {mode === "month" ? "เดือน" : mode === "week" ? "สัปดาห์" : "วัน"}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => navigateMonth(-1)}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                วันนี้
                            </button>
                            <button
                                onClick={() => navigateMonth(1)}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Calendar */}
                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                    {weekDays.map(day => (
                        <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700">
                            {day}
                        </div>
                    ))}

                    {calendarData.map((day, index) => (
                        <div
                            key={index}
                            onClick={() => handleDayClick(day)}
                            className={`bg-white min-h-[120px] p-2 transition-all ${
                                day ? "hover:bg-gray-50 cursor-pointer" : "bg-gray-50/50"
                            } ${day?.dateString === new Date().toISOString().split("T")[0] ? "ring-2 ring-blue-200" : ""}`}
                        >
                            {day && (
                                <>
                                    <div
                                        className={`text-sm font-medium mb-2 ${
                                            day.dateString === new Date().toISOString().split("T")[0] ? "text-blue-600" : "text-gray-700"
                                        }`}
                                    >
                                        {day.day}
                                    </div>

                                    <div className="space-y-1">
                                        {Object.entries(day.statusCount)
                                            .filter(([_, count]) => count > 0)
                                            .map(([status, count]) => (
                                                <div
                                                    key={status}
                                                    className={`flex items-center justify-between text-xs px-2 py-1 rounded border ${getStatusColor(status)}`}
                                                >
                                                    <span className="truncate flex items-center gap-1">
                                                        {getStatusIcon(status)}
                                                        <span className="hidden sm:inline">{status}</span>
                                                    </span>
                                                    <span className="font-medium">{count}</span>
                                                </div>
                                            ))}
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 text-center">
                                        {day.totalEmployees > 0 ? `${day.totalEmployees} คน` : "ไม่มีข้อมูล"}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ▶️ Modal แสดงพนักงาน */}
            {showEmployeeModal && modalDayData && (
                <CalendarModal
                    dayData={modalDayData}
                    onEmployeeClick={emp => {
                        onEmployeeClick([emp]);
                        setShowEmployeeModal(false);
                    }}
                    onClose={() => setShowEmployeeModal(false)}
                    onStatusChange={handleStatusChange}
                    onSaveAll={handleSaveAll}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                />
            )}
        </>
    );
}
