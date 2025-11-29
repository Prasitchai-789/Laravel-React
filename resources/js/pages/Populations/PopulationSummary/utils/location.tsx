import { Perple } from "../types/Perple";
import axios from "axios";
export const extractLocationData = (perples: Perple[]) => {
    const tambonSet = new Set<string>();
    const amphoeSet = new Set<string>();
    const provinceSet = new Set<string>();

    perples.forEach(p => {
        if (p.tambon) tambonSet.add(p.tambon);
        if (p.amphoe) amphoeSet.add(p.amphoe);
        if (p.province) provinceSet.add(p.province);
    });

    return {
        tambons: Array.from(tambonSet).sort(),
        amphoes: Array.from(amphoeSet).sort(),
        provinces: Array.from(provinceSet).sort()
    };
};



// utils/location.ts


// ดึงเฉพาะข้อมูลจังหวัดสกลนครจาก API
export async function fetchProvinceSakon() {
    const res = await axios.get("/getLocationSakon");
    return res.data;
}

