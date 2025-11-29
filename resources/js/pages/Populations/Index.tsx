import React from "react";
import PopulationImportForm from "./components/PopulationImportForm";

import AppLayout from "@/layouts/app-layout"; // ปรับให้ตรงกับโปรเจคคุณ
import { Head } from "@inertiajs/react";
import PopulationsTable from "./components/PopulationsTable";

const Index: React.FC = () => {
    return (
        <AppLayout>
            <Head title="นำเข้าข้อมูลประชากร" />

            <div className="max-w-6xl mx-auto py-6 px-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                    จัดการข้อมูลประชากร
                </h1>

                <div className="grid grid-cols-1 gap-6">

                    {/* กล่องเมนูอื่น ๆ (เพิ่มภายหลังได้) */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-white border rounded-xl shadow-sm">
                        <p className="text-gray-700">
                            ระบบจัดการข้อมูลประชากร ใช้สำหรับนำเข้าข้อมูลจาก Excel และวิเคราะห์สถิติในหมู่บ้าน/ตำบล/อำเภอ/จังหวัด
                        </p>
                    </div>

                    {/* Component Import Excel */}
                    <PopulationImportForm />
                    {/* <PopulationsTable /> */}
                </div>
            </div>
        </AppLayout>
    );
};

export default Index;
