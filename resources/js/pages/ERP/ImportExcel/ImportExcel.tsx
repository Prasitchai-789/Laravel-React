import AppLayout from "@/layouts/app-layout";
import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { Breadcrumb, EmployeeRecord, FilterState, UploadSummary } from "./components/Shifts/ShiftTypes";
import {
    validateFileType,
    processMultipleShifts,
    validateEmployeeId,
    formatDateDisplay,
    calculateStatus,
    calculateWorkHours,
    assignShiftToRecord,
    timeToMinutes
} from "./components/Shifts/ShiftUtils";
import { FileUploadArea } from "./components/Upload/FileUploadArea";
import { UploadProgress } from "./components/Upload/UploadProgress";
import { FileInfo } from "./components/Upload/FileInfo";
import { DataTable } from "./Data/DataTable";
import { DataFilters } from "./Data/DataFilters";
import { DataSummary } from "./Data/DataSummary";

const breadcrumbs: Breadcrumb[] = [
    { title: "Home", href: "/dashboard" },
    { title: "ERP", href: "/ERPIndex" },
    { title: "Import Excel", href: "/import-excel" },
];

// ฟังก์ชัน formatTimeDisplay ที่สมบูรณ์
const formatTimeDisplay = (time: string): string => {
    if (!time || time === '-' || time === '00:00' || time === '00:00:00') return '-';

    // ถ้ามีวินาที ให้ตัดออก
    if (time.includes(':') && time.split(':').length === 3) {
        return time.slice(0, 5);
    }

    return time;
};

// ฟังก์ชันแปลงรูปแบบวันที่ - เวอร์ชันปรับปรุง
const parseThaiDate = (dateStr: string): Date | null => {
    try {
        if (!dateStr || dateStr === '-') return null;

        const [day, month, year] = dateStr.split('/').map(Number);
        if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) return null;

        // ตรวจสอบว่าปีเป็นพุทธศักราช (มากกว่า 2500) หรือคริสต์ศักราช
        const buddhistYear = year > 2500 ? year - 543 : year;
        return new Date(buddhistYear, month - 1, day);
    } catch {
        return null;
    }
};

// ฟังก์ชันเรียงลำดับวันที่ไทย
const sortThaiDates = (dates: string[]): string[] => {
    return dates.sort((a, b) => {
        const dateA = parseThaiDate(a);
        const dateB = parseThaiDate(b);

        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
    });
};

// ฟังก์ชันตรวจสอบและปรับกะโดยดูจากข้อมูลวันถัดไป
const validateAndAdjustShift = (
    shift: any,
    departmentFromFile: string,
    employeeId: string,
    date: string,
    allRecords: EmployeeRecord[]
): { shift: string; shiftName: string; warning: string } => {
    const normalizedDept = departmentFromFile.toLowerCase().trim();

    // ✅ ถ้ามีกะจากไฟล์ → บังคับใช้กะนั้น ไม่สนใจเวลาจริง
    if (departmentFromFile && departmentFromFile !== '-') {
        const shiftMap: { [key: string]: { shift: string; shiftName: string } } = {
            'กะ a': { shift: 'shift_a', shiftName: 'กะ A (08:00-17:00)' },
            'กะ b': { shift: 'shift_b', shiftName: 'กะ B (08:00-16:00)' },
            'กะ c': { shift: 'shift_c', shiftName: 'กะ C (16:00-00:00)' },
            'กะ d': { shift: 'shift_d', shiftName: 'กะ D (20:00-04:00)' },
            'กะ e': { shift: 'shift_e', shiftName: 'กะ E (00:00-08:00)' },
            'กะ b/e': { shift: 'shift_b_e', shiftName: 'กะ B/E (ข้ามวัน)' },
            'กะ c/b': { shift: 'shift_c_b', shiftName: 'กะ C/B (ข้ามวัน)' },
            'กะ e/d': { shift: 'shift_e_d', shiftName: 'กะ E/D (ข้ามวัน)' },
            'a': { shift: 'shift_a', shiftName: 'กะ A (08:00-17:00)' },
            'b': { shift: 'shift_b', shiftName: 'กะ B (08:00-16:00)' },
            'c': { shift: 'shift_c', shiftName: 'กะ C (16:00-00:00)' },
            'd': { shift: 'shift_d', shiftName: 'กะ D (20:00-04:00)' },
            'e': { shift: 'shift_e', shiftName: 'กะ E (00:00-08:00)' },
            'b/e': { shift: 'shift_b_e', shiftName: 'กะ B/E (ข้ามวัน)' },
            'c/b': { shift: 'shift_c_b', shiftName: 'กะ C/B (ข้ามวัน)' },
            'e/d': { shift: 'shift_e_d', shiftName: 'กะ E/D (ข้ามวัน)' }
        };

        const mappedShift = shiftMap[normalizedDept];
        if (mappedShift) {
            return {
                shift: mappedShift.shift,
                shiftName: mappedShift.shiftName,
                warning: ''
            };
        }
    }

    // Fallback: คำนวณจากเวลาจริง (กรณีไม่มีกะจากไฟล์)
    const calculatedShift = assignShiftToRecord(shift.timeIn, shift.timeOut);
    return {
        shift: calculatedShift.shift,
        shiftName: calculatedShift.shiftName,
        warning: ''
    };
};

