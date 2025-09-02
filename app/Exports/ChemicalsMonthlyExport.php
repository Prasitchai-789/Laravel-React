<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ChemicalsMonthlyExport implements FromArray, WithHeadings, WithTitle, WithStyles, WithColumnFormatting
{
    protected $data;
    protected $month;
    protected $year;
    protected $headings;

    public function __construct($data, $month, $year, $headings = null)
    {
        $this->data = $data;
        $this->month = $month;
        $this->year = $year;
        $this->headings = $headings;
    }

    public function array(): array
    {
        return $this->data;
    }

    public function headings(): array
    {
        if ($this->headings) {
            return $this->headings;
        }

        // Headings เริ่มต้นถ้าไม่ได้กำหนดมา
        return [
            'วันที่',
            'ดินขาว (กก.)',
            'Fogon 3000 (กก.)',
            'Hexon 4000 (กก.)',
            'Sumalchlor 50 (กก.)',
            'PROXITANE (กก.)',
            'Polymer (กก.)',
            'Soda Ash (กก.)',
            'Salt (กก.)',
            
        ];
    }

    public function title(): string
    {
        $months = [
            '01' => 'มกราคม', '02' => 'กุมภาพันธ์', '03' => 'มีนาคม',
            '04' => 'เมษายน', '05' => 'พฤษภาคม', '06' => 'มิถุนายน',
            '07' => 'กรกฎาคม', '08' => 'สิงหาคม', '09' => 'กันยายน',
            '10' => 'ตุลาคม', '11' => 'พฤศจิกายน', '12' => 'ธันวาคม'
        ];
        
        return 'รายงานเดือน_' . ($months[$this->month] ?? $this->month) . '_' . $this->year;
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = count($this->data) + 1; // +1 เพราะมีหัวข้อ
        
        // กำหนดสไตล์สำหรับหัวตาราง
        $sheet->getStyle('A1:I1')->applyFromArray([
            'font' => [
                'bold' => true, 
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 12
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID, 
                'startColor' => ['rgb' => '2E75B6']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);
        
        // กำหนดความสูงของแถวหัวข้อ
        $sheet->getRowDimension(1)->setRowHeight(25);
        
        // กำหนดสไตล์สำหรับผลรวม (ถ้ามี)
        if ($lastRow > 2) {
            $sheet->getStyle('A' . $lastRow . ':I' . $lastRow)->applyFromArray([
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID, 
                    'startColor' => ['rgb' => 'E2EFDA']
                ],
                'borders' => [
                    'top' => ['borderStyle' => Border::BORDER_DOUBLE],
                    'bottom' => ['borderStyle' => Border::BORDER_DOUBLE]
                ],
            ]);
        }
        
        // กำหนดความกว้างคอลัมน์
        $sheet->getColumnDimension('A')->setWidth(15); // วันที่
        foreach (range('B', 'I') as $column) {
            $sheet->getColumnDimension($column)->setWidth(16);
        }
        
        // กำหนดรูปแบบตัวเลขและจัดกลาง
        foreach (range('B', 'I') as $column) {
            for ($row = 2; $row <= $lastRow; $row++) {
                $sheet->getStyle($column . $row)->applyFromArray([
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER
                    ]
                ]);
            }
        }
        
        // กำหนดขอบให้ทั้งตาราง
        $sheet->getStyle('A1:J' . $lastRow)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'D9D9D9']
                ]
            ]
        ]);
        
        // จัดกลางข้อมูลในคอลัมน์ A (วันที่)
        $sheet->getStyle('A2:A' . $lastRow)->applyFromArray([
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER
            ]
        ]);
    }

    public function columnFormats(): array
    {
        return [
            'B' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'C' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'D' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'E' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'G' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'H' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'I' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    ];
    }
}