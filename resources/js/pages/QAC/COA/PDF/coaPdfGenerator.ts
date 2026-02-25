// resources/js/pages/QAC/COA/PDF/coaPdfGenerator.ts
// ใช้ pdf-lib โหลด template PDF และกรอกข้อมูล COA ลงในตำแหน่งที่กำหนด

import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export interface COAFields {
    coa_no?: string;
    lot_no?: string;
    product_name?: string;
    customer_name?: string;
    license_plate?: string;
    driver_name?: string;
    coa_tank?: string;
    inspector?: string;
    coa_user_id?: string | number;
    coa_mgr?: string;
    notes?: string;
    created_at?: string;
    // Oil
    ffa?: number | string;
    m_i?: number | string;
    iv?: number | string;
    dobi?: number | string;
    spec_ffa?: string;
    spec_moisture?: string;
    spec_iv?: string;
    spec_dobi?: string;
    // Seed
    result_shell?: number | string;
    result_kn_moisture?: number | string;
    spec_shell?: string;
    spec_kn_moisture?: string;

    // CAR
    po_no?: string;
    date?: string;
    vehicle_inspection?: any;
}

/** helper: format ตัวเลขให้ทศนิยม 2 ตำแหน่ง หรือ '-' */
const fmt = (v?: number | string) => {
    if (v === undefined || v === null || v === '') return '-';
    if (typeof v === 'string') {
        const num = parseFloat(v);
        return isNaN(num) ? v : num.toFixed(2);
    }
    return v.toFixed(2);
};

/** helper: format วันที่ไทย (เช่น 24 กุมภาพันธ์ 2569) */
const formatThaiDate = (dateString?: string) => {
    const date = dateString ? new Date(dateString) : new Date();
    if (isNaN(date.getTime())) return '-';
    const thaiMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
    return `${day} ${month} ${year}`;
};

/** helper: mapping signature path */
const getSignaturePath = (identity?: string | number) => {
    // Identity can be a User ID (number/string) or a User Name (string)
    const id = identity ? identity.toString() : '';
    const baseUrl = window.location.origin;

    // Check by ID
    if (id === '1149') return `${baseUrl}/images/signature/prasitchai.png`;
    if (id === '1143') return `${baseUrl}/images/signature/prapaporn.png`;
    if (id === '1177') return `${baseUrl}/images/signature/yapha.png`;
    if (id === '1183') return `${baseUrl}/images/signature/sukanya.png`;
    if (id === '1434') return `${baseUrl}/images/signature/than.png`;
    if (id === '1476') return `${baseUrl}/images/signature/veerayut.png`;

    // Check by Name (Exact or Partial Match)
    const name = id.toLowerCase();
    if (name.includes('ประสิทธิ์ชัย')) return `${baseUrl}/images/signature/prasitchai.png`;
    if (name.includes('ประภาพร')) return `${baseUrl}/images/signature/prapaporn.png`;
    if (name.includes('ยุพา')) return `${baseUrl}/images/signature/yapha.png`;
    if (name.includes('สุกัญญา')) return `${baseUrl}/images/signature/sukanya.png`;
    if (name.includes('ธัญญลักษณ์') || name.includes('ธัญ')) return `${baseUrl}/images/signature/than.png`;
    if (name.includes('วีระยุทธ') || name.includes('วีรยุทธ')) return `${baseUrl}/images/signature/veerayut.png`;

    // Default signature if no match
    return `${baseUrl}/images/signature/sukanya.png`;
};

/** helper: download file จาก Uint8Array */
export const downloadPdf = (bytes: Uint8Array, filename: string) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

/**
 * สร้าง COA PDF สำหรับน้ำมัน (ISP หรือ MUN)
 */
