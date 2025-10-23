import React from 'react';
import { exportToCSV } from '../lib/exportCSV';


export default function ExportButtons({ data }: { data: any[] }) {
const handlePrint = () => window.print();
const handleCSV = () => exportToCSV(data, 'sales_report.csv');


return (
<div className="flex justify-end gap-2">
<button onClick={handlePrint} className="rounded-lg bg-amber-500 px-3 py-2 text-white hover:bg-amber-600">🖨 พิมพ์รายงาน</button>
<button onClick={handleCSV} className="rounded-lg bg-emerald-500 px-3 py-2 text-white hover:bg-emerald-600">⬇ Export CSV</button>
</div>
);
}
