// components/CalendarModal/CalendarEmptyState.tsx
import React from "react";

interface CalendarEmptyStateProps {
    message?: string;
}

const CalendarEmptyState: React.FC<CalendarEmptyStateProps> = ({ message = "ไม่มีข้อมูลพนักงานในวันนี้" }) => {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 mb-3 text-gray-400"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <p className="text-sm">{message}</p>
        </div>
    );
};

export default CalendarEmptyState;