export async function generateOilCoaPdf(fields: COAFields, coaType: 'isp' | 'mun' = 'isp'): Promise<Uint8Array> {
    const templateUrl = coaType === 'mun' ? '/QAC/COA/PDF/MUN_COA_OIL.pdf' : '/QAC/COA/PDF/ISP_COA_OIl.pdf';
    const templateBytes = await fetch(templateUrl).then(r => {
        if (!r.ok) throw new Error(`Template not found: ${templateUrl}`);
        return r.arrayBuffer();
    });
    const pdfDoc = await PDFDocument.load(templateBytes);

    pdfDoc.registerFontkit(fontkit);

    const fontBytes = await fetch('https://script-app.github.io/font/THSarabunNew.ttf').then(res => res.arrayBuffer());
    const font = await pdfDoc.embedFont(fontBytes);

    const firstPage = pdfDoc.getPages()[0];
    const textColor = rgb(0.1, 0.1, 0.95);

    const drawText = (text: string | undefined, x: number, y: number, size = 14) => {
        if (text && text !== '-') {
            firstPage.drawText(text, { x, y, size, font: font, color: textColor });
        }
    };

    // ─── กรอกข้อมูลข้อมูลทั่วไป ───────────────────────────────────────
    const thaiDate = formatThaiDate(fields.date || fields.created_at);

    if (coaType === 'mun') {
        // [MUN OIL] Coordinates
        drawText(thaiDate, 156, 620);
        drawText(fields.customer_name, 152, 600);
        drawText(fields.coa_tank, 160, 583);
        drawText(fields.product_name, 420, 600);
        drawText(fields.license_plate, 420, 585);
        drawText(fields.coa_no, 420, 640);
        drawText(fields.lot_no, 420, 620);

        // ─── ผลวิเคราะห์ ────────────────────────────────────────────────
        // drawText(fields.spec_ffa, 335, 510);
        // drawText(fields.spec_moisture, 335, 490);
        // drawText(fields.spec_iv, 335, 472);
        // drawText(fields.spec_dobi, 335, 453);
        drawText(fmt(fields.ffa), 420, 530);
        drawText(fmt(fields.m_i), 420, 515);
        drawText(fmt(fields.iv), 420, 495);
        drawText(fmt(fields.dobi), 420, 475);
    } else {
        // [ISP OIL] Coordinates
        drawText(thaiDate, 156, 605);
        drawText(fields.customer_name, 152, 584);
        drawText(fields.coa_tank, 160, 567);
        drawText(fields.product_name, 420, 584);
        drawText(fields.license_plate, 420, 567);
        drawText(fields.coa_no, 420, 624);
        drawText(fields.lot_no, 420, 605);

        // ─── ผลวิเคราะห์ ────────────────────────────────────────────────
        drawText(fields.spec_ffa, 335, 510);
        drawText(fields.spec_moisture, 335, 490);
        drawText(fields.spec_iv, 335, 472);
        drawText(fields.spec_dobi, 335, 453);
        drawText(fmt(fields.ffa), 440, 510);
        drawText(fmt(fields.m_i), 440, 490);
        drawText(fmt(fields.iv), 440, 472);
        drawText(fmt(fields.dobi), 440, 453);
    }

    // ─── ลายเซ็น ───────────────────────────────────────────────────
    try {
        const baseUrl = window.location.origin;
        // ลายเซ็น User (Inspector)
        const userSigPath = coaType === 'mun' ? `${baseUrl}/images/signature/fan.png` : getSignaturePath(fields.coa_user_id);
        const userSigBytes = await fetch(userSigPath).then(r => {
            if (!r.ok) throw new Error(`Failed to fetch ${userSigPath}: ${r.statusText}`);
            return r.arrayBuffer();
        });
        const userSigImage = await pdfDoc.embedPng(userSigBytes);
        const userSigScale = coaType === 'mun' ? 0.25 : 0.10;
        const userSigDims = userSigImage.scale(userSigScale);

        // ลายเซ็น Manager
        const mgrSigPath = coaType === 'mun' ? `${baseUrl}/images/signature/peach.png` : `${baseUrl}/images/signature/prapaporn.png`;
        const mgrSigBytes = await fetch(mgrSigPath).then(r => {
            if (!r.ok) throw new Error(`Failed to fetch ${mgrSigPath}: ${r.statusText}`);
            return r.arrayBuffer();
        });
        const mgrSigImage = await pdfDoc.embedPng(mgrSigBytes);
        const mgrSigScale = coaType === 'mun' ? 0.15 : 0.25;
        const mgrSigDims = mgrSigImage.scale(mgrSigScale);

        if (coaType === 'mun') {
            // [MUN OIL] Signature Coordinates
            firstPage.drawImage(userSigImage, {
                x: 175,
                y: 262,
                width: userSigDims.width,
                height: userSigDims.height,
            });
            firstPage.drawImage(mgrSigImage, {
                x: 425,
                y: 262,
                width: mgrSigDims.width,
                height: mgrSigDims.height,
            });
            // วันที่ใต้ลายเซ็น
            drawText(thaiDate, 175, 209);
            drawText(thaiDate, 425, 209);
        } else {
            // [ISP OIL] Signature Coordinates
            firstPage.drawImage(userSigImage, {
                x: 175,
                y: 235,
                width: userSigDims.width,
                height: userSigDims.height,
            });
            firstPage.drawImage(mgrSigImage, {
                x: 425,
                y: 235,
                width: mgrSigDims.width,
                height: mgrSigDims.height,
            });
            // วันที่ใต้ลายเซ็น
            drawText(thaiDate, 175, 175);
            drawText(thaiDate, 425, 175);
        }
    } catch (e: any) {
        console.error('Error embedding signatures in Oil COA:', e, e.stack);
    }

    return pdfDoc.save();
}

