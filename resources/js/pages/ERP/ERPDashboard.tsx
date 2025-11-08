import AppLayout from "@/layouts/app-layout";
import { useState, useRef, useEffect } from "react";

const breadcrumbs = [
    { title: "Home", href: "/dashboard" },
    { title: "OT Management", href: "/ot-dashboard" },
];

export default function OTDashboard() {
    const [selectedTab, setSelectedTab] = useState("pending");
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [selectedDateRange, setSelectedDateRange] = useState("all");
    const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const dateDropdownRef = useRef(null);
    const calendarRef = useRef(null);

    // Mock data for OT management system
    const otStats = {
        totalPending: 24,
        approvedThisMonth: 156,
        rejectedThisWeek: 8,
        totalOvertimeHours: 342,
        avgProcessingTime: "2.3",
        completionRate: 94.5,
    };

    const departments = [
        { id: "all", name: "All Departments", color: "bg-gray-500" },
        { id: "development", name: "Development", color: "bg-blue-500" },
        { id: "qa", name: "QA", color: "bg-green-500" },
        { id: "support", name: "Support", color: "bg-purple-500" },
        { id: "marketing", name: "Marketing", color: "bg-orange-500" },
        { id: "operations", name: "Operations", color: "bg-indigo-500" },
        { id: "design", name: "Design", color: "bg-pink-500" },
    ];

    const dateRanges = [
        { id: "all", name: "All Time", range: "ทั้งหมด" },
        { id: "today", name: "Today", range: "วันนี้" },
        { id: "yesterday", name: "Yesterday", range: "เมื่อวาน" },
        { id: "this_week", name: "This Week", range: "สัปดาห์นี้" },
        { id: "last_week", name: "Last Week", range: "สัปดาห์ที่แล้ว" },
        { id: "this_month", name: "This Month", range: "เดือนนี้" },
        { id: "last_month", name: "Last Month", range: "เดือนที่แล้ว" },
        { id: "custom", name: "Custom Range", range: "กำหนดเอง" },
    ];

    const pendingRequests = [
        {
            id: 1,
            employee: "John Doe",
            employeeId: "EMP001",
            department: "development",
            departmentName: "Development",
            position: "Senior Developer",
            date: "2024-01-15",
            startTime: "18:00",
            endTime: "21:00",
            hours: 3,
            reason: "Project deadline - Need to complete the payment module integration",
            priority: "high",
            project: "Payment System",
            requestedAt: "2024-01-14 09:30"
        },
        {
            id: 2,
            employee: "Jane Smith",
            employeeId: "EMP002",
            department: "qa",
            departmentName: "QA",
            position: "QA Engineer",
            date: "2024-01-15",
            startTime: "17:30",
            endTime: "20:30",
            hours: 3,
            reason: "Testing completion for release v2.1.0",
            priority: "medium",
            project: "Mobile App",
            requestedAt: "2024-01-14 10:15"
        },
        {
            id: 3,
            employee: "Robert Johnson",
            employeeId: "EMP003",
            department: "support",
            departmentName: "Support",
            position: "Support Specialist",
            date: "2024-01-16",
            startTime: "19:00",
            endTime: "22:00",
            hours: 3,
            reason: "Client emergency - System outage affecting multiple customers",
            priority: "high",
            project: "Production Support",
            requestedAt: "2024-01-15 14:20"
        },
        {
            id: 4,
            employee: "Emily Davis",
            employeeId: "EMP004",
            department: "marketing",
            departmentName: "Marketing",
            position: "Marketing Manager",
            date: "2024-01-14",
            startTime: "18:00",
            endTime: "20:00",
            hours: 2,
            reason: "Campaign launch preparation for new product",
            priority: "low",
            project: "Product Launch",
            requestedAt: "2024-01-13 16:45"
        }
    ];

    const approvedRequests = [
        {
            id: 5,
            employee: "Michael Brown",
            department: "development",
            departmentName: "Development",
            date: "2024-01-14",
            hours: 4,
            project: "API Integration",
            approvedBy: "Sarah Wilson",
            approvedAt: "2024-01-13 14:30"
        },
        {
            id: 6,
            employee: "David Miller",
            department: "operations",
            departmentName: "Operations",
            date: "2024-01-13",
            hours: 2,
            project: "System Maintenance",
            approvedBy: "Sarah Wilson",
            approvedAt: "2024-01-13 10:15"
        },
        {
            id: 7,
            employee: "Lisa Wang",
            department: "design",
            departmentName: "Design",
            date: "2024-01-12",
            hours: 3,
            project: "UI Revamp",
            approvedBy: "Sarah Wilson",
            approvedAt: "2024-01-12 16:45"
        }
    ];

    const departmentOT = [
        { department: "development", name: "Development", pending: 8, approved: 45, rejected: 3, totalHours: 167, color: "bg-blue-500" },
        { department: "qa", name: "QA", pending: 3, approved: 23, rejected: 1, totalHours: 89, color: "bg-green-500" },
        { department: "support", name: "Support", pending: 5, approved: 34, rejected: 2, totalHours: 102, color: "bg-purple-500" },
        { department: "marketing", name: "Marketing", pending: 2, approved: 12, rejected: 0, totalHours: 45, color: "bg-orange-500" },
        { department: "operations", name: "Operations", pending: 4, approved: 28, rejected: 1, totalHours: 78, color: "bg-indigo-500" },
        { department: "design", name: "Design", pending: 2, approved: 14, rejected: 1, totalHours: 32, color: "bg-pink-500" },
    ];

    const upcomingOT = [
        { id: 1, employee: "John Doe", department: "development", date: "2024-01-16", hours: 3, status: "approved", project: "Payment System" },
        { id: 2, employee: "Jane Smith", department: "qa", date: "2024-01-17", hours: 2, status: "approved", project: "Mobile App" },
        { id: 3, employee: "Mike Johnson", department: "operations", date: "2024-01-18", hours: 4, status: "approved", project: "Database Optimization" },
        { id: 4, employee: "Sarah Wilson", department: "design", date: "2024-01-19", hours: 3, status: "pending", project: "Team Management" },
    ];

    const quickStats = [
        {
            label: "Today's OT",
            value: "15",
            change: "+2",
            trend: "up",
            icon: "🕒"
        },
        {
            label: "This Week",
            value: "89",
            change: "+12",
            trend: "up",
            icon: "📅"
        },
        {
            label: "Avg Hours/Person",
            value: "2.8",
            change: "-0.3",
            trend: "down",
            icon: "⏱️"
        },
        {
            label: "Cost Estimate",
            value: "฿45,680",
            change: "+5%",
            trend: "up",
            icon: "💰"
        },
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
                setIsDateDropdownOpen(false);
            }
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setIsCalendarOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Calendar functions
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const isDateInRange = (date) => {
        if (!customStartDate || !customEndDate) return false;
        const currentDate = formatDate(date);
        return currentDate >= customStartDate && currentDate <= customEndDate;
    };

    const handleDateSelect = (date) => {
        const dateString = formatDate(date);

        if (!customStartDate) {
            setCustomStartDate(dateString);
        } else if (!customEndDate) {
            if (dateString < customStartDate) {
                setCustomEndDate(customStartDate);
                setCustomStartDate(dateString);
            } else {
                setCustomEndDate(dateString);
            }
        } else {
            setCustomStartDate(dateString);
            setCustomEndDate("");
        }
    };

    const applyCustomDateRange = () => {
        if (customStartDate && customEndDate) {
            setSelectedDateRange("custom");
            setIsCalendarOpen(false);
            setIsDateDropdownOpen(false);
        }
    };

    const clearCustomDateRange = () => {
        setCustomStartDate("");
        setCustomEndDate("");
    };

    const getFilteredRequests = () => {
        let requests = [];

        switch (selectedTab) {
            case "pending":
                requests = pendingRequests;
                break;
            case "approved":
                requests = approvedRequests;
                break;
            default:
                requests = pendingRequests;
        }

        // Filter by department
        if (selectedDepartment !== "all") {
            requests = requests.filter(request => request.department === selectedDepartment);
        }

        // Filter by date range
        if (selectedDateRange !== "all") {
            const today = new Date();
            const filterDate = new Date();

            switch (selectedDateRange) {
                case "today":
                    requests = requests.filter(request => request.date === formatDate(today));
                    break;
                case "yesterday":
                    filterDate.setDate(today.getDate() - 1);
                    requests = requests.filter(request => request.date === formatDate(filterDate));
                    break;
                case "this_week":
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    requests = requests.filter(request => {
                        const requestDate = new Date(request.date);
                        return requestDate >= startOfWeek && requestDate <= endOfWeek;
                    });
                    break;
                case "this_month":
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    requests = requests.filter(request => {
                        const requestDate = new Date(request.date);
                        return requestDate >= startOfMonth && requestDate <= endOfMonth;
                    });
                    break;
                case "custom":
                    if (customStartDate && customEndDate) {
                        requests = requests.filter(request => {
                            return request.date >= customStartDate && request.date <= customEndDate;
                        });
                    }
                    break;
                default:
                    break;
            }
        }

        return requests;
    };

    const getDepartmentStats = () => {
        if (selectedDepartment === "all") {
            return departmentOT;
        }
        return departmentOT.filter(dept => dept.department === selectedDepartment);
    };

    const getFilteredUpcomingOT = () => {
        if (selectedDepartment === "all") {
            return upcomingOT;
        }
        return upcomingOT.filter(ot => ot.department === selectedDepartment);
    };

    const getSelectedDepartmentName = () => {
        const dept = departments.find(d => d.id === selectedDepartment);
        return dept ? dept.name : "All Departments";
    };

    const getSelectedDepartmentColor = () => {
        const dept = departments.find(d => d.id === selectedDepartment);
        return dept ? dept.color : "bg-gray-500";
    };

    const getSelectedDateName = () => {
        if (selectedDateRange === "custom" && customStartDate && customEndDate) {
            return `${customStartDate} to ${customEndDate}`;
        }
        const dateRange = dateRanges.find(d => d.id === selectedDateRange);
        return dateRange ? dateRange.name : "All Time";
    };

    const getSelectedDateRange = () => {
        if (selectedDateRange === "custom" && customStartDate && customEndDate) {
            return "ช่วงวันที่กำหนดเอง";
        }
        const dateRange = dateRanges.find(d => d.id === selectedDateRange);
        return dateRange ? dateRange.range : "ทั้งหมด";
    };

    const handleApprove = (id) => {
        console.log(`Approved request ${id}`);
    };

    const handleReject = (id) => {
        console.log(`Rejected request ${id}`);
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            days.push(date);
        }

        return days;
    };

    const calendarDays = generateCalendarDays();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                    <div className="mb-4 lg:mb-0">
                        <h1 className="text-3xl font-bold text-gray-800">OT Management Dashboard</h1>
                        <p className="text-gray-600 mt-2">
                            ภาพรวมระบบจัดการการทำงานล่วงเวลา
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Department Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDepartmentDropdownOpen(!isDepartmentDropdownOpen)}
                                className="flex items-center space-x-2 bg-white rounded-lg shadow-sm px-4 py-3 border hover:shadow-md transition-all duration-200 min-w-[200px]"
                            >
                                <div className={`w-3 h-3 rounded-full ${getSelectedDepartmentColor()}`}></div>
                                <span className="text-sm font-medium text-gray-700">{getSelectedDepartmentName()}</span>
                                <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDepartmentDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>

                            {isDepartmentDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-60 overflow-y-auto">
                                    {departments.map((dept) => (
                                        <button
                                            key={dept.id}
                                            onClick={() => {
                                                setSelectedDepartment(dept.id);
                                                setIsDepartmentDropdownOpen(false);
                                            }}
                                            className={`flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 ${
                                                selectedDepartment === dept.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                            }`}
                                        >
                                            <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                                            <span className="text-sm font-medium">{dept.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Date Dropdown */}
                        <div className="relative" ref={dateDropdownRef}>
                            <button
                                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                                className="flex items-center space-x-2 bg-white rounded-lg shadow-sm px-4 py-3 border hover:shadow-md transition-all duration-200 min-w-[200px]"
                            >
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-sm font-medium text-gray-700">{getSelectedDateName()}</span>
                                <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>

                            {isDateDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-30">
                                    <div className="p-3 border-b border-gray-200">
                                        <h3 className="text-sm font-semibold text-gray-800">Select Date Range</h3>
                                    </div>

                                    {/* Quick Date Ranges */}
                                    <div className="p-3 border-b border-gray-200">
                                        <div className="grid grid-cols-2 gap-2">
                                            {dateRanges.filter(d => d.id !== 'custom').map((dateRange) => (
                                                <button
                                                    key={dateRange.id}
                                                    onClick={() => {
                                                        setSelectedDateRange(dateRange.id);
                                                        setIsDateDropdownOpen(false);
                                                        clearCustomDateRange();
                                                    }}
                                                    className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-200 ${
                                                        selectedDateRange === dateRange.id
                                                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <span className="text-sm font-medium">{dateRange.name}</span>
                                                    <span className="text-xs text-gray-500 mt-1">{dateRange.range}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Custom Date Range */}
                                    <div className="p-3">
                                        <button
                                            onClick={() => setIsCalendarOpen(true)}
                                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                                                selectedDateRange === "custom"
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                </svg>
                                                <span className="text-sm font-medium">Custom Range</span>
                                            </div>
                                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                                กำหนดเอง
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Calendar Modal */}
                            {isCalendarOpen && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div ref={calendarRef} className="bg-white rounded-2xl shadow-2xl p-6 w-96 max-h-[90vh] overflow-y-auto">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-gray-800">Select Date Range</h3>
                                            <button
                                                onClick={() => setIsCalendarOpen(false)}
                                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Calendar Navigation */}
                                        <div className="flex justify-between items-center mb-4">
                                            <button
                                                onClick={() => navigateMonth(-1)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                                </svg>
                                            </button>
                                            <h4 className="text-lg font-semibold text-gray-800">
                                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </h4>
                                            <button
                                                onClick={() => navigateMonth(1)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Calendar Days */}
                                        <div className="grid grid-cols-7 gap-1 mb-4">
                                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                                    {day}
                                                </div>
                                            ))}
                                            {calendarDays.map((date, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => date && handleDateSelect(date)}
                                                    disabled={!date}
                                                    className={`h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                        !date
                                                            ? 'bg-transparent'
                                                            : isDateInRange(date)
                                                            ? 'bg-blue-500 text-white'
                                                            : formatDate(date) === customStartDate || formatDate(date) === customEndDate
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    } ${date && formatDate(date) === formatDate(new Date()) ? 'ring-2 ring-blue-400' : ''}`}
                                                >
                                                    {date ? date.getDate() : ''}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Selected Date Range Display */}
                                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                            <div className="text-sm text-gray-600 mb-2">Selected Range:</div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm font-medium">
                                                    {customStartDate || 'Start date'}
                                                </div>
                                                <div className="text-gray-400">→</div>
                                                <div className="text-sm font-medium">
                                                    {customEndDate || 'End date'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={clearCustomDateRange}
                                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                onClick={applyCustomDateRange}
                                                disabled={!customStartDate || !customEndDate}
                                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                                    customStartDate && customEndDate
                                                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Current Date Display */}
                        <div className="bg-white rounded-lg shadow-sm px-4 py-3 border">
                            <div className="text-sm text-gray-500">
                                {new Date().toLocaleDateString('th-TH', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                            <div className="text-xs text-green-600 font-medium mt-1 flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                Real-time data
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Summary */}
                <div className="bg-white rounded-lg p-4 shadow-sm border mb-8">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <span className="font-medium">Filters:</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                            <div className={`w-2 h-2 rounded-full ${getSelectedDepartmentColor()}`}></div>
                            <span>Department: {getSelectedDepartmentName()}</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span>Date: {getSelectedDateRange()}</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-full">
                            <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            <span>Status: {selectedTab === "pending" ? "Pending" : "Approved"}</span>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedDepartment("all");
                                setSelectedDateRange("all");
                                setSelectedTab("pending");
                                clearCustomDateRange();
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center space-x-1"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                            <span>Clear All</span>
                        </button>
                    </div>
                </div>

                {/* Rest of the component remains the same as previous version */}
                {/* Quick Stats, Main Grid, and Recent Requests sections... */}

            </div>
        </AppLayout>
    );
}
