import { toNumber } from "./number";
import { TankInfo } from "../types/TankInfo";

/** Normalize จาก API */
export const normalizeTankInfoArray = (arr: any[]): TankInfo[] =>
    (arr || []).map((t) => ({
        tank_no: toNumber(t.tank_no),
        height_m: toNumber(t.height_m),
        diameter_m: t.diameter_m !== undefined ? toNumber(t.diameter_m) : undefined,
        volume_m3: toNumber(t.volume_m3),
    }));
