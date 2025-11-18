import { Shift, EmployeeRecord } from './ShiftTypes';

export const SHIFTS: Shift[] = [
    { id: 1, name: 'shift_a', startTime: '08:00', endTime: '17:00', description: 'กะ A (08:00-17:00)', color: 'blue' },
    { id: 2, name: 'shift_b', startTime: '08:00', endTime: '16:00', description: 'กะ B (08:00-16:00)', color: 'green' },
    { id: 3, name: 'shift_c', startTime: '16:00', endTime: '00:00', description: 'กะ C (16:00-00:00)', color: 'purple' },
    { id: 4, name: 'shift_d', startTime: '20:00', endTime: '04:00', description: 'กะ D (20:00-04:00)', color: 'orange' },
    { id: 5, name: 'shift_e', startTime: '00:00', endTime: '08:00', description: 'กะ E (00:00-08:00)', color: 'red' }
];

// ฟังก์ชันหลักสำหรับคำนวณกะและ OT
export const calculateShiftWithOT = (
    shiftType: string,
    timeString: string
) => {
    const timeEntries = timeString.toString().split(' ').filter(t => t.trim() !== '');
    const filteredTimes = filterCloseTimes(timeEntries, 2);

    if (filteredTimes.length < 2) return {
        shiftHours: 0,
        otHours: 0,
        totalHours: 0,
        timeIn: '-',
        timeOut: '-',
        isOvernight: false
    };

    // ใช้เวลาจริงเป็น timeIn
    const realTimeIn = filteredTimes[0];
    const realTimeOut = filteredTimes[filteredTimes.length - 1];

    // ตรวจสอบว่าข้ามวันหรือไม่
    const inMinutes = timeToMinutes(realTimeIn);
    const outMinutes = timeToMinutes(realTimeOut);
    const isOvernight = outMinutes < inMinutes;

    // ชั่วโมงงาน = total minutes / 60
    let workMinutes = outMinutes - inMinutes;
    if (workMinutes < 0) workMinutes += 24 * 60;

    // คำนวณ OT
    const shiftTimes = getShiftTimes(shiftType);
    const otHours = calculateOvertimeFromActualTimes(shiftType, timeString, shiftTimes);

    return {
        shiftHours: Math.round((workMinutes / 60) * 100) / 100,
        otHours,
        totalHours: Math.round((workMinutes / 60 + otHours) * 100) / 100,
        timeIn: realTimeIn,
        timeOut: realTimeOut,
        isOvernight
    };
};


// กำหนดเวลากะตามประเภท
const getShiftTimes = (shiftType: string) => {
    const shiftMap = {
        'กะ A (08:00-17:00)': { startTime: '08:00', endTime: '17:00', isOvernight: false },
        'กะ B (08:00-16:00)': { startTime: '08:00', endTime: '16:00', isOvernight: false },
        'กะ C (16:00-00:00)': { startTime: '16:00', endTime: '00:00', isOvernight: true },
        'กะ D (20:00-04:00)': { startTime: '20:00', endTime: '04:00', isOvernight: true },
        'กะ E (00:00-08:00)': { startTime: '00:00', endTime: '08:00', isOvernight: false },
        'กะ B/E': { startTime: '08:00', endTime: '08:00', isOvernight: true, isCombined: true },
        'กะ C/B': { startTime: '16:00', endTime: '16:00', isOvernight: true, isCombined: true },
        'กะ D/C': { startTime: '20:00', endTime: '00:00', isOvernight: true, isCombined: true },
        'กะ E/D': { startTime: '00:00', endTime: '04:00', isOvernight: true, isCombined: true }
    };

    return shiftMap[shiftType] || shiftMap['กะ B (08:00-16:00)'];
};

