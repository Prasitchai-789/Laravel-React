import AppLayout from "@/layouts/app-layout";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";

interface Breadcrumb {
  title: string;
  href: string;
}

interface EmployeeRecord {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  time: string;
  formattedTime: string;
  status: 'present' | 'late' | 'absent';
  statusColor: string;
  rawData: any;
}

interface UploadSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  departments: string[];
  dates: string[];
}

const breadcrumbs: Breadcrumb[] = [
  { title: "Home", href: "/dashboard" },
  { title: "ERP", href: "/ERPIndex" },
  { title: "Import Excel", href: "/import-excel" },
];

// ฟังก์ชันแปลงเวลาให้อยู่ในรูปแบบที่อ่านง่าย
const formatTimeDisplay = (timeString: string): string => {
  if (!timeString || timeString === '-') return "-";

  const times = timeString.toString().split(' ').filter((t: string) => t.trim() !== '');
  return times.map(time => {
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':').map(Number);
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        return time;
      }
    }

    try {
      const numericTime = parseFloat(time);
      if (!isNaN(numericTime)) {
        const totalSeconds = numericTime * 24 * 60 * 60;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    } catch (error) {
      console.warn('Error parsing time:', time);
    }

    return time;
  }).join(' → ');
};

// ฟังก์ชันแปลงวันที่จาก Excel serial number หรือ string
const formatDateDisplay = (dateValue: any): string => {
  if (!dateValue || dateValue === '-') return "-";

  if (typeof dateValue === 'string') {
    try {
      const dateParts = dateValue.split(/[/-]/);
      if (dateParts.length === 3) {
        let day, month, year;

        if (dateParts[0].length === 4) {
          [year, month, day] = dateParts;
        } else {
          [day, month, year] = dateParts;
        }

        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('th-TH');
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
        return date.toLocaleDateString('th-TH');
      }
    } catch (error) {
      console.warn('Error parsing Excel date:', dateValue);
    }
  }

  return dateValue?.toString() || "-";
};

// ฟังก์ชันคำนวณสถานะการทำงาน
const calculateStatus = (timeString: string): { status: 'present' | 'late' | 'absent'; color: string } => {
  if (!timeString || timeString === '-') return { status: 'absent', color: 'red' };

  const times = timeString.toString().split(' ').filter((t: string) => t.trim() !== '');
  if (times.length === 0) return { status: 'absent', color: 'red' };

  const firstCheckIn = times[0];
  if (!firstCheckIn || firstCheckIn === '-') return { status: 'absent', color: 'red' };

  try {
    let hours: number, minutes: number;

    if (firstCheckIn.includes(':')) {
      const timeParts = firstCheckIn.split(':').map(Number);
      if (timeParts.length >= 2) {
        hours = timeParts[0];
        minutes = timeParts[1];
      } else {
        return { status: 'absent', color: 'red' };
      }
    } else {
      const numericTime = parseFloat(firstCheckIn);
      if (isNaN(numericTime)) {
        return { status: 'absent', color: 'red' };
      }
      const totalMinutes = numericTime * 24 * 60;
      hours = Math.floor(totalMinutes / 60);
      minutes = Math.floor(totalMinutes % 60);
    }

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) {
      return { status: 'absent', color: 'red' };
    }

    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes > 8 * 60 + 30) {
      return { status: 'late', color: 'yellow' };
    }

    return { status: 'present', color: 'green' };
  } catch (error) {
    console.warn('Error calculating status for time:', firstCheckIn);
    return { status: 'absent', color: 'red' };
  }
};

// ฟังก์ชันตรวจสอบรหัสพนักงาน
const validateEmployeeId = (employeeId: string): boolean => {
  if (!employeeId || employeeId === '-') return false;
  const employeeIdRegex = /^[0-9]{6,10}$/;
  return employeeIdRegex.test(employeeId);
};

