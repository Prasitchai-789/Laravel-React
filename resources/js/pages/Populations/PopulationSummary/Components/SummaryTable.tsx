import React, { useMemo, useState } from 'react';
import { Table, HelpCircle } from 'lucide-react';
import { Perple } from '../types/Perple';
import UnspecifiedModal from './UnspecifiedModal';

interface SummaryTableProps {
    filteredSummary: Perple[];
    fmt: (n: number) => string;
}

interface AggSummary {
    province?: string;
    amphoe?: string;
    tambon?: string;
    village_no: string | number;
    total: number;
    male: number;
    female: number;
    unspecified: number;
    residents: Perple[]; // เก็บรายชื่อประชากร
}

const SummaryTable: React.FC<SummaryTableProps> = ({ filteredSummary, fmt }) => {
    const [showUnspecified, setShowUnspecified] = useState(false);

    const aggSummary = useMemo(() => {
        const map = new Map<string, AggSummary>();

        filteredSummary.forEach(p => {
            const village_no = p.village_no ?? "ไม่ระบุ";
            const key = `${p.province ?? ''}-${p.amphoe ?? ''}-${p.tambon ?? ''}-${village_no}`;

            const title = p.title?.trim() ?? "";
            const male = title === "นาย" ? 1 : 0;
            const female = ["นาง", "นางสาว", "น.ส."].includes(title) ? 1 : 0;
            const unspecified = male + female === 0 ? 1 : 0;

            if (map.has(key)) {
                const existing = map.get(key)!;
                existing.male += male;
                existing.female += female;
                existing.unspecified += unspecified;
                existing.total += 1;
                existing.residents.push(p);
            } else {
                map.set(key, {
                    province: p.province ?? "",
                    amphoe: p.amphoe ?? "",
                    tambon: p.tambon ?? "",
                    village_no,
                    male,
                    female,
                    unspecified,
                    total: 1,
                    residents: [p],
                });
            }
        });

        return Array.from(map.values());
    }, [filteredSummary]);

    const unspecifiedList = filteredSummary.filter(
        p => !["นาย", "นาง", "นางสาว", "น.ส."].includes(p.title ?? "")
    );

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Table className="w-6 h-6 text-blue-600" />
                    สรุปข้อมูลประชากรแยกตามพื้นที่
                </h2>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
                        แสดง {aggSummary.length} หมู่บ้าน
                    </div>
                    {unspecifiedList.length > 0 && (
                        <button
                            className="flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                            onClick={() => setShowUnspecified(true)}
                        >
                            <HelpCircle className="w-4 h-4" /> ไม่ระบุ {unspecifiedList.length} คน
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-slate-700 border-b">หมู่บ้าน / รายชื่อ</th>
                                <th className="px-6 py-4 text-center font-semibold text-slate-700 border-b">ทั้งหมด</th>
                                <th className="px-6 py-4 text-center font-semibold text-slate-700 border-b">ชาย</th>
                                <th className="px-6 py-4 text-center font-semibold text-slate-700 border-b">หญิง</th>
                                <th className="px-6 py-4 text-center font-semibold text-slate-700 border-b">ไม่ระบุ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {aggSummary.map(s => (
                                <tr key={`${s.province}-${s.amphoe}-${s.tambon}-${s.village_no}`} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-800">หมู่ที่ {s.village_no}</div>
                                        <div className="text-sm text-slate-600 mt-1">
                                            {s.tambon && `ตำบล${s.tambon} `}
                                            {s.amphoe && `อำเภอ${s.amphoe} `}
                                            {s.province && `จังหวัด${s.province}`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-semibold text-slate-800">{fmt(s.total)}</td>
                                    <td className="px-6 py-4 text-center font-semibold text-green-600">{fmt(s.male)}</td>
                                    <td className="px-6 py-4 text-center font-semibold text-pink-600">{fmt(s.female)}</td>
                                    <td className="px-6 py-4 text-center font-semibold text-purple-600">{fmt(s.unspecified)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <UnspecifiedModal
                showUnspecifiedDetails={showUnspecified}
                setShowUnspecifiedDetails={setShowUnspecified}
                perples={filteredSummary}
            />
        </div>
    );
};

export default SummaryTable;
