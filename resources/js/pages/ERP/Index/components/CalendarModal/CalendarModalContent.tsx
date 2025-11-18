// components/CalendarModal/CalendarModalContent.jsx
import CalendarStatusSection from "./CalendarStatusSection";
import CalendarEmptyState from "./CalendarEmptyState";

export default function CalendarModalContent({
    dayData,
    onEmployeeClick,
    onStatusChange,
    getStatusColor,
    getStatusIcon
}) {
    return (
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Employee List by Status */}
            <div className="space-y-6">
                {Object.entries(dayData.employeesByStatus)
                    .filter(([_, emps]) => emps.length > 0)
                    .map(([status, emps]) => (
                        <CalendarStatusSection
                            key={status}
                            status={status}
                            employees={emps}
                            onEmployeeClick={onEmployeeClick}
                            onStatusChange={onStatusChange}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                        />
                    ))
                }
            </div>

            {/* Empty State */}
            {dayData.totalEmployees === 0 && (
                <CalendarEmptyState />
            )}
        </div>
    );
}
