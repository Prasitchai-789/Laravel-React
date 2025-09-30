import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
import { useState } from 'react';


interface DocumentFormProps {
    categories: { id: number; name: string }[];
    mode?: 'create' | 'edit';
    onSubmit: (data: FormData) => void;
    onClose: () => void;
}
export default function MemoForm({ categories, onSubmit , onClose, mode }: DocumentFormProps) {
    const [form, setForm, processing] = useState({
        document_no: '',
        date: '',
        description: '',
        category_id: '',
        amount: '',
        status: 'pending',
        attachment: null,
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setForm({ ...form, [name]: files[0] });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = new FormData();
        Object.keys(form).forEach((key) => {
            data.append(key, form[key]);
        });

        if (onSubmit) onSubmit(data);
    };

    return (
        <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Document No */}
                <div>
                    <label className="mb-1 block text-sm font-medium">เลขที่เอกสาร</label>
                    <input
                        type="text"
                        name="document_no"
                        value={form.document_no}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2"
                        required
                    />
                </div>

                {/* Date */}
                <InputLabel
                    label="วันที่"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required={true}
                    disabled={processing}
                    type="date"
                    className="font-anuphan"
                />

                {/* Description */}
                <div>
                    <label className="mb-1 block text-sm font-medium">รายละเอียด</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2"
                        rows={3}
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="mb-1 block text-sm font-medium">หมวดค่าใช้จ่าย</label>
                    <select
                        name="category_id"
                        value={form.category_id}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2"
                        required
                    >
                        <option value="">-- เลือกหมวด --</option>
                        {/* {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))} */}
                    </select>
                </div>

                {/* Amount */}
                <div>
                    <label className="mb-1 block text-sm font-medium">จำนวนเงิน</label>
                    <input
                        type="number"
                        step="0.01"
                        name="amount"
                        value={form.amount}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2"
                        required
                    />
                </div>

                {/* Status */}
                <div>
                    <label className="mb-1 block text-sm font-medium">สถานะ</label>
                    <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-lg border px-3 py-2">
                        <option value="pending">รอดำเนินการ</option>
                        <option value="approved">อนุมัติ</option>
                        <option value="rejected">ไม่อนุมัติ</option>
                    </select>
                </div>

                {/* Attachment */}
                <div>
                    <label className="mb-1 block text-sm font-medium">ไฟล์แนบ</label>
                    <input type="file" name="attachment" onChange={handleChange} className="w-full" />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                    <Button type="button" variant="secondary"
                    // onClick={onClose}
                    // disabled={processing}
                    >
                        ยกเลิก
                    </Button>
                    <Button type="submit" variant="primary"
                    // disabled={processing}
                    >
                        {mode === 'create' ? 'บันทึกข้อมูล' : 'อัปเดตข้อมูล'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
