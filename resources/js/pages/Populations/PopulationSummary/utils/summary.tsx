import { SummaryItem } from "../types/Summary";

export const normalizeSummaryData = (serverSummary: any[]): SummaryItem[] => {
    const src = serverSummary?.length ? serverSummary : [];

    return src
        .map((item) => ({
            village_no: Number(item.village_no ?? 0),
            total: Number(item.total ?? 0) || 0,
            male: Number(item.male ?? 0) || 0,
            female: Number(item.female ?? 0) || 0,
            unspecified: Number(item.unspecified ?? 0) || 0,
            tambon: item.tambon || "",
            amphoe: item.amphoe || "",
            province: item.province || "",
        }))
        .sort((a, b) => a.village_no - b.village_no);
};

export const computeSummaryFromPerples = (
    perples: any[],
    normalizedSummary: SummaryItem[]
): SummaryItem[] => {
    if (normalizedSummary.length > 0) return normalizedSummary;

    const map: Record<
        number,
        {
            total: number;
            male: number;
            female: number;
            unspecified: number;
            tambon: string;
            amphoe: string;
            province: string;
        }
    > = {};

    perples.forEach((p) => {
        const v = Number(p.village_no ?? 0);
        if (!map[v]) map[v] = {
            total: 0,
            male: 0,
            female: 0,
            unspecified: 0,
            tambon: p.tambon || "",
            amphoe: p.amphoe || "",
            province: p.province || ""
        };

        map[v].total += 1;

        if (p.title === "นาย") map[v].male += 1;
        else if (["นาง", "นางสาว", "น.ส."].includes(p.title ?? "")) map[v].female += 1;
        else map[v].unspecified += 1;
    });

    return Object.entries(map)
        .map(([village_no, data]) => ({
            village_no: Number(village_no),
            ...data,
        }))
        .sort((a, b) => a.village_no - b.village_no);
};

export const calculateTotalSummary = (filteredSummary: SummaryItem[]): TotalSummary => {
    return filteredSummary.reduce(
        (acc, curr) => ({
            total: acc.total + Number(curr.total ?? 0),
            male: acc.male + Number(curr.male ?? 0),
            female: acc.female + Number(curr.female ?? 0),
            unspecified: acc.unspecified + Number(curr.unspecified ?? 0),
        }),
        { total: 0, male: 0, female: 0, unspecified: 0 }
    );
};
