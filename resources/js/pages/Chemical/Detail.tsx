interface DetailViewProps {
  group: {
    date: string;
    shift: string;
    records: {
      chemical_name: string;
      quantity: number | null;
      note: string | null;
    }[];
  };
}

export default function DetailView({ group }: DetailViewProps) {
  if (!group || !group.records || group.records.length === 0) {
    return (
      <div className="flex justify-center items-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-lg">ไม่พบข้อมูล</p>
      </div>
    );
  }

  // ✅ ทำ merge ภายใน component
  const mergedRecords = group.records.reduce((acc, item) => {
    const existing = acc.find(r => r.chemical_name === item.chemical_name);
    if (existing) {
      existing.quantity = (existing.quantity ?? 0) + (item.quantity ?? 0);
      // รวมหมายเหตุด้วย
      if (item.note && !existing.note?.includes(item.note)) {
        existing.note = existing.note 
          ? `${existing.note}, ${item.note}` 
          : item.note;
      }
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as { chemical_name: string; quantity: number | null; note: string | null }[]);

  return (
    <div className="space-y-6 p-6 bg-white rounded-2xl shadow-lg">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
        <h3 className="text-xl font-bold text-gray-800 text-center">
          รายละเอียดสารเคมี       </h3>
        <p className="text-center text-gray-600 mt-1">
          {group.date} - กะ{group.shift}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">
                ชื่อสารเคมี
              </th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">
                ปริมาณ
              </th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">
                หมายเหตุ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {mergedRecords.map((item, idx) => (
              <tr key={idx} className="hover:bg-blue-50 transition-colors duration-150">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {item.chemical_name}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${item.quantity ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {item.quantity ?? '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700 max-w-xs">
                  {item.note ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded">
                      <p className="text-sm">{item.note}</p>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          จำนวนรายการทั้งหมด: {mergedRecords.length} รายการ
        </p>
       
      </div>
    </div>
  );
}