import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface TransactionCardProps {
    title?: string;
    value: number;
    percent: number;
    date?: string;
    bars?: number[];
    currency?: string;
    variant?: 'default' | 'modern' | 'minimal';
}

export default function TransactionCard({
    title = 'Transactions',
    value,
    percent,
    date = 'dd/mm/yyyy',
    bars = [20, 45, 35, 70, 60, 30, 40, 50, 25, 65, 45, 35],
    currency = '$',
    variant = 'modern',
}: TransactionCardProps) {
    // สีตาม variant
    const getVariantStyles = () => {
        switch (variant) {
            case 'modern':
                return {
                    card: 'bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/60',
                    title: 'text-gray-700',
                    value: 'text-gray-900',
                    percent:
                        percent >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200',
                    bar: percent >= 0 ? 'bg-gradient-to-t from-emerald-400 to-emerald-500' : 'bg-gradient-to-t from-rose-400 to-rose-500',
                    date: 'text-gray-500 bg-gray-100/80',
                };
            case 'minimal':
                return {
                    card: 'bg-white border-l-4 border-l-blue-500 shadow-sm',
                    title: 'text-gray-600',
                    value: 'text-gray-900',
                    percent: percent >= 0 ? 'text-emerald-600' : 'text-rose-600',
                    bar: percent >= 0 ? 'bg-emerald-300' : 'bg-rose-300',
                    date: 'text-gray-400',
                };
            default:
                return {
                    card: 'bg-white shadow-lg border border-gray-100',
                    title: 'text-gray-800',
                    value: 'text-gray-900',
                    percent: percent >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600',
                    bar: percent >= 0 ? 'bg-blue-500' : 'bg-red-400',
                    date: 'text-gray-400',
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className={`rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${styles.card}`}
        >
            {/* Header */}
            <div className="mb-2 flex items-start justify-between">
                <div>
                    <h3 className={`mb-1 text-lg font-semibold ${styles.title}`}>{title}</h3>
                    {/* <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${styles.date}`}>
            <Calendar size={14} />
            <span>{date}</span>
          </div> */}
                </div>

                {/* Percent Badge */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`inline-flex items-center space-x-1 rounded-full px-3 py-2 text-xs font-semibold ${styles.percent}`}
                >
                    {percent >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span>
                        {percent > 0 ? '+' : ''}
                        {percent}%
                    </span>
                </motion.div>
            </div>

            {/* Amount */}
            <div className="mb-4">
                <motion.h2 initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`mb-2 text-4xl font-bold ${styles.value}`}>
                    {currency} {value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </motion.h2>
                <p className="text-sm text-gray-400">Total transaction amount</p>
            </div>

            {/* Bar Chart */}
            <div className="relative p-0">
                <div className="flex h-20 items-end justify-between">
                    {bars.map((height, index) => (
                        <motion.div
                            key={index}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            whileHover={{
                                scaleY: 1.1,
                                backgroundColor: percent >= 0 ? '#10b981' : '#ef4444',
                            }}
                            transition={{
                                delay: index * 0.05,
                                duration: 0.6,
                                ease: 'easeOut',
                            }}
                            className={`w-3 cursor-pointer rounded-t-lg transition-all duration-200 ${styles.bar}`}
                            style={{ height: `${height}%` }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

{/* <TransactionCard
    title="Revenue"
    value={1200.75}
    percent={12.5}
    bars={[10, 25, 40, 80, 60, 50, 70, 90, 20, 45, 35, 70, 60, 30, 40, 50, 25, 65, 45, 3]}
    currency="฿"
/>; */}
