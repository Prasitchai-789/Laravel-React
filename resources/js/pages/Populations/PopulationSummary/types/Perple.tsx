export interface Perple {
    id: number;
    title?: string;
    first_name?: string;
    last_name?: string;
    village_no?: number;
    tambon?: string;
    amphoe?: string;
    province?: string;
}

export interface SummaryItemRaw {
    village_no: number;
    total?: number | string;
    male?: number | string;
    female?: number | string;
    unspecified?: number | string;
    tambon?: string;
    amphoe?: string;
    province?: string;
}
