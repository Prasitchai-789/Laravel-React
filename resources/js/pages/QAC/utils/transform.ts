import { CPORecord } from "../types/CPORecord";
import { toNumber } from "./number";

/**
 * transformRecordData
 * - ดึงข้อมูลออกจาก CPORecord
 * - แยก tanks[] และ oil_room
 */
export const transformRecordData = (record: CPORecord) => {
    const r = record as any;
    const tanks: any[] = [];

    const pushTank = (no: number) => {
        if (r[`tank${no}_oil_level`] || r[`tank${no}_temperature`]) {
            tanks.push({
                tank_no: no,
                oil_level: r[`tank${no}_oil_level`] ?? "",
                temperature: r[`tank${no}_temperature`] ?? "",
                cpo_volume: r[`tank${no}_cpo_volume`] ?? "",
                ffa: r[`tank${no}_ffa`] ?? "",
                moisture: r[`tank${no}_moisture`] ?? "",
                dobi: r[`tank${no}_dobi`] ?? "",
                top_ffa: r[`tank${no}_top_ffa`] ?? "",
                top_moisture: r[`tank${no}_top_moisture`] ?? "",
                top_dobi: r[`tank${no}_top_dobi`] ?? "",
                bottom_ffa: r[`tank${no}_bottom_ffa`] ?? "",
                bottom_moisture: r[`tank${no}_bottom_moisture`] ?? "",
                bottom_dobi: r[`tank${no}_bottom_dobi`] ?? "",
            });
        }
    };

    [1, 2, 3, 4].forEach(pushTank);

    return {
        tanks,
        oil_room: {
            total_cpo: r.total_cpo ?? "",
            ffa_cpo: r.ffa_cpo ?? "",
            dobi_cpo: r.dobi_cpo ?? "",
            cs1_cm: r.cs1_cm ?? "",
            undilute_1: r.undilute_1 ?? "",
            undilute_2: r.undilute_2 ?? "",
            setting: r.setting ?? "",
            clean_oil: r.clean_oil ?? "",
            skim: r.skim ?? "",
            mix: r.mix ?? "",
            loop_back: r.loop_back ?? "",
        },
    };
};


export const normalizeDensityArray = (arr: any[] = []) =>
    arr.map((d) => ({
        temperature_c: toNumber(d.temperature_c),
        density: toNumber(d.density),
    }));

    export const normalizeTankInfoArray = (arr: any[] = []) =>
    arr.map((t) => ({
        tank_no: toNumber(t.tank_no),
        height_m: toNumber(t.height_m),
        diameter_m: t.diameter_m !== undefined ? toNumber(t.diameter_m) : undefined,
        volume_m3: toNumber(t.volume_m3),
    }));

/**
 * normalizeRecord
 * แปลงทุก field ที่เป็น string → number (ถ้าได้)
 */
export const normalizeRecord = (record: CPORecord): CPORecord => {
    const normalized: any = { ...record };

    Object.keys(record).forEach((key) => {
        const value = record[key as keyof CPORecord];
        if (typeof value === "string" || typeof value === "number") {
            normalized[key] = toNumber(value);
        } else {
            normalized[key] = value;
        }
    });

    return normalized;
};
