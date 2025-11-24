import { ITOrder } from '../types/order';

export const getStatusFromNumber = (status: string | null | undefined): string => {
    if (!status) return "ทั้งหมด";
    switch (status) {
        case "1": return "พร้อมใช้งาน";
        case "2": return "ใช้งานอยู่";
        case "3": return "ไม่พร้อมใช้งาน";
        default: return "ทั้งหมด";
    }
};

export const getStatusToNumber = (status: string): string | undefined => {
    switch (status) {
        case "พร้อมใช้งาน": return "1";
        case "ใช้งานอยู่": return "2";
        case "ไม่พร้อมใช้งาน": return "3";
        default: return undefined;
    }
};

const getBrandFromAsset = (assetName?: string, model?: string): string => {
    const name = (assetName || "").toLowerCase();
    const modelStr = (model || "").toLowerCase();

    const brands: Record<string, string> = {
        dell: 'Dell', hp: 'HP', lenovo: 'Lenovo', asus: 'Asus', acer: 'Acer',
        cisco: 'Cisco', epson: 'Epson', canon: 'Canon', samsung: 'Samsung',
        apple: 'Apple', apc: 'APC', ibm: 'IBM', sony: 'Sony', lg: 'LG',
        toshiba: 'Toshiba', microsoft: 'Microsoft', tplink: 'TP-Link',
        "tp-link": "TP-Link", dlink: "D-Link", netgear: "Netgear",
        linksys: "Linksys", mikrotik: "Mikrotik", ubiquiti: "Ubiquiti",
        unifi: "Ubiquiti", synology: "Synology", hikvision: "Hikvision",
        emerson: "Emerson"
    };

    for (const key in brands) {
        if (name.includes(key) || modelStr.includes(key)) {
            return brands[key];
        }
    }
    return 'ไม่ระบุยี่ห้อ';
};

const getTransformedCategory = (order: any): string => {
    let category = "ไม่ระบุหมวดหมู่";

    if (order.asset_type && order.asset_type !== 'null' && order.asset_type !== '') {
        category = order.asset_type;
    } else if (order.category_display && order.category_display !== 'null' && order.category_display !== '') {
        category = order.category_display;
    }

    const categoryMapping: { [key: string]: string } = {
        'switch': 'Switch', 'Switch': 'Switch', 'SWITCH': 'Switch',
        'computer': 'Computer', 'Computer': 'Computer', 'COMPUTER': 'Computer',
        'monitor': 'Monitor', 'Monitor': 'Monitor',
        'ups': 'UPS', 'UPS': 'UPS',
        'cctv': 'CCTV', 'CCTV': 'CCTV',
        'server': 'Server', 'Server': 'Server',
        'firewall': 'Firewall', 'Firewall': 'Firewall',
        'network': 'Network', 'Network': 'Network',
        'printer': 'Printer', 'Printer': 'Printer',
        'scanner': 'Scanner', 'Scanner': 'Scanner',
        'projector': 'Projector', 'Projector': 'Projector',
        'laptop': 'Laptop', 'Laptop': 'Laptop'
    };

    return categoryMapping[category] || category;
};

const buildSpecification = (order: any): string => {
    const specificationParts = [];
    if (order.cpu) specificationParts.push(`CPU: ${order.cpu}`);
    if (order.ram) specificationParts.push(`RAM: ${order.ram}`);
    if (order.storage) specificationParts.push(`Storage: ${order.storage}`);
    if (order.os) specificationParts.push(`OS: ${getOSName(order.os)}`);
    if (order.office) specificationParts.push(`Office: ${getOfficeName(order.office)}`);
    if (order.monitor) specificationParts.push(`Monitor: ${order.monitor}`);
    if (order.graphic) specificationParts.push(`Graphics: ${order.graphic}`);

    return specificationParts.length > 0 ? specificationParts.join(', ') : "ไม่มีข้อมูลสเปค";
};

export const getOSName = (osNumber: number): string => {
    const osMap: { [key: number]: string } = {
        1: "Windows 10", 2: "Windows 11", 3: "Windows 7",
        4: "Linux", 5: "macOS", 6: "Windows Server"
    };
    return osMap[osNumber] || `OS ${osNumber}`;
};

export const getOfficeName = (officeNumber: number): string => {
    const officeMap: { [key: number]: string } = {
        1: "Microsoft Office 365", 2: "Microsoft Office 2021",
        3: "Microsoft Office 2019", 4: "Microsoft Office 2016",
        5: "LibreOffice"
    };
    return officeMap[officeNumber] || `Office ${officeNumber}`;
};

export const transformOrderData = (dbOrders: any[]): ITOrder[] => {
    if (!dbOrders || dbOrders.length === 0) return [];

    console.log(dbOrders);
    return dbOrders.map((order, index) => {
        const orderNumber = order.asset_id || `IT-ORD-${new Date().getFullYear()}-${String(order.id).padStart(3, '0')}`;
        const productCode = order.asset_name
            ? `IT-${order.asset_name.substring(0, 3).toUpperCase()}-${String(order.id).padStart(3, '0')}`
            : `IT-${String(order.id).padStart(3, '0')}`;

        return {
            id: order.id || index + 1,
            orderNumber,
            orderDate: order.acquisition_date ||
                (order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
            requester: order.requester || "ไม่ระบุผู้ขอ",
            department: order.department || "ไม่ระบุแผนก",
            productName: order.asset_name || "ไม่ระบุชื่ออุปกรณ์",
            productCode,
            category: getTransformedCategory(order),
            brand: getBrandFromAsset(order.asset_name, order.model),
            model: order.model || 'ไม่ระบุรุ่น',
            specification: buildSpecification(order),
            quantity: 1,
            unit: "เครื่อง",
            status: (order.status_display as ITOrder["status"]) || "พร้อมใช้งาน",
            location: order.location || "ไม่ระบุสถานที่",
            purpose: order.purpose || order.additional_details || "ใช้งานทั่วไป",
            assignee: order.assignee || order.record_responsible,
            note: order.note || order.remarks,
            asset_id: order.asset_id,
            asset_name: order.asset_name,
            asset_type: order.asset_type,
            serial_number: order.serial_number,
            acquisition_date: order.acquisition_date,
            image_path:order.image_path,
            estimated_value: order.estimated_value,
            cia_rating: order.cia_rating,
            cpu: order.cpu,
            ram: order.ram,
            storage: order.storage,
            os: order.os,
            computer_status: order.computer_status,
            asset_status: order.asset_status,
            office: order.office,
            monitor: order.monitor,
            service_tag: order.service_tag,
            graphic: order.graphic,
            created_at: order.created_at
        };
    });
};
