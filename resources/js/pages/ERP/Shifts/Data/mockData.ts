// resources/js/pages/ERP/Shifts/data/mockData.ts

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

// วันหยุดประจำปี
export const commonHolidays = [
  { id: 1, date: "2024-01-01", name: "วันขึ้นปีใหม่", type: "public" },
  { id: 2, date: "2024-02-10", name: "วันมาฆบูชา", type: "public" },
  { id: 3, date: "2024-04-06", name: "วันจักรี", type: "public" },
  { id: 4, date: "2024-04-13", name: "วันสงกรานต์", type: "public" },
  { id: 5, date: "2024-04-14", name: "วันสงกรานต์", type: "public" },
  { id: 6, date: "2024-04-15", name: "วันสงกรานต์", type: "public" },
  { id: 7, date: "2024-05-01", name: "วันแรงงาน", type: "public" },
  { id: 8, date: "2024-05-22", name: "วันวิสาขบูชา", type: "public" },
  { id: 9, date: "2024-07-28", name: "วันเฉลิมพระชนมพรรษา", type: "public" },
  { id: 10, date: "2024-08-12", name: "วันแม่", type: "public" },
  { id: 11, date: "2024-10-23", name: "วันปิยมหาราช", type: "public" },
  { id: 12, date: "2024-12-05", name: "วันพ่อ", type: "public" },
  { id: 13, date: "2024-12-10", name: "วันรัฐธรรมนูญ", type: "public" },
  { id: 14, date: "2024-12-31", name: "วันสิ้นปี", type: "public" }
];

// วันหยุดพิเศษของบริษัท
export const companyHolidays = [
  { id: 101, date: "2024-03-15", name: "วันก่อตั้งบริษัท", type: "company" },
  { id: 102, date: "2024-06-28", name: "วันครอบครัวบริษัท", type: "company" },
  { id: 103, date: "2024-09-20", name: "วันพัฒนาบุคลากร", type: "company" }
];

// ข้อมูลกะงาน
export const shiftData = [
  {
    id: 1,
    department: "it",
    departmentName: "ฝ่าย IT",
    shiftName: "กะเช้า",
    timeRange: "กลางวัน",
    startTime: "08:30",
    endTime: "17:30",
    breakStart: "12:00",
    breakEnd: "13:00",
    totalHours: 8,
    employees: 20,
    status: "active",
    overtimeAllowed: true,
    maxOvertimeHours: 3,
    color: "blue",
    description: "กะทำงานปกติสำหรับฝ่าย IT",
    holidays: [1, 2, 4, 5, 6, 7, 11, 12, 13, 14, 101, 102, 103]
  },
  {
    id: 2,
    department: "store",
    departmentName: "คลังสินค้า",
    shiftName: "กะบ่าย",
    timeRange: "บ่ายถึงดึก",
    startTime: "16:00",
    endTime: "00:00",
    breakStart: "20:00",
    breakEnd: "20:30",
    totalHours: 7.5,
    employees: 15,
    status: "active",
    overtimeAllowed: true,
    maxOvertimeHours: 4,
    color: "orange",
    description: "กะบ่ายสำหรับคลังสินค้า",
    holidays: [1, 4, 5, 6, 7, 14, 101]
  },
  {
    id: 3,
    department: "production",
    departmentName: "ฝ่ายผลิต",
    shiftName: "กะดึก",
    timeRange: "ดึกถึงเช้า",
    startTime: "00:00",
    endTime: "08:00",
    breakStart: "04:00",
    breakEnd: "04:30",
    totalHours: 7.5,
    employees: 35,
    status: "active",
    overtimeAllowed: true,
    maxOvertimeHours: 2,
    color: "red",
    description: "กะดึกสำหรับฝ่ายผลิต",
    holidays: [1, 4, 5, 6, 7, 14]
  },
  {
    id: 4,
    department: "production",
    departmentName: "ฝ่ายผลิต",
    shiftName: "กะเช้า",
    timeRange: "กลางวัน",
    startTime: "08:00",
    endTime: "16:00",
    breakStart: "12:00",
    breakEnd: "12:30",
    totalHours: 7.5,
    employees: 40,
    status: "active",
    overtimeAllowed: true,
    maxOvertimeHours: 3,
    color: "red",
    description: "กะเช้าสำหรับฝ่ายผลิต",
    holidays: [1, 4, 5, 6, 7, 14]
  },
  {
    id: 5,
    department: "hr",
    departmentName: "ฝ่ายบุคคล",
    shiftName: "กะยืดหยุ่น",
    timeRange: "ยืดหยุ่น",
    startTime: "09:00",
    endTime: "18:00",
    breakStart: "12:00",
    breakEnd: "13:00",
    totalHours: 8,
    employees: 8,
    status: "active",
    overtimeAllowed: false,
    maxOvertimeHours: 0,
    color: "green",
    description: "กะยืดหยุ่นสำหรับฝ่ายบุคคล",
    holidays: [1, 4, 5, 6, 7, 11, 12, 13, 14, 101, 102, 103]
  },
  {
    id: 6,
    department: "account",
    departmentName: "ฝ่ายบัญชี",
    shiftName: "กะมาตรฐาน",
    timeRange: "กลางวัน",
    startTime: "08:30",
    endTime: "17:30",
    breakStart: "12:00",
    breakEnd: "13:00",
    totalHours: 8,
    employees: 10,
    status: "active",
    overtimeAllowed: true,
    maxOvertimeHours: 2,
    color: "purple",
    description: "กะมาตรฐานสำหรับฝ่ายบัญชี",
    holidays: [1, 4, 5, 6, 7, 11, 12, 13, 14, 101, 102, 103]
  },
  {
    id: 7,
    department: "sales",
    departmentName: "ฝ่ายขาย",
    shiftName: "กะลูกค้า",
    timeRange: "กลางวัน-เย็น",
    startTime: "10:00",
    endTime: "19:00",
    breakStart: "14:00",
    breakEnd: "15:00",
    totalHours: 8,
    employees: 12,
    status: "active",
    overtimeAllowed: true,
    maxOvertimeHours: 2,
    color: "pink",
    description: "กะที่เหมาะกับการติดต่อลูกค้า",
    holidays: [1, 4, 5, 6, 7, 14, 101]
  },
  {
    id: 8,
    department: "marketing",
    departmentName: "ฝ่ายการตลาด",
    shiftName: "กะครีเอทีฟ",
    timeRange: "ยืดหยุ่น",
    startTime: "09:30",
    endTime: "18:30",
    breakStart: "13:00",
    breakEnd: "14:00",
    totalHours: 8,
    employees: 8,
    status: "active",
    overtimeAllowed: true,
    maxOvertimeHours: 3,
    color: "indigo",
    description: "กะยืดหยุ่นสำหรับทีมครีเอทีฟ",
    holidays: [1, 4, 5, 6, 7, 11, 12, 13, 14, 101, 102, 103]
  },
  {
    id: 9,
    department: "it",
    departmentName: "ฝ่าย IT",
    shiftName: "กะด่วน",
    timeRange: "ด่วน",
    startTime: "07:00",
    endTime: "15:00",
    breakStart: "11:30",
    breakEnd: "12:00",
    totalHours: 7.5,
    employees: 4,
    status: "inactive",
    overtimeAllowed: true,
    maxOvertimeHours: 5,
    color: "blue",
    description: "กะด่วนสำหรับงานเร่งด่วน (ยังไม่เปิดใช้)",
    holidays: []
  }
];

