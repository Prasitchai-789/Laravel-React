import AppLayout from '@/layouts/app-layout';
import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Printer, ArrowLeft } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface D {
    coa_no: string; lot_no: string; product_name: string;
    customer_name: string; destination_name: string;
    license_plate: string; driver_name: string; coa_tank: string;
    ffa?: number | string; m_i?: number | string; iv?: number | string; dobi?: number | string;
    spec_ffa?: string; spec_moisture?: string; spec_iv?: string; spec_dobi?: string;
    notes?: string; coa_user?: string; coa_mgr?: string; inspector?: string;
    coa_user_id?: string; created_at?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v?: number | string) => {
    if (!v && v !== 0) return '-';
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(n) ? String(v) : n.toFixed(2);
};

const thaiDate = (s?: string) => {
    const d = s ? new Date(s) : new Date();
    if (isNaN(d.getTime())) return '-';
    const m = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
               'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear() + 543}`;
};

const parseDateStr = (s: string) => {
    if (!s) return '';
    const p = s.split(' ')[0];
    if (p.includes('/')) { const [dd,mm,yy] = p.split('/'); let y=parseInt(yy); if(y>2500)y-=543; return `${y}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`; }
    if (p.includes('-')) { const pts = p.split('-'); if(pts[0].length===4) return p; let y=parseInt(pts[2]); if(y>2500)y-=543; return `${y}-${pts[1].padStart(2,'0')}-${pts[0].padStart(2,'0')}`; }
    return p.substring(0,10);
};

const sigPath = (id?: string|number) => {
    const s = id ? String(id).trim() : '';
    const b = window.location.origin;
    if(s==='1149'||s.includes('ประสิทธิ์ชัย')) return `${b}/images/signature/prasitchai.png`;
    if(s==='1143'||s.includes('ประภาพร'))     return `${b}/images/signature/prapaporn.png`;
    if(s==='1177'||s.includes('ยุพา'))         return `${b}/images/signature/yapha.png`;
    if(s==='1183'||s.includes('สุกัญญา'))      return `${b}/images/signature/sukanya.png`;
    if(s==='1434'||s.includes('ธัญ'))          return `${b}/images/signature/than.png`;
    if(s==='1476'||s.includes('วีระยุทธ'))     return `${b}/images/signature/veerayut.png`;
    return `${b}/images/signature/sukanya.png`;
};

// ─── Styled sub-components ────────────────────────────────────────────────────
const Blue = ({ children }: { children: React.ReactNode }) => (
    <span style={{ color: '#1a1aff', textDecoration: '', fontWeight: 600, }}>{children}</span>
);

