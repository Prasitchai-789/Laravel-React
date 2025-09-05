import React from "react";

interface RecordItem {
  id: number;
  chemical_name: string;
  quantity: number | null;
  note?: string | null;
  shift: "A" | "B";
  date: string;
}

interface MonthlyDetailProps {
  month: string;
  records: RecordItem[];
}

export default function MonthlyDetail({ month, records }: MonthlyDetailProps) {
  const safeRecords = records || [];

  const shiftA = safeRecords.filter(r => r.shift === "A");
  const shiftB = safeRecords.filter(r => r.shift === "B");

  // ฟังก์ชันรวมและเรียงลำดับข้อมูล
  const mergeAndSortRecords = (items: RecordItem[]) => {
    const merged = Object.values(
      items.reduce((acc, item) => {
        if (!acc[item.chemical_name]) acc[item.chemical_name] = { ...item };
        else acc[item.chemical_name].quantity = (acc[item.chemical_name].quantity ?? 0) + (item.quantity ?? 0);
        return acc;
      }, {} as Record<string, RecordItem>)
    );

    // เรียงลำดับตามชื่อสารเคมี
    return merged.sort((a, b) => a.chemical_name.localeCompare(b.chemical_name, 'th'));
  };

  // ดึงรายชื่อสารเคมีทั้งหมดจากทั้งสองกะและเรียงลำดับ
  const getAllChemicalNames = () => {
    const allNames = [...new Set([...shiftA, ...shiftB].map(item => item.chemical_name))];
    return allNames.sort((a, b) => a.localeCompare(b, 'th'));
  };

  const allChemicalNames = getAllChemicalNames();
  const mergedA = mergeAndSortRecords(shiftA);
  const mergedB = mergeAndSortRecords(shiftB);

  // สร้างข้อมูลผลรวมจากทั้งสองกะ
  const mergedTotal = mergeAndSortRecords([...shiftA, ...shiftB]);

  // สร้างข้อมูลสำหรับตารางที่เรียงเหมือนกัน
  const createAlignedTableData = (mergedData: RecordItem[]) => {
    const dataMap = new Map(mergedData.map(item => [item.chemical_name, item]));
    return allChemicalNames.map(name => ({
      chemical_name: name,
      quantity: dataMap.get(name)?.quantity ?? null
    }));
  };

  // ฟังก์ชันจัดรูปแบบตัวเลขให้มี comma
  const formatNumber = (num: number | null): string => {
    if (num === null || num === undefined) return "-";
    return num.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const monthNames: Record<string, string> = {
    "01": "มกราคม",
    "02": "กุมภาพันธ์",
    "03": "มีนาคม",
    "04": "เมษายน",
    "05": "พฤษภาคม",
    "06": "มิถุนายน",
    "07": "กรกฎาคม",
    "08": "สิงหาคม",
    "09": "กันยายน",
    "10": "ตุลาคม",
    "11": "พฤศจิกายน",
    "12": "ธันวาคม",
  };

  const monthName = monthNames[month] || month;

  const tableDataA = createAlignedTableData(mergedA);
  const tableDataB = createAlignedTableData(mergedB);
  const tableDataTotal = createAlignedTableData(mergedTotal);

  // คำนวณผลรวมทั้งหมด
  const totalA = tableDataA.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalB = tableDataB.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalAll = tableDataTotal.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const renderTable = (items: {chemical_name: string, quantity: number | null}[], shift: "A" | "B" | "TOTAL", total: number = 0) => (
    <div className="border border-gray-300 rounded-lg shadow-sm text-sm h-full flex flex-col font-anuphan">
      <table className="w-full border-collapse flex-1">
        <thead className={
          shift === "A" ? "bg-blue-100" :
          shift === "B" ? "bg-green-100" :
          "bg-purple-100"
        }>
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-300">สารเคมี</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700 border-b border-gray-300">ปริมาณ</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r, index) => (
            <tr key={r.chemical_name} className={index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-gray-100"}>
              <td className="px-4 py-2.5 text-gray-900 border-b border-gray-200 whitespace-normal break-words" title={r.chemical_name}>
                {r.chemical_name}
              </td>
              <td className="px-4 py-2.5 text-right text-gray-700 border-b border-gray-200 font-medium whitespace-nowrap">
                {formatNumber(r.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* แถวผลรวม */}
      <div className={
        shift === "A" ? "bg-blue-200" :
        shift === "B" ? "bg-green-200" :
        "bg-purple-200"
      }>
        <div className="px-4 py-2.5 flex justify-between items-center border-t border-gray-300">
          <span className="font-semibold text-gray-800">รวม</span>
          <span className="font-bold text-gray-800">{formatNumber(total)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-white w-full max-w-5xl font-anuphan">
      <div className="text-center mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">เดือน {monthName}</h2>
        <p className="text-sm text-gray-500 mt-1.5">สรุปการใช้สารเคมี</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* กะ A */}
        <div className="flex flex-col">
          <div className="flex items-center mb-3 justify-between">
            <div className="flex items-center">
              <div className="w-3 h-5 rounded-sm bg-blue-500 mr-3"></div>
              <h3 className="font-semibold text-base text-blue-800">กะ A</h3>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {shiftA.length} รายการ
            </span>
          </div>
          {shiftA.length > 0 ? renderTable(tableDataA, "A", totalA) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-400 text-sm text-gray-500">
              ไม่มีข้อมูล
            </div>
          )}
        </div>

        {/* กะ B */}
        <div className="flex flex-col">
          <div className="flex items-center mb-3 justify-between">
            <div className="flex items-center">
              <div className="w-3 h-5 rounded-sm bg-green-500 mr-3"></div>
              <h3 className="font-semibold text-base text-green-800">กะ B</h3>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {shiftB.length} รายการ
            </span>
          </div>
          {shiftB.length > 0 ? renderTable(tableDataB, "B", totalB) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-400 text-sm text-gray-500">
              ไม่มีข้อมูล
            </div>
          )}
        </div>

        {/* ผลรวมทั้งสองกะ */}
        <div className="flex flex-col">
          <div className="flex items-center mb-3 justify-between">
            <div className="flex items-center">
              <div className="w-3 h-5 rounded-sm bg-purple-500 mr-3"></div>
              <h3 className="font-semibold text-base text-purple-800">ผลรวมทั้งสองกะ</h3>
            </div>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              ทั้งหมด
            </span>
          </div>
          {safeRecords.length > 0 ? renderTable(tableDataTotal, "TOTAL", totalAll) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-400 text-sm text-gray-500">
              ไม่มีข้อมูล
            </div>
          )}
        </div>
      </div>

      {/* สรุปผลรวม */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-700 mb-3 text-center">สรุปผลรวม</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-100 rounded-lg">
            <div className="text-sm text-blue-700">กะ A</div>
            <div className="text-xl font-bold text-blue-800">{formatNumber(totalA)}</div>
          </div>
          <div className="text-center p-3 bg-green-100 rounded-lg">
            <div className="text-sm text-green-700">กะ B</div>
            <div className="text-xl font-bold text-green-800">{formatNumber(totalB)}</div>
          </div>
          <div className="text-center p-3 bg-purple-100 rounded-lg">
            <div className="text-sm text-purple-700">รวมทั้งหมด</div>
            <div className="text-xl font-bold text-purple-800">{formatNumber(totalAll)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}