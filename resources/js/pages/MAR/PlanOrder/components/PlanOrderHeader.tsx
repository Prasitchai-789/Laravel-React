import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Grid3x3, Plus, Truck, Package, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
    viewMode: 'table' | 'calendar';
    onViewModeChange: (mode: 'table' | 'calendar') => void;
    selectedCount: number;
    onCreateClick: () => void;
}

export default function PlanOrderHeader({ viewMode, onViewModeChange, selectedCount, onCreateClick }: Props) {
    // สถิติตัวอย่าง (อาจส่งมาจาก parent)
    const todayStats = {
        total: 24,
        pending: 8,
        completed: 16
    };

    return (
        <div className="bg-blue-600 rounded-xl p-6 mb-6 text-white shadow-lg">
            {/* Main Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500 p-2.5 rounded-xl">
                            <Truck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                วางแผนการขนส่ง
                                <Badge variant="secondary" className="bg-blue-500 text-white border-0 text-sm">
                                    จัดการคำสั่งขนส่ง
                                </Badge>
                            </h1>
                            <p className="text-blue-100 text-sm mt-0.5 flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                อัปเดตล่าสุด {new Date().toLocaleTimeString('th-TH')}
                            </p>
                        </div>
                    </div>
              
                </div>

                {/* Right Section - Actions */}
                <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="bg-blue-500 p-1 rounded-lg">
                        <div className="flex gap-1">
                            <Button
                                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => onViewModeChange('table')}
                                className={`flex items-center gap-2 ${
                                    viewMode === 'table' 
                                        ? 'bg-white text-blue-600 hover:bg-white/90' 
                                        : 'text-white hover:bg-blue-400'
                                }`}
                            >
                                <Grid3x3 className="h-4 w-4" />
                                <span className="hidden sm:inline">ตาราง</span>
                            </Button>
                            <Button
                                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => onViewModeChange('calendar')}
                                className={`flex items-center gap-2 ${
                                    viewMode === 'calendar' 
                                        ? 'bg-white text-blue-600 hover:bg-white/90' 
                                        : 'text-white hover:bg-blue-400'
                                }`}
                            >
                                <Calendar className="h-4 w-4" />
                                <span className="hidden sm:inline">ปฏิทิน</span>
                            </Button>
                        </div>
                    </div>

                    {/* Create Button */}
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-400 border-0"
                        onClick={onCreateClick}
                    >
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">สร้างแผน</span>
                    </Button>

                    {/* Selected Count Badge (ถ้ามี) */}
                    {selectedCount > 0 && (
                        <Badge variant="secondary" className="bg-blue-500 text-white border-0 ml-2">
                            เลือก {selectedCount} รายการ
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
}