// คำนวณชั่วโมงงานตามกะ
const calculateShiftHours = (shiftTimes: any): number => {
    // กะผสมได้ 16 ชม.
    if (shiftTimes.isCombined) {
        return 16.00;
    }

    const startMinutes = timeToMinutes(shiftTimes.startTime);
    const endMinutes = timeToMinutes(shiftTimes.endTime);

    let totalMinutes = 0;

    if (shiftTimes.isOvernight) {
        // กะข้ามวัน
        totalMinutes = (24 * 60 - startMinutes) + endMinutes;
    } else {
        // กะปกติ
        totalMinutes = endMinutes - startMinutes;
        if (totalMinutes < 0) totalMinutes += 24 * 60;
    }

    // หักเวลาพัก (เฉพาะกะ A)
    if (shiftTimes.startTime === '08:00' && shiftTimes.endTime === '17:00') {
        totalMinutes = Math.max(0, totalMinutes - 60); // หัก 1 ชม. พัก
    }

    return Math.round((totalMinutes / 60) * 100) / 100;
};

// คำนวณ OT จากเวลาจริง
const calculateOvertimeFromActualTimes = (
    shiftType: string,
    timeString: string,
    shiftTimes: any
): number => {
    if (!timeString || timeString === '-') return 0;

    const timeEntries = timeString.toString().split(' ').filter(t => t.trim() !== '');
    const filteredTimes = filterCloseTimes(timeEntries, 2);

    if (filteredTimes.length < 2) return 0;

    // หาเวลาจริงที่เกินเวลากะ
    const otPeriods = findOvertimePeriods(shiftType, filteredTimes, shiftTimes);

    let totalOTMinutes = 0;

    // คำนวณ OT จากช่วงเวลาที่พบ
    otPeriods.forEach(period => {
        const otMinutes = period.outMinutes - period.inMinutes;
        if (otMinutes > 0) {
            totalOTMinutes += otMinutes;
        }
    });

    // จำกัด OT ไม่เกิน 5 ชม. (300 นาที)
    totalOTMinutes = Math.min(totalOTMinutes, 300);
    return Math.round((totalOTMinutes / 60) * 100) / 100;
};

// หาช่วงเวลา OT
const findOvertimePeriods = (shiftType: string, times: string[], shiftTimes: any) => {
    const otPeriods: { timeIn: string; timeOut: string; inMinutes: number; outMinutes: number }[] = [];

    // กำหนดเงื่อนไข OT ตามประเภทกะ
    const getOTCondition = (shiftType: string) => {
        const conditions = {
            'กะ B (08:00-16:00)': { startOT: timeToMinutes('16:00') },
            'กะ C (16:00-00:00)': { startOT: 0 }, // หลัง 00:00
            'กะ D (20:00-04:00)': { startOT: timeToMinutes('04:00') },
            'กะ E (00:00-08:00)': { startOT: timeToMinutes('08:00') },
            'กะ B/E': { startOT: timeToMinutes('16:00') },
            'กะ C/B': { startOT: timeToMinutes('16:00') },
            'กะ D/C': { startOT: timeToMinutes('04:00') },
            'กะ E/D': { startOT: timeToMinutes('08:00') }
        };

        return conditions[shiftType] || conditions['กะ B (08:00-16:00)'];
    };

    const otCondition = getOTCondition(shiftType);

    // ตรวจสอบแต่ละคู่เวลา
    for (let i = 0; i < times.length - 1; i += 2) {
        const timeIn = times[i];
        const timeOut = times[i + 1];
        const inMinutes = timeToMinutes(timeIn);
        const outMinutes = timeToMinutes(timeOut);

        // เช็คว่าเป็นช่วง OT หรือไม่ (เวลาเข้า/ออก หลังเวลาเริ่ม OT)
        if (inMinutes >= otCondition.startOT || outMinutes >= otCondition.startOT) {
            const otStart = Math.max(inMinutes, otCondition.startOT);
            let otEnd = outMinutes;

            // กรณีข้ามวัน
            if (otEnd < otStart) otEnd += 24 * 60;

            const otMinutes = Math.max(0, otEnd - otStart);
            if (otMinutes > 0) {
                otPeriods.push({
                    timeIn: timeIn,
                    timeOut: timeOut,
                    inMinutes: otStart,
                    outMinutes: otEnd
                });
            }
        }
    }

    return otPeriods;
};

