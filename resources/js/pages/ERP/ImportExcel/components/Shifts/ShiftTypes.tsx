export interface Breadcrumb {
  title: string;
  href: string;
}

export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  description: string;
  color: string;
}

export interface EmployeeRecord {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  shiftNumber: number;
  timeIn: string;
  timeOut: string;
  formattedTimeIn: string;
  formattedTimeOut: string;
  workHours?: string;
  status: 'present' | 'late' | 'absent' | 'incomplete';
  statusColor: string;
  rawData: any;
  isOvernight?: boolean;
  assignedShift?: string;
  assignedShiftName?: string;
}

export interface UploadSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  incomplete: number;
  departments: string[];
  dates: string[];
  shifts: string[];
}

export interface FilterState {
  department: string;
  shift: string;
  date: string;
  status: string;
  employeeId: string;
  employeeName: string;
}
