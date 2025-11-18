// components/CalendarModal/CalendarEmployeeCard.jsx
export default function CalendarEmployeeCard({ employee, onClick }) {
    return (
        <div
            className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img
                        src={employee.avatar}
                        alt={employee.EmpName}
                        className="w-12 h-12 rounded-full border-2 border-white shadow-sm group-hover:border-gray-200 transition-colors"
                    />
                    <div>
                        <div className="font-semibold text-gray-900 text-lg">
                            {employee.EmpName}
                        </div>
                        <div className="text-sm text-gray-600">
                            #{employee.EmpCode} • {employee.Position}
                        </div>
                        <div className="text-sm text-gray-500">
                            {employee.DeptName}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-base font-mono text-gray-800 font-semibold">
                        {employee.timeIn} - {employee.timeOut}
                    </div>
                    <div className="text-sm text-gray-600">
                        {employee.workHours} ชั่วโมง
                    </div>
                    {employee.lateMinutes > 0 && (
                        <div className="text-sm text-amber-600 font-medium">
                            มาสาย {employee.lateMinutes} นาที
                        </div>
                    )}
                    {employee.overtime > 0 && (
                        <div className="text-sm text-blue-600 font-medium">
                            ล่วงเวลา {employee.overtime} ชั่วโมง
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Info */}
            <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{employee.checkInLocation}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>กะ{employee.shift}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