// ฟังก์ชันช่วยเหลือ - แปลงชื่อกะ
const getShiftDescription = (shiftType: string): string => {
    const shiftMap = {
        'กะ a': 'กะ A (08:00-17:00)',
        'กะ b': 'กะ B (08:00-16:00)',
        'กะ c': 'กะ C (16:00-00:00)',
        'กะ d': 'กะ D (20:00-04:00)',
        'กะ e': 'กะ E (00:00-08:00)',
        'a': 'กะ A (08:00-17:00)',
        'b': 'กะ B (08:00-16:00)',
        'c': 'กะ C (16:00-00:00)',
        'd': 'กะ D (20:00-04:00)',
        'e': 'กะ E (00:00-08:00)',
        'กะ b/e': 'กะ B/E',
        'กะ c/b': 'กะ C/B',
        'กะ d/c': 'กะ D/C',
        'กะ e/d': 'กะ E/D'
    };

    const normalized = shiftType.toLowerCase().trim();
    return shiftMap[normalized] || 'กะ B (08:00-16:00)';
};

const getShiftName = (shiftDescription: string): string => {
    const shiftMap = {
        'กะ A (08:00-17:00)': 'shift_a',
        'กะ B (08:00-16:00)': 'shift_b',
        'กะ C (16:00-00:00)': 'shift_c',
        'กะ D (20:00-04:00)': 'shift_d',
        'กะ E (00:00-08:00)': 'shift_e',
        'กะ B/E': 'shift_b',
        'กะ C/B': 'shift_c',
        'กะ D/C': 'shift_d',
        'กะ E/D': 'shift_e'
    };

    return shiftMap[shiftDescription] || 'shift_b';
};

export const formatTimeDisplay = (timeString: string): string => {
    if (!timeString || timeString === '-') return "-";

    if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':').map(Number);
        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
    }

    try {
        const numericTime = parseFloat(timeString);
        if (!isNaN(numericTime)) {
            const totalSeconds = numericTime * 24 * 60 * 60;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
    } catch (error) {
        console.warn('Error parsing time:', timeString);
    }

    return timeString;
};

export const formatDateDisplay = (dateValue: any): string => {
    if (!dateValue || dateValue === '-') return "-";

    if (typeof dateValue === 'string') {
        try {
            const cleanDate = dateValue.toString().trim();
            const dateParts = cleanDate.split(/[/-]/);
            if (dateParts.length === 3) {
                let day, month, year;

                if (dateParts[0].length === 4) {
                    [year, month, day] = dateParts;
                } else {
                    [day, month, year] = dateParts;
                }

                let christianYear = parseInt(year);
                if (christianYear < 100) {
                    christianYear += 2000;
                } else if (christianYear > 2500) {
                    christianYear = christianYear - 543;
                }

                const date = new Date(christianYear, parseInt(month) - 1, parseInt(day));
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                }
            }
        } catch (error) {
            console.warn('Error parsing date string:', dateValue);
        }
        return dateValue;
    }

    if (typeof dateValue === 'number') {
        try {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            }
        } catch (error) {
            console.warn('Error parsing Excel date:', dateValue);
        }
    }

    return dateValue?.toString() || "-";
};

export const timeToMinutes = (timeStr: string): number => {
    if (!timeStr || timeStr === '-') return 0;

    try {
        if (timeStr.includes(':')) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) return 0;
            return hours * 60 + minutes;
        } else {
            const numericTime = parseFloat(timeStr);
            if (!isNaN(numericTime)) {
                return numericTime * 24 * 60;
            }
        }
    } catch (error) {
        console.warn('Error converting time to minutes:', timeStr);
    }
    return 0;
};

