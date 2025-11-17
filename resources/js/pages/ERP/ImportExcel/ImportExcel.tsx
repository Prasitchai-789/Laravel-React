import AppLayout from "@/layouts/app-layout";
import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { Breadcrumb, EmployeeRecord, FilterState, UploadSummary } from "./shift";
import {
  validateFileType,
  processMultipleShifts,
  validateEmployeeId,
  formatDateDisplay,
  calculateStatus,
  calculateWorkHours,
  assignShiftToRecord,
  timeToMinutes
} from "./Shifts/ShiftUtils";
import { FileUploadArea } from "./components/Upload/FileUploadArea";
import { UploadProgress } from "./components/Upload/UploadProgress";
import { FileInfo } from "./components/Upload/FileInfo";
import { DataTable } from "./components/Data/DataTable";
import { DataFilters } from "./components/Data/DataFilters";
import { DataSummary } from "./components/Data/DataSummary";

const breadcrumbs: Breadcrumb[] = [
  { title: "Home", href: "/dashboard" },
  { title: "ERP", href: "/ERPIndex" },
  { title: "Import Excel", href: "/import-excel" },
];

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    department: '',
    shift: '',
    date: '',
    status: '',
    employeeId: '',
    employeeName: ''
  });

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

  // Sort logic
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
        aValue = new Date(aValue.split('/').reverse().join('-'));
        bValue = new Date(bValue.split('/').reverse().join('-'));
      } else if (key === 'formattedTimeIn' || key === 'formattedTimeOut') {
        aValue = timeToMinutes(aValue);
        bValue = timeToMinutes(bValue);
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

        const requiredHeaders = ['รหัสพนักงาน', 'ชื่อพนักงาน', 'แผนก', 'วันที่', 'เวลา'];
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

        const formattedData: EmployeeRecord[] = [];
        let recordId = 1;

        rows.forEach((row, index) => {
          try {
            const rowData: { [key: string]: any } = {};
            headers.forEach((header, colIndex) => {
              const normalizedHeader = headerMapping[header] || header;
              rowData[normalizedHeader] = row[colIndex] ?? '-';
            });

            const employeeId = rowData['รหัสพนักงาน']?.toString().trim();
            const employeeName = rowData['ชื่อพนักงาน']?.toString().trim();

            if (!employeeId || employeeId === '-' || !employeeName || employeeName === '-') {
              return;
            }

            if (!validateEmployeeId(employeeId)) {
              console.warn(`รหัสพนักงานไม่ถูกต้อง: ${employeeId}`);
              return;
            }

            const formattedDate = formatDateDisplay(rowData['วันที่']);
            const timeData = rowData['เวลา']?.toString() || '-';

            const shifts = processMultipleShifts(timeData, formattedDate);

            shifts.forEach(shift => {
              formattedData.push({
                id: recordId++,
                employeeId,
                employeeName,
                department: rowData['แผนก']?.toString() || '-',
                ...shift,
                rawData: rowData
              });
            });

          } catch (error) {
            console.warn(`Error processing row ${index + 1}:`, error);
          }
        });

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

        const workHours = updatedTimeOut !== '-' ? calculateWorkHours(updatedTimeIn, updatedTimeOut, isOvernight) : undefined;
        const shiftAssignment = assignShiftToRecord(updatedTimeIn, updatedTimeOut);

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
          assignedShift: shiftAssignment.shift,
          assignedShiftName: shiftAssignment.shiftName
        };
      }
      return item;
    });

    setUploadedData(updatedData);
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
    resetFilters();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['รหัสพนักงาน', 'ชื่อพนักงาน', 'แผนก', 'วันที่', 'เวลา'],
      ['201610078', 'สีสมุทร หอมจันทร์', 'กะ A', '1/9/2568', '08:01 15:32 15:32'],
      ['201610078', 'สีสมุทร หอมจันทร์', 'กะ A', '10/9/2568', '08:00 08:01 19:21 19:22'],
      ['201610078', 'สีสมุทร หอมจันทร์', 'กะ A', '11/9/2568', '08:02 08:03 19:26 19:26'],
      ['201610078', 'สีสมุทร หอมจันทร์', 'กะ A', '12/9/2568', '08:00 19:21 19:22'],
      ['201610078', 'สีสมุทร หอมจันทร์', 'กะ A', '13/9/2568', '08:00 19:23 19:24'],
      ['', '', '', '', ''],
      ['หมายเหตุ:'],
      ['- รหัสพนักงาน: ให้ใช้รหัสที่ใช้ลงเวลาทำงาน (ต้องเป็นตัวเลข 6-10 หลัก)'],
      ['- ชื่อพนักงาน: ให้ใช้ชื่อ-นามสกุลจริง'],
      ['- แผนก: ให้ใส่แผนกหรือกะการทำงาน'],
      ['- วันที่: ให้ใช้รูปแบบ วันที่/เดือน/ปี (เช่น 1/9/2568)'],
      ['- เวลา: ให้คั่นด้วยช่องว่าง'],
      ['- ระบบจะประมวลผลเวลาซ้ำและแยกกะอัตโนมัติ'],
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
    dates: [...new Set(uploadedData.map(item => item.date))].sort(),
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
                  <li>• เวลาเข้างานหลัง <strong>8:30 น.</strong> จะถือว่าสาย</li>
                  <li>• ระบบจัดการ<strong>เวลาซ้ำ</strong> อัตโนมัติ</li>
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
