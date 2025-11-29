import React from "react";
import { Calendar, FlaskConical, Filter, TrendingUp } from "lucide-react";
import { toFixed } from "../../utils/number";

interface Props {
    latestRecord?: any;
    tankTotals?: {
        totalVolume: string;
        skim: string;
        tankCount: number;
    };
    totalRecords: number;
}

export default function StatsCards({ latestRecord, tankTotals, totalRecords }: Props) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* วันที่ล่าสุด */}
            <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-blue-100">วันที่บันทึกล่าสุด</p>

                        <p className="mt-1 text-lg font-bold">
                            {latestRecord
                                ? new Date(latestRecord.date).toLocaleDateString("th-TH", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                  })
                                : "ไม่มีข้อมูล"}
                        </p>

                        <p className="mt-1 text-xs text-blue-200">{totalRecords} รายการ</p>
                    </div>

                    <div className="rounded-2xl bg-white/20 p-3">
                        <Calendar className="h-6 w-6" />
                    </div>
                </div>
            </div>

            {/* Total CPO */}
            <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-amber-100">ยอด CPO</p>
                        <p className="mt-1 text-xl font-bold">
                            {tankTotals ? tankTotals.totalVolume : "0.000"} ตัน
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white/20 p-3">
                        <FlaskConical className="h-6 w-6" />
                    </div>
                </div>
            </div>

            {/* Skim */}
            <div className="rounded-3xl bg-gradient-to-br from-red-500 to-pink-600 p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-red-100">Skim</p>
                        <p className="mt-1 text-xl font-bold">{tankTotals ? tankTotals.skim : "0.000"} ตัน</p>
                    </div>
                    <div className="rounded-2xl bg-white/20 p-3">
                        <Filter className="h-6 w-6" />
                    </div>
                </div>
            </div>

            {/* จำนวนแทงค์ */}
            <div className="rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-green-100">แทงค์ที่ใช้งาน</p>
                        <p className="mt-1 text-2xl font-bold">
                            {tankTotals ? tankTotals.tankCount : "0"}
                        </p>
                        <div className="mt-1 text-xs text-green-200">แทงค์</div>
                    </div>

                    <div className="rounded-2xl bg-white/20 p-3">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                </div>
            </div>
        </div>
    );
}
