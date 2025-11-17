// components/CalendarModal/CalendarModalHeader.jsx
export default function CalendarModalHeader({ dayData, onClose, onSaveAll, onStatusChange }) {
    const handleSaveAll = () => {
        if (onSaveAll) {
            onSaveAll();
        }
    };

    const handleStatusChange = (status) => {
        if (onStatusChange) {
            // เปลี่ยนสถานะให้พนักงานทั้งหมดในหน้านี้
            dayData.employees.forEach(emp => {
                onStatusChange(emp.EmpID, status);
            });
        }
    };

    return (
        <div className="border-b border-gray-200">
            {/* Header Main */}
            <div className="flex items-center justify-between p-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                        รายชื่อพนักงาน - {dayData.date.toLocaleDateString('th-TH')}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        รวม {dayData.totalEmployees} คน
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">เปลี่ยนทั้งหมดเป็น:</span>
                        <select
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">เลือกสถานะ</option>
                            <option value="เข้างาน">เข้างาน</option>
                            <option value="ขาดงาน">ขาดงาน</option>
                            <option value="ลาป่วย">ลาป่วย</option>
                            <option value="ลากิจ">ลากิจ</option>
                            <option value="มาสาย">มาสาย</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSaveAll}
                        className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        บันทึกทั้งหมด
                    </button>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="px-6 pb-4">
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded"></div>
                        <span className="text-gray-600">เข้างาน: <strong>{dayData.statusCount['เข้างาน'] || 0}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-rose-100 border border-rose-300 rounded"></div>
                        <span className="text-gray-600">ขาดงาน: <strong>{dayData.statusCount['ขาดงาน'] || 0}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                        <span className="text-gray-600">ลาป่วย: <strong>{dayData.statusCount['ลาป่วย'] || 0}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-violet-100 border border-violet-300 rounded"></div>
                        <span className="text-gray-600">ลากิจ: <strong>{dayData.statusCount['ลากิจ'] || 0}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded"></div>
                        <span className="text-gray-600">มาสาย: <strong>{dayData.statusCount['มาสาย'] || 0}</strong></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
