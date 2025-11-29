export interface SummaryItem {
    village_no: number;
    total: number;
    male: number;
    female: number;
    unspecified: number;
    tambon: string;
    amphoe: string;
    province: string;
}

export interface TotalSummary {
    total: number;
    male: number;
    female: number;
    unspecified: number;
}
