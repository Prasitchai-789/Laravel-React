import React, { useState } from "react";
import { router } from "@inertiajs/react";
import Swal from "sweetalert2";

interface ShiftFormProps {
    shift?: any;              // shift อาจ undefined ได้
    isAddingNew: boolean;
    departments?: any[];      // ป้องกัน undefined
    onCancel: () => void;
}

const ShiftForm: React.FC<ShiftFormProps> = ({
    shift = {},               // fallback ป้องกัน shift undefined
    isAddingNew,
    departments = [],         // fallback array ป้องกัน map error
    onCancel,
}) => {

    const [form, setForm] = useState({
        shiftName: shift.shiftName ?? "",
        shiftCode: shift.shiftCode ?? "",
        startTime: shift.startTime ?? "",
        endTime: shift.endTime ?? "",
        breakTime: shift.breakTime ?? 0,
        totalHours: shift.totalHours ?? 8,
        departmentId: shift.departmentId ?? "",
        description: shift.description ?? "",
        isActive: shift.isActive !== false,
    });

    const handleChange = (field: string, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name: form.shiftName,
            shift_number: Number(form.shiftCode) || 0,
            start_time: form.startTime,
            end_time: form.endTime,
            total_hours: Number(form.totalHours) || 8,
            description: form.description || "",
            break_time: Number(form.breakTime) || 0,
            department_id: form.departmentId || null,
            is_active: form.isActive ? 1 : 0,
        };

        const options = {
            onSuccess: () => {
                Swal.fire({
                    icon: "success",
                    title: "สำเร็จ!",
                    text: isAddingNew
                        ? "เพิ่มกะงานใหม่เรียบร้อยแล้ว"
                        : "บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว",
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
            onError: (errors: any) => {
                const messages = Object.values(errors).flat().join("\n");
                Swal.fire({
                    icon: "error",
                    title: "เกิดข้อผิดพลาด",
                    text: messages || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ",
                });
            },
        };

        if (isAddingNew) {
            router.post("/shifts", payload, options);
        } else {
            router.put(`/shifts/${shift.id}`, payload, options);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 my-6">
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* ชื่อกะ */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อกะงาน *
                    </label>
                    <input
                        type="text"
                        value={form.shiftName}
                        onChange={(e) => handleChange("shiftName", e.target.value)}
                        className="w-full px-4 py-3 border rounded-lg"
                        required
                    />
                </div>

                {/* รหัสกะ */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        รหัสกะ *
                    </label>
                    <input
                        type="number"
                        value={form.shiftCode}
                        onChange={(e) => handleChange("shiftCode", e.target.value)}
                        className="w-full px-4 py-3 border rounded-lg"
                        required
                    />
                </div>

                {/* เวลาเริ่ม - เลิก */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label>เวลาเริ่มงาน *</label>
                        <input
                            type="time"
                            value={form.startTime}
                            onChange={(e) => handleChange("startTime", e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg"
                            required
                        />
                    </div>
                    <div>
                        <label>เวลาเลิกงาน *</label>
                        <input
                            type="time"
                            value={form.endTime}
                            onChange={(e) => handleChange("endTime", e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg"
                            required
                        />
                    </div>
                </div>

                {/* เวลาพัก */}
                <div>
                    <label>เวลาพัก (นาที)</label>
                    <input
                        type="number"
                        value={form.breakTime}
                        onChange={(e) => handleChange("breakTime", Number(e.target.value) || 0)}
                        className="w-full px-4 py-3 border rounded-lg"
                    />
                </div>

                {/* แผนก */}
                <div>
                    <label>แผนก</label>
                    <select
                        value={form.departmentId}
                        onChange={(e) => handleChange("departmentId", e.target.value)}
                        className="w-full px-4 py-3 border rounded-lg"
                    >
                        <option value="">เลือกแผนก</option>

                        {departments.map((dept, index) => (
                            <option
                                key={dept.DeptID ?? `dept-${index}`}
                                value={dept.DeptID || ""}
                            >
                                {dept.DeptName ?? "ไม่ระบุชื่อแผนก"}
                            </option>
                        ))}
                    </select>
                </div>

                {/* รายละเอียด */}
                <div>
                    <label>รายละเอียดเพิ่มเติม</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        className="w-full px-4 py-3 border rounded-lg"
                        rows={3}
                    />
                </div>

                {/* สถานะ */}
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) => handleChange("isActive", e.target.checked)}
                        />{" "}
                        เปิดใช้งาน
                    </label>
                </div>

                {/* ปุ่ม */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border rounded-lg"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg"
                    >
                        {isAddingNew ? "เพิ่มกะงาน" : "บันทึกการเปลี่ยนแปลง"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ShiftForm;
