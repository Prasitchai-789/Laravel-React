import React from 'react';
import GenericTable, { Column } from '@/components/Tables/GenericTable';

interface SaleRow {
  id?: number;
  index: number;
  subdistrict: string;
  total: number;
  [key: string]: any;
}

interface SalesTableProps {
  data: SaleRow[];
  productsAPI: string[];
  formatQuantity: (value: number | undefined) => string;
  formatDateThai: (date: string) => string;
  dateRange: {
    start: string;
    end: string;
  };
}

export default function SalesTable({
  data,
  productsAPI,
  formatQuantity,
  formatDateThai,
  dateRange
}: SalesTableProps) {
  // ✅ กำหนด columns หลัก
  const baseColumns: Column<SaleRow>[] = [
    {
      key: 'index',
      label: 'ลำดับ',
      align: 'center',
      className: 'w-12 text-center',
      render: (row) => row.index,
    },
    {
      key: 'subdistrict',
      label: 'พื้นที่ (ตำบล)',
      render: (row) => row.subdistrict,
    },
  ];

  // ✅ เพิ่ม columns ของสินค้าแบบ dynamic
  const productColumns: Column<SaleRow>[] = productsAPI.map((productName) => ({
    key: productName,
    label: productName,
    align: 'right',
    render: (row) => {
      const value = row[productName];
      if (value === undefined || value === null) return '-';
      return formatQuantity(Number(value));
    },
  }));

  // ✅ เพิ่มคอลัมน์รวม
  const totalColumn: Column<SaleRow> = {
    key: 'total',
    label: 'รวม',
    align: 'right',
    render: (row) => {
      const value = row.total || 0;
      return formatQuantity(Number(value));
    },
  };

  const columns: Column<SaleRow>[] = [...baseColumns, ...productColumns, totalColumn];

  // ✅ คำนวณแถวรวมทั้งหมด (summary row)
  const summaryRow: SaleRow | null =
    Array.isArray(data) && data.length > 0
      ? productsAPI.reduce(
          (acc, product) => {
            acc[product] = data.reduce(
              (sum, row) => sum + (Number(row[product]) || 0),
              0
            );
            acc.total = data.reduce((sum, row) => sum + (Number(row.total) || 0), 0);
            return acc;
          },
          { subdistrict: 'รวมทั้งหมด', index: 0, total: 0 } as SaleRow
        )
      : null;

  // ✅ รวมข้อมูลจริง + แถวรวม
  const tableData = summaryRow ? [...data, summaryRow] : data;

  return (
    <div className="rounded-xl bg-white shadow font-anuphan">
      {/* Header with date range */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">รายงานปริมาณต้นกล้าแยกตามพื้นที่</h2>
            <span className="text-sm text-gray-500">
              ช่วงวันที่ {formatDateThai(dateRange.start)} ถึง {formatDateThai(dateRange.end)}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {data.length} พื้นที่
          </div>
        </div>
      </div>

      <GenericTable
        data={tableData}
        columns={columns}
        idField="index"
        highlightLastRow
        emptyMessage="ไม่พบข้อมูลการขาย"
      />

      {/* Footer with additional info */}
      {tableData.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>หน่วย: ต้น</span>
            <span>อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
