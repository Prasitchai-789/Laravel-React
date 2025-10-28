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
}

export default function SalesTable({ data, productsAPI }: SalesTableProps) {
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
    render: (row) =>
      row[productName]
        ? Number(row[productName]).toLocaleString('th-TH')
        : '-',
  }));

  // ✅ เพิ่มคอลัมน์รวม
  const totalColumn: Column<SaleRow> = {
    key: 'total',
    label: 'รวม',
    align: 'right',
    render: (row) => Number(row.total || 0).toLocaleString('th-TH'),
  };

  const columns: Column<SaleRow>[] = [...baseColumns, ...productColumns, totalColumn];

  // ✅ คำนวณแถวรวมทั้งหมด (summary row)
  const summaryRow: SaleRow | null =
    Array.isArray(data) && data.length > 0
      ? productsAPI.reduce(
          (acc, product) => {
            acc[product] = data.reduce(
              (sum, row) => sum + (row[product] || 0),
              0
            );
            acc.total = data.reduce((sum, row) => sum + (row.total || 0), 0);
            return acc;
          },
          { subdistrict: 'รวมทั้งหมด', index: 0, total: 0 } as SaleRow
        )
      : null;

  // ✅ รวมข้อมูลจริง + แถวรวม
  const tableData = summaryRow ? [...data, summaryRow] : data;

  return (
    <div className="rounded-xl bg-white shadow font-anuphan">

      <GenericTable
        title="รายงานปริมาณต้นกล้าแยกตามพื้นที่"
        data={tableData}
        columns={columns}
        idField="index"
        highlightLastRow
        emptyMessage="ไม่พบข้อมูลการขาย"
      />
    </div>
  );
}
