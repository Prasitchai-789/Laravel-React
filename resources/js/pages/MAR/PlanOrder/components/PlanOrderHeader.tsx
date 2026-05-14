import React from 'react';
import { Calendar, Grid3x3, Plus, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
    viewMode: 'table' | 'calendar';
    onViewModeChange: (mode: 'table' | 'calendar') => void;
    selectedCount: number;
    onCreateClick: () => void;
}

export default function PlanOrderHeader({ viewMode, onViewModeChange, selectedCount, onCreateClick }: Props) {
    return (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl p-4 border border-white/60 shadow-sm mb-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* 1. Branding & Current Selection */}
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-xl shadow-blue-500/20 text-white">
                        <Truck className="w-8 h-8" />
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <h1 className="text-4xl font-black tracking-tight text-slate-800">Plan Order</h1>
                            <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-lg shadow-sm">ISANPALM</span>
                        </div>
                        <p className="text-slate-800 font-bold text-md flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            จัดการแผนและคำสั่งขนส่งสินค้า
                            {selectedCount > 0 && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0 text-xs ml-2">
                                    เลือก {selectedCount} รายการ
                                </Badge>
                            )}
                        </p>
                    </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1.5 bg-slate-100/50 p-2 rounded-2xl border border-slate-200/50 shadow-inner">
                        <button
                            title="มุมมองตาราง"
                            onClick={() => onViewModeChange('table')}
                            className={`flex items-center justify-center rounded-xl px-4 py-2 transition-all duration-300 ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'}`}
                        >
                            <Grid3x3 className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2 text-[11px] font-bold uppercase tracking-wider">ตาราง</span>
                        </button>
                        <button
                            title="มุมมองปฏิทิน"
                            onClick={() => onViewModeChange('calendar')}
                            className={`flex items-center justify-center rounded-xl px-4 py-2 transition-all duration-300 ${viewMode === 'calendar' ? 'bg-blue-600 text-white shadow-md ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'}`}
                        >
                            <Calendar className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2 text-[11px] font-bold uppercase tracking-wider">ปฏิทิน</span>
                        </button>
                    </div>

                    {/* Create Button */}
                    <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-black text-xs transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transform hover:scale-[1.02]"
                        onClick={onCreateClick}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="uppercase tracking-widest">สร้างแผนใหม่</span>
                    </button>
                </div>
            </div>
        </div>
    );
}