import { Shift } from './components/Shifts/ShiftTypes';

export const SHIFTS: Shift[] = [
  {
    id: 'morning',
    name: 'กะเช้า',
    startTime: '08:00',
    endTime: '17:00',
    color: 'blue',
    overnight: false,
    lateThreshold: '08:15'
  },
  {
    id: 'evening',
    name: 'กะบ่าย',
    startTime: '16:00',
    endTime: '01:00',
    color: 'green',
    overnight: true,
    lateThreshold: '16:15'
  },
  {
    id: 'night',
    name: 'กะดึก',
    startTime: '22:00',
    endTime: '07:00',
    color: 'purple',
    overnight: true,
    lateThreshold: '22:15'
  },
  {
    id: 'flexible',
    name: 'กะยืดหยุ่น',
    startTime: '09:00',
    endTime: '18:00',
    color: 'orange',
    overnight: false,
    lateThreshold: '09:30'
  }
];

export const STATUS_COLORS = {
  present: 'bg-green-100 text-green-800 border-green-200',
  late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  incomplete: 'bg-gray-100 text-gray-800 border-gray-200'
};

export const SHIFT_COLORS: { [key: string]: string } = {
  morning: 'bg-blue-100 text-blue-800 border-blue-200',
  evening: 'bg-green-100 text-green-800 border-green-200',
  night: 'bg-purple-100 text-purple-800 border-purple-200',
  flexible: 'bg-orange-100 text-orange-800 border-orange-200',
  undefined: 'bg-gray-100 text-gray-800 border-gray-200'
};