// ฟังก์ชันตรวจสอบความสอดคล้องของกะข้ามวัน
const validateOvernightShiftConsistency = (
    currentRecord: EmployeeRecord,
    allRecords: EmployeeRecord[],
    departmentFromFile: string
): { isValid: boolean; message: string } => {
    const normalizedDept = departmentFromFile.toLowerCase().trim();

    // กะที่ข้ามวัน
    const overnightShifts = ['d', 'e', 'b/e', 'c/b', 'e/d', 'กะ d', 'กะ e', 'กะ b/e', 'กะ c/b', 'กะ e/d'];

    if (!overnightShifts.includes(normalizedDept)) {
        return { isValid: true, message: '' };
    }

    try {
        // แปลงวันที่ไทยเป็น Date object
        const currentDate = parseThaiDate(currentRecord.date);
        if (!currentDate) {
            return {
                isValid: false,
                message: `กะ ${departmentFromFile}: วันที่ไม่ถูกต้อง`
            };
        }

        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);

        // แปลงกลับเป็นรูปแบบไทย
        const nextDay = nextDate.getDate();
        const nextMonth = nextDate.getMonth() + 1;
        const nextYear = nextDate.getFullYear() + 543;
        const nextDateFormatted = `${nextDay}/${nextMonth}/${nextYear}`;

        // หาข้อมูลของวันถัดไปทั้งหมด
        const nextDayRecords = allRecords.filter(record =>
            record.employeeId === currentRecord.employeeId &&
            record.date === nextDateFormatted
        );

        if (nextDayRecords.length === 0) {
            return {
                isValid: false,
                message: `กะ ${departmentFromFile}: ไม่พบข้อมูลวันถัดไป (${nextDateFormatted}) สำหรับการทำงานข้ามวัน`
            };
        }

        return { isValid: true, message: '' };
    } catch (error) {
        return {
            isValid: false,
            message: `กะ ${departmentFromFile}: เกิดข้อผิดพลาดในการตรวจสอบข้อมูลข้ามวัน`
        };
    }
};

