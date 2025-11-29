import { DensityData } from "../types/Density";
import { toNumber } from "../utils/number";

export const normalizeDensityArray = (arr: any[]): DensityData[] =>
    (arr || []).map((d) => ({
        temperature_c: toNumber(d.temperature_c),
        density: toNumber(d.density),
    }));
