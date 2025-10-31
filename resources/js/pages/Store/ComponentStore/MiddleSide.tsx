import React, { useState, useEffect, useCallback } from 'react';
import MonthlyTrendChart from './MonthlyTrendChart';
import CategoryUsageStats from './CategoryUsageStats';
import TopProductsSection from './TopProductsSection';

interface MiddleSideProps {
    timeRange: string;
    selectedDate?: Date | null;
    dateRange?: [Date | null, Date | null];
    dateMode?: 'single' | 'range';
}

const MiddleSide: React.FC<MiddleSideProps> = ({
    timeRange,
    selectedDate,
    dateRange,
    dateMode
}) => {
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // อัพเดทเวลาล่าสุดเมื่อข้อมูลเปลี่ยน
    useEffect(() => {
        console.log('🔄 MiddleSide - Props changed, updating lastUpdate');
        setLastUpdate(new Date());
    }, [timeRange, selectedDate, dateRange, dateMode]); // เพิ่ม dateMode ใน dependencies

    // ฟังก์ชันแสดงช่วงเวลาที่เลือก - ใช้ useCallback เพื่อป้องกันการสร้างฟังก์ชันใหม่ทุกครั้งที่ render
    const getDisplayTimeRange = useCallback(() => {
        console.log('📅 MiddleSide - Calculating display time range:', {
            timeRange,
            dateMode,
            selectedDate: selectedDate?.toLocaleDateString('th-TH'),
            dateRange: dateRange?.map(d => d?.toLocaleDateString('th-TH'))
        });

        if (timeRange === 'custom') {
            if (dateMode === 'single' && selectedDate) {
                return `วันที่ ${selectedDate.toLocaleDateString('th-TH')}`;
            } else if (dateMode === 'range' && dateRange?.[0] && dateRange?.[1]) {
                return `ช่วง ${dateRange[0].toLocaleDateString('th-TH')} - ${dateRange[1].toLocaleDateString('th-TH')}`;
            }
            // กรณี custom แต่ไม่มีวันที่เลือก
            return 'กำหนดเอง';
        }

        const rangeLabels: { [key: string]: string } = {
            'month': 'เดือนนี้',
            'quarter': 'ไตรมาสนี้',
            'year': 'ปีนี้',
            'all': 'ทั้งหมด'
        };

        return rangeLabels[timeRange] || 'ทั้งหมด';
    }, [timeRange, selectedDate, dateRange, dateMode]);

    // ฟังก์ชันจัดการการอัพเดทข้อมูล - ใช้ useCallback
    const handleDataUpdate = useCallback(() => {
        console.log('📢 MiddleSide - Child component reported data update');
        setLastUpdate(new Date());
    }, []);

    // Debug: Log props changes
    useEffect(() => {
        console.log('🔍 MiddleSide - Props received:', {
            timeRange,
            selectedDate: selectedDate?.toISOString(),
            dateRange: dateRange?.map(d => d?.toISOString()),
            dateMode
        });
    }, [timeRange, selectedDate, dateRange, dateMode]);

    const displayTimeRange = getDisplayTimeRange();

    return (
        // Product Usage Statistics
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">สถิติการใช้สินค้า</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {displayTimeRange}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-700/50">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ข้อมูล: {displayTimeRange} • โหลด: {lastUpdate.toLocaleTimeString('th-TH')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8">
                <MonthlyTrendChart
                    key={`monthly-chart-${timeRange}-${selectedDate?.getTime()}-${dateRange?.[0]?.getTime()}-${dateRange?.[1]?.getTime()}`}
                    timeRange={timeRange}
                    selectedDate={selectedDate}
                    dateRange={dateRange}
                    dateMode={dateMode}
                    onDataUpdate={handleDataUpdate}
                />

                {/* <CategoryUsageStats
                    key={`category-stats-${timeRange}-${selectedDate?.getTime()}-${dateRange?.[0]?.getTime()}-${dateRange?.[1]?.getTime()}`}
                    timeRange={timeRange}
                    selectedDate={selectedDate}
                    dateRange={dateRange}
                    dateMode={dateMode}
                    onDataUpdate={handleDataUpdate}
                /> */}

                <TopProductsSection
                    key={`top-products-${timeRange}-${selectedDate?.getTime()}-${dateRange?.[0]?.getTime()}-${dateRange?.[1]?.getTime()}`}
                    timeRange={timeRange}
                    selectedDate={selectedDate}
                    dateRange={dateRange}
                    dateMode={dateMode}
                    onDataUpdate={handleDataUpdate}
                />
            </div>
        </div>
    );
};

export default MiddleSide;
