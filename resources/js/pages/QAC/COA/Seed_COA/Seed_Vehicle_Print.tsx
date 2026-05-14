import AppLayout from '@/layouts/app-layout';
import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Printer, ArrowLeft } from 'lucide-react';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────
interface D {
    coa_no: string; lot_no: string; product_name: string;
    customer_name: string; destination_name: string;
    license_plate: string; driver_name: string; coa_tank: string;
    notes?: string; coa_user?: string; coa_mgr?: string; inspector?: string;
    coa_user_id?: string; created_at?: string;
    vehicle_inspection?: {
        is_clean: boolean;
        is_covered: boolean;
        is_no_smell: boolean;
        is_doc_valid: boolean;
        remark: string;
        inspector_name: string;
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const thaiDate = (s?: string) => {
    const d = s ? new Date(s) : new Date();
    if (isNaN(d.getTime())) return '-';
    const m = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear() + 543}`;
};

const parseDateStr = (s: string) => {
    if (!s) return '';
    const p = s.split(' ')[0];
    if (p.includes('/')) { const [dd, mm, yy] = p.split('/'); let y = parseInt(yy); if (y > 2500) y -= 543; return `${y}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`; }
    if (p.includes('-')) { const pts = p.split('-'); if (pts[0].length === 4) return p; let y = parseInt(pts[2]); if (y > 2500) y -= 543; return `${y}-${pts[1].padStart(2, '0')}-${pts[0].padStart(2, '0')}`; }
    return p.substring(0, 10);
};

const sigPath = (id?: string | number) => {
    const s = id ? String(id).trim() : '';
    const b = typeof window !== 'undefined' ? window.location.origin : '';
    if (s === '1149' || s.includes('ประสิทธิ์ชัย')) return `${b}/images/signature/prasitchai.png`;
    if (s === '1143' || s.includes('ประภาพร')) return `${b}/images/signature/prapaporn.png`;
    if (s === '1177' || s.includes('ยุพา')) return `${b}/images/signature/yapha.png`;
    if (s === '1183' || s.includes('สุกัญญา')) return `${b}/images/signature/sukanya.png`;
    if (s === '1434' || s.includes('ธัญ')) return `${b}/images/signature/than.png`;
    if (s === '1476' || s.includes('วีระยุทธ')) return `${b}/images/signature/veerayut.png`;
    return `${b}/images/signature/sukanya.png`;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const Seed_Vehicle_Print: React.FC = () => {
    const { sopid } = usePage<any>().props;
    const [data, setData] = useState<D | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!sopid) { setError('ไม่พบ SOPID'); setLoading(false); return; }

        const fetchData = async () => {
            try {
                const coaRes = await fetch(`/mar/plan-order/data/${sopid}`).then(r => r.json());
                if (coaRes.success && coaRes.data) {
                    const d = coaRes.data;
                    const mappedData: D = {
                        coa_no: d.coa_no || '-', lot_no: d.coa_lot || '-',
                        product_name: d.GoodName || 'เมล็ดในปาล์ม',
                        customer_name: d.CustName || '-', destination_name: d.Recipient || '-',
                        license_plate: d.NumberCar || '-', driver_name: d.DriverName || '-',
                        coa_tank: d.coa_tank || '-',
                        notes: d.notes || '', coa_user: d.inspector || '',
                        coa_mgr: d.coa_mgr || 'ประภาพร เชื่อพระซอง',
                        inspector: d.inspector || '', coa_user_id: d.coa_user_id || '',
                        created_at: parseDateStr(d.coa_date || d.SOPDate || ''),
                    };

                    try {
                        const insRes = await fetch(`/mar/vehicle-inspections/${sopid}`).then(r => r.json());
                        if (insRes.success && insRes.data) {
                            mappedData.vehicle_inspection = insRes.data;
                        }
                    } catch (e) { console.error('No inspection data', e); }

                    setData(mappedData);
                } else setError('ไม่พบข้อมูล COA');
            } catch (err) {
                setError('โหลดข้อมูลไม่สำเร็จ');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [sopid]);

    const date = thaiDate(data?.created_at);
    const P: React.CSSProperties = { fontFamily: "'THSarabunNew','Sarabun','TH Sarabun New',sans-serif" };

    const checklist = [
        { id: 'is_clean', label: '1. พื้นกะบะสะอาด / ไม่ชื้น' },
        { id: 'is_covered', label: '2. ไม่มีการปนเปื้อนฮารอมในกะบะบรรทุกสินค้า' },
        { id: 'is_no_smell', label: '3. ไม่มีการปนเปื้อนนายิสในกะบะบรรทุกสินค้า' },
        { id: 'is_doc_valid', label: '4. ไม่มีสิ่งอื่นใดในท้ายกะบะบรรทุกสินค้า' },
    ];

    const handleToggleCheck = (field: string, val: boolean) => {
        if (!data) return;
        const newInsp = { ...(data.vehicle_inspection || {}), [field]: val };
        setData({ ...data, vehicle_inspection: newInsp as any });
    };

    const handleSave = async () => {
        if (!data) return;
        try {
            const res = await axios.post(`/mar/vehicle-inspections`, {
                sop_id: sopid,
                is_clean: data.vehicle_inspection?.is_clean,
                is_covered: data.vehicle_inspection?.is_covered,
                is_no_smell: data.vehicle_inspection?.is_no_smell,
                is_doc_valid: data.vehicle_inspection?.is_doc_valid,
                remark: data.vehicle_inspection?.remark,
                inspector_name: data.vehicle_inspection?.inspector_name || data.inspector
            });

            if (res.data.success) alert('บันทึกข้อมูลเรียบร้อยแล้ว');
            else alert('บันทึกไม่สำเร็จ: ' + (res.data.message || 'Unknown error'));
        } catch (err: any) {
            console.error('Save error:', err);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div className="flex justify-center py-20">กำลังโหลด...</div>;
    if (error) return <div className="flex justify-center py-20 text-red-600">{error}</div>;
    if (!data) return null;

    return (
        <AppLayout>
            <div className="no-print sticky top-0 z-20 flex items-center gap-3 border-b bg-white px-6 py-3 shadow-sm">
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                        <Printer className="w-4 h-4" /> พิมพ์แบบฟอร์ม
                    </button>
                </div>
            </div>

            <div className="min-h-screen bg-slate-200 py-8 flex justify-center print:bg-white print:py-0">
                <div id="print-paper" style={{
                    ...P,
                    width: '210mm', minHeight: '297mm', backgroundColor: '#fff',
                    padding: '10mm 14mm', boxSizing: 'border-box',
                    boxShadow: '0 4px 32px rgba(0,0,0,0.18)', fontSize: '9pt',
                    display: 'flex', flexDirection: 'column',
                }}>
                    {/* Header Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                        <tbody>
                            <tr>
                                <td rowSpan={3} style={{ width: '40mm', border: '1px solid #000', textAlign: 'center', padding: '1.5mm', verticalAlign: 'middle' }}>
                                    <img src="/images/isp-touch-icon.png" alt="logo" style={{ width: '16mm', display: 'block', margin: '0 auto 0.5mm auto' }} />
                                    <div style={{ fontSize: '8.5pt', fontWeight: 'bold' }}>บริษัท อีสานปาล์ม จำกัด</div>
                                </td>
                                <td colSpan={2} style={{ border: '1px solid #000', padding: '0.8mm 2mm', fontWeight: 'bold' }}>ประเภทเอกสาร : แบบฟอร์ม</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #000', padding: '0.8mm 2mm', fontWeight: 'bold' }}>ชื่อเอกสาร : ตรวจความสะอาดรถขนส่งก่อนโหลดเมล็ดในปาล์ม</td>
                                <td style={{ border: '1px solid #000', padding: '0.8mm 2mm' }}>วันที่บังคับใช้ : 05-01-2569</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #000', padding: '0.8mm 2mm', fontWeight: 'bold' }}>รหัสเอกสาร : FM-QAC-67-0029</td>
                                <td style={{ border: '1px solid #000', padding: '0.8mm 2mm' }}>แก้ไขครั้งที่ : 01</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ fontSize: '10pt', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        {/* COA No & Title */}
                        <div style={{ textAlign: 'right', fontWeight: 'bold', marginTop: '2mm' }}>
                            เลขที่ : <span style={{ color: '#00f', borderBottom: '1px dotted #000', minWidth: '30mm', display: 'inline-block', textAlign: 'center' }}>{data.coa_no}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '2mm' }}>
                            <div style={{ textAlign: 'center', fontSize: '12pt', fontWeight: 'bold', flex: 2 }}>แบบฟอร์มตรวจความสะอาดรถขนส่งก่อนโหลดเมล็ดในปาล์ม</div>
                        </div>

                        {/* Info Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5mm 8mm', marginTop: '3mm', marginBottom: '2mm' }}>
                            <div style={{ display: 'flex', gap: '2mm' }}>
                                <span style={{ minWidth: '30mm' }}>Date :</span>
                                <span style={{ borderBottom: '1px dotted #000', flex: 1, color: '#00f' }}>{date}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '2mm' }}>
                                <span style={{ minWidth: '30mm' }}>Sample Name :</span>
                                <span style={{ borderBottom: '1px dotted #000', flex: 1, color: '#00f' }}>{data.product_name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '2mm' }}>
                                <span style={{ minWidth: '30mm' }}>Customer :</span>
                                <span style={{ borderBottom: '1px dotted #000', flex: 1, color: '#00f' }}>{data.customer_name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '2mm' }}>
                                <span style={{ minWidth: '30mm' }}>License plate :</span>
                                <span style={{ borderBottom: '1px dotted #000', flex: 1, color: '#00f' }}>{data.license_plate}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '2mm' }}>
                                <span style={{ minWidth: '30mm' }}>Storage Tank No. :</span>
                                <span style={{ borderBottom: '1px dotted #000', flex: 1, color: '#00f' }}>{data.coa_tank}</span>
                            </div>
                        </div>

                        {/* Truck Image */}
                        <div style={{ textAlign: 'center', marginBottom: '2mm', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src="/images/truck.png" alt="truck" style={{ height: '22mm', objectFit: 'contain', display: 'block' }}
                                onError={e => e.currentTarget.style.display = 'none'} />
                        </div>

                        {/* Checklist Items */}
                        <div style={{ padding: '0 6mm' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6mm', paddingRight: '28mm', marginBottom: '0.5mm' }}>
                                <div style={{ width: '12mm', height: '6mm', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#cfc', border: '1px solid #777', fontSize: '9pt' }}>ใช่</div>
                                <div style={{ width: '12mm', height: '6mm', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fcc', border: '1px solid #777', fontSize: '9pt', color: '#fff' }}>ไม่ใช่</div>
                            </div>

                            <div style={{ fontWeight: 'bold', marginBottom: '0.5mm', paddingLeft: '15mm' }}>หัวข้อการตรวจความสะอาดของรถ</div>
                            {checklist.map((item, idx) => {
                                const val = data.vehicle_inspection?.[item.id as keyof typeof data.vehicle_inspection];
                                return (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8mm', paddingLeft: '15mm' }}>
                                        <div style={{ flex: 1 }}>{item.label}</div>
                                        <div style={{ display: 'flex', gap: '10mm', paddingRight: '30mm' }}>
                                            <div
                                                style={{ width: '7mm', height: '7mm', border: '1px solid #000', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
                                            >
                                                {val === true && <span style={{ fontSize: '18pt', fontWeight: 'bold', color: '#00f', position: 'absolute' }}>/</span>}
                                            </div>
                                            <div
                                                style={{ width: '7mm', height: '7mm', border: '1px solid #000', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
                                            >
                                                {val === false && <span style={{ fontSize: '18pt', fontWeight: 'bold', color: '#f00', position: 'absolute' }}>/</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary */}
                        {(() => {
                            const failCount = checklist.filter(item => data.vehicle_inspection?.[item.id as keyof typeof data.vehicle_inspection] === false).length;
                            const autoFail = failCount >= 3;
                            const isSuccess = !autoFail && (!data.vehicle_inspection || !data.vehicle_inspection.remark);

                            return (
                                <div style={{ marginTop: '2mm', paddingLeft: '22mm' }}>
                                    <div style={{ marginBottom: '1mm' }}>จากการตรวจเช็ค รายละเอียด 4 รายการ สรุปได้ว่าการเข้าโหลดบรรจุเมล็ดในปาล์มคันนี้</div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4mm', marginBottom: '1mm' }}>
                                        <div style={{ width: '6mm', height: '6mm', border: '1px solid #000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            {isSuccess && <span style={{ color: '#00f', fontSize: '18pt', fontWeight: 'bold' }}>/</span>}
                                        </div>
                                        <div>ทุกอย่างเรียบร้อยและปรกติเห็นควรอนุญาตให้รถคันนี้เข้าโหลดบรรจุเมล็ดในปาล์มได้</div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4mm' }}>
                                        <div style={{ width: '6mm', height: '6mm', border: '1px solid #000', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5mm' }}>
                                            {(autoFail || (data.vehicle_inspection?.remark)) && <span style={{ color: '#f00', fontSize: '18pt', fontWeight: 'bold' }}>/</span>}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            ไม่ควรให้โหลดบรรจุเพราะมีสิ่งที่ผิดปกติและปัญหาตามรายการที่ ......................................
                                            {(autoFail || data.vehicle_inspection?.remark) && (
                                                <div style={{ color: '#f00', paddingLeft: '1mm', marginTop: '0.5mm', fontWeight: 'bold' }}>
                                                    {autoFail ? 'ตรวจไม่ผ่าน 3 รายการขึ้นไป' : data.vehicle_inspection?.remark}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Inspector Signature */}
                        <div style={{ marginTop: '4mm', textAlign: 'right', paddingRight: '6mm' }}>
                            <div style={{ display: 'inline-block', textAlign: 'center' }}>
                                <div style={{ position: 'relative', height: '10mm', marginTop: '8mm' }}>
                                    <img
                                        src={sigPath(data.vehicle_inspection?.inspector_name || data.inspector || data.coa_user_id || '')}
                                        alt="inspector-sig"
                                        style={{ height: '14mm', position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)' }}
                                        onError={e => (e.currentTarget.style.visibility = 'hidden')}
                                    />
                                </div>
                                <div style={{ marginTop: '-4mm', textAlign: 'right' }}>....................................................................ลงชื่อผู้ตรวจเช็ค</div>
                            </div>
                        </div>

                        {/* Manager Approval */}
                        {(() => {
                            const failCount = checklist.filter(item => data.vehicle_inspection?.[item.id as keyof typeof data.vehicle_inspection] === false).length;
                            const autoFail = failCount >= 3;

                            return (
                                <div style={{ marginTop: '3mm', paddingLeft: '22mm' }}>
                                    <div style={{ fontWeight: 'bold' }}>ความคิดเห็นของผู้จัดการฝ่ายควบคุมคุณภาพ</div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4mm', marginTop: '1mm' }}>
                                        <div style={{ width: '6mm', height: '6mm', border: '1px solid #000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            {data.coa_mgr && !autoFail && <span style={{ color: '#00f', fontSize: '18pt', fontWeight: 'bold' }}>/</span>}
                                        </div>
                                        <div>อนุญาตให้รถเข้าบรรทุกเมล็ดในปาล์มตามที่ผู้ตรวจเช็คเสนอ</div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4mm', marginTop: '1mm' }}>
                                        <div style={{ width: '6mm', height: '6mm', border: '1px solid #000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            {autoFail && <span style={{ color: '#f00', fontSize: '18pt', fontWeight: 'bold' }}>/</span>}
                                        </div>
                                        <div>ไม่ให้รถโหลดบรรจุจนกว่าจะดำเนินการให้เรียบร้อย ดังนี้ ..................................................</div>
                                    </div>
                                    <div style={{ borderBottom: '2px dotted #000', marginTop: '6mm' }}></div>
                                </div>
                            );
                        })()}

                        {/* Manager Signature */}
                        <div style={{ marginTop: '4mm', textAlign: 'right', paddingRight: '6mm' }}>
                            <div style={{ display: 'inline-block', textAlign: 'center' }}>
                                <div style={{ position: 'relative', height: '10mm', marginTop: '5mm' }}>
                                    {data.coa_mgr && <img src="/images/signature/prapaporn.png" alt="mgr" style={{ height: '14mm', position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)' }} />}
                                </div>
                                <div style={{ marginTop: '-2mm', textAlign: 'right' }}>................................................................................ลงชื่อ</div>
                                <div style={{ marginTop: '1mm' }}>ผู้จัดการฝ่ายควบคุมคุณภาพ</div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '8.5pt', paddingTop: '1mm' }}>
                            <span>หน้า 1/1</span>
                            <span>FM-QAC-67-0029-Rev.01</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                    .no-print { display: none !important; }
                    #print-paper {
                        box-shadow: none !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 210mm !important;
                        height: 296mm !important;
                        margin: 0 !important;
                        padding: 10mm 14mm !important;
                        overflow: hidden;
                        page-break-after: avoid;
                    }
                }
            `}</style>
        </AppLayout>
    );
};

export default Seed_Vehicle_Print;
