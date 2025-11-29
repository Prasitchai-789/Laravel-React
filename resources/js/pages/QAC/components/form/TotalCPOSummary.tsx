import React from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";

interface Props {
    totalVolume: number;
    tankCount: number;
    tankDetails: { tank_no: number; volume: number }[];
}

export default function TotalCPOSummary({
    totalVolume,
    tankCount,
    tankDetails,
}: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">สรุป Total CPO</h3>
                </div>

                <div className="text-right">
                    <p className="text-2xl font-bold text-blue-700">
                        {totalVolume.toFixed(3)} ตัน
                    </p>
                    <p className="text-sm text-blue-600">รวมจาก {tankCount} แทงค์</p>
                </div>
            </div>

            {/* Tank List */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                {tankDetails.map((tank) => (
                    <div
                        key={tank.tank_no}
                        className="rounded-lg bg-white/50 p-2 text-center"
                    >
                        <p className="font-medium text-blue-700">
                            Tank {tank.tank_no}
                        </p>
                        <p className="text-blue-600">
                            {tank.volume.toFixed(3)} ตัน
                        </p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
