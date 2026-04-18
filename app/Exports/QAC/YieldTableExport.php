<?php

namespace App\Exports\QAC;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class YieldTableExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths
{
    protected array $data;
    protected Carbon $month;

    public function __construct(array $data, Carbon $month)
    {
        $this->data = $data;
        $this->month = $month;
    }

    public function collection()
    {
        return collect($this->data)->map(function ($row) {
            return [
                'วันที่'        => Carbon::parse($row['date'])->format('d/m/Y'),
                'ซื้อผลปาล์ม'   => $row['ffb_purchase'],
                'ผลิต FFB'      => $row['ffb_good_qty'],
                'CPO ผลิตได้'   => $row['product_cpo'],
                '% Yield CPO'   => $row['yield_cpo'],
                'KN ผลิตได้'    => $row['product_kn'],
                '% Yield KN'    => $row['yield_kn'],
                'Sale CPO'      => $row['sales_cpo'],
                'Sale KN'       => $row['sales_kn'],
            ];
        });
    }

    public function headings(): array
    {
        return [
            'วันที่',
            'ซื้อผลปาล์ม (TON)',
            'ผลิต FFB (TON)',
            'CPO ผลิตได้ (TON)',
            '% Yield CPO',
            'KN ผลิตได้ (TON)',
            '% Yield KN',
            'Sale CPO (TON)',
            'Sale KN (TON)',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15, // วันที่
            'B' => 18, // ซื้อผลปาล์ม
            'C' => 18, // ผลิต FFB
            'D' => 18, // CPO produced
            'E' => 15, // Yield CPO
            'F' => 18, // KN produced
            'G' => 15, // Yield KN
            'H' => 18, // Sale CPO
            'I' => 18, // Sale KN
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = $sheet->getHighestRow();

        // Header Row Style
        $sheet->getStyle('A1:I1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E293B'] // Slate-800
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Alternating Row Shading and Alignment
        for ($row = 2; $row <= $lastRow; $row++) {
            // Right align numbers
            $sheet->getStyle("B{$row}:I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            // Center align dates
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:I{$row}")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'F8FAFC'] // Slate-50
                    ],
                ]);
            }
        }

        // Specific Column Colors
        // CPO (Blue) - Columns D, E
        $sheet->getStyle("D2:E{$lastRow}")->getFont()->getColor()->setRGB('1D4ED8'); // Blue-700
        
        // KN (Emerald) - Columns F, G
        $sheet->getStyle("F2:G{$lastRow}")->getFont()->getColor()->setRGB('047857'); // Emerald-700

        // Borders
        $sheet->getStyle("A1:I{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => 'E2E8F0'], // Slate-200
                ],
            ],
        ]);

        return [];
    }
}
