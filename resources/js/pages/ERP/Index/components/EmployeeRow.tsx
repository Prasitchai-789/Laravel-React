// EmployeeRow.tsx
export default function EmployeeRow({ employee, onViewDetail, getStatusColor, getShiftColor }) {
    return (
        <>
            {/* ชื่อพนักงาน */}
            <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                    <img
                        src={employee.avatar || "/images/default-avatar.png"}
                        alt={employee.EmpName || "ไม่มีชื่อ"}
                        className="w-12 h-12 rounded-full border border-gray-200 shadow-sm object-cover"
                    />
                    <div className="truncate">
                        <div className="font-semibold text-gray-900 truncate">{employee.EmpName || "-"}</div>
                        <div className="text-sm text-gray-500 truncate">#{employee.EmpCode || "ไม่มีรหัส"}</div>
                        <div className="text-xs text-gray-400 truncate">{employee.Position || "-"}</div>
                    </div>
                </div>
            </td>

            {/* แผนก */}
            <td className="py-4 px-6">
                <span className="text-gray-700 font-medium">{employee.DeptName || "-"}</span>
            </td>

            {/* เวลาเข้าออก */}
            <td className="py-4 px-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <svg
                            className="w-4 h-4 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span className="font-mono text-gray-900">{employee.timeIn || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg
                            className="w-4 h-4 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span className="font-mono text-gray-900">{employee.timeOut || "-"}</span>
                    </div>
                </div>
            </td>

            {/* กะ */}
            <td className="py-4 px-6">
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                        getShiftColor?.(employee.shift) || "bg-gray-100 text-gray-600"
                    }`}
                >
                    {employee.shift || "-"}
                </span>
            </td>

            {/* สถานะ */}
            <td className="py-4 px-6">
                <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${
                        getStatusColor?.(employee.status) || "border-gray-300 text-gray-600"
                    }`}
                >
                    {employee.status || "ไม่ระบุ"}
                </span>
            </td>

            {/* ปุ่มดูรายละเอียด */}
            <td className="py-4 px-6">
                <button
                    onClick={() => onViewDetail(employee)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                    ดูรายละเอียด
                </button>
            </td>
        </>
    );
}
