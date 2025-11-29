import { DensityData } from "../types/Density";
import { TankInfo } from "../types/TankInfo";
import { toNumber } from "./number";

/**
 * คำนวณปริมาตร CPO หน่วยตัน
 * คัดลอกจาก logic เดิม (CPORecordList)
 */
export const calculateCPOVolume = (
    tankInputs: any[],
    tankInfo: TankInfo[],
    densityRef: DensityData[]
) => {
    if (!tankInfo.length || !densityRef.length) {
        return { volumes: {} as Record<number, number>, total_cpo: 0 };
    }

    const tankMap = new Map<number, TankInfo>();
    tankInfo.forEach((t) => tankMap.set(t.tank_no, t));

    const densityMap = new Map<number, number>();
    densityRef.forEach((d) => densityMap.set(d.temperature_c, d.density));

    let total = 0;
    const volumes: Record<number, number> = {};

    tankInputs.forEach((tank) => {
        const tankNo = toNumber(tank.tank_no);
        const oilLevel = toNumber(tank.oil_level);
        const temp = Math.round(toNumber(tank.temperature));

        if (!tankNo || !oilLevel || !temp) {
            volumes[tankNo] = 0;
            return;
        }

        const info = tankMap.get(tankNo);
        if (!info || !info.height_m || !info.volume_m3) {
            volumes[tankNo] = 0;
            return;
        }

        const density =
            densityMap.get(temp) ??
            densityMap.get(temp - 1) ??
            densityMap.get(temp + 1) ??
            0.8841;

        const volumePerCm_m3 = info.volume_m3 / info.height_m / 100;
        const weightTon = oilLevel * volumePerCm_m3 * density;

        volumes[tankNo] = weightTon;
        total += weightTon;
    });

    return { volumes, total_cpo: total };
};
