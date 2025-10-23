// export default function KPICard({ title, value, sub }: { title: string; value: string; sub?: string }) {
//     return (
//         <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
//             <p className="text-sm text-gray-500">{title}</p>
//             <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
//             {sub && <p className="text-xs text-gray-500">{sub}</p>}
//         </div>
//     );
// }

// components/KPICard.tsx
import React from 'react';

interface KPICardProps {
    title: string;
    value: string | number;
    change?: {
        value: string;
        type: 'positive' | 'negative';
    };
    target?: string | number;
    duration?: string | number;
    icon?: React.ReactNode;
    iconBgColor?: string;
    trendData?: {
        labels: string[];
        data: number[];
    };
    className?: string;
}

const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    change,
    target,
    duration,
    icon,
    iconBgColor = 'bg-gradient-to-br from-blue-500 to-blue-600',
    trendData,
    className = '',
}) => {
    return (
        <div
            className={`group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg ${className}`}
        >
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {icon && <div className={`rounded-xl p-2 text-white ${iconBgColor} transition-transform group-hover:scale-110`}>{icon}</div>}
                    <h3 className="font-medium text-gray-600">{title}</h3>
                </div>

                {change && (
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            change.type === 'positive' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}
                    >
                        {change.type === 'positive' ? '↑' : '↓'} {change.value}
                    </span>
                )}
            </div>

            {/* Main Value */}
            <div className="flex items-center space-x-3">
                <p className="text-3xl font-bold text-gray-900">{value}</p>

                {/* Progress Bar (if target exists)
        {target && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min((Number(value) / Number(target)) * 100, 100)}%`
              }}
            ></div>
          </div>
        )} */}
            </div>

            {/* Additional Info */}
            <div className="mt-4 flex items-center justify-center space-x-8 border-gray-100">
                {target && (
                    <div className="text-center">
                        <p className="text-sm text-gray-400">Target</p>
                        <p className="text-xl font-semibold text-gray-800">{target}</p>
                    </div>
                )}

                {target && duration && <div className="h-8 w-px bg-gray-200"></div>}

                {duration && (
                    <div className="text-center">
                        <p className="text-sm text-gray-400">Duration</p>
                        <p className="text-xl font-semibold text-gray-800">{duration}</p>
                    </div>
                )}
            </div>

            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-blue-50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="absolute bottom-0 left-0 h-16 w-16 -translate-x-8 translate-y-8 rounded-full bg-gradient-to-tr from-blue-50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
        </div>
    );
};

// Alternative Design - Compact Version
export const CompactKPICard: React.FC<KPICardProps> = ({ title, value, change, icon, iconBgColor = 'bg-blue-500', className = '' }) => {
    return (
        <div
            className={`group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-md ${className}`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {icon && <div className={`rounded-lg p-2 text-white ${iconBgColor} transition-colors group-hover:bg-blue-600`}>{icon}</div>}
                    <div>
                        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                </div>

                {change && (
                    <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            change.type === 'positive'
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-600'
                                : 'border border-rose-200 bg-rose-50 text-rose-600'
                        }`}
                    >
                        {change.type === 'positive' ? '↑' : '↓'} {change.value}
                    </span>
                )}
            </div>
        </div>
    );
};

export default KPICard;

{
    /* <KPICard
        title="Active Users"
        value="8,742"
        change={{ value: '+12.3%', type: 'positive' }}
        target="15,000"
        duration="2,148"
        icon={<UserIcon />}
        iconBgColor="bg-gradient-to-br from-blue-500 to-cyan-600"
    /> */
}
