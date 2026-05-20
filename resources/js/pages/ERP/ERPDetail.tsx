// @ts-nocheck
import AppLayout from "@/layouts/app-layout";
import { useState, useEffect } from "react";

const breadcrumbs = [
    { title: "หน้าหลัก", href: "/dashboard" },
    { title: "ระบบบันทึกเวลาทำงาน", href: "/attendance" },
];

export default function AttendanceSystem() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [clockInTime, setClockInTime] = useState(null);
    const [workDuration, setWorkDuration] = useState("00:00:00");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState("personal");

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);
            setCurrentDate(now);

            // Calculate work duration if clocked in
            if (isClockedIn && clockInTime) {
                const diff = now - clockInTime;
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setWorkDuration(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [isClockedIn, clockInTime]);

    // Employee personal data
    const employeeData = {
        personalInfo: {
            id: "EMP-2024-001",
            name: "นายสมชาย ใจดี",
            position: "Senior Software Developer",
            department: "Technology Department",
            email: "somchai.j@company.com",
            phone: "+66 123 456 789",
            joinDate: "2022-03-15",
            status: "ปฏิบัติงาน",
            employmentType: "ประจำ",
            salary: 45000,
            bankAccount: "123-4-56789-0",
            socialSecurity: "1234567890123",
            taxId: "1234567890123",
            address: "123/456 ถนนสุขุมวิท กรุงเทพมหานคร 10110",
            emergencyContact: {
                name: "นางสมหญิง ใจดี",
                relationship: "คู่สมรส",
                phone: "+66 987 654 321"
            }
        },
        attendance: {
            present: 18,
            late: 2,
            absent: 1,
            overtime: 22.5,
            leaveUsed: 3,
            productivity: 94.5,
            attendanceRate: 95.2
        },
        leaveBalance: {
            sick: 10,
            personal: 7,
            vacation: 12,
            business: 5
        },
        performance: {
            averageHours: 8.2,
            punctuality: 88.5,
            productivity: 94.5,
            teamContribution: 92.0
        },
        timeOff: {
            upcoming: [
                {
                    date: "2024-02-10",
                    type: "ลาพักร้อน",
                    days: 2,
                    status: "approved",
                    reason: "พักผ่อนประจำปี"
                },
                {
                    date: "2024-02-15",
                    type: "ลากิจ",
                    days: 1,
                    status: "pending",
                    reason: "ธุระส่วนตัว"
                }
            ],
            holidays: [
                {
                    date: "2024-02-24",
                    name: "วันมาฆบูชา",
                    type: "วันหยุดนักขัตฤกษ์"
                },
                {
                    date: "2024-04-06",
                    name: "วันจักรี",
                    type: "วันหยุดนักขัตฤกษ์"
                },
                {
                    date: "2024-04-13",
                    name: "วันสงกรานต์",
                    type: "วันหยุดนักขัตฤกษ์"
                }
            ]
        }
    };

    // Recent activities
    const recentActivities = [
        { time: "08:15", action: "บันทึกเข้างาน", type: "checkin", status: "success", date: "2024-01-20" },
        { time: "12:00", action: "เริ่มพักเที่ยง", type: "break", status: "success", date: "2024-01-20" },
        { time: "13:05", action: "สิ้นสุดพักเที่ยง", type: "breakend", status: "late", date: "2024-01-20" },
        { time: "17:45", action: "บันทึกออกงาน", type: "checkout", status: "success", date: "2024-01-20" }
    ];

    const handleClockIn = () => {
        setIsClockedIn(true);
        setClockInTime(new Date());
    };

    const handleClockOut = () => {
        setIsClockedIn(false);
        setClockInTime(null);
        setWorkDuration("00:00:00");
    };

    // Calendar data for current month
    const calendarDays = Array.from({ length: 31 }, (_, i) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
        return {
            date: date,
            isToday: date.toDateString() === new Date().toDateString(),
            status: i % 7 === 0 ? "absent" : i % 5 === 0 ? "late" : "present"
        };
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 shadow-sm">
                    <div className="px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                                    {employeeData.personalInfo.name.split(' ').slice(1).map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">ระบบบันทึกเวลาทำงาน</h1>
                                    <p className="text-gray-600">{employeeData.personalInfo.name} • {employeeData.personalInfo.department}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-mono font-bold text-gray-900">
                                    {currentTime.toLocaleTimeString('th-TH', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </div>
                                <div className="text-gray-600">
                                    {currentTime.toLocaleDateString('th-TH', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="px-8 pt-8">
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-8">สถิติการทำงาน</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                                <div className="text-center">
                                    <div className="text-3xl font-bold mb-2">{employeeData.attendance.present}</div>
                                    <p className="text-sm font-medium opacity-90">การเข้างาน</p>
                                    <p className="text-xs opacity-80 mt-1">วัน</p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
                                <div className="text-center">
                                    <div className="text-3xl font-bold mb-2">{employeeData.attendance.late}</div>
                                    <p className="text-sm font-medium opacity-90">การมาสาย</p>
                                    <p className="text-xs opacity-80 mt-1">ครั้ง</p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
                                <div className="text-center">
                                    <div className="text-3xl font-bold mb-2">{employeeData.attendance.overtime}</div>
                                    <p className="text-sm font-medium opacity-90">โอที</p>
                                    <p className="text-xs opacity-80 mt-1">ชั่วโมง</p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                                <div className="text-center">
                                    <div className="text-3xl font-bold mb-2">{employeeData.attendance.absent}</div>
                                    <p className="text-sm font-medium opacity-90">ขาดงาน</p>
                                    <p className="text-xs opacity-80 mt-1">วัน</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content - 2 columns */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Tab Navigation */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => setActiveTab("personal")}
                                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                                                activeTab === "personal"
                                                    ? "bg-white text-blue-600 shadow-lg border border-blue-200"
                                                    : "text-gray-600 hover:bg-white hover:shadow-md"
                                            }`}
                                        >
                                            ข้อมูลส่วนตัว
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Personal Information Tab */}
                                    {activeTab === "personal" && (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {/* Basic Information */}
                                                <div className="space-y-4">
                                                    <h4 className="text-lg font-semibold text-gray-900">ข้อมูลพื้นฐาน</h4>
                                                    <div className="space-y-4">
                                                        {[
                                                            { label: "รหัสพนักงาน", value: employeeData.personalInfo.id },
                                                            { label: "ตำแหน่ง", value: employeeData.personalInfo.position },
                                                            { label: "แผนก", value: employeeData.personalInfo.department },
                                                            { label: "วันที่เริ่มงาน", value: new Date(employeeData.personalInfo.joinDate).toLocaleDateString('th-TH') },
                                                            { label: "ประเภทการจ้าง", value: employeeData.personalInfo.employmentType }
                                                        ].map((item, index) => (
                                                            <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                                                                <span className="text-gray-600 text-sm">{item.label}</span>
                                                                <span className="font-medium text-gray-900 text-sm text-right">{item.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Contact Information */}
                                                <div className="space-y-4">
                                                    <h4 className="text-lg font-semibold text-gray-900">ข้อมูลติดต่อ</h4>
                                                    <div className="space-y-4">
                                                        {[
                                                            { label: "อีเมล", value: employeeData.personalInfo.email },
                                                            { label: "โทรศัพท์", value: employeeData.personalInfo.phone },
                                                            { label: "ที่อยู่", value: employeeData.personalInfo.address }
                                                        ].map((item, index) => (
                                                            <div key={index} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-b-0">
                                                                <span className="text-gray-600 text-sm">{item.label}</span>
                                                                <span className="font-medium text-gray-900 text-sm text-right max-w-[200px] leading-relaxed">{item.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Financial Information */}
                                            <div className="space-y-4">
                                                <h4 className="text-lg font-semibold text-gray-900">ข้อมูลการเงิน</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                                                        <p className="text-sm font-medium opacity-90">เงินเดือน</p>
                                                        <p className="text-2xl font-bold mt-2">
                                                            {employeeData.personalInfo.salary.toLocaleString()}
                                                        </p>
                                                        <p className="text-xs opacity-80 mt-1">บาท/เดือน</p>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                                                        <p className="text-sm font-medium opacity-90">บัญชีธนาคาร</p>
                                                        <p className="text-lg font-bold mt-2">{employeeData.personalInfo.bankAccount}</p>
                                                        <p className="text-xs opacity-80 mt-1">เลขที่บัญชี</p>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                                                        <p className="text-sm font-medium opacity-90">ประกันสังคม</p>
                                                        <p className="text-lg font-bold mt-2">{employeeData.personalInfo.socialSecurity}</p>
                                                        <p className="text-xs opacity-80 mt-1">เลขประกันสังคม</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Emergency Contact */}
                                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
                                                <h4 className="text-lg font-semibold text-gray-900 mb-4">ผู้ติดต่อฉุกเฉิน</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <p className="text-gray-600 text-sm font-medium">ชื่อ</p>
                                                        <p className="font-semibold text-gray-900 mt-1">{employeeData.personalInfo.emergencyContact.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600 text-sm font-medium">ความสัมพันธ์</p>
                                                        <p className="font-semibold text-gray-900 mt-1">{employeeData.personalInfo.emergencyContact.relationship}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600 text-sm font-medium">โทรศัพท์</p>
                                                        <p className="font-semibold text-gray-900 mt-1">{employeeData.personalInfo.emergencyContact.phone}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Calendar View */}
                            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-bold text-gray-900">ปฏิทินการทำงาน</h3>
                                    <span className="text-gray-600 font-medium">
                                        {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="grid grid-cols-7 gap-2 mb-6">
                                    {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                                        <div key={day} className="text-center text-sm font-semibold text-gray-500 py-3">
                                            {day}
                                        </div>
                                    ))}
                                    {calendarDays.map((day, index) => (
                                        <div
                                            key={index}
                                            className={`h-12 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                                                day.isToday
                                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                                                    : day.status === 'present'
                                                    ? 'bg-green-100 text-green-800'
                                                    : day.status === 'late'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {day.date.getDate()}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-center space-x-6 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-green-100 rounded border border-green-300"></div>
                                        <span className="text-gray-600">เข้างาน</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-yellow-100 rounded border border-yellow-300"></div>
                                        <span className="text-gray-600">มาสาย</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-red-100 rounded border border-red-300"></div>
                                        <span className="text-gray-600">ขาดงาน</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Today's Status */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">สถานะวันนี้</h3>
                                <div className="space-y-4">
                                    {[
                                        { label: "สถานะการทำงาน", value: isClockedIn ? 'กำลังทำงาน' : 'ยังไม่เข้างาน', color: isClockedIn ? 'text-green-600' : 'text-red-600' },
                                        { label: "เวลาเข้างาน", value: clockInTime ? clockInTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-', color: 'text-gray-900' },
                                        { label: "เวลาออกงาน", value: '-', color: 'text-gray-900' },
                                        { label: "โอทีวันนี้", value: '0 ชม.', color: 'text-gray-900' }
                                    ].map((item, index) => (
                                        <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                                            <span className="text-gray-600 text-sm">{item.label}</span>
                                            <span className={`font-semibold text-sm ${item.color}`}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Leave Balance */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">สิทธิการลาคงเหลือ</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                <span className="text-lg">🏥</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">ลาป่วย</span>
                                        </div>
                                        <span className="text-2xl font-bold text-red-600">{employeeData.leaveBalance.sick}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 border border-purple-200">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <span className="text-lg">📝</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">ลากิจ</span>
                                        </div>
                                        <span className="text-2xl font-bold text-purple-600">{employeeData.leaveBalance.personal}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-200">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <span className="text-lg">🏖️</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">ลาพักร้อน</span>
                                        </div>
                                        <span className="text-2xl font-bold text-blue-600">{employeeData.leaveBalance.vacation}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                <span className="text-lg">💼</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">ลาพักกิจ</span>
                                        </div>
                                        <span className="text-2xl font-bold text-green-600">{employeeData.leaveBalance.business}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">กิจกรรมล่าสุด</h3>
                                <div className="space-y-4">
                                    {recentActivities.map((activity, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-xl">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                                                activity.status === 'success' ? 'bg-green-100' : 'bg-yellow-100'
                                            }`}>
                                                <span className={`text-xl ${
                                                    activity.status === 'success' ? 'text-green-600' : 'text-yellow-600'
                                                }`}>
                                                    {activity.type === 'checkin' ? '📍' :
                                                     activity.type === 'checkout' ? '🏠' :
                                                     activity.type === 'break' ? '🍽️' : '↩️'}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{activity.action}</p>
                                                <p className="text-gray-600 text-sm">{activity.time} น.</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
