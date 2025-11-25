import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";

const PopulationsTable: React.FC = () => {
    const page: any = usePage().props;

    // ให้ default เป็น array ว่างเผื่อ props ยังไม่มี
    const populations = page.populations ?? { data: [], current_page: 1, last_page: 1, links: [] };
    const filters = page.filters ?? {};

    const [search, setSearch] = useState(filters.search ?? "");

    const handleSearch = () => {
        router.get(
            "/populations",
            { search },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    return (
        <div className="p-6 bg-white shadow-sm rounded-xl border">
            <h2 className="text-lg font-bold mb-4">ข้อมูลประชากรทั้งหมด</h2>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="ค้นหา (เลขบัตร / ชื่อ / นามสกุล / เบอร์โทร)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                    ค้นหา
                </button>
            </div>

            <div className="overflow-auto max-h-[70vh] rounded-lg border">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="px-3 py-2 border">เลขบัตร</th>
                            <th className="px-3 py-2 border">ชื่อ</th>
                            <th className="px-3 py-2 border">วันเกิด</th>
                            <th className="px-3 py-2 border">เพศ</th>
                            <th className="px-3 py-2 border">บ้านเลขที่</th>
                            <th className="px-3 py-2 border">หมู่ที่</th>
                            <th className="px-3 py-2 border">หมู่บ้าน</th>
                            <th className="px-3 py-2 border">ตำบล</th>
                            <th className="px-3 py-2 border">อำเภอ</th>
                            <th className="px-3 py-2 border">จังหวัด</th>
                            <th className="px-3 py-2 border">ศาสนา</th>
                            <th className="px-3 py-2 border">เบอร์โทร</th>
                        </tr>
                    </thead>
                    <tbody>
                        {populations.data.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="text-center text-gray-500 py-4">
                                    ไม่พบข้อมูล
                                </td>
                            </tr>
                        ) : (
                            populations.data.map((p: any) => (
                                <tr key={p.id} className="border-t hover:bg-gray-50">
                                    <td className="px-3 py-2 border">{p.national_id}</td>
                                    <td className="px-3 py-2 border">{p.title} {p.first_name} {p.last_name}</td>
                                    <td className="px-3 py-2 border">{p.birthdate ?? "-"}</td>
                                    <td className="px-3 py-2 border">{p.gender}</td>
                                    <td className="px-3 py-2 border">{p.house_no}</td>
                                    <td className="px-3 py-2 border">{p.village_no}</td>
                                    <td className="px-3 py-2 border">{p.village_name}</td>
                                    <td className="px-3 py-2 border">{p.subdistrict_name}</td>
                                    <td className="px-3 py-2 border">{p.district_name}</td>
                                    <td className="px-3 py-2 border">{p.province_name}</td>
                                    <td className="px-3 py-2 border">{p.religion}</td>
                                    <td className="px-3 py-2 border">{p.phone}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">
                    หน้าที่ {populations.current_page} / {populations.last_page}
                </span>
                <div className="flex gap-2">
                    {populations.links.map((link: any, index: number) => (
                        <button
                            key={index}
                            disabled={!link.url}
                            onClick={() => router.get(link.url, {}, { preserveScroll: true })}
                            className={`px-3 py-1 rounded ${
                                link.active ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                            } ${!link.url && "opacity-50 cursor-not-allowed"}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PopulationsTable;
