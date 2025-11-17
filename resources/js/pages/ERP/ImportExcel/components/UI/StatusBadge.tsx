import { EmployeeRecord } from '@/types/shift';

interface StatusBadgeProps {
  status: EmployeeRecord['status'];
  color: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, color }) => {
  const getStatusText = (status: EmployeeRecord['status']): string => {
    switch (status) {
      case 'present': return 'มา work';
      case 'late': return 'สาย';
      case 'absent': return 'ขาด';
      case 'incomplete': return 'รอออก';
      default: return '-';
    }
  };

  const getStatusColor = (color: string): string => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800 border border-green-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'red': return 'bg-red-100 text-red-800 border border-red-200';
      case 'orange': return 'bg-orange-100 text-orange-800 border border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(color)}`}>
      {getStatusText(status)}
    </span>
  );
};
