import React from "react";
import { Thermometer } from "lucide-react";
import { toFixed } from "../../utils/number";

interface Props {
    tank: any; // transformed tank
    tankVolume: number;
    density?: number;
}

export default function TankCard({ tank, tankVolume, density }: Props) {
    return (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
            <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-medium text-amber-600">
                    Tank {tank.tank_no}
                </div>

                <div className="flex items-center space-x-1 text-xs text-amber-500">
                    <Thermometer className="h-3 w-3" />
                    <span>{tank.temperature}°C</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="text-gray-600">ระดับ:</div>
                <div className="font-medium text-gray-700">{tank.oil_level} cm</div>

                <div className="text-gray-600">ปริมาณ:</div>
                <div className="font-bold text-amber-700">{toFixed(tankVolume, 3)} ตัน</div>
            </div>

            {density && (
                <div className="mt-1 text-xs text-gray-500">
                    ความหนาแน่น: {density}
                </div>
            )}
        </div>
    );
}
