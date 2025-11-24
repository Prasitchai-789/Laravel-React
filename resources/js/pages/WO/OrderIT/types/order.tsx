export interface ITOrder {
    id: number;
    orderNumber: string;
    orderDate: string;
    requester: string;
    department: string;
    productName: string;
    productCode: string;
    category: string;
    brand: string;
    model: string;
    specification: string;
    quantity: number;
    unit: string;
    status: "ใช้งานอยู่" | "พร้อมใช้งาน" | "ไม่พร้อมใช้งาน";
    location: string;
    purpose: string;
    assignee?: string;
    assignDate?: string;
    note?: string;
    lastMaintenance?: string;
    nextMaintenance?: string;
    image_path?: string;

    // Database fields
    asset_id?: string;
    asset_name?: string;
    asset_type?: string;
    serial_number?: string;
    acquisition_date?: string;
    estimated_value?: number;
    cia_rating?: string;
    cpu?: string;
    ram?: string;
    storage?: string;
    os?: number;
    computer_status?: number;
    asset_status?: number;
    office?: number;
    monitor?: string;
    service_tag?: string;
    graphic?: string;
    created_at?: string;


}


export interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export interface FilterState {
    search: string;
    status: string;
    category: string;
}

export interface OrderPageProps {
    order?: ITOrder;
    pagination?: PaginationData;
    filters?: Partial<FilterState>;
    // ITOrder?: any[];
}

