// resources/js/pages/ERP/Overtime/data/mockData.ts

// ข้อมูลกะงาน
export const shifts = [
  {
    id: 1,
    name: 'กะเช้า',
    startTime: '08:30',
    endTime: '17:30',
    breakStart: '12:00',
    breakEnd: '13:00',
    totalHours: 8,
    color: 'blue'
  },
  {
    id: 2,
    name: 'กะบ่าย',
    startTime: '16:00',
    endTime: '00:00',
    breakStart: '20:00',
    breakEnd: '20:30',
    totalHours: 7.5,
    color: 'orange'
  },
  {
    id: 3,
    name: 'กะดึก',
    startTime: '00:00',
    endTime: '08:00',
    breakStart: '04:00',
    breakEnd: '04:30',
    totalHours: 7.5,
    color: 'red'
  },
  {
    id: 4,
    name: 'กะยืดหยุ่น',
    startTime: '09:00',
    endTime: '18:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    totalHours: 8,
    color: 'green'
  }
];

// ข้อมูลพนักงาน
export const employees = [
  {
    id: 1,
    name: 'สมชาย ใจดี',
    department: 'it',
    departmentName: 'ฝ่าย IT',
    position: 'Senior Developer',
    shiftId: 1,
    baseSalary: 45000,
    email: 'somchai.j@company.com',
    phone: '089-123-4567',
    status: 'active'
  },
  {
    id: 2,
    name: 'สมหญิง เก่งดี',
    department: 'hr',
    departmentName: 'ฝ่ายบุคคล',
    position: 'HR Manager',
    shiftId: 4,
    baseSalary: 38000,
    email: 'somying.g@company.com',
    phone: '089-234-5678',
    status: 'active'
  },
  {
    id: 3,
    name: 'สมหมาย ทำงาน',
    department: 'production',
    departmentName: 'ฝ่ายผลิต',
    position: 'Production Supervisor',
    shiftId: 1,
    baseSalary: 35000,
    email: 'somma.t@company.com',
    phone: '089-345-6789',
    status: 'active'
  },
  {
    id: 4,
    name: 'สมศรี สวยงาม',
    department: 'account',
    departmentName: 'ฝ่ายบัญชี',
    position: 'Accountant',
    shiftId: 1,
    baseSalary: 32000,
    email: 'somsri.s@company.com',
    phone: '089-456-7890',
    status: 'active'
  },
  {
    id: 5,
    name: 'สมบูรณ์ มากมี',
    department: 'it',
    departmentName: 'ฝ่าย IT',
    position: 'System Analyst',
    shiftId: 1,
    baseSalary: 42000,
    email: 'somboon.m@company.com',
    phone: '089-567-8901',
    status: 'active'
  },
  {
    id: 6,
    name: 'สมปอง ขยัน',
    department: 'store',
    departmentName: 'คลังสินค้า',
    position: 'Warehouse Staff',
    shiftId: 2,
    baseSalary: 28000,
    email: 'sompong.k@company.com',
    phone: '089-678-9012',
    status: 'active'
  },
  {
    id: 7,
    name: 'สมนึก ตั้งใจ',
    department: 'production',
    departmentName: 'ฝ่ายผลิต',
    position: 'Production Operator',
    shiftId: 3,
    baseSalary: 29000,
    email: 'somnek.t@company.com',
    phone: '089-789-0123',
    status: 'active'
  },
  {
    id: 8,
    name: 'สมใจ ดีเสมอ',
    department: 'sales',
    departmentName: 'ฝ่ายขาย',
    position: 'Sales Executive',
    shiftId: 4,
    baseSalary: 30000,
    email: 'somjai.d@company.com',
    phone: '089-890-1234',
    status: 'active'
  }
];

