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

        // Debug: ดูข้อมูลทั้งหมด
        \Log::info('📋 Order data for PDF:', [
            'order_id' => $order->id,
            'document_number' => $order->document_number,
            'items_count' => $order->items->count()
        ]);

        $items = $order->items->map(function ($item) {
            // Debug แต่ละ item
            \Log::info('📦 Item details:', [
                'item_id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->good?->GoodName1,
                'product_code' => $item->good?->GoodCode,
                'quantity' => $item->quantity,
                'unit_from_item' => $item->unit,
                'good_data' => $item->good ? [
                    'GoodName1' => $item->good->GoodName1,
                    'GoodCode' => $item->good->GoodCode,
                    'MainGoodUnitID' => $item->good->MainGoodUnitID,
                    // ตรวจสอบว่ามี field หน่วยอื่นๆ หรือไม่
                ] : null
            ]);

            return [
                'product_id' => $item->product_id,
                'product_name' => $item->good?->GoodName1 ?? '-',
                'product_code' => $item->good?->GoodCode ?? '-',
                'quantity' => $item->quantity,
                'unit' => $this->getUnitName($item),
            ];
        });

        // Debug ข้อมูลที่เตรียมสำหรับ PDF
        \Log::info('📊 Final items for PDF:', $items->toArray());

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
            \Log::info('📝 Writing to PDF:', [
                'line' => $no,
                'product_name' => $item['product_name'],
                'quantity' => $item['quantity'],
                'unit' => $item['unit'] // Debug หน่วยก่อนเขียน
            ]);

            $pdf->SetXY(23, $y);
            $pdf->Write(0, $no++);

            $pdf->SetXY(32, $y);
            $pdf->Write(0, $item['product_code']);

            // คอลัมน์ 1: ชื่อสินค้า
            $pdf->SetXY(58, $y);
            $pdf->Write(0, $item['product_name']);

            // คอลัมน์ 2: จำนวน
            $pdf->SetXY(142, $y);
            $quantity = $item['quantity'];
            if (is_numeric($quantity)) {
                if (floor($quantity) == $quantity) {
                    $formattedQuantity = number_format($quantity, 0);
                } else {
                    $formattedQuantity = number_format($quantity, 2);
                }
            } else {
                $formattedQuantity = $quantity;
            }
            $pdf->Write(0, $formattedQuantity);

            // คอลัมน์ 3: หน่วย - แก้ไขตรงนี้
            $pdf->SetXY(157, $y);

            // ตรวจสอบว่าหน่วยมีค่าหรือไม่
            $unit = $item['unit'] ?? 'ชิ้น';
            \Log::info('📏 Unit value:', ['unit' => $unit, 'position' => $y]);

            $pdf->Write(0, $unit);

            $y += 7; // ขึ้นบรรทัดใหม่
        }

        // ส่ง PDF กลับ browser
        return response($pdf->Output('S'))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="order-' . $order->id . '.pdf"');
    }

    /**
     * ฟังก์ชันดึงชื่อหน่วยจากหลายๆ source
     */
    private function getUnitName($item)
    {
        // 1. ตรวจสอบจาก field unit ใน item โดยตรง
        if (!empty($item->unit)) {
            return $item->unit;
        }

        // 2. ตรวจสอบจาก good relation
        if ($item->good) {
            // ถ้ามี GoodStockUnitName
            if (!empty($item->good->GoodStockUnitName)) {
                return $item->good->GoodStockUnitName;
            }

            // ถ้ามี GoodUnitName
            if (!empty($item->good->GoodUnitName)) {
                return $item->good->GoodUnitName;
            }

            // ถ้ามี MeasureUnitID
            if (!empty($item->good->MeasureUnitID)) {
                return $item->good->MeasureUnitID;
            }

            // ถ้ามี MainGoodUnitID ให้แปลงเป็นชื่อหน่วย
            if (!empty($item->good->MainGoodUnitID)) {
                return $this->getUnitNameFromID($item->good->MainGoodUnitID);
            }
        }

        // 3. Fallback มาตรฐาน
        return 'ชิ้น';
    }

    /**
     * ฟังก์ชันแปลง Unit ID เป็นชื่อหน่วย
     */
    private function getUnitNameFromID($unitId)
    {
        try {
            $unit = DB::connection('sqlsrv2')
                ->table('EMGoodUnit')
                ->where('GoodUnitID', $unitId)
                ->select('GoodUnitName')
                ->first();

            return $unit->GoodUnitName ?? 'ชิ้น';
        } catch (\Exception $e) {
            \Log::warning('❌ Cannot fetch unit name:', [
                'unit_id' => $unitId,
                'error' => $e->getMessage()
            ]);
            return 'ชิ้น';
        }
    }
}
