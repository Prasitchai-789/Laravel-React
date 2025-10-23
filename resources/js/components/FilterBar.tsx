export default function FilterBar({ year, setYear, month, setMonth, goodId, setGoodId, refresh }: any) {
    const today = new Date();
    const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return (
        <div className="flex flex-wrap items-end gap-3">
            <div>
                <label className="text-xs text-gray-600">ปี</label>
                <select
                    className="block rounded-xl border bg-white p-2 text-sm shadow-sm"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                >
                    {[0, 1, 2, 3, 4].map((o) => {
                        const y = today.getFullYear() - o;
                        return (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        );
                    })}
                </select>
            </div>
            <div>
                <label className="text-xs text-gray-600">เดือน</label>
                <select className="block rounded-xl border bg-white p-2 text-sm shadow-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
                    <option value="">ทั้งหมด</option>
                    {monthLabels.map((m, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {m}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="text-xs text-gray-600">สินค้า</label>
                <select
                    className="block rounded-xl border bg-white p-2 text-sm shadow-sm"
                    value={goodId as any}
                    onChange={(e) => setGoodId(e.target.value ? parseInt(e.target.value) : '')}
                >
                    <option value="">ทั้งหมด</option>
                    <option value={2147}>น้ำมันปาล์มดิบ</option>
                    <option value={2150}>เมล็ดในปาล์ม</option>
                    <option value={2151}>กะลา</option>
                    <option value={2152}>ทะลายสับ</option>
                    <option value={2153}>ทะลายปาล์มเปล่า</option>
                    <option value={2154}>ใยปาล์ม</option>
                </select>
            </div>
            <button onClick={refresh} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">
                รีเฟรช
            </button>
        </div>
    );
}
