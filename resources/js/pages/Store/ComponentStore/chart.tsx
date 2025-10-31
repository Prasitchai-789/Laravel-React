import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

interface WaveCardProps {
    value: string;
    label: string;
    color?: string;
    direction?: 'up' | 'down';
    data?: { name: string; value: number }[];
}

function WaveCard({
    value = 1,
    label,
    color = 'from-blue-400 to-blue-600',
    // direction = 'up',
    data = [
        { name: 'Jan', value: 20 },
        { name: 'Feb', value: 40 },
        { name: 'Mar', value: 20 },
        { name: 'Apr', value: 40 },
        { name: 'May', value: 20 },
        { name: 'Jun', value: 30 },
    ],
}: WaveCardProps) {
    // const Icon = direction === 'up' ? ArrowUp : ArrowDown;
    // const arrowColor = direction === 'up' ? 'text-emerald-300' : 'text-rose-300';

    // ✅ ป้องกัน data เปลี่ยน reference โดยใช้ shallow compare
    const stableData = useMemo(() => [...data], [data]);

    // ✅ ใช้ unique gradient id ต่อ component เพื่อป้องกัน conflict ภายใน Recharts
    const gradientId = useMemo(
        () => `waveWhite-${Math.random().toString(36).substring(2, 8)}`,
        []
    );

    return (
        <div className="w-full max-w-xs overflow-hidden rounded-2xl font-anuphan shadow-md transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl">
            <div className={`relative bg-gradient-to-b ${color} flex flex-col justify-center pt-6 pb-10 text-white`}>
                <div className="flex w-full items-center justify-center px-6 pb-2">
                    <div className="absolute -right-5 bottom-10 h-24 w-24 rounded-full bg-white/10"></div>
                    <h2 className="text-2xl font-bold tracking-wide">{value}</h2>
                    {/* <Icon className={`h-5 w-5 opacity-90 transition-transform duration-300 ${arrowColor}`} /> */}
                </div>

                <div className="absolute bottom-0 m-0 h-[60px] w-full pt-4">
                    <ResponsiveContainer key={label} width="100%" height="100%" >
                        <AreaChart
                            data={stableData}
                            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="100%" stopColor="white" stopOpacity={1} />
                                </linearGradient>
                            </defs>
                            <Tooltip content={() => null} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="white"
                                strokeWidth={2}
                                fill={`url(#${gradientId})`}
                                fillOpacity={1}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white py-2 text-center">
                <p className="text-sm font-medium text-gray-800">{label}</p>
            </div>
        </div>
    );
}

export default React.memo(WaveCard);