export default function ImportExcel() {
    const [uploadedData, setUploadedData] = useState<EmployeeRecord[]>([]);
    const [filteredData, setFilteredData] = useState<EmployeeRecord[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string>("");
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadError, setUploadError] = useState<string>("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<EmployeeRecord>>({});
    const [showFilters, setShowFilters] = useState<boolean>(true);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });
    const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [filters, setFilters] = useState<FilterState>({
        department: '',
        shift: '',
        date: '',
        status: '',
        employeeId: '',
        employeeName: ''
    });

    // เรียงข้อมูลตามวันที่เมื่อโหลดข้อมูลใหม่
    useEffect(() => {
        if (uploadedData.length > 0) {
            const sortedData = [...uploadedData].sort((a, b) => {
                const dateA = parseThaiDate(a.date);
                const dateB = parseThaiDate(b.date);

                if (!dateA || !dateB) return 0;
                return dateA.getTime() - dateB.getTime();
            });

            // อัพเดทเฉพาะถ้ายังไม่ได้เรียงลำดับ
            if (JSON.stringify(sortedData) !== JSON.stringify(uploadedData)) {
                setUploadedData(sortedData);
            }
        }
    }, [uploadedData.length]); // ใช้ uploadedData.length เป็น dependency

    // Filter logic
    const applyFilters = (data: EmployeeRecord[]) => {
        return data.filter(record => {
            if (filters.department && record.department !== filters.department) return false;
            if (filters.shift && record.assignedShift !== filters.shift) return false;
            if (filters.date && record.date !== filters.date) return false;
            if (filters.status && record.status !== filters.status) return false;
            if (filters.employeeId && !record.employeeId.includes(filters.employeeId)) return false;
            if (filters.employeeName && !record.employeeName.toLowerCase().includes(filters.employeeName.toLowerCase())) return false;
            return true;
        });
    };

    const resetFilters = () => {
        setFilters({
            department: '',
            shift: '',
            date: '',
            status: '',
            employeeId: '',
            employeeName: ''
        });
    };

    useEffect(() => {
        const filtered = applyFilters(uploadedData);
        setFilteredData(filtered);
    }, [uploadedData, filters]);

    // Sort logic - ปรับปรุงให้เรียงตามวันที่โดยอัตโนมัติ
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedData = [...filteredData].sort((a, b) => {
            let aValue: any = a[key as keyof EmployeeRecord];
            let bValue: any = b[key as keyof EmployeeRecord];

            if (key === 'date') {
                const dateA = parseThaiDate(aValue);
                const dateB = parseThaiDate(bValue);
                if (dateA && dateB) {
                    aValue = dateA.getTime();
                    bValue = dateB.getTime();
                } else if (!dateA && dateB) {
                    return direction === 'asc' ? -1 : 1;
                } else if (dateA && !dateB) {
                    return direction === 'asc' ? 1 : -1;
                } else {
                    return 0;
                }
            } else if (key === 'formattedTimeIn' || key === 'formattedTimeOut') {
                aValue = timeToMinutes(aValue);
                bValue = timeToMinutes(bValue);
            } else if (key === 'employeeId') {
                aValue = parseInt(aValue) || 0;
                bValue = parseInt(bValue) || 0;
            } else if (key === 'employeeName') {
                aValue = aValue?.toLowerCase() || '';
                bValue = bValue?.toLowerCase() || '';
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredData(sortedData);
    };

    // File handling
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        setUploadError("");
        setValidationWarnings([]);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (validateFileType(file)) {
                processExcelFile(file);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (validateFileType(file)) {
                setUploadError("");
                setValidationWarnings([]);
                processExcelFile(file);
            }
        }
    };

    const processExcelFile = (file: File) => {
        setIsLoading(true);
        setUploadProgress(0);
        setFileName(file.name);
        setValidationWarnings([]);

        const reader = new FileReader();

        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                const progress = (e.loaded / e.total) * 100;
                setUploadProgress(progress);
            }
        };

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length <= 1) {
                    setUploadError("ไม่พบข้อมูลในไฟล์ Excel");
                    setIsLoading(false);
                    return;
                }

                const headers = jsonData[0] as string[];
                const rows = jsonData.slice(1) as any[][];

                const requiredHeaders = ['รหัสพนักงาน', 'ชื่อพนักงาน', 'แผนก', 'วันที่', 'เวลา'];
                const headerMapping: { [key: string]: string } = {
                    'รหัสที่เครื่อง': 'รหัสพนักงาน',
                    'ชื่อพนง.': 'ชื่อพนักงาน',
                    'รหัส': 'รหัสพนักงาน',
                    'ชื่อ': 'ชื่อพนักงาน',
                    'แผนก/กะ': 'แผนก',
                    'เวลาทำงาน': 'เวลา'
                };

                const normalizedHeaders = headers.map(header => {
                    const cleanHeader = header.toString().trim();
                    return headerMapping[cleanHeader] || cleanHeader;
                });

                const missingHeaders = requiredHeaders.filter(header => !normalizedHeaders.includes(header));

                if (missingHeaders.length > 0) {
                    setUploadError(`รูปแบบไฟล์ไม่ถูกต้อง - ไม่พบคอลัมน์: ${missingHeaders.join(', ')}`);
                    setIsLoading(false);
                    return;
                }

                const formattedData: EmployeeRecord[] = [];
                const warnings: string[] = [];
                let recordId = 1;

                // Process each row
                rows.forEach((row, index) => {
                    try {
                        // ข้ามแถวว่าง
                        if (row.every(cell => !cell || cell.toString().trim() === '')) {
                            return;
                        }

                        const rowData: { [key: string]: any } = {};
                        headers.forEach((header, colIndex) => {
                            const normalizedHeader = headerMapping[header] || header;
                            const cellValue = row[colIndex];
                            rowData[normalizedHeader] = cellValue !== undefined && cellValue !== null
                                ? cellValue.toString().trim()
                                : '-';
                        });

                        const employeeId = rowData['รหัสพนักงาน']?.toString().trim();
                        const employeeName = rowData['ชื่อพนักงาน']?.toString().trim();
                        const departmentFromFile = rowData['แผนก']?.toString().trim();

                        if (!employeeId || employeeId === '-' || !employeeName || employeeName === '-') {
                            return;
                        }

                        if (!validateEmployeeId(employeeId)) {
                            warnings.push(`❌ แถวที่ ${index + 2}: รหัสพนักงานไม่ถูกต้อง "${employeeId}"`);
                            return;
                        }

                        const formattedDate = formatDateDisplay(rowData['วันที่']);
                        if (!formattedDate || formattedDate === '-') {
                            warnings.push(`❌ แถวที่ ${index + 2}: วันที่ไม่ถูกต้อง "${rowData['วันที่']}"`);
                            return;
                        }

                        const timeData = rowData['เวลา']?.toString() || '-';

                        // ✅ แก้ไขตรงนี้: ส่ง departmentFromFile ไปเป็น predefinedShift
                        const shifts = processMultipleShifts(timeData, formattedDate, departmentFromFile);

                        shifts.forEach(shift => {
                            // ตรวจสอบและปรับกะโดยดูจากข้อมูลวันถัดไป
                            const shiftValidation = validateAndAdjustShift(
                                shift,
                                departmentFromFile,
                                employeeId,
                                formattedDate,
                                formattedData
                            );

                            let finalShift = shiftValidation.shift;
                            let finalShiftName = shiftValidation.shiftName;

                            const record: EmployeeRecord = {
                                id: recordId++,
                                employeeId,
                                employeeName,
                                department: departmentFromFile || '-',
                                ...shift,
                                assignedShift: finalShift,
                                assignedShiftName: finalShiftName,
                                shiftConsistencyWarning: shiftValidation.warning,
                                rawData: rowData
                            };

                            formattedData.push(record);

                            // ตรวจสอบความสอดคล้องของกะข้ามวัน
                            if (departmentFromFile && departmentFromFile !== '-') {
                                const overnightConsistency = validateOvernightShiftConsistency(
                                    record,
                                    formattedData,
                                    departmentFromFile
                                );

                                if (!overnightConsistency.isValid) {
                                    warnings.push(
                                        `🌙 ${employeeName} (${employeeId}) วันที่ ${formattedDate}: ${overnightConsistency.message}`
                                    );
                                }
                            }
                        });

                    } catch (error) {
                        console.warn(`Error processing row ${index + 1}:`, error);
                        warnings.push(`❌ แถวที่ ${index + 2}: เกิดข้อผิดพลาดในการประมวลผล`);
                    }
                });

                // เรียงลำดับข้อมูลตามวันที่ก่อนตั้งค่า state
                const sortedFormattedData = formattedData.sort((a, b) => {
                    const dateA = parseThaiDate(a.date);
                    const dateB = parseThaiDate(b.date);

                    if (!dateA || !dateB) return 0;
                    return dateA.getTime() - dateB.getTime();
                });

                if (sortedFormattedData.length === 0) {
                    setUploadError("ไม่พบข้อมูลที่ถูกต้องในไฟล์ Excel");
                } else {
                    setUploadedData(sortedFormattedData);
                    setValidationWarnings(warnings);
                }

                setUploadProgress(100);
            } catch (error) {
                console.error('Error processing Excel file:', error);
                setUploadError("เกิดข้อผิดพลาดในการอ่านไฟล์ Excel");
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            setIsLoading(false);
            setUploadError("เกิดข้อผิดพลาดในการอ่านไฟล์");
        };

        reader.readAsArrayBuffer(file);
    };

    // Edit handling
    const handleEdit = (record: EmployeeRecord) => {
        setEditingId(record.id);
        setEditForm({
            employeeId: record.employeeId,
            employeeName: record.employeeName,
            department: record.department,
            date: record.date,
            timeIn: record.timeIn,
            timeOut: record.timeOut
        });
    };

    const handleSaveEdit = (id: number) => {
        const updatedData = uploadedData.map(item => {
            if (item.id === id) {
                const updatedTimeIn = editForm.timeIn || item.timeIn;
                const updatedTimeOut = editForm.timeOut || item.timeOut;
                const isOvernight = timeToMinutes(updatedTimeOut) < timeToMinutes(updatedTimeIn);

                let status: EmployeeRecord['status'];
                let statusColor: string;

                if (updatedTimeIn === '-' || updatedTimeOut === '-') {
                    if (updatedTimeIn !== '-' && updatedTimeOut === '-') {
                        status = 'incomplete';
                        statusColor = 'orange';
                    } else {
                        status = 'absent';
                        statusColor = 'red';
                    }
                } else {
                    const statusInfo = calculateStatus(updatedTimeIn, isOvernight);
                    status = statusInfo.status;
                    statusColor = statusInfo.color;
                }

                const workHours = updatedTimeOut !== '-'
                    ? calculateWorkHours(updatedTimeIn, updatedTimeOut, isOvernight, item.assignedShiftName)
                    : undefined;

                // คำนวณกะใหม่จากเวลาที่แก้ไข
                const calculatedShift = assignShiftToRecord(updatedTimeIn, updatedTimeOut);

                return {
                    ...item,
                    employeeId: editForm.employeeId || item.employeeId,
                    employeeName: editForm.employeeName || item.employeeName,
                    department: editForm.department || item.department,
                    date: editForm.date || item.date,
                    timeIn: updatedTimeIn,
                    timeOut: updatedTimeOut,
                    formattedTimeIn: formatTimeDisplay(updatedTimeIn),
                    formattedTimeOut: formatTimeDisplay(updatedTimeOut),
                    workHours,
                    status,
                    statusColor,
                    isOvernight,
                    assignedShift: calculatedShift.shift,
                    assignedShiftName: calculatedShift.shiftName
                };
            }
            return item;
        });

        // เรียงลำดับข้อมูลใหม่หลังจากแก้ไข
        const sortedUpdatedData = updatedData.sort((a, b) => {
            const dateA = parseThaiDate(a.date);
            const dateB = parseThaiDate(b.date);

            if (!dateA || !dateB) return 0;
            return dateA.getTime() - dateB.getTime();
        });

        setUploadedData(sortedUpdatedData);
        setEditingId(null);
        setEditForm({});
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleDelete = (id: number) => {
        if (confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?')) {
            const updatedData = uploadedData.filter(item => item.id !== id);
            setUploadedData(updatedData);
        }
    };

    const handleEditFormChange = (field: keyof EmployeeRecord, value: string) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleUpload = async () => {
        if (uploadedData.length === 0) {
            setUploadError("กรุณาเลือกไฟล์ Excel ก่อน");
            return;
        }

        setIsLoading(true);
        setUploadProgress(0);

        try {
            for (let i = 0; i <= 100; i += 20) {
                setUploadProgress(i);
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            console.log('Data to be uploaded:', {
                records: uploadedData,
                fileName: fileName,
                uploadDate: new Date().toISOString(),
                summary: {
                    total: uploadedData.length,
                    present: uploadedData.filter(item => item.status === 'present').length,
                    late: uploadedData.filter(item => item.status === 'late').length,
                    absent: uploadedData.filter(item => item.status === 'absent').length,
                    incomplete: uploadedData.filter(item => item.status === 'incomplete').length,
                }
            });

            await new Promise(resolve => setTimeout(resolve, 1000));
            setUploadProgress(100);

            alert(`อัพโหลดข้อมูลสำเร็จ! ${uploadedData.length} แถว`);
            handleClear();

        } catch (error) {
            console.error('Upload error:', error);
            setUploadError("เกิดข้อผิดพลาดในการอัพโหลดข้อมูล");
        } finally {
            setIsLoading(false);
            setUploadProgress(0);
        }
    };

    const handleClear = () => {
        setUploadedData([]);
        setFilteredData([]);
        setFileName("");
        setUploadError("");
        setUploadProgress(0);
        setEditingId(null);
        setEditForm({});
        setValidationWarnings([]);
        resetFilters();
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const downloadTemplate = () => {
        const templateData = [
            ['รหัสพนักงาน', 'ชื่อพนักงาน', 'แผนก', 'วันที่', 'เวลา'],
            ['201610078', 'สีสมุทร หอมจันทร์', 'กะ c', '1/9/2568', '08:01 15:32 15:32'],
            ['201610078', 'สีสมุทร หอมจันทร์', 'กะ d', '10/9/2568', '08:00 08:01 19:21 19:22'],
            ['201610078', 'สีสมุทร หอมจันทร์', 'กะ e', '11/9/2568', '23:21 23:22'],
            ['', '', '', '', ''],
            ['หมายเหตุ:'],
            ['- รหัสพนักงาน: ให้ใช้รหัสที่ใช้ลงเวลาทำงาน (ต้องเป็นตัวเลข 6-10 หลัก)'],
            ['- ชื่อพนักงาน: ให้ใช้ชื่อ-นามสกุลจริง'],
            ['- แผนก: ให้ใส่แผนกหรือกะการทำงาน (กะ a, กะ b, กะ c, กะ d, กะ e, กะ b/e, กะ c/b, กะ e/d)'],
            ['- วันที่: ให้ใช้รูปแบบ วันที่/เดือน/ปี (เช่น 1/9/2568)'],
            ['- เวลา: ให้คั่นด้วยช่องว่าง'],
            ['- ระบบจะตรวจสอบความต่อเนื่องของกะข้ามวันอัตโนมัติ'],
            ['- สำหรับกะข้ามวัน ระบบจะตรวจสอบข้อมูลวันถัดไปด้วย'],
            ['- เวลาเข้างานหลัง 8:30 น. จะถือว่าสาย'],
            ['- สามารถมีหลายกะต่อวันได้']
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "template_import_attendance.xlsx");
    };

    const summary: UploadSummary = {
        total: uploadedData.length,
        present: uploadedData.filter(item => item.status === 'present').length,
        late: uploadedData.filter(item => item.status === 'late').length,
        absent: uploadedData.filter(item => item.status === 'absent').length,
        incomplete: uploadedData.filter(item => item.status === 'incomplete').length,
        departments: [...new Set(uploadedData.map(item => item.department))],
        dates: sortThaiDates([...new Set(uploadedData.map(item => item.date))]),
        shifts: [...new Set(uploadedData.map(item => item.assignedShift).filter(Boolean))] as string[]
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">นำเข้าข้อมูล Excel</h1>
                        <p className="text-gray-600 mt-2">
                            อัพโหลดไฟล์ Excel เพื่อนำเข้าข้อมูลการเข้างานของพนักงาน (รองรับ Multiple Shifts และการข้ามวัน)
                        </p>
                    </div>
                    <button
                        onClick={downloadTemplate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        ดาวน์โหลด Template
                    </button>
                </div>

                {uploadError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="text-red-700">{uploadError}</span>
                        </div>
                    </div>
                )}

                {/* Validation Warnings */}
                {validationWarnings.length > 0 && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                            <span className="text-yellow-700 font-medium">พบข้อควรระวังในการตรวจสอบกะ</span>
                        </div>
                        <ul className="text-sm text-yellow-700 space-y-1 max-h-40 overflow-y-auto">
                            {validationWarnings.map((warning, index) => (
                                <li key={index}>• {warning}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Upload Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">อัพโหลดไฟล์</h2>

                            <FileUploadArea
                                isDragging={isDragging}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onFileSelect={handleFileSelect}
                                fileInputRef={fileInputRef}
                            />

                            <UploadProgress isLoading={isLoading} uploadProgress={uploadProgress} />

                            <FileInfo
                                fileName={fileName}
                                recordCount={uploadedData.length}
                                onClear={handleClear}
                            />

                            {/* Upload Button */}
                            <div className="mt-6">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploadedData.length === 0 || isLoading}
                                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${uploadedData.length === 0 || isLoading
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {uploadProgress < 100 ? 'กำลังอัพโหลด...' : 'กำลังบันทึก...'}
                                        </div>
                                    ) : (
                                        `อัพโหลดข้อมูล (${uploadedData.length} กะ)`
                                    )}
                                </button>
                            </div>

                            {/* Instructions */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <h3 className="font-medium text-blue-800 mb-2">รูปแบบไฟล์ที่ต้องการ</h3>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• ต้องมีคอลัมน์: <strong>รหัสพนักงาน, ชื่อพนักงาน, แผนก, วันที่, เวลา</strong></li>
                                    <li>• รหัสพนักงานต้องเป็น<strong>ตัวเลข 6-10 หลัก</strong></li>
                                    <li>• ข้อมูลวันที่ควรอยู่ในรูปแบบ <strong>วันที่/เดือน/ปี</strong></li>
                                    <li>• ข้อมูลเวลาให้คั่นด้วย<strong>ช่องว่าง</strong></li>
                                    <li>• รองรับ<strong>Multiple Shifts</strong> ต่อวัน</li>
                                    <li>• รองรับ<strong>การทำงานข้ามวัน</strong> อัตโนมัติ</li>
                                    <li>• ระบบ<strong>ตรวจสอบความต่อเนื่องของกะข้ามวัน</strong></li>
                                    <li>• เวลาเข้างานหลัง <strong>8:30 น.</strong> จะถือว่าสาย</li>
                                </ul>
                            </div>
                        </div>

                        {/* Summary Card */}
                        {uploadedData.length > 0 && (
                            <DataSummary summary={summary} />
                        )}
                    </div>

                    {/* Right Column - Data Preview with Edit */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">ตัวอย่างข้อมูล</h2>
                                {uploadedData.length > 0 && (
                                    <div className="text-sm text-gray-500">
                                        แสดง {Math.min(filteredData.length, 50)} จาก {filteredData.length} กะ
                                        {filteredData.length !== uploadedData.length && (
                                            <span className="text-blue-600 ml-1">(กรองแล้ว)</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Filter Section */}
                            {uploadedData.length > 0 && (
                                <DataFilters
                                    filters={filters}
                                    summary={summary}
                                    showFilters={showFilters}
                                    onFilterChange={setFilters}
                                    onToggleFilters={() => setShowFilters(!showFilters)}
                                    onResetFilters={resetFilters}
                                    filteredCount={filteredData.length}
                                    totalCount={uploadedData.length}
                                />
                            )}

                            <DataTable
                                data={filteredData}
                                editingId={editingId}
                                editForm={editForm}
                                onEdit={handleEdit}
                                onSaveEdit={handleSaveEdit}
                                onCancelEdit={handleCancelEdit}
                                onDelete={handleDelete}
                                onSort={handleSort}
                                sortConfig={sortConfig}
                                onEditFormChange={handleEditFormChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
