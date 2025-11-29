import { useCallback } from "react";
import { calculateCPOVolume } from "../utils/cpo";
import { normalizeRecord } from "../utils/transform";
import { toFixed, toNumber } from "../utils/number";
import { CPORecord, TankInfo, DensityData } from "../types";
import { transformRecordData } from "../utils/transform";

export const useTankCalculation = (tankInfo: TankInfo[], densityRef: DensityData[]) => {

    /** คำนวณปริมาตรทั้งหมด */
    const computeTankTotals = useCallback((record: CPORecord) => {
        const normalized = normalizeRecord(record);
        const transformed = transformRecordData(normalized);
        const volumeResult = calculateCPOVolume(transformed.tanks, tankInfo, densityRef);

        const tankDetails = transformed.tanks.map((tank: any) => ({
            tank_no: tank.tank_no,
            volume: toNumber(volumeResult.volumes[tank.tank_no]),
            oil_level: toNumber(tank.oil_level),
            temperature: toNumber(tank.temperature),
        }));

        return {
            tankDetails,
            tankCount: tankDetails.length,
            totalVolume: toFixed(volumeResult.total_cpo),
            skim: toFixed(normalized.skim || 0),
        };
    }, [tankInfo, densityRef]);


    /** คำนวณค่าเฉลี่ยคุณภาพน้ำมัน */
    const computeQualityAverages = useCallback((record: CPORecord) => {
        const normalized = normalizeRecord(record);
        const transformed = transformRecordData(normalized);

        const validTanks = transformed.tanks.filter(
            (tank: any) => tank.ffa || tank.moisture || tank.dobi
        );

        const avg = (key: string) =>
            validTanks.length
                ? validTanks.reduce((s: number, t: any) => s + toNumber(t[key]), 0) / validTanks.length
                : 0;

        return {
            avgFFA: avg("ffa").toFixed(2),
            avgMoisture: avg("moisture").toFixed(2),
            avgDobi: avg("dobi").toFixed(2),
            tankCount: validTanks.length,
        };
    }, []);

    return {
        computeTankTotals,
        computeQualityAverages,
    };
};
