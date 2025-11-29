import React from 'react';
import { Users, User, UserCheck, HelpCircle, Search } from 'lucide-react';
import { Perple } from '../types/Perple';

interface DetailsViewProps {
    filteredPerples: Perple[];
    searchTerm: string;
    fmt: (n: number) => string;
}

const DetailsView: React.FC<DetailsViewProps> = ({ filteredPerples, searchTerm, fmt }) => {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-600" />
                    รายชื่อประชากร
                </h2>
                <div className="text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
                    พบ {fmt(filteredPerples.length)} รายการ
                    {searchTerm && ` สำหรับ "${searchTerm}"`}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                {filteredPerples.length > 0 ? (
                    <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
                        {filteredPerples.map((p) => (
                            <div key={p.id} className="p-6 flex items-center hover:bg-blue-50 transition-colors">
                                <div
                                    className={`rounded-2xl p-4 mr-4 ${
                                        p.title === "นาย"
                                            ? "bg-green-100 text-green-600"
                                            : ["นาง", "นางสาว", "น.ส."].includes(p.title ?? "")
                                            ? "bg-pink-100 text-pink-600"
                                            : "bg-purple-100 text-purple-600"
                                    }`}
                                >
                                    {p.title === "นาย" ? (
                                        <User className="w-6 h-6" />
                                    ) : ["นาง", "นางสาว", "น.ส."].includes(p.title ?? "") ? (
                                        <UserCheck className="w-6 h-6" />
                                    ) : (
                                        <HelpCircle className="w-6 h-6" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800 text-lg mb-2">
                                        {p.first_name ?? "-"} {p.last_name ?? "-"}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm font-medium">
                                            หมู่ที่ {p.village_no ?? "-"}
                                        </span>
                                        {p.tambon && (
                                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
                                                ต.{p.tambon}
                                            </span>
                                        )}
                                        {p.amphoe && (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
                                                อ.{p.amphoe}
                                            </span>
                                        )}
                                        {p.province && (
                                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm font-medium">
                                                จ.{p.province}
                                            </span>
                                        )}
                                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                            p.title === "นาย"
                                                ? "bg-green-100 text-green-700"
                                                : ["นาง", "นางสาว", "น.ส."].includes(p.title ?? "")
                                                ? "bg-pink-100 text-pink-700"
                                                : "bg-purple-100 text-purple-700"
                                        }`}>
                                            {p.title ?? "ไม่ระบุ"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500">
                        <Search className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                        <p className="text-xl font-semibold mb-2">ไม่พบข้อมูลประชากร</p>
                        <p className="text-slate-600">ลองเปลี่ยนคำค้นหาหรือเงื่อนไขการกรอง</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailsView;
