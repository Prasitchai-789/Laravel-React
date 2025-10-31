import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';

interface QuickSummaryData {
    totalUsed: number;
    totalRemaining: number;
    usageRate: number;
    comparisonRate: number;
    totalItems: number;
    totalValue: number;
    totalOrders: number;
    timeRange?: string;
    startDate?: string;
    endDate?: string;
    isFutureYear?: boolean;
    previousYearData?: { // ✅ เพิ่ม previousYearData
        year: number;
        totalUsed: number;
        totalValue: number;
        totalOrders: number;
        totalItems: number;
        hasData: boolean;
    };
}

interface RightSideProps {
    timeRange?: string;
    selectedDate?: Date | null;
    dateRange?: [Date | null, Date | null];
    dateMode?: 'single' | 'range';
}

const RightSide: React.FC<RightSideProps> = ({
    timeRange,
    selectedDate,
    dateRange,
    dateMode
}) => {
    const [loadingApprovals, setLoadingApprovals] = useState(true);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [recentApprovals, setRecentApprovals] = useState([]);
    const [quickSummary, setQuickSummary] = useState<QuickSummaryData>({
        totalUsed: 0,
        totalRemaining: 0,
        usageRate: 0,
        comparisonRate: 0,
        totalItems: 0,
        totalValue: 0
    });

    // ดึงข้อมูลสรุปภาพรวม
    const fetchQuickSummary = async (selectedYear: number | null = null) => {
        setLoadingSummary(true);
        try {
            // ใช้ปีที่เลือก หรือปีปัจจุบันเป็น default
            const yearToUse = selectedYear || new Date().getFullYear();

            const url = `/StoreOrder/QuickSummary?timeRange=${yearToUse}`;
            console.log('📊 Fetching quick summary from:', url);

            const response = await fetch(url);

            if (!response.ok) {
                // พยายามอ่าน error message จาก response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage += `, message: ${errorData.message || errorData.error || 'Unknown error'}`;
                    console.error('❌ Backend error details:', errorData);
                } catch {
                    // ถ้าอ่าน JSON ไม่ได้
                    errorMessage += ', message: Unable to parse error response';
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            // console.log('✅ Quick Summary Data:', data);

            if (data.success) {
                // 🔥 LOG ข้อมูลปีนี้และปีที่แล้วแบบละเอียด
                // console.log('📊=== COMPARISON DATA ===');
                // console.log(`📅 ปีนี้ (${data.timeRange}):`);
                // console.log(`   💰 มูลค่า: ${data.totalUsed?.toLocaleString()} บาท`);
                // console.log(`   📦 รายการ: ${data.totalItems} รายการ`);
                // console.log(`   📋 คำสั่งเบิก: ${data.totalOrders} คำสั่ง`);

                if (data.previousYearData) {
                    // console.log(`📅 ปีที่แล้ว (${data.previousYearData.year}):`);
                    // console.log(`   💰 มูลค่า: ${data.previousYearData.totalUsed?.toLocaleString()} บาท`);
                    // console.log(`   📦 รายการ: ${data.previousYearData.totalItems} รายการ`);
                    // console.log(`   📋 คำสั่งเบิก: ${data.previousYearData.totalOrders} คำสั่ง`);
                    // console.log(`   📈 มีข้อมูล: ${data.previousYearData.hasData ? '✅' : '❌'}`);
                } else {
                    // console.log('❌ ไม่มีข้อมูลปีที่แล้ว');
                }

                // console.log(`📈 อัตราการเติบโต: ${data.comparisonRate}%`);
                // console.log('📊=== END COMPARISON ===');

                setQuickSummary({
                    totalUsed: data.totalUsed || 0,
                    totalRemaining: data.totalRemaining || 0,
                    usageRate: data.usageRate || 0,
                    comparisonRate: data.comparisonRate || 0,
                    totalItems: data.totalItems || 0,
                    totalValue: data.totalValue || 0,
                    totalOrders: data.totalOrders || 0,
                    timeRange: data.timeRange,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    isFutureYear: data.isFutureYear,
                    previousYearData: data.previousYearData // ✅ เพิ่ม previousYearData
                });

                // ✅ แสดง warning ถ้าเป็นปีในอนาคต
                if (data.isFutureYear) {
                    // console.warn(`⚠️ Selected year ${data.originalYear} is in future, showing data for ${data.timeRange}`);
                }

                // ✅ Log ข้อมูล debug ถ้ามี
                if (data.debug) {
                    // console.log('🐛 Debug Info:', data.debug);
                    // 🔥 LOG ข้อมูล debug เพิ่มเติม
                    // console.log('🔍=== DEBUG COMPARISON ===');
                    // console.log(`💰 ปีนี้: ${data.debug.withdrawal_value} | ปีที่แล้ว: ${data.debug.previous_year_data?.value}`);
                    // console.log(`📦 ชิ้นปีนี้: ${data.debug.withdrawal_quantity} | ปีที่แล้ว: ${data.debug.previous_year_data?.quantity}`);
                    // console.log(`📋 Orderปีนี้: ${data.debug.withdrawal_orders} | ปีที่แล้ว: ${data.debug.previous_year_data?.orders}`);
                    // console.log('🔍=== END DEBUG ===');
                }
            } else {
                // console.error('❌ API returned success: false', data.message);
                throw new Error(data.message || 'API request failed');
            }
        } catch (error) {
            // console.error('❌ Error fetching quick summary:', error);

            // ✅ ตั้งค่า default values เมื่อ error
            setQuickSummary({
                totalUsed: 0,
                totalRemaining: 0,
                usageRate: 0,
                comparisonRate: 0,
                totalItems: 0,
                totalValue: 0,
                totalOrders: 0,
                timeRange: selectedYear?.toString() || new Date().getFullYear().toString(),
                startDate: '',
                endDate: '',
                isFutureYear: false,
                previousYearData: undefined
            });
        } finally {
            setLoadingSummary(false);
        }
    };
    // ดึงข้อมูลคำขอที่อนุมัติล่าสุด
    const fetchRecentApprovals = async () => {
        setLoadingApprovals(true);
        try {
            let url = '/StoreOrder/RecentApprovals';

            // เพิ่ม parameters ตามช่วงเวลาที่เลือก
            const params = new URLSearchParams();
            if (timeRange) params.append('timeRange', timeRange);
            if (selectedDate) params.append('selectedDate', selectedDate.toISOString().split('T')[0]);
            if (dateMode === 'range' && dateRange && dateRange[0] && dateRange[1]) {
                params.append('startDate', dateRange[0].toISOString().split('T')[0]);
                params.append('endDate', dateRange[1].toISOString().split('T')[0]);
            }
            if (dateMode) params.append('dateMode', dateMode);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            console.log('📋 Fetching recent approvals from:', url);

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            console.log('✅ Recent Approvals:', data);
            setRecentApprovals(data);
        } catch (error) {
            console.error('❌ Error fetching recent approvals:', error);
        } finally {
            setLoadingApprovals(false);
        }
    };

    useEffect(() => {
        fetchQuickSummary();
        fetchRecentApprovals();
    }, [timeRange, selectedDate, dateRange, dateMode]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };
    // เพิ่มฟังก์ชันจัดรูปแบบวันที่แสดงผล
    const formatDisplayDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const summaryStats = [
        {
            label: 'เบิกไปแล้ว',
            value: formatCurrency(quickSummary.totalUsed), // ✅ ใช้ formatCurrency
            unit: 'บาท',
            icon: '💰',
            description: `จาก ${quickSummary.totalOrders} คำสั่งเบิก`
        },
        {
            label: 'คงเหลือ',
            value: formatCurrency(quickSummary.totalRemaining), // ✅ ใช้ formatCurrency
            unit: 'บาท',
            icon: '🏪',
            description: 'มูลค่าสต็อก'
        },
        {
            label: 'อัตราการใช้',
            value: `${quickSummary.usageRate}%`,
            unit: 'ของสต็อก',
            icon: '⚡',
            description: `ใช้ไป ${formatCurrency(quickSummary.totalUsed)}`
        },
        {
            label: 'เปรียบเทียบ',
            value: quickSummary.comparisonRate > 0 ? `+${quickSummary.comparisonRate}%` :
                quickSummary.comparisonRate < 0 ? `${quickSummary.comparisonRate}%` : '0%',
            unit: 'จากปีก่อน',
            icon: quickSummary.comparisonRate > 0 ? '📈' :
                quickSummary.comparisonRate < 0 ? '📉' : '➡️',
            description: quickSummary.comparisonRate > 0 ? 'ใช้จ่ายเพิ่ม' :
                quickSummary.comparisonRate < 0 ? 'ประหยัดกว่า' : 'ใช้จ่ายเท่าเดิม'
        }
    ];

    return (
        <>
            {/* Quick Summary */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">สรุปภาพรวม</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {quickSummary.timeRange ? `ข้อมูลปี ${quickSummary.timeRange}` : (
                                        timeRange === 'month' && 'ข้อมูลเดือนนี้' ||
                                        timeRange === 'quarter' && 'ข้อมูลไตรมาสนี้' ||
                                        timeRange === 'year' && 'ข้อมูลปีนี้' ||
                                        timeRange === 'all' && 'ข้อมูลทั้งหมด' ||
                                        timeRange === 'custom' && 'ข้อมูลช่วงที่เลือก' ||
                                        'ข้อมูลภาพรวม'
                                    )}
                                </p>
                            </div>
                            {quickSummary.timeRange && (
                                <div className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
                                    ปี {quickSummary.timeRange}
                                </div>
                            )}
                        </div>
                        {quickSummary.isFutureYear && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                ⚠️ แสดงข้อมูลปีปัจจุบันแทนปีที่เลือก
                            </p>
                        )}
                        {quickSummary.startDate && quickSummary.endDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                ตั้งแต่ {formatDisplayDate(quickSummary.startDate)} ถึง {formatDisplayDate(quickSummary.endDate)}
                            </p>
                        )}
                    </div>
                </div>

                {loadingSummary ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">กำลังโหลดข้อมูล...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {summaryStats.map((stat, index) => (
                                <div key={index}
                                    className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-4 text-center border border-gray-200/30 dark:border-gray-600/30 hover:scale-105 transition-transform duration-200">
                                    <div className="text-2xl mb-2">{stat.icon}</div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                                    {/* ✅ ปรับสี: เพิ่มขึ้นเป็นแดง (ใช้จ่ายมากขึ้น), ลดลงเป็นเขียว (ประหยัด) */}
                                    <p className={`text-xl font-bold mt-1 ${stat.label === 'เปรียบเทียบ'
                                        ? quickSummary.comparisonRate > 0
                                            ? 'text-red-600 dark:text-red-400'  // เพิ่มขึ้น = แดง (ไม่ดี)
                                            : quickSummary.comparisonRate < 0
                                                ? 'text-green-600 dark:text-green-400'  // ลดลง = เขียว (ดี)
                                                : 'text-gray-600 dark:text-gray-400'    // คงที่ = เทา
                                        : 'text-gray-900 dark:text-white'
                                        }`}>
                                        {stat.value}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.unit}</p>
                                    {stat.description && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Additional Summary Info */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/5 rounded-xl border border-blue-200/30 dark:border-blue-700/30">

                            {quickSummary.totalOrders > 0 && (

                                <div className="text-center">
                                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                        {quickSummary.totalOrders.toLocaleString()} คำสั่งเบิก
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">ที่อนุมัติแล้ว</p>
                                </div>

                            )}
                        </div>

                        {/* ✅ ปรับส่วนแสดงอัตราการเติบโต: เพิ่มขึ้นเป็นแดง, ลดลงเป็นเขียว */}
                        <div className={`mt-4 p-4 rounded-xl border ${quickSummary.comparisonRate > 0
                            ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-700/30'  // เพิ่มขึ้น = แดง
                            : quickSummary.comparisonRate < 0
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-700/30'  // ลดลง = เขียว
                                : 'bg-gray-50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-700/30'      // คงที่ = เทา
                            }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        เปรียบเทียบการใช้จ่ายจากปีที่แล้ว
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        ปี {quickSummary.timeRange} vs ปี {quickSummary.previousYearData?.year}
                                    </p>
                                </div>
                                <div className={`text-lg font-bold ${quickSummary.comparisonRate > 0
                                    ? 'text-red-600 dark:text-red-400'  // เพิ่มขึ้น = แดง
                                    : quickSummary.comparisonRate < 0
                                        ? 'text-green-600 dark:text-green-400'  // ลดลง = เขียว
                                        : 'text-gray-600 dark:text-gray-400'    // คงที่ = เทา
                                    }`}>
                                    {quickSummary.comparisonRate > 0 ? '+' : ''}{quickSummary.comparisonRate}%
                                </div>
                            </div>
                            {/* ✅ แสดงไอคอนและข้อความตามการเปลี่ยนแปลง */}
                            <div className="flex items-center mt-2">
                                {quickSummary.comparisonRate > 0 ? (
                                    <>
                                        <svg className="w-4 h-4 text-red-600 dark:text-red-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        <span className="text-xs text-red-600 dark:text-red-400">ใช้จ่ายเพิ่มขึ้นจากปีที่แล้ว</span>
                                    </>
                                ) : quickSummary.comparisonRate < 0 ? (
                                    <>
                                        <svg className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                        <span className="text-xs text-green-600 dark:text-green-400">ประหยัดกว่าปีที่แล้ว</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                                        </svg>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">ใช้จ่ายเท่ากับปีที่แล้ว</span>
                                    </>
                                )}
                            </div>
                        </div>


                    </>
                )}
            </div>

            {/* Recent Approvals */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">คำขอที่อนุมัติล่าสุด</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {timeRange === 'month' && '3 คำขอล่าสุดที่ได้รับการอนุมัติเดือนนี้'}
                                {timeRange === 'quarter' && '3 คำขอล่าสุดที่ได้รับการอนุมัติไตรมาสนี้'}
                                {timeRange === 'year' && '3 คำขอล่าสุดที่ได้รับการอนุมัติปีนี้'}
                                {timeRange === 'all' && '3 คำขอล่าสุดที่ได้รับการอนุมัติ'}
                                {timeRange === 'custom' && '3 คำขอล่าสุดที่ได้รับการอนุมัติ'}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/StoreOrder/StoreIssueIndex"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                    >
                        ดูทั้งหมด
                    </Link>
                </div>

                {loadingApprovals ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">กำลังโหลด...</p>
                        </div>
                    </div>
                ) : recentApprovals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">ไม่มีคำขอที่อนุมัติแล้ว</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">คำขอที่ได้รับการอนุมัติจะแสดงที่นี่</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* ✅ แสดงแค่ 3 รายการล่าสุด */}
                        {recentApprovals.slice(0, 3).map((approval: any, index: number) => (
                            <div
                                key={`${approval.document_number}-${index}`}
                                className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/5 hover:from-green-100 dark:hover:from-green-800/20 transition-all duration-200 group border-l-4 border-green-500"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">✅</span>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                                {approval.document_number}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                อนุมัติเมื่อ {formatDate(approval.order_date)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        อนุมัติแล้ว
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">แผนก</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{approval.department}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">ผู้ขอเบิก</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{approval.requester}</p>
                                    </div>
                                </div>

                                {approval.user_approved && approval.user_approved !== 'ไม่ระบุ' && (
                                    <div className="mb-3">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">ผู้อนุมัติ</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{approval.user_approved}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-white/60 dark:bg-gray-600/20 rounded-lg border border-gray-200/50 dark:border-gray-500/30">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {approval.itemsCount || 0}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">รายการ</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            ฿{(approval.totalValue || 0).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">มูลค่ารวม</p>
                                    </div>
                                </div>

                                {approval.note && approval.note.trim() !== '' && (
                                    <div className="mb-3">
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">หมายเหตุ</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 bg-white/50 dark:bg-gray-600/20 p-2 rounded">
                                            {approval.note}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}


                    </div>
                )}
            </div>
        </>
    );
};

export default RightSide;
