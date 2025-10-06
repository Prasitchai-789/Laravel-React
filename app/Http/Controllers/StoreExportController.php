<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StoreOrder;
use setasign\Fpdi\Tcpdf\Fpdi;
use Illuminate\Support\Facades\DB;

class StoreExportController extends Controller
{
    public function export($id)
    {
        $order = StoreOrder::with(['items.good'])->findOrFail($id);

        $items = $order->items->map(fn($item) => [
            'product_id' => $item->product_id,
            'product_name' => $item->good?->GoodName1 ?? '-',
            'product_code' => $item->good?->GoodCode ?? '-',
            'quantity' => $item->quantity,
            'unit' => $item->unit ?? ($item->good?->MeasureUnitID ?? '-'),
        ]);

        // dd($items, $order);

        $pdf = new Fpdi();

        // โหลด template PDF
        $filePath = public_path('PDFForm/store.pdf');
        $pageCount = $pdf->setSourceFile($filePath);
        $tplId = $pdf->importPage(1);

        $pdf->AddPage();
        $pdf->useTemplate($tplId);

        // ตั้งฟอนต์ไทย
        $pdf->SetFont('thsarabunnew', '', 14);

        // เขียนข้อมูล order ลง PDF
        $pdf->SetXY(143, 38);
        $pdf->Write(0,  date('d/m/Y', strtotime($order->order_date)));

        $pdf->SetXY(153, 31);
        $pdf->Write(0,   $order->document_number);

        $pdf->SetXY(38, 52);
        $pdf->Write(0, ($order->requester ?? 'ไม่ระบุ'));

        $pdf->SetXY(146, 52);
        $pdf->Write(0, ($order->department ?? 'ไม่ระบุ'));

        $y = 116; // เริ่มบรรทัดแรก
        $no = 1;
        foreach ($items as $item) {

            $pdf->SetXY(23, $y);
            $pdf->Write(0, $no++);

            $pdf->SetXY(32, $y);
            $pdf->Write(0, $item['product_code']);
            // คอลัมน์ 1: ชื่อสินค้า
            $pdf->SetXY(58, $y);
            $pdf->Write(0, $item['product_name']);

            // คอลัมน์ 2: จำนวน
            $pdf->SetXY(148, $y);
            $pdf->Write(0, $item['quantity']);

            // คอลัมน์ 3: หน่วย
            $pdf->SetXY(166, $y);
            $pdf->Write(0, $item['unit']);

            $y += 7; // ขึ้นบรรทัดใหม่

        }

        // ส่ง PDF กลับ browser
        return response($pdf->Output('S'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="order-' . $order->id . '.pdf"');
    }
}
