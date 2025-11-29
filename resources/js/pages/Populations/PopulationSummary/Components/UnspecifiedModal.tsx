import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Perple } from '../types/Perple';

interface UnspecifiedModalProps {
    showUnspecifiedDetails: boolean;
    setShowUnspecifiedDetails: (show: boolean) => void;
    perples: Perple[];
}

const UnspecifiedModal: React.FC<UnspecifiedModalProps> = ({
    showUnspecifiedDetails,
    setShowUnspecifiedDetails,
    perples
}) => {
    if (!showUnspecifiedDetails) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-purple-600" />
                            รายชื่อที่ไม่ระบุคำนำหน้า
                        </h3>
                        <button
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                            onClick={() => setShowUnspecifiedDetails(false)}
                        >
                            <X className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid gap-4">
                        {perples
                            .filter((p) => !["นาย", "นาง", "นางสาว", "น.ส."].includes(p.title ?? ""))
                            .map((p) => (
                                <div key={p.id} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="font-semibold text-slate-800 text-lg">
                                        {p.first_name} {p.last_name}
                                    </div>
                                    <div className="text-sm text-slate-600 mt-2 flex flex-wrap gap-3">
                                        <span>หมู่ที่ {p.village_no}</span>
                                        {p.tambon && <span>ตำบล{p.tambon}</span>}
                                        {p.amphoe && <span>อำเภอ{p.amphoe}</span>}
                                        {p.province && <span>จังหวัด{p.province}</span>}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
                <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                    <div className="flex justify-end">
                        <button
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
                            onClick={() => setShowUnspecifiedDetails(false)}
                        >
                            <X className="w-4 h-4" />
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnspecifiedModal;