/**
 * สร้าง COA PDF สำหรับเมล็ดปาล์ม (ISP_COA_KN)
 */
export async function generateSeedCoaPdf(fields: COAFields, coaType: 'isp' | 'mun' = 'isp'): Promise<Uint8Array> {
    const templateUrl = coaType === 'mun' ? '/QAC/COA/PDF/MUN_COA_KN.pdf' : '/QAC/COA/PDF/ISP_COA_KN.pdf';
    const templateBytes = await fetch(templateUrl).then(r => {
        if (!r.ok) throw new Error(`Template not found: ${templateUrl}`);
        return r.arrayBuffer();
    });
    const pdfDoc = await PDFDocument.load(templateBytes);

    pdfDoc.registerFontkit(fontkit);

    const fontBytes = await fetch('https://script-app.github.io/font/THSarabunNew.ttf').then(res => res.arrayBuffer());
    const font = await pdfDoc.embedFont(fontBytes);

    const firstPage = pdfDoc.getPages()[0];
    const textColor = rgb(0.1, 0.1, 0.95);

    const drawText = (text: string | undefined, x: number, y: number, size = 14) => {
        if (text && text !== '-') {
            firstPage.drawText(text, { x, y, size, font: font, color: textColor });
        }
    };

    const thaiDate = formatThaiDate(fields.date || fields.created_at);
    let finalCoaNo = fields.coa_no || '-';
    if (finalCoaNo !== '-' && !finalCoaNo.toUpperCase().includes('KN')) {
        if (finalCoaNo.startsWith('ISP_')) {
            finalCoaNo = finalCoaNo.replace('ISP_', 'ISP_KN');
        } else if (finalCoaNo.startsWith('MUN_')) {
            finalCoaNo = finalCoaNo.replace('MUN_', 'MUN_KN');
        } else {
            finalCoaNo = 'KN' + finalCoaNo;
        }
    }

    if (coaType === 'mun') {
        // [MUN KN] Coordinates
        drawText(thaiDate, 153, 620);
        drawText(fields.customer_name, 150, 600);
        drawText(fields.coa_tank, 150, 585);
        drawText(fields.product_name, 410, 600);
        drawText(fields.license_plate, 410, 585);
        drawText(finalCoaNo, 410, 640);
        drawText(fields.lot_no, 410, 620);

        // ผลวิเคราะห์ KN
        drawText(fmt(fields.result_shell), 420, 530);
        drawText(fmt(fields.result_kn_moisture), 420, 510);
    } else {
        // [ISP KN] Coordinates
        drawText(thaiDate, 153, 620);
        drawText(fields.customer_name, 150, 600);
        drawText(fields.coa_tank, 150, 585);
        drawText(fields.product_name, 410, 600);
        drawText(fields.license_plate, 410, 585);
        drawText(finalCoaNo, 410, 640);
        drawText(fields.lot_no, 410, 620);

        // ผลวิเคราะห์ KN
        drawText(fmt(fields.result_shell), 420, 530);
        drawText(fmt(fields.result_kn_moisture), 420, 510);
    }

    // ลายเซ็น
    try {
        const baseUrl = window.location.origin;
        // ลายเซ็น User (Inspector)
        const userSigPath = coaType === 'mun' ? `${baseUrl}/images/signature/fan.png` : getSignaturePath(fields.coa_user_id);
        const userSigBytes = await fetch(userSigPath).then(r => {
            if (!r.ok) throw new Error(`Failed to fetch ${userSigPath}: ${r.statusText}`);
            return r.arrayBuffer();
        });
        const userSigImage = await pdfDoc.embedPng(userSigBytes);
        const userSigScale = coaType === 'mun' ? 0.25 : 0.10;
        const userSigDims = userSigImage.scale(userSigScale);

        // ลายเซ็น Manager
        const mgrSigPath = coaType === 'mun' ? `${baseUrl}/images/signature/peach.png` : `${baseUrl}/images/signature/prapaporn.png`;
        const mgrSigBytes = await fetch(mgrSigPath).then(r => {
            if (!r.ok) throw new Error(`Failed to fetch ${mgrSigPath}: ${r.statusText}`);
            return r.arrayBuffer();
        });
        const mgrSigImage = await pdfDoc.embedPng(mgrSigBytes);
        const mgrSigScale = coaType === 'mun' ? 0.15 : 0.25;
        const mgrSigDims = mgrSigImage.scale(mgrSigScale);

        if (coaType === 'mun') {
            // [MUN KN] Signature Coordinates
            firstPage.drawImage(userSigImage, {
                x: 175,
                y: 262,
                width: userSigDims.width,
                height: userSigDims.height,
            });
            firstPage.drawImage(mgrSigImage, {
                x: 425,
                y: 262,
                width: mgrSigDims.width,
                height: mgrSigDims.height,
            });
            // วันที่ใต้ลายเซ็น
            drawText(thaiDate, 175, 209);
            drawText(thaiDate, 425, 209);
        } else {
            // [ISP KN] Signature Coordinates
            firstPage.drawImage(userSigImage, {
                x: 175,
                y: 262,
                width: userSigDims.width,
                height: userSigDims.height,
            });
            firstPage.drawImage(mgrSigImage, {
                x: 425,
                y: 262,
                width: mgrSigDims.width,
                height: mgrSigDims.height,
            });
            // วันที่ใต้ลายเซ็น
            drawText(thaiDate, 175, 209);
            drawText(thaiDate, 425, 209);
        }
    } catch (e: any) {
        console.error('Error embedding signatures in Seed COA:', e, e.stack);
    }

    return pdfDoc.save();
}

