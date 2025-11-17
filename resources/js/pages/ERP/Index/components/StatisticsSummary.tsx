export default function StatisticsSummary({ stats }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">ทั้งหมด</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                <div className="text-sm text-gray-600">เข้างาน</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-amber-500">{stats.late}</div>
                <div className="text-sm text-gray-600">มาสาย</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-red-500">{stats.absent}</div>
                <div className="text-sm text-gray-600">ขาดงาน</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-blue-500">{stats.sickLeave}</div>
                <div className="text-sm text-gray-600">ลาป่วย</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.attendanceRate}%</div>
                <div className="text-sm text-gray-600">อัตราการเข้างาน</div>
            </div>
        </div>
    );
}
