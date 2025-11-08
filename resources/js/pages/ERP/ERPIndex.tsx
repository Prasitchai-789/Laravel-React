import AppLayout from "@/layouts/app-layout";
import { useState, useEffect } from "react";

const breadcrumbs = [
    { title: "Home", href: "/dashboard" },
    { title: "ERP", href: "/ERPIndex" },
];

// Mock data for demonstration
const departments = [
    { id: "all", name: "ทั้งหมด" },
    { id: "it", name: "ฝ่ายไอที" },
    { id: "finance", name: "ฝ่ายการเงิน" },
    { id: "sales", name: "ฝ่ายขาย" },
    { id: "hr", name: "ฝ่ายบุคคล" },
    { id: "marketing", name: "ฝ่ายการตลาด" }
];

// Mock employee data with daily attendance and OT
const generateEmployeeData = (selectedDepartment, selectedDate) => {
    const employees = {
        it: [
            {
                id: 1,
                name: "สมชาย ใจดี",
                position: "Developer",
                dailyRecords: [
                    { date: "2024-01-01", checkIn: "08:15", checkOut: "17:30", overtime: 2.5, status: "present", project: "Project A" },
                    { date: "2024-01-02", checkIn: "08:00", checkOut: "18:00", overtime: 3.0, status: "present", project: "Project A" },
                    { date: "2024-01-03", checkIn: "08:10", checkOut: "17:45", overtime: 1.5, status: "present", project: "Project B" },
                    { date: "2024-01-04", checkIn: "09:30", checkOut: "18:15", overtime: 2.0, status: "late", project: "Project B" },
                    { date: "2024-01-05", checkIn: "-", checkOut: "-", overtime: 0, status: "absent", project: "-" },
                ]
            },
            {
                id: 2,
                name: "สุชาติ กล้าหาญ",
                position: "System Analyst",
                dailyRecords: [
                    { date: "2025-01-01", checkIn: "08:00", checkOut: "17:00", overtime: 0, status: "present", project: "Project C" },
                    { date: "2025-01-02", checkIn: "08:05", checkOut: "17:30", overtime: 0.5, status: "present", project: "Project C" },
                    { date: "2025-01-03", checkIn: "09:15", checkOut: "18:00", overtime: 1.5, status: "late", project: "Project C" },
                    { date: "2025-01-04", checkIn: "08:00", checkOut: "17:00", overtime: 0, status: "present", project: "Project C" },
                    { date: "2025-03-11", checkIn: "08:10", checkOut: "19:00", overtime: 3.0, status: "present", project: "Project D" },
                ]
            },
            {
                id: 3,
                name: "พิมพา สวยงาม",
                position: "UX Designer",
                dailyRecords: [
                    { date: "2024-01-01", checkIn: "08:00", checkOut: "17:00", overtime: 0, status: "present", project: "Project E" },
                    { date: "2024-01-02", checkIn: "08:05", checkOut: "17:15", overtime: 0.25, status: "present", project: "Project E" },
                ]
            }
        ],
        finance: [
            {
                id: 4,
                name: "กนกวรรณ เงินทอง",
                position: "Accountant",
                dailyRecords: [
                    { date: "2024-01-01", checkIn: "08:05", checkOut: "17:15", overtime: 1.5, status: "present", project: "Monthly Report" },
                    { date: "2024-01-02", checkIn: "08:00", checkOut: "17:00", overtime: 0, status: "present", project: "Monthly Report" },
                    { date: "2024-01-03", checkIn: "08:30", checkOut: "17:45", overtime: 0.75, status: "late", project: "Audit" },
                ]
            },
            {
                id: 5,
                name: "ธนวัฒน์ รวยทรัพย์",
                position: "Financial Analyst",
                dailyRecords: [
                    { date: "2024-01-01", checkIn: "08:00", checkOut: "17:00", overtime: 0, status: "present", project: "Budget Analysis" },
                    { date: "2024-01-02", checkIn: "08:10", checkOut: "18:30", overtime: 3.0, status: "present", project: "Financial Report" },
                ]
            }
        ],
        sales: [
            {
                id: 6,
                name: "วีรศักดิ์ เก่งขาย",
                position: "Sales Manager",
                dailyRecords: [
                    { date: "2024-01-01", checkIn: "08:00", checkOut: "18:30", overtime: 4.5, status: "present", project: "Client Meeting" },
                    { date: "2024-01-02", checkIn: "08:10", checkOut: "17:45", overtime: 2.2, status: "present", project: "Sales Report" },
                ]
            },
            {
                id: 7,
                name: "อรุณี สวยสง่า",
                position: "Sales Executive",
                dailyRecords: [
                    { date: "2024-01-01", checkIn: "08:15", checkOut: "17:45", overtime: 1.5, status: "present", project: "Client Visit" },
                    { date: "2024-01-02", checkIn: "08:05", checkOut: "18:15", overtime: 2.0, status: "present", project: "Sales Presentation" },
                ]
            }
        ],
        hr: [
            {
                id: 8,
                name: "เพ็ญพิชชา ดูแลดี",
                position: "HR Manager",
                dailyRecords: [
                    { date: "2024-01-01", checkIn: "08:00", checkOut: "17:15", overtime: 1.8, status: "present", project: "Recruitment" },
                    { date: "2024-01-02", checkIn: "08:05", checkOut: "17:00", overtime: 0, status: "present", project: "Training" },
                ]
            }
        ],
        marketing: [
            {
                id: 9,
                name: "ธนาพร สร้างสรรค์",
                position: "Marketing Executive",
                dailyRecords: [
                    { date: "2024-01-01", checkIn: "08:20", checkOut: "18:00", overtime: 2.0, status: "late", project: "Campaign A" },
                    { date: "2024-01-02", checkIn: "08:00", checkOut: "17:30", overtime: 1.0, status: "present", project: "Campaign B" },
                ]
            }
        ]
    };

    // Filter records for selected date and ensure each employee has at least one record
    const filterRecordsByDate = (employeeList) => {
        return employeeList.map(employee => {
            const recordForDate = employee.dailyRecords.find(record => record.date === selectedDate);

            // If no record for selected date, create a default absent record
            if (!recordForDate) {
                return {
                    ...employee,
                    dailyRecords: [{
                        date: selectedDate,
                        checkIn: "-",
                        checkOut: "-",
                        overtime: 0,
                        status: "absent",
                        project: "-"
                    }]
                };
            }

            return {
                ...employee,
                dailyRecords: [recordForDate]
            };
        });
    };

    if (selectedDepartment === "all") {
        const allEmployees = Object.values(employees).flat();
        const filteredEmployees = filterRecordsByDate(allEmployees);

        return {
            employees: filteredEmployees,
            summary: {
                total: filteredEmployees.length,
                present: filteredEmployees.filter(emp =>
                    emp.dailyRecords[0]?.status === 'present'
                ).length,
                absent: filteredEmployees.filter(emp =>
                    emp.dailyRecords[0]?.status === 'absent'
                ).length,
                late: filteredEmployees.filter(emp =>
                    emp.dailyRecords[0]?.status === 'late'
                ).length,
                overtime: filteredEmployees.reduce((acc, emp) =>
                    acc + (emp.dailyRecords[0]?.overtime || 0), 0
                )
            }
        };
    } else {
        const deptEmployees = employees[selectedDepartment] || [];
        const filteredEmployees = filterRecordsByDate(deptEmployees);

        return {
            employees: filteredEmployees,
            summary: {
                total: filteredEmployees.length,
                present: filteredEmployees.filter(emp =>
                    emp.dailyRecords[0]?.status === 'present'
                ).length,
                absent: filteredEmployees.filter(emp =>
                    emp.dailyRecords[0]?.status === 'absent'
                ).length,
                late: filteredEmployees.filter(emp =>
                    emp.dailyRecords[0]?.status === 'late'
                ).length,
                overtime: filteredEmployees.reduce((acc, emp) =>
                    acc + (emp.dailyRecords[0]?.overtime || 0), 0
                )
            }
        };
    }
};

