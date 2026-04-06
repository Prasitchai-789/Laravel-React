import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
    Leaf,
    Archive,
    ShoppingBag,
    Factory,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';

// Glassmorphism wrapper card
export const GlassCard = ({ children, className = '', delay = 0 }: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${className}`}
    >
        {children}
    </motion.div>
);

// Progress indicator component
const ProgressArrow = ({ progress, threshold = 70 }: { progress: number; threshold?: number }) => (
    <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex items-center float-end"
    >
        <span className="text-sm text-slate-500 font-medium">{typeof progress === 'number' ? progress.toFixed(0) : progress}%</span>
        {progress > threshold ? (
            <ArrowUp className="w-4 h-4 text-emerald-500 ml-1 animate-bounce" />
        ) : (
            <ArrowDown className="w-4 h-4 text-rose-500 ml-1 animate-pulse" />
        )}
    </motion.span>
);

// Animated progress bar
const ProgressBar = ({ progress, delay = 0.3, colorClass }: {
    progress: number;
    delay?: number;
    colorClass: string;
}) => (
    <div className="relative">
        <div className="flex w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, delay }}
                className={`flex flex-col justify-center overflow-hidden rounded-full ${colorClass}`}
            />
        </div>
    </div>
);

// Card 1: Palm Quantity
export const DetailedPalmCard = ({ total, carry, incoming, progress }: {
    total: number; carry: number; incoming: number; progress: number;
}) => (
    <GlassCard className="col-span-1 md:col-span-2 xl:col-span-3 overflow-hidden relative" delay={0.1}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-blue-500/10 rounded-full blur-2xl"></div>
        <div className="p-6 pb-4 relative">
            <div className="mb-2">
                <ProgressArrow progress={progress} />
                <h5 className="truncate text-slate-700 font-bold font-prompt text-base flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    ปริมาณผลปาล์ม
                </h5>
            </div>
            <div className="mb-3 text-center">
                <h2 className="text-4xl font-bold text-slate-800">
                    <CountUp key={total} end={total} duration={2.5} separator="," /> <span className="text-base font-normal text-slate-500">kg.</span>
                </h2>
            </div>
            <div className="flex items-center justify-between mb-4">
                <div className="mx-6 text-center flex-1">
                    <p className="text-2xl font-bold text-slate-800 font-anuphan">{carry.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 font-anuphan">ยอดยกมา</p>
                </div>
                <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>
                <div className="mx-6 text-center flex-1">
                    <p className="text-2xl font-bold text-slate-800 font-anuphan">{incoming.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 font-anuphan">ผลปาล์มรับเข้า</p>
                </div>
            </div>
            <ProgressBar
                progress={progress}
                delay={0.3}
                colorClass={progress > 70
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-rose-400 to-rose-600'
                }
            />
        </div>
    </GlassCard>
);

// Card 2: Remaining Stock
export const RemainingStockCard = ({ value, progress }: { value: number; progress: number }) => (
    <GlassCard className="col-span-1 md:col-span-2 xl:col-span-2 relative overflow-hidden" delay={0.15}>
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent"></div>
        <div className="p-6 relative">
            <div className="mb-8 flex justify-between items-start">
                <h5 className="truncate text-slate-700 font-bold font-prompt text-base flex items-center gap-2">
                    <Archive className="w-4 h-4 text-rose-600" />
                    ปริมาณผลปาล์มคงเหลือ
                </h5>
                <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="px-3 py-1 text-[10px] font-bold rounded-full text-emerald-600 bg-emerald-100 uppercase tracking-widest shadow-sm"
                >
                    Daily
                </motion.span>
            </div>
            <div className="flex items-center justify-between mb-11">
                <h2 className="text-4xl font-bold text-slate-800">
                    <CountUp key={value} end={value} duration={2} separator="," /> <span className="text-base font-normal text-slate-500">kg.</span>
                </h2>
            </div>
            <ProgressBar progress={progress} delay={0.4} colorClass="bg-gradient-to-r from-rose-400 to-rose-600" />
        </div>
    </GlassCard>
);

// Card 3: Basket Count
export const BasketCountCard = ({ total, start, hours, progress }: {
    total: number; start: string; hours: string; progress?: number;
}) => (
    <GlassCard className="col-span-1 md:col-span-2 xl:col-span-2 relative overflow-hidden" delay={0.2}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl"></div>
        <div className="p-6 relative text-center h-full flex flex-col">
            <div className="mb-2 flex justify-between items-start">
                <h5 className="truncate text-slate-700 font-bold font-prompt text-base flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    จำนวนกะบะ
                </h5>
                <motion.span
                    className="px-3 py-1 text-[10px] font-bold rounded-full text-amber-600 bg-amber-100 uppercase tracking-widest shadow-sm"
                >
                    Today
                </motion.span>
            </div>
            <div className="mb-1 mt-2">
                <h2 className="text-5xl font-black text-slate-800">
                    <CountUp key={total} end={total} duration={2} separator="," /> <span className="text-xl font-normal text-slate-500"></span>
                </h2>
            </div>
            <div className="flex items-center justify-between mt-auto ">
                <div className="text-center flex-1">
                    <p className="text-xl font-bold text-slate-700 font-anuphan">{start} น.</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เริ่มงาน</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="text-center flex-1">
                    <p className="text-xl font-bold text-slate-700 font-anuphan">{hours}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ชั่วโมงทำงาน</p>
                </div>
            </div>
        </div>
    </GlassCard>
);

// Card 4: Production Quantity
export const ProductionDetailedCard = ({ total, avg, yieldVal, progress }: {
    total: number; avg: number; yieldVal: number; progress: number;
}) => (
    <GlassCard className="col-span-1 md:col-span-2 xl:col-span-3 overflow-hidden relative" delay={0.25}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"></div>
        <div className="p-6 pb-4 relative">
            <div className="mb-1">
                <ProgressArrow progress={progress} />
                <h5 className="truncate text-slate-700 font-bold font-prompt text-base flex items-center gap-2">
                    <Factory className="w-4 h-4 text-blue-600" />
                    ปริมาณการผลิต
                </h5>
            </div>
            <div className="mb-3 text-center">
                <h2 className="text-4xl font-bold text-blue-700">
                    <CountUp key={total} end={total} duration={2.5} separator="," /> <span className="text-base font-normal text-slate-500">kg.</span>
                </h2>
            </div>
            <div className="flex items-center justify-between mb-4">
                <div className="mx-6 text-center flex-1">
                    <p className="text-2xl font-bold text-blue-600 font-anuphan">{avg.toFixed(2)}</p>
                    <p className="text-xs text-slate-500 font-anuphan">ตัน / กะบะ</p>
                </div>
                <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>
                <div className="mx-6 text-center flex-1">
                    <p className={`text-2xl font-bold font-anuphan ${yieldVal >= 18 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {yieldVal.toFixed(2)}%
                    </p>
                    <p className="text-xs text-slate-500 font-anuphan">Yield</p>
                </div>
            </div>
            <ProgressBar progress={progress} delay={0.6} colorClass="bg-gradient-to-r from-blue-500 to-indigo-600" />
        </div>
    </GlassCard>
);
