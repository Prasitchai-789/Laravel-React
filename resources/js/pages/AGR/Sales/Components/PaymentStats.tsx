import React from 'react';

interface PaymentStatsData {
    cash?: number;
    transfer?: number;
    credit?: number;
    other?: number;
}

interface PaymentStatsProps {
    stats: PaymentStatsData;
    formatCurrency: (value: number | undefined) => string;
}

const PaymentStats: React.FC<PaymentStatsProps> = ({ stats, formatCurrency }) => {
    const paymentMethods = [
        { key: 'cash' as keyof PaymentStatsData, label: 'เงินสด', color: 'bg-green-500', gradient: 'from-green-500 to-green-600' },
        { key: 'transfer' as keyof PaymentStatsData, label: 'เงินโอน', color: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' },
        { key: 'credit' as keyof PaymentStatsData, label: 'เครดิต', color: 'bg-yellow-500', gradient: 'from-yellow-500 to-yellow-600' },
        { key: 'other' as keyof PaymentStatsData, label: 'อื่นๆ', color: 'bg-gray-500', gradient: 'from-gray-500 to-gray-600' }
    ];

    // ฟังก์ชันคำนวณ total
    const calculateTotal = (): number => {
        return paymentMethods.reduce((sum, method) => {
            return sum + (stats[method.key] || 0);
        }, 0);
    };

    const total = calculateTotal();

    // ฟังก์ชันคำนวณ percentage
    const calculatePercentage = (amount: number): number => {
        if (total === 0) return 0;
        return Number(((amount / total) * 100).toFixed(1));
    };

    // สร้างข้อมูลสำหรับ progress bar
    const getProgressBarData = () => {
        const percentages = paymentMethods.map(method => {
            const amount = stats[method.key] || 0;
            return calculatePercentage(amount);
        });

        let currentPosition = 0;
        const gradientStops = paymentMethods.map((method, index) => {
            const start = currentPosition;
            currentPosition += percentages[index];
            return {
                color: method.color.replace('bg-', ''),
                start: start,
                end: currentPosition
            };
        });

        return gradientStops;
    };

    const gradientStops = getProgressBarData();

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 font-anuphan">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">สถิติการชำระเงิน</h2>
            </div>

            <div className="space-y-4 mb-6">
                {paymentMethods.map(method => {
                    const amount = stats[method.key] || 0;
                    const percentage = calculatePercentage(amount);

                    return (
                        <div key={method.key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="flex items-center space-x-3 flex-1">
                                <div className={`w-4 h-4 rounded-full ${method.color}`}></div>
                                <span className="font-medium text-gray-700">{method.label}</span>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-gray-800 text-lg">
                                    {formatCurrency(amount)} บาท
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {percentage}%
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Progress Bar */}
            {total > 0 && (
                <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>สัดส่วนการชำระเงิน</span>
                        <span>100%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-3 rounded-full"
                            style={{
                                background: `linear-gradient(90deg, ${gradientStops.map(stop =>
                                    `${stop.color} ${stop.start}% ${stop.end}%`
                                ).join(', ')})`
                            }}
                        ></div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        {paymentMethods.map((method, index) => {
                            const amount = stats[method.key] || 0;
                            const percentage = calculatePercentage(amount);

                            if (percentage === 0) return null;

                            return (
                                <div key={method.key} className="flex items-center space-x-2 text-xs">
                                    <div className={`w-3 h-3 rounded ${method.color}`}></div>
                                    <span className="text-gray-600">{method.label}</span>
                                    <span className="font-medium text-gray-800">{percentage}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Summary */}
            {total > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-gray-600 text-sm">ยอดรวมทั้งหมด</p>
                            <p className="font-bold text-gray-800 text-lg">{formatCurrency(total)} บาท</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">วิธีการชำระเงิน</p>
                            <p className="font-bold text-blue-600 text-lg">
                                {paymentMethods.filter(method => (stats[method.key] || 0) > 0).length} วิธี
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {total === 0 && (
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-lg">ไม่มีข้อมูลการชำระเงิน</p>
                    <p className="text-gray-400 text-sm mt-1">ไม่พบข้อมูลในช่วงวันที่นี้</p>
                </div>
            )}
        </div>
    );
};

export default PaymentStats;
