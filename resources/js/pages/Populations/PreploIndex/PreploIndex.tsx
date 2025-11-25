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

  const { props } = usePage();
  const { parseXlsxFile, parseSimpleExcelData, checkIncompleteData } = useExcelParser();

  // Inertia backend report
  useEffect(() => {
    if (props.reportData) {
      setReport(props.reportData);
    }
  }, [props.reportData]);


  // ========== อ่านไฟล์ Excel ==========
  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;

    setFileName(selectedFile.name);
    setLoading(true);
    setParsedData([]);
    setIncompleteData([]);
    setReport(null);

    try {
      const data = await parseXlsxFile(selectedFile);
      if (data.length === 0) {
        alert('ไฟล์ไม่มีข้อมูล');
        return;
      }

      setRows(data);
    } catch (error) {
      alert('อ่านไฟล์ล้มเหลว: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  // ========== Parse Excel → Filter Unique / Duplicate ==========
  useEffect(() => {
    if (rows.length > 0 && !loading) {
      const parsed = parseSimpleExcelData(rows);

      // --- หา duplicates ใน Excel ---
      const duplicates = [];
      const unique = [];

      parsed.forEach((item) => {
        const found = unique.find(
          (p) =>
            p.first_name === item.first_name &&
            p.last_name === item.last_name &&
            p.house_no === item.house_no
        );

        if (found) duplicates.push(item);
        else unique.push(item);
      });

      console.log("ข้อมูลซ้ำ (จากไฟล์):", duplicates);

      setParsedData(unique);

      const incomplete = checkIncompleteData(unique);
      setIncompleteData(incomplete);
    }
  }, [rows, loading, parseSimpleExcelData, checkIncompleteData]);


  // ========== รีเซ็ต ==========
  const handleReset = useCallback(() => {
    setFileName('');
    setRows([]);
    setParsedData([]);
    setIncompleteData([]);
    setReport(null);

    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = '';
  }, []);


  // ========== ส่งข้อมูลไป Backend ==========
  const handleSubmit = async () => {
    if (parsedData.length === 0) {
      return alert('ไม่มีข้อมูลนำเข้า');
    }

    if (incompleteData.length > 0) {
      if (!confirm(`ข้อมูลไม่สมบูรณ์ ${incompleteData.length} รายการ ต้องการนำเข้าต่อหรือไม่?`)) {
        return;
      }
    }

    setSubmitting(true);

    try {
      const { data } = await axios.post('/preplo/import-simple', {
        rows: parsedData,
        file_name: fileName
      });

      if (data.success) {
        // ========== ปรับรูปแบบผลลัพธ์ให้ตรงกับ backend ==========
        const reportData = {
          imported: data.data.imported ?? 0,
          skipped: data.data.skipped ?? 0,
          skipped_rows: data.data.skipped_rows || [],
          duplicate: data.data.duplicate ?? 0,
          duplicate_rows: data.data.duplicate_rows || [] // ⭐ เพิ่มแสดงข้อมูลซ้ำจริง
        };

        setReport(reportData);
        handleReset();
      } else {
        alert('นำเข้าล้มเหลว');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow border">

            {/* Header */}
            <div className="px-6 py-4 border-b">
              <h1 className="text-2xl font-bold">นำเข้าข้อมูลประชากรจาก Excel</h1>
              <p className="text-gray-600">อัพโหลดไฟล์ Excel เพื่อนำเข้าข้อมูล</p>
            </div>

            <div className="p-6">

              <SupportedFormatInfo />

              <FileUploadSection
                loading={loading}
                submitting={submitting}
                fileName={fileName}
                rows={rows}
                parsedData={parsedData}
                onFileChange={(e) => handleFile(e.target.files[0])}
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
