import React from "react";
import { Filter } from "lucide-react";

interface Props {
    tank: any; // transformed tank
}

export default function QualityCard({ tank }: Props) {
    const isTank1 = tank.tank_no === 1;

    return (
        <div
            className={`rounded-2xl border p-3 ${
                isTank1
                    ? "border-blue-100 bg-blue-50/50"
                    : "border-purple-100 bg-purple-50/50"
            }`}
        >
            <div className="mb-2 flex items-center justify-between">
                <div
                    className={`text-xs font-medium ${
                        isTank1 ? "text-blue-600" : "text-purple-600"
                    }`}
                >
                    คุณภาพ Tank {tank.tank_no}
                </div>

                {!isTank1 && (
                    <div className="flex items-center space-x-1 text-xs text-purple-500">
                        <Filter className="h-3 w-3" />
                        <span>Top/Bottom</span>
                    </div>
                )}
            </div>

            {isTank1 ? (
                // Tank 1: Single data only
                <div className="text-xs">
                    <div className="mb-1 grid grid-cols-3 gap-2 font-medium text-gray-600">
                        <div>%FFA</div>
                        <div>%Moisture</div>
                        <div>DOBI</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-bold text-blue-700">
                        <div>{tank.ffa || "-"}%</div>
                        <div>{tank.moisture || "-"}%</div>
                        <div>{tank.dobi || "-"}</div>
                    </div>
                </div>
            ) : (
                // Tank 2-4: TOP / BOTTOM
                <div className="space-y-2 text-xs">
                    {/* TOP */}
                    <div>
                        <div className="mb-1 grid grid-cols-4 gap-2 text-gray-600">
                            <span></span>
                            <div>%FFA</div>
                            <div>%Moisture</div>
                            <div>DOBI</div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 font-bold text-green-700">
                            <div className="mb-1 flex items-center space-x-1 font-medium text-green-600">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                <span>บน</span>
                            </div>
                            <div>{tank.top_ffa || "-"}%</div>
                            <div>{tank.top_moisture || "-"}%</div>
                            <div>{tank.top_dobi || "-"}</div>
                        </div>
                    </div>

                    {/* BOTTOM */}
                    <div>
                        <div className="grid grid-cols-4 gap-2 font-bold text-orange-700">
                            <div className="mb-1 flex items-center space-x-1 font-medium text-orange-600">
                                <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                                <span>ล่าง</span>
                            </div>
                            <div>{tank.bottom_ffa || "-"}%</div>
                            <div>{tank.bottom_moisture || "-"}%</div>
                            <div>{tank.bottom_dobi || "-"}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
