import GenericTable, { Column } from '@/components/Tables/GenericTable';
import { Pencil, Trash2, MapPin, Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PhoneNumber } from '@/components/Fomat/PhoneNumber';

interface Customer {
    id: number;
    name: string;
    address?: string;
    subdistrict?: string;
    district?: string;
    province?: string;
    phone?: string;
    notes?: string;
    id_card?: string;

    cityProvince?: { ProvinceID: number; ProvinceName: string };
    cityDistrict?: { DistrictID: number; DistrictName: string };
    citySubdistrict?: { SubDistrictID: number; SubDistrictName: string };
}

interface CustomerTableProps {
    customers: Customer[];
    onEdit?: (customer: Customer) => void;
    onDelete?: (customer: Customer) => void;
    cities?: any[];
}

export default function CustomerTable({ customers, onEdit, onDelete, cities = [] }: CustomerTableProps) {
    const [provinceMap, setProvinceMap] = useState<Map<string, string>>(new Map());
    const [districtMap, setDistrictMap] = useState<Map<string, string>>(new Map());
    const [subdistrictMap, setSubdistrictMap] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        if (cities && cities.length > 0) {
            const provinceMap = new Map<string, string>();
            const districtMap = new Map<string, string>();
            const subdistrictMap = new Map<string, string>();
            const provinceSet = new Set();
            const districtSet = new Set();
            const subdistrictSet = new Set();

            cities.forEach(city => {
                if (!provinceSet.has(city.ProvinceID)) {
                    provinceSet.add(city.ProvinceID);
                    provinceMap.set(String(city.ProvinceID), city.ProvinceName);
                }

                if (!districtSet.has(city.DistrictID)) {
                    districtSet.add(city.DistrictID);
                    districtMap.set(String(city.DistrictID), city.DistrictName);
                }

                if (!subdistrictSet.has(city.SubDistrictID)) {
                    subdistrictSet.add(city.SubDistrictID);
                    subdistrictMap.set(String(city.SubDistrictID), city.SubDistrictName);
                }
            });

            setProvinceMap(provinceMap);
            setDistrictMap(districtMap);
            setSubdistrictMap(subdistrictMap);
        }
    }, [cities]);

    const handleEdit = (customer: Customer) => {
        onEdit?.(customer);
    };

    const handleDelete = (customer: Customer) => {
        onDelete?.(customer);
    };

    const getLocationText = (customer: Customer) => {
        const subdistrict = customer.citySubdistrict?.SubDistrictName ||
                           (customer.subdistrict && subdistrictMap.size > 0
                            ? subdistrictMap.get(String(parseInt(customer.subdistrict)))
                            : customer.subdistrict) || 'ไม่ระบุ';

        const district = customer.cityDistrict?.DistrictName ||
                        (customer.district && districtMap.size > 0
                         ? districtMap.get(String(parseInt(customer.district)))
                         : customer.district) || 'ไม่ระบุ';

        const province = customer.cityProvince?.ProvinceName ||
                        (customer.province && provinceMap.size > 0
                         ? provinceMap.get(String(parseInt(customer.province)))
                         : customer.province) || 'ไม่ระบุ';

        return `${subdistrict} • ${district} • ${province}`;
    };

    const customerColumns: Column<Customer>[] = [
        {
            key: 'name',
            label: 'ลูกค้า',
            sortable: true,
            render: (customer) => (
                <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                            {customer.name}
                        </div>
                        {customer.id_card && (
                            <div className="text-xs text-gray-500 truncate">
                                {customer.id_card}
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'phone',
            label: 'ติดต่อ',
            align: 'center',
            width: '140px',
            render: (customer) => (
                <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 text-gray-700">
                        <Phone size={14} className="text-green-600" />
                        <span className="text-sm font-medium">{PhoneNumber(customer.phone)}</span>
                    </div>
                    {customer.notes && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1" title={customer.notes}>
                            {customer.notes}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'location',
            label: 'ที่อยู่',
            align: 'left',
            render: (customer) => (
                <div className="flex items-start gap-2 min-w-[250px]">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-700 line-clamp-2">
                            {getLocationText(customer)}
                        </div>
                        {customer.address && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2" title={customer.address}>
                                {customer.address}
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'actions',
            label: 'การดำเนินการ',
            align: 'center',
            width: '120px'
        },
    ];

    return (
        <div className="">
            {/* <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">รายการลูกค้า</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            ทั้งหมด {customers.length} รายการ
                        </p>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <User size={18} className="text-white" />
                    </div>
                </div>
            </div> */}

            <GenericTable
                data={customers.sort((a, b) => b.id - a.id)}
                columns={customerColumns}
                idField="id"
                emptyMessage={
                    <div className="text-center py-12">
                        <User size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีข้อมูลลูกค้า</h3>
                        <p className="text-gray-500">ยังไม่มีลูกค้าในระบบ</p>
                    </div>
                }
                actions={(row) => (
                    <div className="flex justify-center gap-1">
                        <button
                            onClick={() => handleEdit(row)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg transition-all duration-200 hover:bg-blue-100 hover:shadow-sm hover:scale-105 active:scale-95"
                        >
                            <Pencil size={14} />
                            <span>แก้ไข</span>
                        </button>

                        <button
                            onClick={() => handleDelete(row)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg transition-all duration-200 hover:bg-red-100 hover:shadow-sm hover:scale-105 active:scale-95"
                        >
                            <Trash2 size={14} />
                            <span>ลบ</span>
                        </button>
                    </div>
                )}
                rowClassName="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                headerClassName="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200"
                thClassName="px-4 py-3 font-semibold text-gray-700 text-sm uppercase tracking-wide"
                tdClassName="px-4 py-4"
            />
        </div>
    );
}
