import React from "react";
import { motion } from "framer-motion";
import { FlaskConical, CheckSquare, Square } from 'lucide-react';

interface Props {
    selectedTanks: number[];
    onSelect: (tankNo: number) => void;
}

export default function TankSelector({ selectedTanks, onSelect }: Props) {
    const isTankSelected = (tankNo: number) => selectedTanks.includes(tankNo);

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((tankNo) => (
                <motion.div
                    key={tankNo}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative transform-gpu cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 hover:shadow-lg ${
                        isTankSelected(tankNo)
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/80 shadow-md shadow-blue-200/30'
                            : 'border-gray-200/80 bg-white/60 hover:border-blue-300/50 hover:bg-blue-50/30'
                    }`}
                    onClick={() => onSelect(tankNo)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div
                                className={`rounded-xl p-2 shadow-sm transition-all duration-300 ${
                                    isTankSelected(tankNo)
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-400'
                                }`}
                            >
                                <FlaskConical className="h-4 w-4" />
                            </div>
                            <div>
                                <span className={`font-semibold ${isTankSelected(tankNo) ? 'text-blue-700' : 'text-gray-600'}`}>
                                    Tank {tankNo}
                                </span>
                                <div
                                    className={`mt-0.5 text-xs ${
                                        isTankSelected(tankNo) ? 'font-medium text-blue-600' : 'text-gray-500'
                                    }`}
                                >
                                    {isTankSelected(tankNo) ? '✓ เลือกแล้ว' : 'คลิกเพื่อเลือก'}
                                </div>
                            </div>
                        </div>
                        {isTankSelected(tankNo) ? (
                            <CheckSquare className="h-5 w-5 text-blue-500" />
                        ) : (
                            <Square className="h-5 w-5 text-gray-300" />
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
