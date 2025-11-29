import { useState, useEffect } from "react";
import axios from "axios";

export function useLocationSakon() {
    const [provinces, setProvinces] = useState<string[]>([]);
    const [amphoes, setAmphoes] = useState<string[]>([]);
    const [tambons, setTambons] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        axios.get("/getProvinceSakon") // <-- endpoint Laravel
            .then(res => {
                const data = res.data;

                const provinceSet = new Set<string>();
                const amphoeSet = new Set<string>();
                const tambonSet = new Set<string>();

                data.forEach((item: any) => {
                    if(item.ProvinceName) provinceSet.add(item.ProvinceName);
                    if(item.DistrictName) amphoeSet.add(item.DistrictName);
                    if(item.SubDistrictName) tambonSet.add(item.SubDistrictName);
                });

                setProvinces(Array.from(provinceSet).sort());
                setAmphoes(Array.from(amphoeSet).sort());
                setTambons(Array.from(tambonSet).sort());
            })
            .finally(() => setLoading(false));
    }, []);

    return { provinces, amphoes, tambons, loading };
}