export default function ERPIndex() {
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        // Simulate API call
        const mockData = generateEmployeeData(selectedDepartment, selectedDate);
        setData(mockData);
    }, [selectedDepartment, selectedDate]);

    // Filter employees based on search term
    const filteredEmployees = data?.employees?.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (!data) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="p-6 bg-gray-50 min-h-screen">
                    <div className="animate-pulse">Loading...</div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">ระบบจัดการพนักงาน</h1>
                        <div className="text-sm text-gray-500 mt-1">
                            ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH')}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <input
                            type="text"
                            placeholder="ค้นหาพนักงาน..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-0 focus:ring-0 focus:outline-none bg-transparent"
                        />
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                        {/* Department Filter */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ฝ่าย
                            </label>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-colors"
                            >
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                วันที่
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-colors"
                            />
                        </div>

                        {/* Reset Button */}
                        <div>
                            <button
                                onClick={() => {
                                    setSelectedDepartment("all");
                                    setSelectedDate(new Date().toISOString().split('T')[0]);
                                    setSearchTerm("");
                                }}
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                รีเซ็ต
                            </button>
                        </div>
                    </div>
                </div>

                {/* Overall Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-sm p-6 text-center border border-blue-200">
                        <div className="text-2xl font-bold text-blue-700">{data.summary.total}</div>
                        <div className="text-sm text-blue-600 font-medium">พนักงานทั้งหมด</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-sm p-6 text-center border border-green-200">
                        <div className="text-2xl font-bold text-green-700">{data.summary.present}</div>
                        <div className="text-sm text-green-600 font-medium">มา work</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-sm p-6 text-center border border-red-200">
                        <div className="text-2xl font-bold text-red-700">{data.summary.absent}</div>
                        <div className="text-sm text-red-600 font-medium">ขาด</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-sm p-6 text-center border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-700">{data.summary.late}</div>
                        <div className="text-sm text-yellow-600 font-medium">สาย</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-sm p-6 text-center border border-purple-200">
                        <div className="text-2xl font-bold text-purple-700">{data.summary.overtime.toFixed(1)}h</div>
                        <div className="text-sm text-purple-600 font-medium">OT รวม</div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl shadow-sm p-6 text-center border border-indigo-200">
                        <div className="text-2xl font-bold text-indigo-700">
                            {data.summary.total > 0 ? ((data.summary.present / data.summary.total) * 100).toFixed(1) : 0}%
                        </div>
                        <div className="text-sm text-indigo-600 font-medium">อัตราการมา work</div>
                    </div>
                </div>

                {/* Employee Daily Records Table */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-2 md:mb-0">
                            รายการเข้างานและ OT
                            {selectedDepartment !== "all" && ` - ${departments.find(d => d.id === selectedDepartment)?.name}`}
                        </h2>
                        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">
                            วันที่ {new Date(selectedDate).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                            })}
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">ชื่อพนักงาน</th>
                                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">ตำแหน่ง</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">เข้างาน</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">ออกงาน</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">OT (ชม.)</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">โปรเจค</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">สถานะ</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees && filteredEmployees.length > 0 ? (
                                    filteredEmployees.map((employee, empIndex) => {
                                        const record = employee.dailyRecords?.[0];

                                        // Safe check for record existence
                                        if (!record) {
                                            return (
                                                <tr
                                                    key={`${employee.id}-no-record`}
                                                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                                        empIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                    }`}
                                                >
                                                    <td className="py-4 px-4 font-medium text-gray-800">
                                                        {employee.name}
                                                    </td>
                                                    <td className="py-4 px-4 text-gray-700">
                                                        {employee.position}
                                                    </td>
                                                    <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                                                        ไม่มีข้อมูลสำหรับวันที่เลือก
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return (
                                            <tr
                                                key={`${employee.id}-${record.date}`}
                                                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                                    empIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                }`}
                                            >
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                                                            {employee.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-800">{employee.name}</div>
                                                            <div className="text-xs text-gray-500">ID: {employee.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-gray-700">
                                                    {employee.position}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className={`inline-flex items-center justify-center w-16 h-8 rounded-full font-medium ${
                                                        record.checkIn === '-'
                                                            ? 'bg-red-100 text-red-700'
                                                            : record.checkIn > '09:00'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-green-100 text-green-700'
                                                    }`}>
                                                        {record.checkIn}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="inline-flex items-center justify-center w-16 h-8 rounded-full font-medium bg-gray-100 text-gray-700">
                                                        {record.checkOut}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className={`inline-flex items-center justify-center w-16 h-8 rounded-full font-bold ${
                                                        record.overtime > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {record.overtime}h
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium max-w-32 truncate">
                                                        {record.project}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                        record.status === 'present'
                                                            ? 'bg-green-100 text-green-800'
                                                            : record.status === 'late'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {record.status === 'present' ? 'มา work' : record.status === 'late' ? 'สาย' : 'ขาด'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <div className="flex justify-center space-x-2">
                                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                            </svg>
                                                            ดู
                                                        </button>
                                                        <button className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                            </svg>
                                                            แก้ไข
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="py-8 px-4 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                <div className="text-lg font-medium text-gray-500 mb-1">ไม่พบข้อมูลพนักงาน</div>
                                                <div className="text-sm text-gray-400">ลองเปลี่ยนเงื่อนไขการค้นหาหรือวันที่</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center text-sm text-gray-600 gap-4">
                        <div className="bg-gray-50 px-4 py-2 rounded-lg">
                            แสดง {filteredEmployees.length} จาก {data.employees?.length || 0} คน
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                <span>มา work: <span className="font-bold text-green-600">{data.summary.present}</span></span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                <span>สาย: <span className="font-bold text-yellow-600">{data.summary.late}</span></span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                <span>ขาด: <span className="font-bold text-red-600">{data.summary.absent}</span></span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                                <span>OT รวม: <span className="font-bold text-purple-600">{data.summary.overtime.toFixed(1)} ชั่วโมง</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">การดำเนินการด่วน</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center shadow-sm hover:shadow-md">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            ส่งออกรายงาน
                        </button>
                        <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center shadow-sm hover:shadow-md">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            อนุมัติ OT
                        </button>
                        <button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center shadow-sm hover:shadow-md">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                            ดูรายงานสรุป
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
