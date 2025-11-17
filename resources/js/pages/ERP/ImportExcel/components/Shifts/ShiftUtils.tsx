import { Shift, EmployeeRecord } from './ImportExcel/Shifts';

export const SHIFTS: Shift[] = [
  { id: 1, name: 'shift_a', startTime: '08:00', endTime: '17:00', description: 'กะ A (08:00-17:00)', color: 'blue' },
  { id: 2, name: 'shift_b', startTime: '08:00', endTime: '16:00', description: 'กะ B (08:00-16:00)', color: 'green' },
  { id: 3, name: 'shift_c', startTime: '16:00', endTime: '00:00', description: 'กะ C (16:00-00:00)', color: 'purple' },
  { id: 4, name: 'shift_d', startTime: '20:00', endTime: '04:00', description: 'กะ D (20:00-04:00)', color: 'orange' },
  { id: 5, name: 'shift_e', startTime: '00:00', endTime: '08:00', description: 'กะ E (00:00-08:00)', color: 'red' }
];

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

export const calculateWorkHours = (timeIn: string, timeOut: string, isOvernight: boolean = false): string => {
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

export const assignShiftToRecord = (timeIn: string, timeOut: string, allTimes: string[] = []): { shift: string; shiftName: string } => {
  if (timeIn === '-' || timeOut === '-') {
    return { shift: 'unknown', shiftName: 'ไม่ได้กำหนด' };
  }

  const timeInMinutes = timeToMinutes(timeIn);
  const timeOutMinutes = timeToMinutes(timeOut);
  const isCrossDay = timeOutMinutes < timeInMinutes;

  const hasNightTime = allTimes.some(time => {
    const minutes = timeToMinutes(time);
    const hour = minutes / 60;
    return hour >= 20 || hour < 4;
  });

  const hasMorningTime = allTimes.some(time => {
    const minutes = timeToMinutes(time);
    const hour = minutes / 60;
    return hour >= 4 && hour < 12;
  });

  const hasAfternoonTime = allTimes.some(time => {
    const minutes = timeToMinutes(time);
    const hour = minutes / 60;
    return hour >= 12 && hour < 20;
  });

  if (isCrossDay) {
    if (hasNightTime && hasMorningTime) {
      return { shift: 'shift_d', shiftName: 'กะ D+E ข้ามวัน (20:00-08:00)' };
    } else if (hasNightTime) {
      return { shift: 'shift_d', shiftName: 'กะ D (20:00-04:00)' };
    }
  }

  for (const shift of SHIFTS) {
    const shiftStart = timeToMinutes(shift.startTime);
    const shiftEnd = timeToMinutes(shift.endTime);

    if (shiftStart < shiftEnd) {
      if (timeInMinutes >= shiftStart && timeInMinutes <= shiftEnd) {
        return { shift: shift.name, shiftName: shift.description };
      }
    } else {
      if (timeInMinutes >= shiftStart || timeInMinutes <= shiftEnd) {
        return { shift: shift.name, shiftName: shift.description };
      }
    }
  }

  if (hasAfternoonTime && hasNightTime) {
    return { shift: 'shift_c', shiftName: 'กะ C (16:00-00:00) + OT' };
  }

  return { shift: 'unknown', shiftName: 'ไม่ได้กำหนด' };
};

export const processCrossDayShifts = (timeString: string, date: string): Omit<EmployeeRecord, 'id' | 'employeeId' | 'employeeName' | 'department' | 'rawData'>[] => {
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
      assignedShiftName: 'ไม่ได้กำหนด'
    }];
  }

  const timeEntries = timeString.toString().split(' ').filter((t: string) => t.trim() !== '');

  if (timeEntries.length === 0) {
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
      assignedShiftName: 'ไม่ได้กำหนด'
    }];
  }

  const timeEntriesWithMinutes = timeEntries.map(time => ({
    original: time,
    formatted: formatTimeDisplay(time),
    minutes: timeToMinutes(time)
  }));

  const uniqueTimes = timeEntriesWithMinutes.filter((time, index, self) =>
    index === self.findIndex(t => t.minutes === time.minutes)
  );

  const sortedTimes = uniqueTimes.sort((a, b) => a.minutes - b.minutes);

  const shifts: Omit<EmployeeRecord, 'id' | 'employeeId' | 'employeeName' | 'department' | 'rawData'>[] = [];

  if (sortedTimes.length >= 2) {
    const timeIn = sortedTimes[0].original;
    const timeOut = sortedTimes[sortedTimes.length - 1].original;
    const isOvernight = timeToMinutes(timeOut) < timeToMinutes(timeIn);

    const hasNightTime = sortedTimes.some(time => {
      const hour = time.minutes / 60;
      return hour >= 20 || hour < 8;
    });

    const hasMorningTime = sortedTimes.some(time => {
      const hour = time.minutes / 60;
      return hour >= 4 && hour < 12;
    });

    const statusInfo = calculateStatus(timeIn, isOvernight);
    const workHours = calculateWorkHours(timeIn, timeOut, isOvernight);
    const shiftAssignment = assignShiftToRecord(timeIn, timeOut, timeEntries);

    shifts.push({
      shiftNumber: 1,
      date,
      timeIn,
      timeOut,
      formattedTimeIn: sortedTimes[0].formatted,
      formattedTimeOut: sortedTimes[sortedTimes.length - 1].formatted,
      workHours,
      status: statusInfo.status,
      statusColor: statusInfo.color,
      isOvernight,
      assignedShift: shiftAssignment.shift,
      assignedShiftName: shiftAssignment.shiftName
    });

    if (sortedTimes.length > 2 && isOvernight) {
      const nightTimes = sortedTimes.filter(time => {
        const hour = time.minutes / 60;
        return hour >= 20 || hour < 4;
      });

      const morningTimes = sortedTimes.filter(time => {
        const hour = time.minutes / 60;
        return hour >= 4 && hour < 12;
      });

      if (nightTimes.length >= 2) {
        const nightIn = nightTimes[0].original;
        const nightOut = nightTimes[nightTimes.length - 1].original;

        shifts.push({
          shiftNumber: 2,
          date,
          timeIn: nightIn,
          timeOut: nightOut,
          formattedTimeIn: nightTimes[0].formatted,
          formattedTimeOut: nightTimes[nightTimes.length - 1].formatted,
          workHours: calculateWorkHours(nightIn, nightOut, false),
          status: 'present',
          statusColor: 'green',
          isOvernight: false,
          assignedShift: 'shift_d',
          assignedShiftName: 'กะ D ส่วนแรก (20:00-23:59)'
        });
      }

      if (morningTimes.length >= 2) {
        const morningIn = morningTimes[0].original;
        const morningOut = morningTimes[morningTimes.length - 1].original;
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });

        shifts.push({
          shiftNumber: 3,
          date: nextDayStr,
          timeIn: morningIn,
          timeOut: morningOut,
          formattedTimeIn: morningTimes[0].formatted,
          formattedTimeOut: morningTimes[morningTimes.length - 1].formatted,
          workHours: calculateWorkHours(morningIn, morningOut, false),
          status: 'present',
          statusColor: 'green',
          isOvernight: true,
          assignedShift: 'shift_e',
          assignedShiftName: 'กะ E ส่วนสอง (00:00-08:00)'
        });
      }
    }
  } else if (sortedTimes.length === 1) {
    const shiftAssignment = assignShiftToRecord(sortedTimes[0].original, '-', timeEntries);

    shifts.push({
      shiftNumber: 1,
      date,
      timeIn: sortedTimes[0].original,
      timeOut: '-',
      formattedTimeIn: sortedTimes[0].formatted,
      formattedTimeOut: '-',
      status: 'incomplete',
      statusColor: 'orange',
      isOvernight: false,
      assignedShift: shiftAssignment.shift,
      assignedShiftName: shiftAssignment.shiftName
    });
  }

  if (shifts.length === 0) {
    shifts.push({
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
      assignedShiftName: 'ไม่ได้กำหนด'
    });
  }

  return shifts;
};

export const processMultipleShifts = (timeString: string, date: string): Omit<EmployeeRecord, 'id' | 'employeeId' | 'employeeName' | 'department' | 'rawData'>[] => {
  return processCrossDayShifts(timeString, date);
};

export const validateEmployeeId = (employeeId: string): boolean => {
  if (!employeeId || employeeId === '-') return false;
  const employeeIdRegex = /^[0-9]{6,10}$/;
  return employeeIdRegex.test(employeeId);
};
