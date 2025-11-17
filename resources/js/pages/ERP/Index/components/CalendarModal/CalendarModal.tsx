// components/CalendarModal/CalendarModal.jsx
import CalendarModalHeader from "./CalendarModalHeader";
import CalendarModalContent from "./CalendarModalContent";
import CalendarModalFooter from "./CalendarModalFooter";

export default function CalendarModal({
    dayData,
    onEmployeeClick,
    onClose,
    onStatusChange,
    onSaveAll,
    getStatusColor,
    getStatusIcon
}) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                <CalendarModalHeader
                    dayData={dayData}
                    onClose={onClose}
                    onSaveAll={onSaveAll}
                    onStatusChange={onStatusChange}
                />

                <CalendarModalContent
                    dayData={dayData}
                    onEmployeeClick={onEmployeeClick}
                    onStatusChange={onStatusChange}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                />

                <CalendarModalFooter onClose={onClose} />
            </div>
        </div>
    );
}
