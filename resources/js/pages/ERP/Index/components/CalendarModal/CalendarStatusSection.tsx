// components/CalendarModal/CalendarStatusSection.jsx
import CalendarEmployeeCard from "./CalendarEmployeeCard";

export default function CalendarStatusSection({
    status,
    employees,
    onEmployeeClick,
    onStatusChange,
    getStatusColor,
    getStatusIcon
}) {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Section Header */}
            <div className={`px-6 py-3 ${getStatusColor(status)}`}>
                <div className="flex items-center gap-3 font-semibold">
                    {getStatusIcon(status)}
                    {status}
                    <span className="text-sm font-normal bg-white/50 px-2 py-1 rounded">
                        {employees.length} คน
                    </span>
                </div>
            </div>

            {/* Employee List */}
            <div className="bg-white divide-y divide-gray-100">
                {employees.map((emp, idx) => (
                    <CalendarEmployeeCard
                        key={idx}
                        employee={emp}
                        onClick={() => onEmployeeClick(emp)}
                        onStatusChange={onStatusChange}
                    />
                ))}
            </div>
        </div>
    );
}
