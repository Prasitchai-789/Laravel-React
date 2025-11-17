// resources/js/pages/ERP/Index/ERPIndex.jsx
import AppLayout from "@/layouts/app-layout";
import { useState, useMemo } from "react";
import { usePage, router } from "@inertiajs/react";
import Header from "./components/Header";
import FilterSection from "./components/FilterSection";
import StatisticsSummary from "./components/StatisticsSummary";
import EmployeeList from "./components/EmployeeList";
import EmployeeDetailModal from "./components/EmployeeDetailModal";
import CalendarView from "./components/CalendarView";
import Pagination from "./components/Pagination";

export default function ERPIndex() {
    const { employees = {}, departments = [], filters = {} } = usePage().props; // ✅ default safe

    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [viewMode, setViewMode] = useState("list");
    const [selectedDayEmployees, setSelectedDayEmployees] = useState([]);

    // ใช้ filters จาก URL parameters
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [dateFilter, setDateFilter] = useState(filters.date || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "ทั้งหมด");
    const [departmentFilter, setDepartmentFilter] = useState(filters.department || "ทั้งหมด");
    const [shiftFilter, setShiftFilter] = useState(filters.shift || "ทั้งหมด");

    // ฟังก์ชันอัพเดท URL parameters เมื่อ filter เปลี่ยน
    const updateFilters = (newFilters) => {
        router.get('/erp', {
            ...(filters || {}),
            ...newFilters,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    // ฟังก์ชันเปลี่ยนหน้า
    const handlePageChange = (page) => {
        router.get('/erp', {
            ...(filters || {}),
            page
        }, {
            preserveState: true,
            replace: true
        });
    };

    // ฟังก์ชันเปลี่ยนจำนวนรายการต่อหน้า
    const handlePerPageChange = (newPerPage) => {
        router.get('/erp', {
            ...(filters || {}),
            page: 1,
            per_page: newPerPage
        }, {
            preserveState: true,
            replace: true
        });
    };

    // ฟังก์ชันเมื่อ filter เปลี่ยน
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        updateFilters({ search: value });
    };

    const handleDateChange = (value) => {
        setDateFilter(value);
        updateFilters({ date: value });
    };

    const handleStatusChange = (value) => {
        setStatusFilter(value);
        updateFilters({ status: value });
    };

    const handleDepartmentChange = (value) => {
        setDepartmentFilter(value);
        updateFilters({ department: value });
    };

    const handleShiftChange = (value) => {
        setShiftFilter(value);
        updateFilters({ shift: value });
    };

    // สร้างข้อมูลการเข้างานแบบสุ่มสำหรับปฏิทิน (ใช้ข้อมูลจาก backend)
    const attendanceData = useMemo(() => {
        if (!employees?.data) return [];

        const statuses = ["เข้างาน", "ลาป่วย", "ลากิจ", "มาสาย", "ขาดงาน"];
        const shifts = ["กะเช้า", "กะบ่าย", "กะดึก", "เต็มวัน"];

        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }

        const result = [];

        dates.forEach(date => {
            employees.data.forEach(emp => {
                const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                const randomShift = shifts[Math.floor(Math.random() * shifts.length)];
                const randomTimeIn = `0${Math.floor(Math.random() * 3) + 7}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
                const randomTimeOut = `1${Math.floor(Math.random() * 8) + 7}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;

                result.push({
                    EmpID: emp.EmpID,
                    EmpCode: emp.EmpCode,
                    EmpName: emp.EmpName,
                    Position: emp.Position,
                    DeptName: emp.DeptName,
                    date,
                    timeIn: randomTimeIn,
                    timeOut: randomTimeOut,
                    status: randomStatus,
                    shift: randomShift,
                    workHours: `${Math.floor(Math.random() * 4) + 7}.${Math.floor(Math.random() * 6)}`,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.EmpName)}&background=random&color=fff`,
                    lateMinutes: Math.floor(Math.random() * 60),
                    overtime: Math.floor(Math.random() * 3),
                    checkInLocation: "อาคาร A - ประตูหลัก",
                    checkOutLocation: "อาคาร A - ประตูหลัก"
                });
            });
        });

        return result;
    }, [employees]);

    // กรองข้อมูลพนักงานสำหรับปฏิทิน
    const filteredEmployeesForCalendar = useMemo(() => {
        if (!attendanceData) return [];

        let filtered = attendanceData;

        if (dateFilter) filtered = filtered.filter(emp => emp.date === dateFilter);
        if (statusFilter !== "ทั้งหมด") filtered = filtered.filter(emp => emp.status === statusFilter);
        if (departmentFilter !== "ทั้งหมด") filtered = filtered.filter(emp => emp.DeptName === departmentFilter);
        if (shiftFilter !== "ทั้งหมด") filtered = filtered.filter(emp => emp.shift === shiftFilter);

        return filtered;
    }, [attendanceData, dateFilter, statusFilter, departmentFilter, shiftFilter]);

    // สรุปสถิติ
    const stats = useMemo(() => {
        const total = employees?.total || 0;
        return {
            total,
            present: Math.floor(total * 0.85),
            late: Math.floor(total * 0.05),
            absent: Math.floor(total * 0.03),
            sickLeave: Math.floor(total * 0.04),
            personalLeave: Math.floor(total * 0.03),
            attendanceRate: total > 0 ? ((Math.floor(total * 0.85) / total) * 100).toFixed(1) : 0
        };
    }, [employees]);

    // รีเซ็ตฟิลเตอร์
    const resetFilters = () => {
        setSearchTerm("");
        setDateFilter("");
        setStatusFilter("ทั้งหมด");
        setDepartmentFilter("ทั้งหมด");
        setShiftFilter("ทั้งหมด");

        router.get('/erp', {
            per_page: filters.per_page || 10,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleCalendarDayClick = (dayEmployees) => {
        setSelectedDayEmployees(dayEmployees);
        if (dayEmployees.length > 0) setSelectedEmployee(dayEmployees[0]);
    };

    const filterProps = {
        searchTerm,
        setSearchTerm: handleSearchChange,
        dateFilter,
        setDateFilter: handleDateChange,
        statusFilter,
        setStatusFilter: handleStatusChange,
        departmentFilter,
        setDepartmentFilter: handleDepartmentChange,
        shiftFilter,
        setShiftFilter: handleShiftChange,
        departments: ["ทั้งหมด", ...(departments || [])],
        resetFilters,
        viewMode,
        setViewMode,
        perPage: employees?.per_page || 10,
        onPerPageChange: handlePerPageChange
    };

    return (
        <AppLayout breadcrumbs={[{ title: "Home", href: "/dashboard" }, { title: "ERP", href: "/ERPIndex" }]}>
            <div className="p-6 bg-gray-50 min-h-screen">
                <Header
                    totalEmployees={employees?.total || 0}
                    filteredEmployeesCount={employees?.data?.length || 0}
                    resetFilters={resetFilters}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                <FilterSection {...filterProps} />
                <StatisticsSummary stats={stats} />

                {viewMode === "list" ? (
                    <>
                        <EmployeeList employees={employees?.data || []} onViewDetail={setSelectedEmployee} />
                        {employees?.data?.length > 0 && (
                            <div className="mt-6">
                                <Pagination
                                    currentPage={employees.current_page || 1}
                                    totalPages={employees.last_page || 1}
                                    onPageChange={handlePageChange}
                                    totalItems={employees.total || 0}
                                    itemsPerPage={employees.per_page || 10}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <CalendarView employees={filteredEmployeesForCalendar} onEmployeeClick={handleCalendarDayClick} />
                )}

                {selectedEmployee && (
                    <EmployeeDetailModal
                        employee={selectedEmployee}
                        onClose={() => setSelectedEmployee(null)}
                        dayEmployees={selectedDayEmployees}
                        onNextEmployee={() => {
                            const currentIndex = selectedDayEmployees.findIndex(emp => emp.EmpCode === selectedEmployee.EmpCode);
                            const nextIndex = (currentIndex + 1) % selectedDayEmployees.length;
                            setSelectedEmployee(selectedDayEmployees[nextIndex]);
                        }}
                        onPrevEmployee={() => {
                            const currentIndex = selectedDayEmployees.findIndex(emp => emp.EmpCode === selectedEmployee.EmpCode);
                            const prevIndex = (currentIndex - 1 + selectedDayEmployees.length) % selectedDayEmployees.length;
                            setSelectedEmployee(selectedDayEmployees[prevIndex]);
                        }}
                        hasMultipleEmployees={selectedDayEmployees.length > 1}
                    />
                )}
            </div>
        </AppLayout>
    );
}