/**
 * สร้าง CAR PDF
 */
export async function generateCarPdf(fields: COAFields): Promise<Uint8Array> {
    const url = '/QAC/COA/PDF/CAR.pdf';
    const existingPdfBytes = await fetch(url).then(r => {
        if (!r.ok) throw new Error(`Template not found: ${url}`);
        return r.arrayBuffer();
    });

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);

    const fontBytes = await fetch('https://script-app.github.io/font/THSarabunNew.ttf').then(res => res.arrayBuffer());
    const font = await pdfDoc.embedFont(fontBytes);

    const firstPage = pdfDoc.getPages()[0];
    const { height } = firstPage.getSize();

    const draw = (text: string, x: number, fromTop: number, size = 12, bold = false) => {
        // CAR.pdf ยังใช้ระบบ fromTop เพราะเป็น template ใหม่ที่เราเริ่มสร้างเอง
        firstPage.drawText(text, {
            x,
            y: height - fromTop,
            size,
            font: font,
            color: rgb(0.1, 0.1, 0.95), // Match COA color
        });
    };

    // ข้อมูลทั่วไปของ CAR (ตำแหน่ง X, Y จากหน้าบน)
    const thaiDate = formatThaiDate(fields.date || fields.created_at);
    draw(thaiDate, 120, 190, 14); // วันที่
    draw(fields.license_plate || '-', 450, 213, 14, true); // ทะเบียนรถ
    // draw(fields.driver_name || '-', 400, 150, 12); // ชื่อคนขับ

    // ข้อมูลเพิ่มเติมตามที่ต้องการดึงให้เหมือน COA (ใช้พิกัดทดสอบ)
    draw(fields.customer_name || '-', 120, 214, 14); // ชื่อลูกค้า
    draw(fields.product_name || '-', 450, 192, 14); // ชื่อสินค้า (คำว่า sample name น่าจะหมายถึง product_name)
    draw(fields.coa_tank || '-', 120, 234, 14); // ถัง
    draw(fields.coa_no || '-', 450, 143, 14); // เลขที่ CAR/COA

    const vi = fields.vehicle_inspection;
    if (vi) {
        // Render a checkmark but shift its X coordinate based on true/false
        const yesX = 380;
        const yesy = 120;
        const noX = 435;
        const mark = '/';

        draw(mark, vi.is_clean ? yesX : noX, 375, 25);
        draw(mark, vi.is_covered ? yesX : noX, 395, 25);
        draw(mark, vi.is_no_smell ? yesX : noX, 415, 25);
        draw(mark, vi.is_doc_valid ? yesX : noX, 435, 25);

        // เครื่องหมาย Checkmark เปล่า 4 อัน (ไม่อิงรถ)
        draw(mark, yesy, 500, 25);
        draw(mark, yesy, 520, 25);
        draw(mark, yesy, 600, 25);
        draw(mark, yesy, 617, 25);

        if (vi.remark) draw(vi.remark, 100, 300, 12);
        // if (vi.inspector_name) draw(vi.inspector_name, 400, 554, 14); // We will draw actual signature image below instead of text
    }

    // ─── ลายเซ็น ───────────────────────────────────────────────────
    try {
        const baseUrl = window.location.origin;

        // ลายเซ็น User (Inspector) -> ดึงตาม login เหมือน ISP
        const userSigPath = getSignaturePath(fields.coa_user_id);
        const userSigBytes = await fetch(userSigPath).then(r => {
            if (!r.ok) throw new Error(`Failed to fetch user signature ${userSigPath}: ${r.statusText}`);
            return r.arrayBuffer();
        });
        const userSigImage = await pdfDoc.embedPng(userSigBytes);
        const userSigScale = 0.10;
        const userSigDims = userSigImage.scale(userSigScale);

        // ลายเซ็น Manager -> prapaporn เสมอ
        const mgrSigPath = `${baseUrl}/images/signature/prapaporn.png`;
        const mgrSigBytes = await fetch(mgrSigPath).then(r => {
            if (!r.ok) throw new Error(`Failed to fetch manager signature ${mgrSigPath}: ${r.statusText}`);
            return r.arrayBuffer();
        });
        const mgrSigImage = await pdfDoc.embedPng(mgrSigBytes);
        const mgrSigScale = 0.25;
        const mgrSigDims = mgrSigImage.scale(mgrSigScale);

        // วางลงกระดาษ (พิกัด Y นับจากจุดเริ่มต้นด้านบนของจอกระดาษ โดยใช้ math height - fromTop)
        // Adjust these (X, and fromTop height) to fit the CAR template correctly
        firstPage.drawImage(userSigImage, {
            x: 420,
            y: height - 560, // 600 from top
            width: userSigDims.width,
            height: userSigDims.height,
        });

        firstPage.drawImage(mgrSigImage, {
            x: 420,
            y: height - 670, // 600 from top
            width: mgrSigDims.width,
            height: mgrSigDims.height,
        });

        // // วันที่ใต้ลายเซ็น
        // draw(thaiDate, 100, 615, 12);
        // draw(thaiDate, 350, 615, 12);

    } catch (e: any) {
        console.error('Error embedding signatures in CAR PDF:', e, e.stack);
    }

    return pdfDoc.save();
}