const LabelRow = ({ label, value }: { label: string; value: string }) => (
    <tr>
        <td style={{ paddingRight: '4px', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>{label}</td>
        <td style={{ borderBottom: '1px solid #555', minWidth: '140px', paddingBottom: '1px', paddingTop: '8px', paddingLeft: '4px' }}>
            <Blue>{value || ''}</Blue>
        </td>
    </tr>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const Oil_COA_Print: React.FC = () => {
    const { sopid } = usePage<any>().props;
    const [data, setData] = useState<D | null>(null);
    const [loading, setLoading] = useState(true);
    const [docType, setDocType] = useState<'isp'|'mun'>('isp');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!sopid) { setError('ไม่พบ SOPID'); setLoading(false); return; }
        fetch(`/mar/plan-order/data/${sopid}`)
            .then(r => r.json())
            .then(res => {
                if (res.success && res.data) {
                    const d = res.data;
                    setData({
                        coa_no: d.coa_no || '-', lot_no: d.coa_lot || '-',
                        product_name: d.GoodName || 'น้ำมันปาล์มดิบ',
                        customer_name: d.CustName || '-', destination_name: d.Recipient || '-',
                        license_plate: d.NumberCar || '-', driver_name: d.DriverName || '-',
                        coa_tank: d.coa_tank || '-',
                        ffa: d.ffa, m_i: d.m_i, iv: d.iv, dobi: d.dobi,
                        spec_ffa: d.spec_ffa || '< 5.00 %',
                        spec_moisture: d.spec_moisture || '< 0.50 %',
                        spec_iv: d.spec_iv || '50 - 55 %',
                        spec_dobi: d.spec_dobi || '> 2.00',
                        notes: d.notes || '', coa_user: d.inspector || '',
                        coa_mgr: d.coa_mgr || 'ประภาพร เชื่อพระซอง',
                        inspector: d.inspector || '', coa_user_id: d.coa_user_id || '',
                        created_at: parseDateStr(d.coa_date || d.SOPDate || ''),
                    });
                } else setError('ไม่พบข้อมูล COA');
            })
            .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
            .finally(() => setLoading(false));
    }, [sopid]);

    const rows = data ? [
        { no: 1, desc: 'Free Fatty Acid  ( % FFA)',       spec: data.spec_ffa,      val: fmt(data.ffa) },
        { no: 2, desc: 'Moisture & Impurity  ( % M&I)',   spec: data.spec_moisture,  val: fmt(data.m_i) },
        { no: 3, desc: 'Iodine Value  ( % IV)',            spec: data.spec_iv,        val: fmt(data.iv) },
        { no: 4, desc: 'Dobi',                             spec: data.spec_dobi,      val: fmt(data.dobi) },
    ] : [];

    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const inspSig = docType === 'mun' ? `${base}/images/signature/fan.png`   : (data ? sigPath(data.coa_user_id || data.coa_user || data.inspector) : '');
    const mgrSig  = docType === 'mun' ? `${base}/images/signature/peach.png` : `${base}/images/signature/prapaporn.png`;
    const inspName = docType === 'mun' ? '' : (data?.coa_user || data?.inspector || '-');
    const mgrName  = docType === 'mun' ? '' : (data?.coa_mgr  || 'ประภาพร เชื่อพระซอง');
    const date    = thaiDate(data?.created_at);

    const P: React.CSSProperties = { fontFamily: "'THSarabunNew','Sarabun','TH Sarabun New',sans-serif" };
    const td: React.CSSProperties = { border: '1px solid #000', padding: '4px 8px', textAlign: 'center' };

    return (
        <AppLayout>
            {/* ── Toolbar ── */}
            <div className="no-print sticky top-0 z-20 flex items-center gap-3 border-b bg-white px-6 py-3 shadow-sm">
                <button onClick={() => window.history.back()} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                    <ArrowLeft className="w-4 h-4" /> กลับ
                </button>
                <div className="flex items-center gap-1 rounded-lg border bg-slate-50 p-1">
                    {(['isp','mun'] as const).map(t => (
                        <button key={t} onClick={() => setDocType(t)}
                            className={`rounded-md px-4 py-1.5 text-sm font-bold transition-colors ${docType===t ? (t==='isp'?'bg-blue-600':'bg-emerald-600')+' text-white shadow' : 'text-slate-500 hover:bg-white'}`}>
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>
                <span className="text-sm text-slate-500">{docType==='isp'?'มาตรฐาน ISP — แสดง Specification':'มาตรฐาน MUN — ไม่แสดง Specification'}</span>
                <button onClick={() => window.print()} className="ml-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                    <Printer className="w-4 h-4" /> พิมพ์เอกสาร
                </button>
            </div>

            {/* ── Page wrapper ── */}
            <div className="min-h-screen bg-slate-200 py-8 flex justify-center print:bg-white print:py-0">
                {loading && <p className="mt-20 text-slate-500 animate-pulse">กำลังโหลด...</p>}
                {error   && <p className="mt-20 text-rose-600">{error}</p>}

                {data && (
                    <div id="coa-paper" style={{
                        ...P,
                        width: '210mm', minHeight: '297mm', backgroundColor: '#fff',
                        padding: '10mm 14mm', boxSizing: 'border-box',
                        boxShadow: '0 4px 32px rgba(0,0,0,0.18)', fontSize: '12pt',
                        display: 'flex', flexDirection: 'column', gap: '0',
                    }}>

                        {/* ── 1. Header ── */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4mm' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '28mm', verticalAlign: 'top' }}>
                                        <img
                                            src={docType === 'mun' ? '/images/mun.png' : '/images/isp-touch-icon.png'}
                                            alt={docType === 'mun' ? 'MUN' : 'ISANPALM'}
                                            style={{ width: '26mm', objectFit: 'contain' }}
                                            onError={e => (e.currentTarget.style.visibility='hidden')} />
                                    </td>
                                    <td style={{ textAlign: 'right', verticalAlign: 'top', lineHeight: '1.55' }}>
                                        {docType === 'mun' ? (
                                            <>
                                                <div style={{ fontWeight: 700, fontSize: '14pt', textAlign: 'center' }}>Munsakon Agriculture Co.,Ltd.</div>
                                                <div style={{ fontSize: '11pt' }}>168 Moo 13, Tambon Kuakay Amphoe Wanon Niwat Sakonnakon 47120. Thailand</div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ fontWeight: 700, fontSize: '14pt', textAlign: 'center' }}>ISAN PALM CO.,LTD.</div>
                                                <div style={{ fontSize: '11pt' }}>222 Moo 6, Tambon Nongsanhom Amphoe Wanon Niwat Sakonnakon 47120. Thailand</div>
                                                <div style={{ fontSize: '11pt' }}>Tel.(042)-707-422</div>
                                                <div style={{ fontSize: '11pt', color: '#1a1aff' }}>www.isanpalm.com</div>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* ── 2. Title ── */}
                        <div style={{ textAlign: 'center', fontSize: '17pt', fontWeight: 700, letterSpacing: '2px', marginBottom: '4mm', marginTop: '2mm' }}>
                            CERTIFICATE OF ANALYSIS
                        </div>

                        {/* ── 3. Info Fields ── */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8mm', fontSize: '11pt' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '8mm' }}>
                                        <table>
                                            <tbody>
                                                <LabelRow label="Date. :" value={date} />
                                                <LabelRow label="Customer. :" value={docType === 'mun' ? data.destination_name : data.customer_name} />
                                                <LabelRow label="Storage Tank No. :" value={data.coa_tank} />
                                            </tbody>
                                        </table>
                                    </td>
                                    <td style={{ width: '50%', verticalAlign: 'top' }}>
                                        <table>
                                            <tbody>
                                                <LabelRow label="COA No. :" value={data.coa_no} />
                                                <LabelRow label="LOT No. :" value={data.lot_no} />
                                                <LabelRow label="Sample Name. :" value={data.product_name} />
                                                <LabelRow label="License plate :" value={data.license_plate} />
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* ── 4. Results Table ── */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '8mm' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#fff' }}>
                                    <th style={{ ...td, width: '10%' }}>Item</th>
                                    <th style={{ ...td, width: '30%' }}>Description</th>
                                    <th style={{ ...td, width: '25%' }}>Customer specification</th>
                                    <th style={{ ...td, width: '20%' }}>Result</th>
                                    <th style={{ ...td, width: '15%' }}>Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(r => (
                                    <tr key={r.no}>
                                        <td style={{ ...td, textAlign: 'center' }}>{r.no}</td>
                                        <td style={{ ...td, textAlign: 'left' }}>{r.desc}</td>
                                        <td style={{ ...td, color: '#1a1aff', fontWeight: 600, textAlign: 'center' }}>{r.spec}</td>
                                        <td style={{ ...td, color: '#1a1aff', fontWeight: 700, textAlign: 'center' }}>{r.val}</td>
                                        <td style={{ ...td, textAlign: 'center' }}>MPOB</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* ── 5. Remark ── */}
                        <div style={{ marginBottom: '3mm', fontSize: '11pt' }}>Remark:{data.notes ? ` ${data.notes}` : ''}</div>
                        {[0,1,2,3].map(i => (
                            <div key={i} style={{ borderBottom: '1px dashed #888', marginBottom: '5mm', height: '3mm' }} />
                        ))}

                        {/* ── 6. Spacer ── */}
                        <div style={{ flex: 1, minHeight: '8mm' }} />

                        {/* ── 7. Signatures ── */}
                        <table style={{ width: '100%', marginBottom: '30mm', fontSize: '11pt' }}>
                            <tbody>
                                <tr>
                                    {[
                                        { label: 'Reported by:', sig: inspSig, title: 'Chief Quality Control', name: inspName },
                                        { label: 'Approved by:', sig: mgrSig,  title: 'Manager',              name: mgrName },
                                    ].map(({ label, sig, title, name }) => (
                                        <td key={label} style={{ width: '50%', textAlign: 'center', verticalAlign: 'bottom', paddingTop: '8mm' }}>
                                            <div style={{ textAlign: 'left', paddingLeft: '8mm', display: 'flex', alignItems: 'flex-end', gap: '6mm' }}>
                                                <span style={{ height: '16mm', maxWidth: '40mm', objectFit: 'contain', paddingTop: '2mm' }}>{label} </span>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <img src={sig} alt="sig"
                                                         style={{
                                                             height: sig.includes('fan.png') ? '24mm' : sig.includes('peach.png') ? '20mm' : '16mm',
                                                             maxWidth: sig.includes('fan.png') ? '24mm' : sig.includes('peach.png') ? '40mm' : '40mm',
                                                             objectFit: 'contain',
                                                             marginBottom: '1mm'
                                                         }}
                                                         onError={e => (e.currentTarget.style.visibility='hidden')} />
                                                    <div style={{ borderTop: '1px solid #333', width: '50mm', textAlign: 'center', paddingTop: '1mm' }}>
                                                        {title}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    {['Date of Issue:', 'Date of Issue:'].map((label, i) => (
                                        <td key={i} style={{ width: '50%', paddingTop: '15mm', fontSize: '11pt' }}>
                                            <div style={{ paddingLeft: '8mm', display: 'flex', gap: '6mm', alignItems: 'flex-end' }}>
                                                <span>{label}</span>
                                                <div style={{ borderBottom: '1px solid #555', minWidth: '45mm', paddingBottom: '1mm' }}>
                                                    <Blue>{date}</Blue>
                                                </div>
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>

                        {/* ── 8. Footer ── */}
                        <div style={{ paddingTop: '2mm', display: 'flex', justifyContent: 'space-between', fontSize: '10pt', color: '#555' }}>
                            <span>หน้า 1/1</span>
                            <span>FM-QAC-59-0004-Rev.04</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Print CSS ── */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }

                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        height: 297mm !important;
                        max-height: 297mm !important;
                        overflow: hidden !important;
                    }

                    /* ซ่อนทุกอย่าง */
                    body * { visibility: hidden !important; }

                    /* แสดงเฉพาะ coa-paper */
                    #coa-paper, #coa-paper * { visibility: visible !important; }

                    /* position: absolute ไม่ซ้ำหน้า (ต่างจาก fixed) */
                    #coa-paper {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        overflow: hidden !important;
                        margin: 0 !important;
                        padding: 10mm 14mm !important;
                        box-shadow: none !important;
                        background: white !important;
                        box-sizing: border-box !important;
                    }
                }
            `}</style>
        </AppLayout>
    );
};

export default Oil_COA_Print;
