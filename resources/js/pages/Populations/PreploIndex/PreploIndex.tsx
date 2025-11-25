// resources/js/Components/Preplo/PreploIndex.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import axios from 'axios';
import { useExcelParser } from './hooks/useExcelParser';
import SupportedFormatInfo from './components/SupportedFormatInfo';
import FileUploadSection from './components/FileUploadSection';
import IncompleteDataWarning from './components/IncompleteDataWarning';
import DataPreview from './components/DataPreview';
import NoDataWarning from './components/NoDataWarning';
import ImportReport from './components/ImportReport';
import SubmissionLoading from './components/SubmissionLoading';

const PreploIndex = () => {
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [incompleteData, setIncompleteData] = useState([]);
  const [report, setReport] = useState(null);

  const page = usePage().props;
  const { parseXlsxFile, parseSimpleExcelData, checkIncompleteData } = useExcelParser();

  // ตั้งค่า report จาก props ถ้ามี
  useEffect(() => {
    if (page.reportData) {
      setReport(page.reportData);
    }
  }, [page.reportData]);

  // จัดการไฟล์
  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;

    setFileName(selectedFile.name);
    setLoading(true);
    setRows([]);
    setParsedData([]);
    setIncompleteData([]);
    setReport(null);

    try {
      console.log('📁 กำลังอ่านไฟล์ Excel จริง:', selectedFile.name);
      const data = await parseXlsxFile(selectedFile);

      if (data.length === 0) {
        alert('ไฟล์ไม่มีข้อมูลหรือรูปแบบไม่ถูกต้อง');
        return;
      }

      setRows(data);
      console.log('✅ อ่านไฟล์สำเร็จ, จำนวนแถว:', data.length);

    } catch (error) {
      console.error('❌ Error reading file:', error);
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // เมื่อมีข้อมูลจาก Excel
  useEffect(() => {
    if (rows.length > 0 && !loading) {
      console.log('🔍 ข้อมูลดิบจาก Excel:', rows);
      const parsed = parseSimpleExcelData(rows);

      // กรองข้อมูลซ้ำโดยใช้ first_name + last_name + house_no
      const uniqueParsed = parsed.filter((person, index, self) =>
        index === self.findIndex((p) =>
          p.first_name === person.first_name &&
          p.last_name === person.last_name &&
          p.house_no === person.house_no
        )
      );

      console.log('✅ ข้อมูลที่ parse แล้ว (ไม่ซ้ำ):', uniqueParsed.length, 'รายการ');
      setParsedData(uniqueParsed);

      const incomplete = checkIncompleteData(uniqueParsed);
      setIncompleteData(incomplete);
    }
  }, [rows, loading, parseSimpleExcelData, checkIncompleteData]);

  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // ตรวจสอบประเภทไฟล์
      const validTypes = ['.xlsx', '.xls'];
      const fileType = selectedFile.name.toLowerCase();

      if (!validTypes.some(type => fileType.endsWith(type))) {
        alert('กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น');
        return;
      }

      handleFile(selectedFile);
    }
  }, []);

  const handleReset = useCallback(() => {
    setFileName('');
    setRows([]);
    setParsedData([]);
    setIncompleteData([]);
    setReport(null);

    // รีเซ็ต input file
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  const handleSubmit = async () => {
    if (parsedData.length === 0) {
      alert('ไม่มีข้อมูลที่จะนำเข้า');
      return;
    }

    if (incompleteData.length > 0) {
      if (!confirm(`พบข้อมูลที่ไม่สมบูรณ์ ${incompleteData.length} รายการ (ไม่มีบ้านเลขที่)\nต้องการนำเข้าข้อมูลต่อไปหรือไม่?`)) return;
    }

    // Debug ข้อมูลก่อนส่ง
    console.log('🔍 ข้อมูลก่อนส่งไป backend:');
    console.log('จำนวนข้อมูล:', parsedData.length);
    console.log('ตัวอย่างข้อมูลแรก:', parsedData[0]);

    setSubmitting(true);

    try {
      const { data } = await axios.post('/preplo/import-simple', {
        rows: parsedData,
        file_name: fileName
      });

      console.log('✅ Response จาก backend:', data);

      if (data.success) {
        // สร้าง report data ตาม structure ที่ backend ส่งกลับ
        const reportData = {
          imported: data.imported,
          skipped: data.skipped,
          skipped_rows: data.skipped_rows || [],
          duplicate: data.duplicate || 0
        };

        setReport(reportData);
        console.log('✅ นำเข้าข้อมูลสำเร็จ', reportData);

        // รีเซ็ตข้อมูลหลังจากนำเข้าสำเร็จ
        handleReset();
      } else {
        alert('การนำเข้าข้อมูลล้มเหลว: ' + (data.message || 'ไม่ทราบสาเหตุ'));
      }
    } catch (error) {
      console.error('❌ ข้อผิดพลาด:', error);
      console.error('❌ Response data:', error.response?.data);
      alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border">
            {/* Header */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">นำเข้าข้อมูลประชากรจากไฟล์ Excel</h1>
                  <p className="text-gray-600 mt-1">
                    อัพโหลดไฟล์ Excel เพื่อนำเข้าข้อมูลประชากรจริง
                  </p>
                </div>
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  กลับ
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <SupportedFormatInfo />

              <FileUploadSection
                loading={loading}
                submitting={submitting}
                fileName={fileName}
                rows={rows}
                parsedData={parsedData}
                onFileChange={handleFileChange}
              />

              <IncompleteDataWarning incompleteData={incompleteData} />

              <DataPreview
                parsedData={parsedData}
                incompleteData={incompleteData}
                submitting={submitting}
                onReset={handleReset}
                onSubmit={handleSubmit}
              />

              <NoDataWarning rows={rows} parsedData={parsedData} loading={loading} />

              <ImportReport report={report} onClose={() => setReport(null)} />

              <SubmissionLoading submitting={submitting} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PreploIndex;
