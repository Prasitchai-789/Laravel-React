import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";

const FormCreate: React.FC = () => {
    const [hasCard, setHasCard] = useState<"yes" | "no" | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const payload = Object.fromEntries(form.entries());

        router.post("/populations", payload); // ส่งข้อมูลไป Controller Laravel
    };

    return (
        <AppLayout>
            <Head title="เพิ่มข้อมูลประชากร" />

            <div className="max-w-4xl mx-auto py-6 px-4">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">เพิ่มข้อมูลประชากร</h1>

                {/* Toggle */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setHasCard("yes")}
                        className={`px-4 py-2 rounded-lg text-white ${
                            hasCard === "yes" ? "bg-blue-700" : "bg-blue-500"
                        }`}
                    >
                        ✔ มีบัตรประชาชน
                    </button>
                    <button
                        onClick={() => setHasCard("no")}
                        className={`px-4 py-2 rounded-lg text-white ${
                            hasCard === "no" ? "bg-green-700" : "bg-green-500"
                        }`}
                    >
                        ✘ ไม่มีบัตรประชาชน
                    </button>
                </div>

                {!hasCard && (
                    <p className="text-gray-500 mb-4">กรุณาเลือกว่ามีบัตรประชาชนหรือไม่</p>
                )}

                {/* FORM SECTION */}
                {hasCard === "yes" && (
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white p-6 rounded-lg shadow space-y-4"
                    >
                        <h2 className="text-xl font-bold mb-4">ฟอร์มผู้มีบัตรประชาชน</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="national_id" placeholder="เลขบัตรประชาชน" className="input" />
                            <input name="title" placeholder="คำนำหน้า" className="input" />
                            <input name="first_name" placeholder="ชื่อ" className="input" required />
                            <input name="last_name" placeholder="นามสกุล" className="input" required />
                            <input type="date" name="birthdate" placeholder="วันเกิด" className="input" />
                            <input name="gender" placeholder="เพศ" className="input" />
                            <input name="house_no" placeholder="บ้านเลขที่" className="input" />
                            <input name="village_no" type="number" placeholder="หมู่ที่" className="input" />
                            <input name="village_name" placeholder="ชื่อหมู่บ้าน" className="input" />
                            <input type="number" name="city_id" placeholder="รหัสตำบล/เมือง" className="input" />
                            <input type="date" name="id_card_issued_at" placeholder="ออกบัตรเมื่อ" className="input" />
                            <input type="date" name="id_card_expired_at" placeholder="บัตรหมดอายุ" className="input" />
                            <input name="religion" placeholder="ศาสนา" className="input" />
                            <input type="number" name="age_at_import" placeholder="อายุ ณ วันที่บันทึก" className="input" />
                            <input name="phone" placeholder="เบอร์โทร" className="input" />
                            <input name="subdistrict_name" placeholder="ตำบล" className="input" />
                            <input name="district_name" placeholder="อำเภอ" className="input" />
                            <input name="province_name" placeholder="จังหวัด" className="input" />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-semibold"
                        >
                            บันทึกข้อมูล
                        </button>
                    </form>
                )}

                {hasCard === "no" && (
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white p-6 rounded-lg shadow space-y-4"
                    >
                        <h2 className="text-xl font-bold mb-4">ฟอร์มผู้ไม่มีบัตรประชาชน</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="title" placeholder="คำนำหน้า" className="input" />
                            <input name="first_name" placeholder="ชื่อ" className="input" />
                            <input name="last_name" placeholder="นามสกุล" className="input" />
                            <input name="house_no" placeholder="บ้านเลขที่" className="input" />
                            <input name="village_no" type="number" placeholder="หมู่ที่" className="input" />
                            <input name="subdistrict_name" placeholder="ตำบล" className="input" />
                            <input name="district_name" placeholder="อำเภอ" className="input" />
                            <input name="province_name" placeholder="จังหวัด" className="input" />
                        </div>

                        <textarea
                            name="note"
                            placeholder="หมายเหตุ"
                            className="input h-24 mt-2"
                        ></textarea>

                        <button
                            type="submit"
                            className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg font-semibold"
                        >
                            บันทึกข้อมูล
                        </button>
                    </form>
                )}
            </div>
        </AppLayout>
    );
};

export default FormCreate;
