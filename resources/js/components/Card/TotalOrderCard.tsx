import { motion } from 'framer-motion';
import { Calendar, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

interface TotalOrderCardProps {
    value: number;
    label?: string;
    data?: { name: string; value: number }[];
    change?: number;
    timeframe?: string;
    variant?: 'default' | 'modern' | 'minimal';
}

export default function TotalOrderCard({
    value,
    label = 'Total Order',
    data = [
        { name: 'Mon', value: 30 },
        { name: 'Tue', value: 60 },
        { name: 'Wed', value: 40 },
        { name: 'Thu', value: 80 },
        { name: 'Fri', value: 55 },
        { name: 'Sat', value: 65 },
        { name: 'Sun', value: 50 },
    ],
    change = 12.5,
    timeframe = 'This Week',
    variant = 'modern',
}: TotalOrderCardProps) {
    // ใช้ transition กลางแบบ "เร็ว" สำหรับทุก motion
    const fast = { duration: 0.2, ease: 'easeOut' };

    // สีตาม variant และค่า change
    const getVariantStyles = () => {
        const isPositive = change >= 0;

        switch (variant) {
            case 'modern':
                return {
                    card: 'bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/60 backdrop-blur-sm',
                    value: 'text-gray-900',
                    label: 'text-gray-600',
                    change: isPositive
                        ? 'text-emerald-600 bg-emerald-50 border border-emerald-200'
                        : 'text-rose-600 bg-rose-50 border border-rose-200',
                    gradient: isPositive ? { start: '#10b981', end: '#059669' } : { start: '#ef4444', end: '#dc2626' },
                    icon: 'text-gray-400 bg-gray-100/80',
                    timeframe: 'text-gray-500 bg-gray-100/60',
                };
            case 'minimal':
                return {
                    card: 'bg-white border-l-4 border-l-blue-500 shadow-sm',
                    value: 'text-gray-900',
                    label: 'text-gray-500',
                    change: isPositive ? 'text-emerald-600' : 'text-rose-600',
                    gradient: isPositive ? { start: '#10b981', end: '#059669' } : { start: '#ef4444', end: '#dc2626' },
                    icon: 'text-gray-400',
                    timeframe: 'text-gray-400',
                };
            default:
                return {
                    card: 'bg-white shadow-lg border border-gray-100',
                    value: 'text-gray-900',
                    label: 'text-gray-500',
                    change: isPositive ? 'text-emerald-600 bg-emerald-100' : 'text-rose-600 bg-rose-100',
                    gradient: isPositive ? { start: '#10b981', end: '#059669' } : { start: '#ef4444', end: '#dc2626' },
                    icon: 'text-gray-400',
                    timeframe: 'text-gray-500',
                };
        }
    };

    const styles = getVariantStyles();
    const isPositive = change >= 0;

    // Custom Tooltip (ทำให้โผล่ไวขึ้น)
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.12, ease: 'easeOut' }}
                    className="rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm"
                >
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-sm text-gray-600">
                        Orders: <span className="font-semibold">{payload[0].value}k</span>
                    </p>
                </motion.div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={fast}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className={`rounded-2xl p-2 transition-all ${styles.card}`}
        >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between px-4 pt-4">
                <div>
                    <motion.h2
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={fast}
                        className={`mb-1 text-3xl font-bold ${styles.value}`}
                    >
                        {value.toLocaleString()}k
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={fast}
                        className={`mb-2 text-sm font-medium ${styles.label}`}
                    >
                        {label}
                    </motion.p>
                </div>

                <div className="flex flex-col items-end space-y-2">
                    {/* Change Indicator (ไม่มี delay) */}
                    <motion.div
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={fast}
                        className={`inline-flex items-center space-x-1 rounded-full px-3 py-2 text-xs font-semibold ${styles.change}`}
                    >
                        <TrendingUp size={12} className={isPositive ? '' : 'rotate-180'} />
                        <span>
                            {isPositive ? '+' : ''}
                            {change}%
                        </span>
                    </motion.div>

                    {/* Timeframe */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={fast}
                        className={`inline-flex items-center space-x-1 rounded-md px-2 py-1 text-xs ${styles.timeframe}`}
                    >
                        <Calendar size={12} />
                        <span>{timeframe}</span>
                    </motion.div>
                </div>
            </div>

            {/* Chart (fade-in เร็ว ๆ พร้อมส่วนอื่น) */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fast} className="-mx-2 h-32">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorOrder" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={styles.gradient.start} stopOpacity={0.4} />
                                <stop offset="80%" stopColor={styles.gradient.start} stopOpacity={0.1} />
                                <stop offset="100%" stopColor={styles.gradient.start} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={styles.gradient.start}
                            fill="url(#colorOrder)"
                            strokeWidth={3}
                            activeDot={{
                                fill: styles.gradient.end,
                                stroke: styles.gradient.end,
                                strokeWidth: 2,
                                r: 6,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </motion.div>
        </motion.div>
    );
}

{/* <TotalOrderCard
    value={4.28}
    label="New Orders"
    data={[
        { name: 'Mon', value: 45 },
        { name: 'Tue', value: 55 },
        { name: 'Wed', value: 70 },
        { name: 'Thu', value: 50 },
        { name: 'Fri', value: 80 },
        { name: 'Sat', value: 65 },
        { name: 'Sun', value: 90 },
    ]}
/>; */}
