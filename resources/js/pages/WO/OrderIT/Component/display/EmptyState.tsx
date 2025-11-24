// named export
import React from 'react';
import { XCircle } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-gray-400">
      <XCircle className="w-16 h-16 mb-4 text-gray-300" />
      <p className="text-lg">{message || "ไม่มีข้อมูล"}</p>
    </div>
  );
};
