import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { router } from "@inertiajs/react";
import { CPORecord } from "../types";
import { normalizeTankInfoArray } from "../utils/tank";
import { normalizeDensityArray } from "./useDensity";

export const useCPORecords = (initialRecords: CPORecord[], tankInfo: any[], densityRef: any[]) => {
    const [records, setRecords] = useState<CPORecord[]>(initialRecords || []);
    const [tankInfoList, setTankInfoList] = useState(normalizeTankInfoArray(tankInfo || []));
    const [densityRefList, setDensityRefList] = useState(normalizeDensityArray(densityRef || []));
    const [loading, setLoading] = useState<boolean>(false);

    /** โหลดข้อมูล API */
    const fetchApiData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(route("cpo.api"));

            if (response.data.success) {
                setRecords(response.data.records || []);
                setTankInfoList(normalizeTankInfoArray(response.data.cpoTankInfo || []));
                setDensityRefList(normalizeDensityArray(response.data.cpoDensityRef || []));
            }
        } catch (err) {
            console.error("Error loading API:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    /** refresh data */
    const refresh = async () => await fetchApiData();

    return {
        records,
        tankInfoList,
        densityRefList,
        loading,
        refresh,
    };
};