export const calculateWorkHours = (timeIn: string, timeOut: string, isOvernight: boolean = false, shiftType?: string): string => {
    // ถ้ามีกะงานกำหนด ให้คำนวณตามกะงานเท่านั้น
    if (shiftType) {
        const hours = calculateWorkHoursByShift(shiftType);
        return `${hours} ชม. 0 นาที`;
    }

    // กรณีไม่มีกะงาน (fallback ใช้ logic เดิม)
    if (!timeIn || timeIn === '-' || !timeOut || timeOut === '-') return "-";

    try {
        const inMinutes = timeToMinutes(timeIn);
        const outMinutes = timeToMinutes(timeOut);

        if (inMinutes === 0 || outMinutes === 0) return "-";

        let workMinutes: number;

        if (isOvernight) {
            workMinutes = (24 * 60 - inMinutes) + outMinutes;
        } else {
            workMinutes = outMinutes - inMinutes;
            if (workMinutes < 0) {
                workMinutes += 24 * 60;
            }
        }

        if (workMinutes < 5) {
            return "0 ชม. 0 นาที";
        }

        const hours = Math.floor(workMinutes / 60);
        const minutes = workMinutes % 60;

        if (hours === 0 && minutes === 0) return "0 ชม. 0 นาที";
        return `${hours} ชม. ${minutes} นาที`;
    } catch (error) {
        console.warn('Error calculating work hours:', error);
        return "-";
    }
};

export const calculateStatus = (timeIn: string, isOvernight: boolean = false): { status: 'present' | 'late' | 'absent' | 'incomplete'; color: string } => {
    if (!timeIn || timeIn === '-') return { status: 'absent', color: 'red' };

    try {
        let totalMinutes: number;

        if (timeIn.includes(':')) {
            const [hours, minutes] = timeIn.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) {
                return { status: 'absent', color: 'red' };
            }
            totalMinutes = hours * 60 + minutes;
        } else {
            const numericTime = parseFloat(timeIn);
            if (isNaN(numericTime)) {
                return { status: 'absent', color: 'red' };
            }
            totalMinutes = numericTime * 24 * 60;
        }

        if (totalMinutes < 0 || totalMinutes >= 24 * 60) {
            return { status: 'absent', color: 'red' };
        }

        if (isOvernight) {
            return { status: 'present', color: 'green' };
        }

        const lateThreshold = 8 * 60 + 30;

        if (totalMinutes > lateThreshold) {
            return { status: 'late', color: 'yellow' };
        }

        return { status: 'present', color: 'green' };
    } catch (error) {
        console.warn('Error calculating status for time:', timeIn);
        return { status: 'absent', color: 'red' };
    }
};

export const processCrossDayShifts = (
    timeString: string,
    date: string,
    predefinedShift?: string
): Omit<EmployeeRecord, 'id' | 'employeeId' | 'employeeName' | 'department' | 'rawData'>[] => {

    if (!timeString || timeString === '-') {
        return [{
            shiftNumber: 1,
            date,
            timeIn: '-',
            timeOut: '-',
            formattedTimeIn: '-',
            formattedTimeOut: '-',
            status: 'absent',
            statusColor: 'red',
            isOvernight: false,
            assignedShift: 'unknown',
            assignedShiftName: 'ไม่ได้กำหนด',
            workHours: 0
        }];
    }

    // เลือกกะงาน
    const finalShiftType = predefinedShift && predefinedShift !== '-' ? getShiftDescription(predefinedShift) : 'กะ B (08:00-16:00)';

    // แยกเวลา Excel
    const timeEntries = timeString.toString().split(' ').filter(t => t.trim() !== '');
    const filteredTimes = filterCloseTimes(timeEntries, 2);

    if (filteredTimes.length < 2) {
        return [{
            shiftNumber: 1,
            date,
            timeIn: filteredTimes[0] || '-',
            timeOut: filteredTimes[filteredTimes.length - 1] || '-',
            formattedTimeIn: formatTimeDisplay(filteredTimes[0] || '-'),
            formattedTimeOut: formatTimeDisplay(filteredTimes[filteredTimes.length - 1] || '-'),
            status: 'absent',
            statusColor: 'red',
            isOvernight: false,
            assignedShift: getShiftName(finalShiftType),
            assignedShiftName: finalShiftType,
            workHours: 0
        }];
    }

    // เลือกเวลาที่ใกล้กับเริ่มกะที่สุด
    const shiftTimes = getShiftTimes(finalShiftType);
    const shiftStart = timeToMinutes(shiftTimes.startTime);
    const shiftEnd = timeToMinutes(shiftTimes.endTime);

    const timeIn = filteredTimes.reduce((closest, t) => {
        return Math.abs(timeToMinutes(t) - shiftStart) <
               Math.abs(timeToMinutes(closest) - shiftStart) ? t : closest;
    }, filteredTimes[0]);

    let timeOut = filteredTimes[filteredTimes.length - 1];

    // ตรวจสอบกะข้ามวัน
    const isOvernight = shiftEnd <= shiftStart || shiftTimes.endTime === '00:00';

    // สำหรับกะข้ามวัน: ถ้า Out < In → ให้ใช้ End ของกะ
    if (isOvernight && timeToMinutes(timeOut) <= timeToMinutes(timeIn)) {
        timeOut = shiftTimes.endTime === '00:00' ? '00:00' : shiftTimes.endTime;
    }

    // คำนวณชั่วโมงงาน
    let workMinutes = timeToMinutes(timeOut) - timeToMinutes(timeIn);
    if (workMinutes < 0) workMinutes += 24 * 60;

    const workHours = Math.round((workMinutes / 60) * 100) / 100;

    // คำนวณ OT
    const otHours = calculateOvertimeFromActualTimes(finalShiftType, timeString, shiftTimes);

    // ตรวจสอบสถานะ
    const statusInfo = calculateStatus(timeIn, isOvernight);

    return [{
        shiftNumber: 1,
        date,
        timeIn,
        timeOut,
        formattedTimeIn: formatTimeDisplay(timeIn),
        formattedTimeOut: formatTimeDisplay(timeOut),
        workHours: Math.round((workHours + otHours) * 100) / 100,
        status: statusInfo.status,
        statusColor: statusInfo.color,
        isOvernight,
        assignedShift: getShiftName(finalShiftType),
        assignedShiftName: finalShiftType
    }];
};

