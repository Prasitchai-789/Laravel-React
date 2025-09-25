import GenericTable, { Column } from '@/components/Tables/GenericTable';
import { Pencil, Trash2 } from 'lucide-react';
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
    cities?: any[]; // รับข้อมูล cities จาก props
}


export default function CustomerTable({ customers, onEdit, onDelete, cities = [] }: CustomerTableProps) {
    const [provinceMap, setProvinceMap] = useState<Map<string, string>>(new Map());
    const [districtMap, setDistrictMap] = useState<Map<string, string>>(new Map());
    const [subdistrictMap, setSubdistrictMap] = useState<Map<string, string>>(new Map());

    // สร้าง mapping สำหรับจังหวัดและอำเภอ
    useEffect(() => {
        if (cities && cities.length > 0) {
            // สร้าง map สำหรับจังหวัด
            const provinceMap = new Map<string, string>();
            const provinceSet = new Set();

            cities.forEach(city => {
                if (!provinceSet.has(city.ProvinceID)) {
                    provinceSet.add(city.ProvinceID);
                    provinceMap.set(String(city.ProvinceID), city.ProvinceName);
                }
            });

            // สร้าง map สำหรับอำเภอ
            const districtMap = new Map<string, string>();
            const districtSet = new Set();

            cities.forEach(city => {
                if (!districtSet.has(city.DistrictID)) {
                    districtSet.add(city.DistrictID);
                    districtMap.set(String(city.DistrictID), city.DistrictName);
                }
            });

            // สร้าง map สำหรับตําบล
            const subdistrictMap = new Map<string, string>();
            const subdistrictSet = new Set();

            cities.forEach(city => {
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
        if (onEdit) {
            onEdit(customer);
        }
    };

    const handleDelete = (customer: Customer) => {
        if (onDelete) {
            onDelete(customer);
        }
    };

    const customerColumns: Column<Customer>[] = [
        { key: 'name', label: 'ชื่อลูกค้า', sortable: true },
        { key: 'phone', label: 'เบอร์โทร', align: 'center' , render: (customer) => PhoneNumber(customer.phone)},
        {
            key: 'subdistrict',
            label: 'ตำบล/แขวง',
            align: 'center',
            render: (customer) => {
                 if (customer.citySubdistrict?.SubDistrictName) {
                    return customer.citySubdistrict.SubDistrictName;
                }

                if (customer.subdistrict && subdistrictMap.size > 0) {
                    const subdistrictId = parseInt(customer.subdistrict);
                    return subdistrictMap.get(String(subdistrictId)) || customer.subdistrict;
                }

                return customer.district || 'ไม่ระบุ';
            }
        },
        {
            key: 'district',
            label: 'อำเภอ/เขต',
            align: 'center',
            render: (customer) => {
                if (customer.cityDistrict?.DistrictName) {
                    return customer.cityDistrict.DistrictName;
                }

                if (customer.district && districtMap.size > 0) {
                    const districtId = parseInt(customer.district);
                    return districtMap.get(String(districtId)) || customer.district;
                }

                return customer.district || 'ไม่ระบุ';
            },
        },
        {
            key: 'province',
            label: 'จังหวัด',
            align: 'center',
            render: (customer) => {
                if (customer.cityProvince?.ProvinceName) {
                    return customer.cityProvince.ProvinceName;
                }

                if (customer.province && provinceMap.size > 0) {
                    const provinceId = parseInt(customer.province);
                    return provinceMap.get(String(provinceId)) || customer.province;
                }

                return customer.province || 'ไม่ระบุ';
            },
        },
        { key: 'actions', label: 'การดำเนินการ', align: 'center' },
    ];

    return (
        <GenericTable
            title="รายการลูกค้า"
            data={customers}
            columns={customerColumns}
            idField="id"
            actions={(row) => (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="group relative p-1.5 text-yellow-600 transition duration-200 hover:scale-110"
                    >
                        <Pencil size={16} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-yellow-500 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                            แก้ไข
                        </span>
                    </button>

                    <button
                        onClick={() => handleDelete(row)}
                        className="group relative p-1.5 text-red-700 transition duration-200 hover:scale-110"
                    >
                        <Trash2 size={16} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-red-600 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                            ลบ
                        </span>
                    </button>
                </div>
            )}
        />
    );
}
