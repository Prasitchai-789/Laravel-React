import React from "react";
import { toFixed } from "../../utils/number";

interface Props {
    tankTotals: {
        tankDetails: { tank_no: number; volume: number }[];
        totalVolume: string;
        tankCount: number;
    };
}

export default function SummaryCard({ tankTotals }: Props) {
    return (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
            <div className="mb-2 text-xs font-medium text-amber-600">
                สรุปปริมาณ (คำนวณ) :{" "}
                <span className="font-bold text-amber-700">
                    {tankTotals.tankCount} แทงค์
                </span>
            </div>

            <div className="space-y-2 text-xs">
                {tankTotals.tankDetails.map((tank) => (
                    <div key={tank.tank_no} className="flex justify-between text-xs">
                        <span className="text-gray-500">Tank {tank.tank_no}:</span>
                        <span className="text-amber-600">{toFixed(tank.volume, 3)} ตัน</span>
                    </div>
                ))}

                <div className="flex justify-between border-t border-amber-200 pt-1">
                    <span className="font-medium text-gray-700">Total ทั้งหมด:</span>
                    <span className="font-bold text-amber-800">{tankTotals.totalVolume} ตัน</span>
                </div>
            </div>
        </div>
    );
}
