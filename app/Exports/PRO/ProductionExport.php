<?php

namespace App\Exports\PRO;

use App\Models\PRO\Production;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ProductionExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths
{
    protected Carbon $month;

    public function __construct(Carbon $month)
    {
        $this->month = $month;
    }

    public function collection()
    {
        return Production::whereMonth('Date', $this->month->month)
            ->whereYear('Date', $this->month->year)
            ->orderBy('Date', 'asc')
            ->get()
            ->map(function ($p, $i) {
                return [
                    'ลำดับ'                => $i + 1,
                    'วันที่'               => $p->Date ? Carbon::parse($p->Date)->format('d/m/Y') : '',
                    'สถานะ'               => ($p->FFBGoodQty ?? 0) > 0 ? 'ผลิต' : 'ไม่ผลิต',
                    'ยอดยกมา (ตัน)'        => round((float)($p->FFBForward  ?? 0), 2),
                    'ยอดรับเข้า (ตัน)'     => round((float)($p->FFBPurchase ?? 0), 2),
                    'รวม FFB (ตัน)'        => round((float)($p->TotalFFB    ?? 0), 2),
                    'กะ A (กะบะ)'          => (int)($p->ShiftA  ?? 0),
                    'กะ B (กะบะ)'          => (int)($p->ShiftB  ?? 0),
                    'กะ 3 (กะบะ)'          => (int)($p->Shift3  ?? 0),
                    'ปริมาณผลิต (ตัน)'     => round((float)($p->FFBGoodQty ?? 0), 2),
                    'ค่าเฉลี่ย (ตัน/กะบะ)' => round((float)($p->AvgPickup  ?? 0), 2),
                    'อบ (กะบะ)'            => (int)($p->Steam   ?? 0),
                    'บรรจุ (กะบะ)'         => (int)($p->StuckIn ?? 0),
                    'ลานเท (ตัน)'          => round((float)($p->RamRemain2  ?? 0), 2),
                    'FFB คงค้าง (ตัน)'     => round((float)($p->FFBRemain  ?? 0), 2),
                ];
            });
    }

    public function headings(): array
    {
        return [
            'ลำดับ', 'วันที่', 'สถานะ',
            'ยอดยกมา (ตัน)', 'ยอดรับเข้า (ตัน)', 'รวม FFB (ตัน)',
            'กะ A (กะบะ)', 'กะ B (กะบะ)', 'กะ 3 (กะบะ)',
            'ปริมาณผลิต (ตัน)', 'ค่าเฉลี่ย (ตัน/กะบะ)',
            'อบ (กะบะ)', 'บรรจุ (กะบะ)',
            'ลานเท (ตัน)', 'FFB คงค้าง (ตัน)',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,  'B' => 14, 'C' => 10,
            'D' => 16, 'E' => 18, 'F' => 16,
            'G' => 14, 'H' => 14, 'I' => 14,
            'J' => 18, 'K' => 20,
            'L' => 12, 'M' => 14,
            'N' => 14, 'O' => 18,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = $sheet->getHighestRow();

        // Header row style
        $sheet->getStyle('A1:O1')->applyFromArray([
            'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '059669']],
            'alignment' => ['horizontal' => 'center', 'vertical' => 'center'],
        ]);

        // Alternate row shading
        for ($row = 2; $row <= $lastRow; $row++) {
            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:O{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F0FDF4']],
                ]);
            }
        }

        // All borders
        $sheet->getStyle("A1:O{$lastRow}")->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => 'thin', 'color' => ['rgb' => 'D1FAE5']]],
        ]);

        return [];
    }
}