// ฟังก์ชัน multiple shifts
export const processMultipleShifts = (
    timeString: string,
    date: string,
    predefinedShift?: string
): Omit<EmployeeRecord, 'id' | 'employeeId' | 'employeeName' | 'department' | 'rawData'>[] => {
    return processCrossDayShifts(timeString, date, predefinedShift);
};



export const validateEmployeeId = (employeeId: string): boolean => {
    if (!employeeId || employeeId === '-') return false;
    const employeeIdRegex = /^[0-9]{6,10}$/;
    return employeeIdRegex.test(employeeId);
};

export const validateFileType = (file: File): boolean => {
    const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.oasis.opendocument.spreadsheet'
    ];

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = validTypes.includes(file.type) ||
        ['xls', 'xlsx', 'ods'].includes(fileExtension || '');

    if (!isValidType) {
        return false;
    }

    if (file.size > 10 * 1024 * 1024) {
        return false;
    }

    return true;
};

// ฟังก์ชันกรองเวลาใกล้กันไม่เกิน `thresholdMinutes` นาที
export const filterCloseTimes = (times: string[], thresholdMinutes: number = 2): string[] => {
    if (times.length === 0) return [];

    const sorted = times
        .map(t => ({ original: t, minutes: timeToMinutes(t) }))
        .sort((a, b) => a.minutes - b.minutes);

    const result: string[] = [];
    let lastTime = sorted[0].original;
    result.push(lastTime);

    for (let i = 1; i < sorted.length; i++) {
        const currentTime = sorted[i].original;
        const diff = Math.abs(timeToMinutes(currentTime) - timeToMinutes(lastTime));

        if (diff > thresholdMinutes) {
            result.push(currentTime);
            lastTime = currentTime;
        }
    }

    return result;
};

// แก้ไข calculateWorkHoursByShift ให้คืนค่า number
export const calculateWorkHoursByShift = (shiftType: string): number => {
    const result = calculateShiftWithOT(shiftType, '');
    return result.shiftHours;
};

// ฟังก์ชันอื่นๆ ที่ไม่ใช้แล้วแต่ยังคงไว้เพื่อความเข้ากันได้
export const assignShiftToRecord = (
    timeIn: string,
    timeOut: string,
    allTimes: string[] = []
): { shift: string; shiftName: string } => {
    return { shift: 'shift_b', shiftName: 'กะ B (08:00-16:00)' };
};

export const analyzeWorkPattern = (times: string[]): { timeIn: string; timeOut: string; isOvernight: boolean }[] => {
    return [];
};