/**
 * Entry point: เลือก generator ตามประเภทสินค้า แล้ว download
 */
export async function generateAndDownloadCoa(
    fields: COAFields,
    type: 'oil' | 'seed' | 'car' | 'coa_isp' | 'coa_mun' | 'seed_isp' | 'seed_mun'
): Promise<void> {
    // Ensure coa_user_id is set for signature mapping (fallback to inspector name)
    if (!fields.coa_user_id && fields.inspector) {
        fields.coa_user_id = fields.inspector;
    }
    const filename = type === 'car'
        ? `CAR_${fields.po_no || 'doc'}.pdf`
        : `COA_${fields.coa_no?.replace('/', '-') || 'draft'}.pdf`;

    let bytes: Uint8Array;
    if (type === 'coa_isp') {
        bytes = await generateOilCoaPdf(fields, 'isp');
    } else if (type === 'coa_mun') {
        bytes = await generateOilCoaPdf(fields, 'mun');
    } else if (type === 'seed' || type === 'seed_isp') {
        bytes = await generateSeedCoaPdf(fields, 'isp');
    } else if (type === 'seed_mun') {
        bytes = await generateSeedCoaPdf(fields, 'mun');
    } else if (type === 'car') {
        bytes = await generateCarPdf(fields);
    } else {
        // Fallback or old oil type
        bytes = await generateOilCoaPdf(fields, 'isp');
    }

    downloadPdf(bytes, filename);
}
