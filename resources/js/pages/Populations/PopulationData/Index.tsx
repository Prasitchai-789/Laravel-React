import React from "react";
import PopulationImportForm from "./components/PopulationImportForm";
import PopulationsTable from "./components/PopulationsTable";

import CreateForm from "./CreateForm"
import AppLayout from "@/layouts/app-layout";
import { Head , Link } from "@inertiajs/react";

const Index: React.FC = () => {
    const toCreate = () => {
        router.visit("/populations/create"); // ไปหน้า CreateForm
    };
    return (
        <AppLayout>
            <Head title="นำเข้าข้อมูลประชากร" />
            <div className="max-w-6xl mx-auto py-6 px-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">จัดการข้อมูลประชากร</h1>

                <div className="grid grid-cols-1 gap-6">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-white border rounded-xl shadow-sm">
                        <p className="text-gray-700">
                            ระบบจัดการข้อมูลประชากร ใช้สำหรับนำเข้าข้อมูลจาก Excel และวิเคราะห์สถิติในหมู่บ้าน/ตำบล/อำเภอ/จังหวัด
                        </p>
                    </div>
            
                    <Link
                        href="/populations/create"
                        className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg shadow-sm transition"
                    >
                        Create
                    </Link>


                    <PopulationImportForm />
                    <PopulationsTable />
                </div>
            </div>
        </AppLayout>
    );
};

export default Index;
