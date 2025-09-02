import React, { useState, ChangeEvent, FormEvent } from 'react';
import * as XLSX from 'xlsx';

interface Citizen {
  citizen_id: string;
  title: string | null;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
  village_name: string | null;
  house_no: string | null;
  moo: string | null;
  alley: string | null;
  soi: string | null;
  road: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  card_issue_date: string | null;
  card_expire_date: string | null;
  religion: string | null;
  age: string | null;
  photo: string | null;
}

const UploadCitizen: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState<boolean>(false);
  const [failRows, setFailRows] = useState<any[]>([]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage('');
      setFailRows([]);
    }
  };

  const convertThaiDate = (thaiDate: any) => {
    if (!thaiDate) return null;

    let dateObj: Date;

    if (typeof thaiDate === 'number') {
      dateObj = XLSX.SSF.parse_date_code(thaiDate);
      dateObj = new Date(dateObj.y, dateObj.m - 1, dateObj.d);
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
    } else {
      return null;
    }

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
        citizen_id: row['เลขบัตรประชาชน'] || '',
        title: row['คำนำหน้า'] || null,
        first_name: row['ชื่อ'] || '',
        last_name: row['นามสกุล'] || '',
        birth_date: convertThaiDate(row['วันเกิด']),
        gender: row['เพศ'] || null,
        phone: row['เบอร์โทร'] || null,
        village_name: row['ชื่อหมู่บ้าน'] || null,
        house_no: row['บ้านเลขที่'] || null,
        moo: row['หมู่ที่'] || null,
        alley: row['ตรอก'] || null,
        soi: row['ซอย'] || null,
        road: row['ถนน'] || null,
        subdistrict: row['ตำบล'] || null,
        district: row['อำเภอ'] || null,
        province: row['จังหวัด'] || null,
        card_issue_date: convertThaiDate(row['วันทำบัตร']),
        card_expire_date: convertThaiDate(row['วันหมดอายุ']),
        religion: row['ศาสนา'] || null,
        age: row['อายุ'] || null,
        photo: row['รูป'] || null,
      }));


      const handleClearCitizens = async () => {
        if (!confirm('ต้องการลบข้อมูลทั้งหมดจริงหรือไม่?')) return;

        try {
          const res = await fetch('/api/citizens/clear', {
            method: 'POST', // ใช้ POST หรือ DELETE
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              // 'Authorization': `Bearer ${token}`, // ถ้าใช้ auth
            },
          });

          if (!res.ok) {
            const text = await res.text();
            console.log('Response:', text);
            throw new Error('Failed to clear citizens');
          }

          const result = await res.json();
          alert(result.message);
        } catch (err) {
          console.error(err);
          alert('เกิดข้อผิดพลาด');
        }
      };


      const res = await fetch('/api/citizens/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ citizens: citizensData }),
      });

      // --- อ่าน error จริงจาก backend ---
      const resultText = await res.text();
      let result: any = {};
      try { result = JSON.parse(resultText); } catch (e) { result = { fail: citizensData.length, success: 0, fail_rows: [{ row_index: 0, error: resultText }] }; }

      if (!res.ok || result.fail > 0) {
        setMessage(`❌ พบข้อผิดพลาด: ล้มเหลว ${result.fail} รายการ`);
        setMessageType('error');
        setFailRows(result.fail_rows || []);
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

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        อัปโหลดข้อมูลประชาชนจากไฟล์ Excel
      </h2>
      <div className="mb-6 text-center">
        <button
          onClick={async () => {
            if (!confirm('ต้องการลบข้อมูลทั้งหมดจริงหรือไม่?')) return;
            try {
              setLoading(true);
              const res = await fetch('/api/citizens/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              });
              const result = await res.json();
              setMessage(result.message);
              setMessageType('info');
            } catch (err) {
              console.error(err);
              setMessage('เกิดข้อผิดพลาดในการลบข้อมูล');
              setMessageType('error');
            } finally {
              setLoading(false);
            }
          }}
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
              className="block w-full text-sm text-gray-500 
              file:mr-4 file:py-2 file:px-4 file:rounded 
              file:border-0 file:text-sm file:font-semibold 
              file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
          <ul className="space-y-2">
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


