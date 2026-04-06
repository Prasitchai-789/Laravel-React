import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
    Truck,
    Factory,
    Archive,
    ChevronRight,
    BarChart3,
} from 'lucide-react';
import { GlassCard } from './ProductionKPICards';

interface FlowStepProps {
    label: string;
    value: number;
    color: 'blue' | 'indigo' | 'emerald' | 'rose' | 'slate';
    icon: React.ReactNode;
    highlight?: boolean;
}

const colorClasses: Record<string, string> = {
    blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700',
    indigo: 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700',
    emerald: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700',
    rose: 'border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100 text-rose-700',
    slate: 'border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700',
};

function FlowStep({ label, value, color, icon, highlight }: FlowStepProps) {
    const displayValue = typeof value === 'number' ? value : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-3 group"
        >
            <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-24 h-24 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${colorClasses[color]} ${highlight ? 'ring-4 ring-rose-300 animate-pulse' : ''}`}
            >
                {icon}
            </motion.div>
            <div className="text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
                <p className="text-xl font-black text-slate-800">
                    <CountUp
                        key={displayValue}
                        end={displayValue}
                        duration={1.5}
                        decimals={displayValue % 1 !== 0 ? 2 : 0}
                        separator=","
                    />{' '}
                    <span className="text-[10px]">T</span>
                </p>
            </div>
        </motion.div>
    );
}

function FlowArrow() {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="hidden md:flex flex-col items-center"
        >
            <ChevronRight className="w-8 h-8 text-slate-300 group-hover:text-slate-400 transition-colors" />
        </motion.div>
    );
}

interface ProductionFlowDiagramProps {
    carry: number;
    incoming: number;
    productionKg: number;
    stock: number;
}

export default function ProductionFlowDiagram({ carry, incoming, productionKg, stock }: ProductionFlowDiagramProps) {
    return (
        <GlassCard className="overflow-hidden" delay={0.35}>
            <div className="p-8">
                <div className="flex items-center gap-2 mb-8">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Production Flow Visualization</h2>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
                    <FlowStep label="Existing Stock" value={carry} color="blue" icon={<Archive />} />
                    <FlowArrow />
                    <FlowStep label="New Harvest" value={incoming} color="indigo" icon={<Truck />} />
                    <FlowArrow />
                    <FlowStep label="Processed" value={productionKg ? productionKg / 1000 : 0} color="emerald" icon={<Factory />} />
                    <FlowArrow />
                    <FlowStep label="Current Stock" value={stock} color={stock < 50 ? 'rose' : 'slate'} icon={<Archive />} highlight={stock < 50} />
                </div>
            </div>
        </GlassCard>
    );
}
