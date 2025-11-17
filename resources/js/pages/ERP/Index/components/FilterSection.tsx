// components/FilterSection.jsx
export default function FilterSection({
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    shiftFilter,
    setShiftFilter,
    departments,
    resetFilters,
    viewMode,
    setViewMode,
    perPage,
    onPerPageChange
}) {
    const statusOptions = ["ทั้งหมด", "เข้างาน", "ลาป่วย", "ลากิจ", "มาสาย", "ขาดงาน"];
    const shiftOptions = ["ทั้งหมด", "กะเช้า", "กะบ่าย", "กะดึก", "เต็มวัน"];
    const perPageOptions = [10, 25, 50, 100];

    // ฟังก์ชันล้าง input search
    const clearSearch = () => {
        setSearchTerm("");
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            {/* View Mode และ Items Per Page */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">มุมมอง:</span>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                                viewMode === "list"
                                    ? "bg-white shadow-sm text-blue-600"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            <span>📋</span>
                            <span>รายการ</span>
                        </button>
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                                viewMode === "calendar"
                                    ? "bg-white shadow-sm text-blue-600"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            <span>📅</span>
                            <span>ปฏิทิน</span>
                        </button>
                    </div>
                </div>

                {/* Items Per Page (แสดงเฉพาะในโหมด list) */}
                {viewMode === "list" && (
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700">แสดง:</span>
                        <select
                            value={perPage}
                            onChange={(e) => onPerPageChange(Number(e.target.value))}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {perPageOptions.map(option => (
                                <option key={option} value={option}>{option} รายการ</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหาพนักงาน</label>
                    <div className="relative flex items-center bg-gray-50 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                        <div className="pl-4 pr-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="ชื่อ, รหัส, ตำแหน่ง..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-0 focus:ring-0 focus:outline-none bg-transparent w-full py-3 pr-10"
                        />
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Date Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">วันที่</label>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Status Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {/* Department Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ฝ่าย</label>
                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="ทั้งหมด">ฝ่ายทั้งหมด</option>
                        {departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>

                {/* Shift Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">กะทำงาน</label>
                    <select
                        value={shiftFilter}
                        onChange={(e) => setShiftFilter(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {shiftOptions.map(shift => (
                            <option key={shift} value={shift}>{shift}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Reset Filters Button */}
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                <button
                    onClick={resetFilters}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    <span>ล้างฟิลเตอร์ทั้งหมด</span>
                </button>
            </div>
        </div>
    );
}
