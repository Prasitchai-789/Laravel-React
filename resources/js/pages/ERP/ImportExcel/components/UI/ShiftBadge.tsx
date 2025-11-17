import { SHIFTS } from '@/utils/shiftUtils';

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
