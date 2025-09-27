import { useState, useEffect } from "react";
import axios from "axios";

export default function CreateExpenseDocument() {
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        document_no: "",
        date: "",
        description: "",
        category_id: "",
        amount: "",
        winspeed_ref_id: "",
        attachment: null,
    });

    useEffect(() => {
        axios.get('/memo/documents')
            .then(res => setCategories(res.data));
    }, []);

    const fetchProductions = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/fertilizer/productions/api');
            setProductions(res.data.productions);
            setLines(res.data.lines);
            setLabors(res.data.labors);
            setEnergies(res.data.energies);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setForm({ ...form, [name]: files[0] });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        for (let key in form) {
            data.append(key, form[key]);
        }

        try {
            const res = await axios.post('/memo/documents', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("บันทึกเอกสารเรียบร้อย");
            setForm({
                document_no: "",
                date: "",
                description: "",
                category_id: "",
                amount: "",
                winspeed_ref_id: "",
                attachment: null,
            });
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด");
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4 bg-white shadow rounded">
            <h2 className="text-xl font-bold mb-4">เพิ่มเอกสารเบิกจ่าย</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-medium">เลขที่เอกสาร</label>
                    <input type="text" name="document_no" value={form.document_no}
                        onChange={handleChange} className="w-full border rounded px-2 py-1" required/>
                </div>
                <div>
                    <label className="block font-medium">วันที่เบิก</label>
                    <input type="date" name="date" value={form.date}
                        onChange={handleChange} className="w-full border rounded px-2 py-1" required/>
                </div>
                <div>
                    <label className="block font-medium">รายละเอียด</label>
                    <textarea name="description" value={form.description} onChange={handleChange}
                        className="w-full border rounded px-2 py-1"></textarea>
                </div>
                <div>
                    {/* <label className="block font-medium">หมวดค่าใช้จ่าย</label>
                    <select name="category_id" value={form.category_id} onChange={handleChange}
                        className="w-full border rounded px-2 py-1" required>
                        <option value="">-- เลือกหมวด --</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select> */}
                </div>
                <div>
                    <label className="block font-medium">จำนวนเงิน</label>
                    <input type="number" name="amount" value={form.amount}
                        onChange={handleChange} className="w-full border rounded px-2 py-1" required/>
                </div>
                <div>
                    <label className="block font-medium">Winspeed Ref ID</label>
                    <input type="text" name="winspeed_ref_id" value={form.winspeed_ref_id}
                        onChange={handleChange} className="w-full border rounded px-2 py-1"/>
                </div>
                <div>
                    <label className="block font-medium">ไฟล์แนบ</label>
                    <input type="file" name="attachment" onChange={handleChange} className="w-full"/>
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    บันทึกเอกสาร
                </button>
            </form>
        </div>
    );
}