// ข้อมูลพนักงานตัวอย่าง
export const employees = [
  {
    id: "emp001",
    name: "สมชาย ใจดี",
    department: "it",
    position: "Senior Developer",
    shiftId: 1,
    email: "somchai.j@company.com",
    phone: "089-123-4567",
    status: "active"
  },
  {
    id: "emp002",
    name: "สมหญิง เก่งดี",
    department: "hr",
    position: "HR Manager",
    shiftId: 5,
    email: "somying.g@company.com",
    phone: "089-234-5678",
    status: "active"
  },
  {
    id: "emp003",
    name: "สมหมาย ทำงาน",
    department: "production",
    position: "Production Supervisor",
    shiftId: 4,
    email: "somma.t@company.com",
    phone: "089-345-6789",
    status: "active"
  },
  {
    id: "emp004",
    name: "สมศรี สวยงาม",
    department: "account",
    position: "Accountant",
    shiftId: 6,
    email: "somsri.s@company.com",
    phone: "089-456-7890",
    status: "active"
  },
  {
    id: "emp005",
    name: "สมปอง ขยัน",
    department: "store",
    position: "Warehouse Staff",
    shiftId: 2,
    email: "sompong.k@company.com",
    phone: "089-567-8901",
    status: "active"
  }
];

// การตั้งค่าโอที
export const overtimeSettings = {
  rates: {
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
  calculation: {
    roundToNearest: 0.25,
    minimumOvertime: 1.0,
    includeBreakTime: false,
    nightShiftStart: "22:00",
    nightShiftEnd: "06:00"
  },
  approval: {
    autoApprove: false,
    requireManagerApproval: true,
    maxMonthlyHours: 36
  }
};

// ฟังก์ชันช่วยเหลือ
export const getHolidayName = (date: string): string => {
  const holiday = [...commonHolidays, ...companyHolidays].find(h => h.date === date);
  return holiday ? holiday.name : '';
};

export const getHolidayType = (date: string): string => {
  const holiday = [...commonHolidays, ...companyHolidays].find(h => h.date === date);
  return holiday ? holiday.type : '';
};

export const isHoliday = (date: string): boolean => {
  return [...commonHolidays, ...companyHolidays].some(h => h.date === date);
};

export const getShiftById = (id: number) => {
  return shiftData.find(shift => shift.id === id);
};

export const getDepartmentById = (id: string) => {
  return departments.find(dept => dept.id === id);
};

export const getEmployeesByShift = (shiftId: number) => {
  return employees.filter(emp => emp.shiftId === shiftId);
};
