import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

interface FormEditOrderProps {
    orderId: number | undefined;
    onClose: () => void;
    onSuccess: () => void;
}

export default function FormEditOrder({ orderId, onClose, onSuccess }: FormEditOrderProps) {
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (!orderId) return;

        axios.get(`/StoreOrder/${orderId}`)
            .then(res => {
                setOrder(res.data);
                setStatus(res.data.status || '');
                setNote(res.data.note || '');
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [orderId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId) return;

        router.put(`/StoreOrder/${orderId}`, { status, note }, {
            onSuccess: () => {
                onSuccess();
            },
            onError: (err) => {
                console.error(err);
                alert('บันทึกไม่สำเร็จ');
            }
        });
    };

    if (loading) return <div>Loading...</div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block font-medium text-gray-700">สถานะ</label>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                >
                    <option value="pending">รอดำเนินการ</option>
                    <option value="approved">อนุมัติ</option>
                    <option value="rejected">ปฏิเสธ</option>
                </select>
            </div>

            <div>
                <label className="block font-medium text-gray-700">หมายเหตุ</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                    rows={4}
                />
            </div>

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-300 rounded-lg"
                >
                    ยกเลิก
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                    บันทึก
                </button>
            </div>
        </form>
    );
}