export default function ImportExcel() {
  const [uploadedData, setUploadedData] = useState<EmployeeRecord[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<EmployeeRecord>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ฟังก์ชันตรวจสอบประเภทไฟล์
  const validateFileType = (file: File): boolean => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet'
    ];

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = validTypes.includes(file.type) ||
                       ['xls', 'xlsx', 'ods'].includes(fileExtension || '');

    if (!isValidType) {
      setUploadError("กรุณาเลือกไฟล์ Excel (.xlsx, .xls) เท่านั้น");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("ขนาดไฟล์ต้องไม่เกิน 10MB");
      return false;
    }

    return true;
  };

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
        processExcelFile(file);
      }
    }
  };

  const processExcelFile = (file: File) => {
    setIsLoading(true);
    setUploadProgress(0);
    setFileName(file.name);

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

        // ตรวจสอบคอลัมน์ที่จำเป็น (รองรับทั้งชื่อเดิมและชื่อใหม่)
        const requiredHeaders = ['รหัสพนักงาน', 'ชื่อพนักงาน', 'แผนก', 'วันที่', 'เวลา'];
        const alternativeHeaders = ['รหัสที่เครื่อง', 'ชื่อพนง.'];

        const headerMapping: { [key: string]: string } = {
          'รหัสที่เครื่อง': 'รหัสพนักงาน',
          'ชื่อพนง.': 'ชื่อพนักงาน'
        };

        const normalizedHeaders = headers.map(header => headerMapping[header] || header);

        const missingHeaders = requiredHeaders.filter(header => !normalizedHeaders.includes(header));

        if (missingHeaders.length > 0) {
          setUploadError(`รูปแบบไฟล์ไม่ถูกต้อง - ไม่พบคอลัมน์: ${missingHeaders.join(', ')}`);
          setIsLoading(false);
          return;
        }

        const formattedData: EmployeeRecord[] = rows
          .map((row, index) => {
            try {
              const rowData: { [key: string]: any } = {};
              headers.forEach((header, colIndex) => {
                const normalizedHeader = headerMapping[header] || header;
                rowData[normalizedHeader] = row[colIndex] ?? '-';
              });

              const employeeId = rowData['รหัสพนักงาน']?.toString().trim();
              const employeeName = rowData['ชื่อพนักงาน']?.toString().trim();

              if (!employeeId || employeeId === '-' || !employeeName || employeeName === '-') {
                return null;
              }

              // ตรวจสอบรหัสพนักงาน
              if (!validateEmployeeId(employeeId)) {
                console.warn(`รหัสพนักงานไม่ถูกต้อง: ${employeeId}`);
                return null;
              }

              const statusInfo = calculateStatus(rowData['เวลา']);
              const formattedDate = formatDateDisplay(rowData['วันที่']);

              return {
                id: index + 1,
                employeeId,
                employeeName,
                department: rowData['แผนก']?.toString() || '-',
                date: formattedDate,
                time: rowData['เวลา']?.toString() || '-',
                formattedTime: formatTimeDisplay(rowData['เวลา']),
                status: statusInfo.status,
                statusColor: statusInfo.color,
                rawData: rowData
              };
            } catch (error) {
              console.warn(`Error processing row ${index + 1}:`, error);
              return null;
            }
          })
          .filter((item): item is EmployeeRecord => item !== null);

        if (formattedData.length === 0) {
          setUploadError("ไม่พบข้อมูลที่ถูกต้องในไฟล์ Excel");
        } else {
          setUploadedData(formattedData);
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

  // ฟังก์ชันเริ่มต้นการแก้ไข
  const handleEdit = (record: EmployeeRecord) => {
    setEditingId(record.id);
    setEditForm({
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      department: record.department,
      date: record.date,
      time: record.time
    });
  };

  // ฟังก์ชันบันทึกการแก้ไข
  const handleSaveEdit = (id: number) => {
    const updatedData = uploadedData.map(item => {
      if (item.id === id) {
        const updatedTime = editForm.time || item.time;
        const statusInfo = calculateStatus(updatedTime);

        return {
          ...item,
          employeeId: editForm.employeeId || item.employeeId,
          employeeName: editForm.employeeName || item.employeeName,
          department: editForm.department || item.department,
          date: editForm.date || item.date,
          time: updatedTime,
          formattedTime: formatTimeDisplay(updatedTime),
          status: statusInfo.status,
          statusColor: statusInfo.color
        };
      }
      return item;
    });

    setUploadedData(updatedData);
    setEditingId(null);
    setEditForm({});
  };

  // ฟังก์ชันยกเลิกการแก้ไข
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // ฟังก์ชันลบข้อมูล
  const handleDelete = (id: number) => {
    if (confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?')) {
      const updatedData = uploadedData.filter(item => item.id !== id);
      setUploadedData(updatedData);
    }
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
    setFileName("");
    setUploadError("");
    setUploadProgress(0);
    setEditingId(null);
    setEditForm({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getStatusText = (status: 'present' | 'late' | 'absent'): string => {
    switch (status) {
      case 'present': return 'มา work';
      case 'late': return 'สาย';
      case 'absent': return 'ขาด';
      default: return '-';
    }
  };

  const getStatusColor = (color: string): string => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800 border border-green-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'red': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // สรุปข้อมูล
  const summary: UploadSummary = {
    total: uploadedData.length,
    present: uploadedData.filter(item => item.status === 'present').length,
    late: uploadedData.filter(item => item.status === 'late').length,
    absent: uploadedData.filter(item => item.status === 'absent').length,
    departments: [...new Set(uploadedData.map(item => item.department))],
    dates: [...new Set(uploadedData.map(item => item.date))].sort()
  };

  const downloadTemplate = () => {
    const templateData = [
      ['รหัสพนักงาน', 'ชื่อพนักงาน', 'แผนก', 'วันที่', 'เวลา'],
      ['201610078', 'สีสมุทร หอมจันทร์', 'กะ A', '1/9/2025', '08:01 15:32 15:32'],
      ['201610078', 'สีสมุทร หอมจันทร์', 'กะ A', '10/9/2025', '08:00 08:01 19:21 19:22'],
      ['201610079', 'ทดสอบ พนักงาน', 'กะ B', '11/9/2025', '08:30 12:00 13:00 17:00'],
      ['', '', '', '', ''],
      ['หมายเหตุ:'],
      ['- รหัสพนักงาน: ให้ใช้รหัสที่ใช้ลงเวลาทำงาน (ต้องเป็นตัวเลข 6-10 หลัก)'],
      ['- ชื่อพนักงาน: ให้ใช้ชื่อ-นามสกุลจริง'],
      ['- แผนก: ให้ใส่แผนกหรือกะการทำงาน'],
      ['- วันที่: ให้ใช้รูปแบบ วันที่/เดือน/ปี (เช่น 1/9/2025)'],
      ['- เวลา: ให้คั่นด้วยช่องว่าง (เช่น 08:00 12:00 13:00 17:00)'],
      ['- เวลาเข้างานแรกหลัง 8:30 น. จะถือว่าสาย'],
      ['- หากไม่มีข้อมูลเวลา จะถือว่าขาดงาน']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template_import_attendance.xlsx");
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">นำเข้าข้อมูล Excel</h1>
            <p className="text-gray-600 mt-2">
              อัพโหลดไฟล์ Excel เพื่อนำเข้าข้อมูลการเข้างานของพนักงาน
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4">อัพโหลดไฟล์</h2>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    รองรับไฟล์ Excel (.xlsx, .xls)
                  </p>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                    เลือกไฟล์ Excel
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls,.ods"
                  className="hidden"
                />
              </div>

              {/* Progress Bar */}
              {isLoading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>
                      {uploadProgress < 100 ? 'กำลังประมวลผล...' : 'ประมวลผลเสร็จสิ้น'}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* File Info */}
              {fileName && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="text-green-700 font-medium">ไฟล์ที่เลือก</span>
                    </div>
                    <button
                      onClick={handleClear}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ลบ
                    </button>
                  </div>
                  <p className="text-sm text-green-600 mt-1 truncate">{fileName}</p>
                  <p className="text-xs text-green-500 mt-1">
                    {uploadedData.length} แถวที่พบ
                  </p>
                </div>
              )}

              {/* Upload Button */}
              <div className="mt-6">
                <button
                  onClick={handleUpload}
                  disabled={uploadedData.length === 0 || isLoading}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                    uploadedData.length === 0 || isLoading
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
                    `อัพโหลดข้อมูล (${uploadedData.length} แถว)`
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
                  <li>• เวลาเข้างานแรกหลัง <strong>8:30 น.</strong> จะถือว่าสาย</li>
                </ul>
              </div>
            </div>

            {/* Summary Card */}
            {uploadedData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">สรุปข้อมูล</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
                      <div className="text-sm text-blue-600">ทั้งหมด</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{summary.present}</div>
                      <div className="text-sm text-green-600">มา work</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-yellow-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{summary.late}</div>
                      <div className="text-sm text-yellow-600">สาย</div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
                      <div className="text-sm text-red-600">ขาด</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-2">แผนกที่พบ</div>
                    <div className="flex flex-wrap gap-2">
                      {summary.departments.map((dept, index) => (
                        <span key={index} className="px-2 py-1 bg-white rounded-lg text-xs text-gray-700 border">
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Data Preview with Edit */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">ตัวอย่างข้อมูล</h2>
                {uploadedData.length > 0 && (
                  <div className="text-sm text-gray-500">
                    แสดง {Math.min(uploadedData.length, 50)} จาก {uploadedData.length} แถว
                  </div>
                )}
              </div>

              {uploadedData.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p className="text-gray-500 text-lg mb-2">ยังไม่มีข้อมูล</p>
                  <p className="text-gray-400 text-sm">
                    อัพโหลดไฟล์ Excel เพื่อแสดงตัวอย่างข้อมูล
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                          รหัสพนักงาน
                          <div className="text-xs font-normal text-gray-500">(รหัสที่ใช้ลงเวลา)</div>
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">ชื่อพนักงาน</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">แผนก</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">วันที่</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">เวลา</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">สถานะ</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedData.slice(0, 50).map((item, index) => (
                        <tr
                          key={item.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            {editingId === item.id ? (
                              <div>
                                <input
                                  type="text"
                                  value={editForm.employeeId || ''}
                                  onChange={(e) => setEditForm({...editForm, employeeId: e.target.value})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                  placeholder="รหัสพนักงาน"
                                />
                                <div className="text-xs text-gray-500 mt-1">ตัวเลข 6-10 หลัก</div>
                              </div>
                            ) : (
                              <div>
                                <span className="font-mono text-sm text-gray-800">{item.employeeId}</span>
                                <div className="text-xs text-gray-500">รหัสพนักงาน</div>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {editingId === item.id ? (
                              <input
                                type="text"
                                value={editForm.employeeName || ''}
                                onChange={(e) => setEditForm({...editForm, employeeName: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="ชื่อพนักงาน"
                              />
                            ) : (
                              <span className="text-gray-700">{item.employeeName}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {editingId === item.id ? (
                              <input
                                type="text"
                                value={editForm.department || ''}
                                onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="แผนก"
                              />
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                {item.department}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {editingId === item.id ? (
                              <input
                                type="text"
                                value={editForm.date || ''}
                                onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="วันที่"
                              />
                            ) : (
                              <span className="text-gray-700 whitespace-nowrap">{item.date}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {editingId === item.id ? (
                              <div>
                                <input
                                  type="text"
                                  value={editForm.time || ''}
                                  onChange={(e) => setEditForm({...editForm, time: e.target.value})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                  placeholder="เวลา"
                                />
                                <div className="text-xs text-gray-500 mt-1">คั่นด้วยช่องว่าง</div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600 font-mono max-w-xs">
                                {item.formattedTime}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.statusColor)}`}>
                              {getStatusText(item.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {editingId === item.id ? (
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleSaveEdit(item.id)}
                                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                  บันทึก
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  แก้ไข
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  ลบ
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {uploadedData.length > 50 && (
                    <div className="mt-4 text-center text-sm text-gray-500 bg-gray-50 py-2 rounded-lg">
                      แสดง 50 แถวแรกจากทั้งหมด {uploadedData.length} แถว
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
