import React, { useState, ChangeEvent, FormEvent } from 'react';
import * as XLSX from 'xlsx';

interface Citizen {
  citizen_id: string;
  title?: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
  gender?: string;
  phone?: string;
  village_name?: string;
  house_no?: string;
  moo?: string;
  alley?: string;
  soi?: string;
  road?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  card_issue_date?: string;
  card_expire_date?: string;
  religion?: string;
  age?: string;
  photo?: string;
}

const UploadCitizen: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState<boolean>(false);
  const [failRows, setFailRows] = useState<any[]>([]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
      setMessage('');
      setFailRows([]);
    }
  };

  const convertThaiDate = (thaiDate: any) => {
    if (!thaiDate) return null;

    let dateObj: Date;
    if (typeof thaiDate === 'number') {
      const parsed = XLSX.SSF.parse_date_code(thaiDate);
      dateObj = new Date(parsed.y, parsed.m - 1, parsed.d);
    } else if (thaiDate instanceof Date) {
      dateObj = thaiDate;
    } else if (typeof thaiDate === 'string') {
      const parts = thaiDate.split(/[-\/]/);
      if (parts.length === 3) {
        let year = parseInt(parts[0], 10);
        if (year > 2500) year -= 543;
        return `${year}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      return thaiDate;
    } else return null;

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setMessage('');
    setFailRows([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });

      const citizensData: Citizen[] = jsonData.map((row: any) => ({
        // citizen_id: row['เลขบัตรประชาชน'] || '',
        title: row['คำนำหน้า'] || undefined,
        first_name: row['ชื่อ'] || '',
        last_name: row['นามสกุล'] || '',
        birth_date: convertThaiDate(row['วันเกิด']),
        gender: row['เพศ'] || undefined,
        phone: row['เบอร์โทร'] || undefined,
        village_name: row['ชื่อหมู่บ้าน'] || undefined,
        house_no: row['บ้านเลขที่'] || undefined,
        moo: row['หมู่ที่'] || undefined,
        alley: row['ตรอก'] || undefined,
        soi: row['ซอย'] || undefined,
        road: row['ถนน'] || undefined,
        subdistrict: row['ตำบล'] || undefined,
        district: row['อำเภอ'] || undefined,
        province: row['จังหวัด'] || undefined,
        card_issue_date: convertThaiDate(row['วันทำบัตร']),
        card_expire_date: convertThaiDate(row['วันหมดอายุ']),
        religion: row['ศาสนา'] || undefined,
        age: row['อายุ'] || undefined,
        photo: row['รูป'] || undefined,
      }));

      // --- ตรวจ duplicate ในไฟล์เดียวกัน ---
      const seenIds = new Set<string>();
      const filteredData: Citizen[] = [];
      const localFailRows: any[] = [];

      citizensData.forEach((citizen, index) => {
        const cid = citizen.citizen_id;
        if (!cid) {
          localFailRows.push({ row_index: index, error: 'Missing citizen_id' });
        } else if (seenIds.has(cid)) {
          localFailRows.push({ row_index: index, error: `Duplicate citizen_id in file: ${cid}` });
        } else {
          seenIds.add(cid);
          filteredData.push(citizen);
        }
      });

      if (!filteredData.length) {
        setMessage('❌ ไม่มีข้อมูลถูกต้องในไฟล์');
        setMessageType('error');
        setFailRows(localFailRows);
        setLoading(false);
        return;
      }

      // --- ส่งไป backend ---
      const res = await fetch('/citizens/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ citizens: filteredData }),
      });

      let result: any = { success: 0, fail: 0, fail_rows: [] };
      try {
        result = await res.json();
      } catch (err) {
        console.error(err);
        result.fail = filteredData.length;
        result.fail_rows = [{ row_index: 0, error: 'Invalid JSON response from server' }];
      }

      const allFailRows = [...localFailRows, ...(result.fail_rows || [])];

      if (!res.ok || result.fail > 0 || allFailRows.length > 0) {
        setMessage(`❌ พบข้อผิดพลาด: ล้มเหลว ${allFailRows.length} รายการ`);
        setMessageType('error');
        setFailRows(allFailRows);
      } else {
        setMessage(`✅ อัปโหลดสำเร็จ: ${result.success} รายการ`);
        setMessageType('success');
        setFailRows([]);
      }

    } catch (err: any) {
      console.error(err);
      setMessage(`เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ${err.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  const handleClear = async () => {
    if (!confirm('ต้องการลบข้อมูลทั้งหมดจริงหรือไม่?')) return;

    try {
      setLoading(true);
      const res = await fetch('/citizens/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });
      const result = await res.json();
      setMessage(result.message || 'ลบข้อมูลเรียบร้อย');
      setMessageType('info');
      setFailRows([]);
    } catch (err) {
      console.error(err);
      setMessage('เกิดข้อผิดพลาดในการลบข้อมูล');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        อัปโหลดข้อมูลประชาชนจากไฟล์ Excel
      </h2>

      <div className="mb-6 text-center">
        <button
          onClick={handleClear}
          disabled={loading}
          className={`px-6 py-2.5 rounded-md font-semibold text-white transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {loading ? 'กำลังลบ...' : 'ลบข้อมูลทั้งหมด'}
        </button>
      </div>

      <form onSubmit={handleUpload} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-grow">
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
              เลือกไฟล์ Excel (.xlsx, .xls)
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            {file && <p className="mt-2 text-sm text-gray-600">ไฟล์ที่เลือก: {file.name}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className={`mt-4 md:mt-0 px-6 py-2.5 rounded-md font-semibold text-white transition-colors ${loading || !file ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์'}
          </button>
        </div>
      </form>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${messageType === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {failRows.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-red-600 mb-2">รายการที่ล้มเหลว</h3>
          <ul className="space-y-2 max-h-60 overflow-auto">
            {failRows.map((row, i) => (
              <li key={i} className="p-3 bg-red-50 border border-red-200 rounded-md text-sm">
                <strong>Row {row.row_index + 1}:</strong> {row.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadCitizen;
