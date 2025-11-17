// components/CalendarModal/CalendarModalFooter.jsx
export default function CalendarModalFooter({ onClose }) {
    return (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    คลิกที่พนักงานเพื่อดูรายละเอียดเพิ่มเติม
                </div>
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    ปิด
                </button>
            </div>
        </div>
    );
}