// ข้อมูลแผนก
export const departments = [
  { id: "it", name: "ฝ่าย IT", color: "blue", employeeCount: 24 },
  { id: "hr", name: "ฝ่ายบุคคล", color: "green", employeeCount: 8 },
  { id: "store", name: "คลังสินค้า", color: "orange", employeeCount: 18 },
  { id: "account", name: "ฝ่ายบัญชี", color: "purple", employeeCount: 12 },
  { id: "production", name: "ฝ่ายผลิต", color: "red", employeeCount: 45 },
  { id: "sales", name: "ฝ่ายขาย", color: "pink", employeeCount: 15 },
  { id: "marketing", name: "ฝ่ายการตลาด", color: "indigo", employeeCount: 10 }
];

// สถิติโอที
export const overtimeStats = {
  totalRequests: 23,
  approved: 15,
  pending: 5,
  rejected: 3,
  totalHours: 67.5,
  monthlyHours: 28.3,
  weeklyHours: 12.5,
  averageHours: 2.9,
  totalPay: 45250,
  requests: []
};

// คำขอโอที
export const overtimeRequests = [
  {
    id: 1,
    employee: {
      id: 1,
      name: 'สมชาย ใจดี',
      department: 'it',
      departmentName: 'ฝ่าย IT',
      position: 'Senior Developer',
      baseSalary: 45000
    },
    shift: {
      id: 1,
      name: 'กะเช้า',
      startTime: '08:30',
      endTime: '17:30',
      breakStart: '12:00',
      breakEnd: '13:00'
    },
    date: '2024-01-15',
    startTime: '17:30',
    endTime: '20:30',
    hours: 3,
    reason: 'workload',
    description: 'ทำงานโปรเจคด่วนต้องส่งลูกค้า',
    status: 'approved',
    pay: 2531.25,
    submittedAt: '2024-01-14T10:00:00Z',
    approvedAt: '2024-01-14T14:30:00Z',
    approvedBy: 'นางสาวสมศรี ผู้จัดการ'
  },
  {
    id: 2,
    employee: {
      id: 2,
      name: 'สมหญิง เก่งดี',
      department: 'hr',
      departmentName: 'ฝ่ายบุคคล',
      position: 'HR Manager',
      baseSalary: 38000
    },
    shift: {
      id: 4,
      name: 'กะยืดหยุ่น',
      startTime: '09:00',
      endTime: '18:00',
      breakStart: '12:00',
      breakEnd: '13:00'
    },
    date: '2024-01-16',
    startTime: '18:00',
    endTime: '21:00',
    hours: 3,
    reason: 'urgent',
    description: 'ปิดงบด่วนสำหรับการประชุมบอร์ด',
    status: 'pending',
    pay: 2137.50,
    submittedAt: '2024-01-15T14:30:00Z',
    approvedAt: null,
    approvedBy: null
  },
  {
    id: 3,
    employee: {
      id: 7,
      name: 'สมนึก ตั้งใจ',
      department: 'production',
      departmentName: 'ฝ่ายผลิต',
      position: 'Production Operator',
      baseSalary: 29000
    },
    shift: {
      id: 3,
      name: 'กะดึก',
      startTime: '00:00',
      endTime: '08:00',
      breakStart: '04:00',
      breakEnd: '04:30'
    },
    date: '2024-01-10',
    startTime: '08:00',
    endTime: '11:00',
    hours: 3,
    reason: 'project',
    description: 'ผลิตงานด่วนตามคำสั่งลูกค้า',
    status: 'approved',
    pay: 1903.13,
    submittedAt: '2024-01-09T08:00:00Z',
    approvedAt: '2024-01-09T10:15:00Z',
    approvedBy: 'นายสมหมาย หัวหน้าแผนก'
  },
  {
    id: 4,
    employee: {
      id: 6,
      name: 'สมปอง ขยัน',
      department: 'store',
      departmentName: 'คลังสินค้า',
      position: 'Warehouse Staff',
      baseSalary: 28000
    },
    shift: {
      id: 2,
      name: 'กะบ่าย',
      startTime: '16:00',
      endTime: '00:00',
      breakStart: '20:00',
      breakEnd: '20:30'
    },
    date: '2024-01-12',
    startTime: '00:00',
    endTime: '02:00',
    hours: 2,
    reason: 'inventory',
    description: 'นับสต็อกสินค้ารายเดือน',
    status: 'approved',
    pay: 1458.33,
    submittedAt: '2024-01-11T16:20:00Z',
    approvedAt: '2024-01-11T18:45:00Z',
    approvedBy: 'นางสาวสมศรี ผู้จัดการ'
  },
  {
    id: 5,
    employee: {
      id: 5,
      name: 'สมบูรณ์ มากมี',
      department: 'it',
      departmentName: 'ฝ่าย IT',
      position: 'System Analyst',
      baseSalary: 42000
    },
    shift: {
      id: 1,
      name: 'กะเช้า',
      startTime: '08:30',
      endTime: '17:30',
      breakStart: '12:00',
      breakEnd: '13:00'
    },
    date: '2024-01-18',
    startTime: '17:30',
    endTime: '19:00',
    hours: 1.5,
    reason: 'maintenance',
    description: 'บำรุงรักษาระบบหลังการใช้งาน',
    status: 'rejected',
    pay: 1181.25,
    submittedAt: '2024-01-17T09:15:00Z',
    approvedAt: '2024-01-17T11:30:00Z',
    approvedBy: 'นางสาวสมศรี ผู้จัดการ',
    rejectionReason: 'งานบำรุงรักษาควรทำในช่วงเวลาปกติ'
  },
  {
    id: 6,
    employee: {
      id: 8,
      name: 'สมใจ ดีเสมอ',
      department: 'sales',
      departmentName: 'ฝ่ายขาย',
      position: 'Sales Executive',
      baseSalary: 30000
    },
    shift: {
      id: 4,
      name: 'กะยืดหยุ่น',
      startTime: '09:00',
      endTime: '18:00',
      breakStart: '12:00',
      breakEnd: '13:00'
    },
    date: '2024-01-20',
    startTime: '18:00',
    endTime: '20:30',
    hours: 2.5,
    reason: 'client',
    description: 'ประชุมกับลูกค้าจากต่างประเทศ',
    status: 'pending',
    pay: 1562.50,
    submittedAt: '2024-01-19T15:45:00Z',
    approvedAt: null,
    approvedBy: null
  }
];

