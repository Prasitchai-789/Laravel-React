import React from 'react';

const PaymentStats = ({ stats }) => {
    const paymentMethods = [
        { key: 'cash', label: 'เงินสด', color: 'bg-green-500' },
        { key: 'transfer', label: 'เงินโอน', color: 'bg-blue-500' },
        { key: 'credit', label: 'เครดิต', color: 'bg-yellow-500' },
        { key: 'other', label: 'อื่นๆ', color: 'bg-gray-500' }
    ];

    const total = Object.values(stats).reduce((sum, amount) => sum + (amount || 0), 0);

    return (
        <div className="bg-white rounded-lg shadow p-6 font-anuphan">
            <h2 className="text-lg font-semibold mb-4">สถิติการชำระเงิน</h2>
            <div className="space-y-4">
                {paymentMethods.map(method => {
                    const amount = stats[method.key] || 0;
                    const percentage = total > 0 ? (amount / total * 100).toFixed(1) : 0;

                    return (
                        <div key={method.key} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${method.color}`}></div>
                                <span className="text-sm font-medium text-gray-700">{method.label}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-800">
                                    {amount.toLocaleString()} บาท
                                </p>
                                <p className="text-xs text-gray-500">{percentage}%</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-green-500 via-blue-500 to-yellow-500 h-2 rounded-full"
                        style={{
                            width: '100%',
                            background: `linear-gradient(90deg,
                                green ${(stats.cash/total*100) || 0}%,
                                blue ${(stats.cash/total*100) || 0}% ${((stats.cash + stats.transfer)/total*100) || 0}%,
                                yellow ${((stats.cash + stats.transfer)/total*100) || 0}% ${((stats.cash + stats.transfer + stats.credit)/total*100) || 0}%,
                                gray ${((stats.cash + stats.transfer + stats.credit)/total*100) || 0}%)`
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default PaymentStats;
