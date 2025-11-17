export default function EmployeeDetailModal({ employee, onClose }) {
    const getStatusColor = (status) => {
        const colors = {
            "เข้างาน": "bg-green-100 text-green-800 border-green-200",
            "มาสาย": "bg-amber-100 text-amber-800 border-amber-200",
            "ขาดงาน": "bg-red-100 text-red-800 border-red-200",
            "ลาป่วย": "bg-blue-100 text-blue-800 border-blue-200",
            "ลากิจ": "bg-purple-100 text-purple-800 border-purple-200"
        };
        return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getShiftColor = (shift) => {
        const colors = {
            "กะเช้า": "bg-sky-100 text-sky-800",
            "กะบ่าย": "bg-orange-100 text-orange-800",
            "กะดึก": "bg-indigo-100 text-indigo-800",
            "เต็มวัน": "bg-emerald-100 text-emerald-800"
        };
        return colors[shift] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">รายละเอียดการเข้างาน</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <img
                            src={employee.avatar}
                            alt={employee.EmpName}
                            className="w-16 h-16 rounded-full border-2 border-gray-200"
                        />
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900">{employee.EmpName}</h4>
                            <p className="text-gray-600">#{employee.EmpCode} • {employee.Position}</p>
                            <p className="text-gray-500">{employee.DeptName}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">ข้อมูลการเข้างาน</label>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">วันที่:</span>
                                        <span className="font-medium">{employee.date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">กะทำงาน:</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getShiftColor(employee.shift)}`}>
                                            {employee.shift}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">สถานะ:</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(employee.status)}`}>
                                            {employee.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">เวลาในการทำงาน</label>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">เวลาเข้า:</span>
                                        <span className="font-mono font-medium">{employee.timeIn}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">เวลาออก:</span>
                                        <span className="font-mono font-medium">{employee.timeOut}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">ชั่วโมงทำงาน:</span>
                                        <span className="font-mono font-medium">{employee.workHours} ชั่วโมง</span>
                                    </div>
                                    {employee.lateMinutes > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">มาสาย:</span>
                                            <span className="font-medium text-amber-600">{employee.lateMinutes} นาที</span>
                                        </div>
                                    )}
                                    {employee.overtime > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">ล่วงเวลา:</span>
                                            <span className="font-medium text-blue-600">{employee.overtime} ชั่วโมง</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">สถานที่ทำงาน</label>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">จุดเข้า:</span>
                                        <span className="font-medium text-sm">{employee.checkInLocation}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">จุดออก:</span>
                                        <span className="font-medium text-sm">{employee.checkOutLocation}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-600 text-sm">
                                        {employee.status === "มาสาย" && `มาสาย ${employee.lateMinutes} นาที`}
                                        {employee.status === "ลาป่วย" && "ลาป่วยตามใบรับรองแพทย์"}
                                        {employee.status === "ลากิจ" && "ลากิจส่วนตัว"}
                                        {employee.status === "ขาดงาน" && "ขาดงานโดยไม่แจ้งล่วงหน้า"}
                                        {employee.status === "เข้างาน" && "เข้างานตามปกติ"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            ปิด
                        </button>
                        <button className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                            พิมพ์รายงาน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