// การตั้งค่าโอที
export const overtimeSettings = {
  overtimeRates: {
    weekday: {
      normal: 1.5,
      holiday: 3.0
    },
    weekend: {
      normal: 2.0,
      holiday: 3.0
    },
    night: {
      normal: 1.75,
      holiday: 3.0
    }
  },
  approvalSettings: {
    autoApprove: false,
    requireManagerApproval: true,
    maxOvertimeHours: 36,
    notificationEnabled: true,
    approvalDeadline: 48 // ชั่วโมง
  },
  calculationSettings: {
    roundToNearest: 0.25,
    includeBreakTime: false,
    minimumOvertime: 1.0,
    nightShiftStart: '22:00',
    nightShiftEnd: '06:00'
  }
};

// วันหยุด
export const commonHolidays = [
  { id: 1, date: "2024-01-01", name: "วันขึ้นปีใหม่", type: "public" },
  { id: 2, date: "2024-04-13", name: "วันสงกรานต์", type: "public" },
  { id: 3, date: "2024-05-01", name: "วันแรงงาน", type: "public" },
  { id: 4, date: "2024-12-05", name: "วันพ่อ", type: "public" },
  { id: 5, date: "2024-12-10", name: "วันรัฐธรรมนูญ", type: "public" },
  { id: 6, date: "2024-12-31", name: "วันสิ้นปี", type: "public" }
];

// ฟังก์ชันช่วยเหลือ
export const getEmployeeById = (id: number) => {
  return employees.find(emp => emp.id === id);
};

export const getShiftById = (id: number) => {
  return shifts.find(shift => shift.id === id);
};

export const getDepartmentById = (id: string) => {
  return departments.find(dept => dept.id === id);
};

export const calculateOvertimePay = (employee: any, hours: number, rate: number = 1.5) => {
  const hourlyRate = employee.baseSalary / 30 / 8;
  return (hours * hourlyRate * rate).toFixed(2);
};

export const isHoliday = (date: string) => {
  return commonHolidays.some(holiday => holiday.date === date);
};
