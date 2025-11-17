import React from 'react';

const SHIFTS = [
  { id: 1, name: 'shift_a', startTime: '08:00', endTime: '17:00', description: 'กะ A (08:00-17:00)', color: 'blue' },
  { id: 2, name: 'shift_b', startTime: '08:00', endTime: '16:00', description: 'กะ B (08:00-16:00)', color: 'green' },
  { id: 3, name: 'shift_c', startTime: '16:00', endTime: '00:00', description: 'กะ C (16:00-00:00)', color: 'purple' },
  { id: 4, name: 'shift_d', startTime: '20:00', endTime: '04:00', description: 'กะ D (20:00-04:00)', color: 'orange' },
  { id: 5, name: 'shift_e', startTime: '00:00', endTime: '08:00', description: 'กะ E (00:00-08:00)', color: 'red' }
];

interface ShiftBadgeProps {
  shiftName: string;
}

export const ShiftBadge: React.FC<ShiftBadgeProps> = ({ shiftName }) => {
  const getShiftColor = (shiftName: string): string => {
    const shift = SHIFTS.find(s => s.name === shiftName);
    if (!shift) return 'bg-gray-100 text-gray-800 border border-gray-200';

    switch (shift.color) {
      case 'blue': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'green': return 'bg-green-100 text-green-800 border border-green-200';
      case 'purple': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'orange': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'red': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getShiftColor(shiftName)}`}>
      {SHIFTS.find(s => s.name === shiftName)?.description || shiftName}
    </span>
  );
};
