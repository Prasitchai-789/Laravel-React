// resources/js/Components/Preplo/hooks/useExcelParser.js
import { useCallback } from 'react';
import * as XLSX from 'xlsx';

export const useExcelParser = () => {
  // อ่านไฟล์ Excel จริงด้วย XLSX
  const parseXlsxFile = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // อ่าน sheet แรก
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // แปลงเป็น JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: '',
              blankrows: false
            });

            console.log('📊 ข้อมูลจากไฟล์ Excel จริง:', jsonData);
            resolve(jsonData);
          } catch (error) {
            console.error('Error parsing Excel:', error);
            reject(new Error('ไม่สามารถอ่านไฟล์ Excel ได้'));
          }
        };

        reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
        reader.readAsArrayBuffer(file);
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  // Parse ข้อมูลจาก Excel
  const parseSimpleExcelData = useCallback((excelRows) => {
    if (!excelRows || excelRows.length === 0) {
      console.log('ไม่มีข้อมูลที่จะ parse');
      return { parsedData: [], skippedRows: [], summary: { total: 0, processed: 0, skipped: 0, successRate: '0%' } };
    }

    const parsedData = [];
    const skippedRows = []; // ✅ เก็บข้อมูลที่ข้าม
    const columnMapping = {
      title: null,
      first_name: null,
      last_name: null,
      house_no: null,
      village_no: null,
      subdistrict_name: null,
      district_name: null,
      province_name: null,
      note: null
    };

    // วิเคราะห์โครงสร้างข้อมูลจากแถวแรก
    console.log('🔍 วิเคราะห์โครงสร้างข้อมูลจากแถวแรก:', excelRows[0]);

    let startRow = 0;

    const firstRow = excelRows[0];
    if (firstRow && firstRow.length > 0) {
      const hasHeaderKeywords = firstRow.some(cell =>
        cell && cell.toString().toLowerCase().includes('คำนำหน้า') ||
        cell && cell.toString().toLowerCase().includes('ชื่อ') ||
        cell && cell.toString().toLowerCase().includes('สกุล')
      );

      if (hasHeaderKeywords) {
        firstRow.forEach((cell, index) => {
          const cellValue = cell?.toString().toLowerCase() || '';
          if (cellValue.includes('คำนำหน้า')) columnMapping.title = index;
          else if (cellValue.includes('ชื่อ') && !cellValue.includes('สกุล')) columnMapping.first_name = index;
          else if (cellValue.includes('สกุล')) columnMapping.last_name = index;
          else if (cellValue.includes('บ้านเลขที่')) columnMapping.house_no = index;
          else if (cellValue.includes('หมู่')) columnMapping.village_no = index;
          else if (cellValue.includes('ตำบล')) columnMapping.subdistrict_name = index;
          else if (cellValue.includes('อำเภอ')) columnMapping.district_name = index;
          else if (cellValue.includes('จังหวัด')) columnMapping.province_name = index;
          else if (cellValue.includes('หมายเหตุ')) columnMapping.note = index;
        });

        startRow = 1;
        console.log('📋 พบ header row, mapping:', columnMapping);
      } else {
        // fixed mapping ตามโครงสร้างข้อมูลของคุณ
        columnMapping.title = 2;
        columnMapping.first_name = 3;
        columnMapping.last_name = 4;
        columnMapping.house_no = 5;
        columnMapping.village_no = 6;
        columnMapping.subdistrict_name = 7;
        columnMapping.district_name = 8;
        columnMapping.province_name = 9;
        console.log('📝 ใช้ fixed column mapping:', columnMapping);
      }
    }

    console.log('🚀 เริ่ม parse จากแถวที่:', startRow + 1);
    console.log('📊 จำนวนแถวทั้งหมด:', excelRows.length);

    let processedCount = 0;
    let skippedCount = 0;

    for (let i = startRow; i < excelRows.length; i++) {
      const row = excelRows[i];

      // ตรวจสอบว่ามีข้อมูลจริงหรือไม่ (ไม่ใช่แถวว่าง)
      const hasData = row && row.some(cell =>
        cell !== null && cell !== undefined && cell.toString().trim() !== '' && cell.toString().trim() !== '-'
      );

      if (!hasData) {
        // ข้ามแถวว่าง
        continue;
      }

      if (row.length >= 6) {
        // สร้าง object ข้อมูลตามโครงสร้างที่ backend ต้องการเท่านั้น
        const person = {
          title: (row[columnMapping.title]?.toString().trim() || '').replace(/\s+/g, ' '),
          first_name: (row[columnMapping.first_name]?.toString().trim() || '').replace(/\s+/g, ' '),
          last_name: (row[columnMapping.last_name]?.toString().trim() || '').replace(/\s+/g, ' '),
          house_no: (row[columnMapping.house_no]?.toString().trim() || '').replace(/\s+/g, ' '),
          village_no: (row[columnMapping.village_no]?.toString().trim() || '').replace(/\s+/g, ' '),
          subdistrict_name: (row[columnMapping.subdistrict_name]?.toString().trim() || '').replace(/\s+/g, ' '),
          district_name: (row[columnMapping.district_name]?.toString().trim() || '').replace(/\s+/g, ' '),
          province_name: (row[columnMapping.province_name]?.toString().trim() || 'สกลนคร').replace(/\s+/g, ' '),
          note: (row[columnMapping.note]?.toString().trim() || '').replace(/\s+/g, ' '),
        };

        // แปลง village_no เป็น integer ถ้าเป็นตัวเลข
        if (person.village_no && !isNaN(person.village_no)) {
          person.village_no = parseInt(person.village_no);
        }

        const hasBasicInfo = person.first_name && person.last_name &&
                          person.first_name !== '-' && person.last_name !== '-' &&
                          person.first_name.trim() !== '' && person.last_name.trim() !== '';

        if (hasBasicInfo) {
          parsedData.push(person);
          processedCount++;
          console.log(`✅ แถว ${i + 1}: ${person.first_name} ${person.last_name}`);
        } else {
          // ✅ เก็บข้อมูลที่ข้ามพร้อมเหตุผล
          skippedRows.push({
            row_number: i + 1,
            data: person,
            reason: 'ไม่มีชื่อหรือสกุล',
            raw_data: row
          });
          console.log(`❌ ข้ามแถวที่ ${i + 1} เนื่องจากไม่มีชื่อหรือสกุล:`, person);
          skippedCount++;
        }
      } else {
        // ✅ เก็บข้อมูลที่ข้ามเนื่องจากคอลัมน์ไม่ครบ
        skippedRows.push({
          row_number: i + 1,
          data: null,
          reason: 'คอลัมน์ไม่ครบ',
          raw_data: row
        });
        console.log(`❌ ข้ามแถวที่ ${i + 1} เนื่องจากคอลัมน์ไม่ครบ:`, row);
        skippedCount++;
      }
    }

    // ✅ แสดงสรุปข้อมูลที่ข้าม
    console.log(`🎯 Parse สำเร็จ: ${processedCount} รายการ, ข้าม: ${skippedCount} รายการ`);

    if (skippedRows.length > 0) {
      console.log('📋 รายการที่ข้าม:', skippedRows);
      console.log('📊 สรุปเหตุผลที่ข้าม:');

      const reasonSummary = {};
      skippedRows.forEach(item => {
        reasonSummary[item.reason] = (reasonSummary[item.reason] || 0) + 1;
      });

      console.log('📈 สถิติการข้าม:', reasonSummary);

      // แสดงตัวอย่างข้อมูลที่ข้าม 5 รายการแรก
      console.log('🔍 ตัวอย่างข้อมูลที่ข้าม (5 รายการแรก):', skippedRows.slice(0, 5));
    }

    console.log('📦 ตัวอย่างข้อมูลที่ส่ง:', parsedData.slice(0, 1));

    // ✅ คืนค่าทั้งข้อมูลที่ parse ได้และข้อมูลที่ข้าม
    return {
      parsedData,
      skippedRows,
      summary: {
        total: excelRows.length - startRow,
        processed: processedCount,
        skipped: skippedCount,
        successRate: ((processedCount / (excelRows.length - startRow)) * 100).toFixed(2) + '%'
      }
    };
  }, []);

  // ตรวจสอบข้อมูลที่ไม่สมบูรณ์
  const checkIncompleteData = useCallback((data) => {
    const incomplete = data.filter(person => {
      return !person.house_no || person.house_no === '-' || person.house_no === '';
    });
    console.log('📊 ข้อมูลไม่สมบูรณ์ (ไม่มีบ้านเลขที่):', incomplete.length, 'รายการ');

    // ✅ แสดงตัวอย่างข้อมูลที่ไม่สมบูรณ์
    if (incomplete.length > 0) {
      console.log('🔍 ตัวอย่างข้อมูลที่ไม่สมบูรณ์:', incomplete.slice(0, 3));
    }

    return incomplete;
  }, []);

  return {
    parseXlsxFile,
    parseSimpleExcelData,
    checkIncompleteData
  };
};
