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

class ChemicalsMonthlyExport implements FromArray, WithTitle, WithStyles, WithColumnFormatting
{
    protected $data;
    protected $month;
    protected $year;

    public function __construct($data, $month, $year)
    {
        $this->data = $data;
        $this->month = $month;
        $this->year = $year;
    }

    public function array(): array
    {
        return $this->data;
    }

    public function title(): string
    {
        $months = [
            '01' => 'มกราคม', '02' => 'กุมภาพันธ์', '03' => 'มีนาคม',
            '04' => 'เมษายน', '05' => 'พฤษภาคม', '06' => 'มิถุนายน',
            '07' => 'กรกฎาคม', '08' => 'สิงหาคม', '09' => 'กันยายน',
            '10' => 'ตุลาคม', '11' => 'พฤศจิกายน', '12' => 'ธันวาคม'
        ];
        
        return 'รายงานเดือน ' . ($months[$this->month] ?? $this->month) . ' ' . $this->year;
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = count($this->data);
        
        // กำหนดสไตล์สำหรับหัวตาราง
        $sheet->getStyle('A1:H1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        
        // กำหนดสไตล์สำหรับผลรวม
        $sheet->getStyle('A' . $lastRow . ':H' . $lastRow)->applyFromArray([
            'font' => ['bold' => true],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F2F2F2']],
            'borders' => ['top' => ['borderStyle' => Border::BORDER_DOUBLE]],
        ]);
        
        // กำหนดความกว้างคอลัมน์
        $sheet->getColumnDimension('A')->setWidth(15);
        foreach (range('B', 'H') as $column) {
            $sheet->getColumnDimension($column)->setWidth(12);
        }
        
        // กำหนดรูปแบบตัวเลข
        foreach (range('B', 'H') as $column) {
            for ($row = 2; $row <= $lastRow; $row++) {
                $sheet->getStyle($column . $row)->getNumberFormat()->setFormatCode('#,##0.00');
            }
        }
        
        // กำหนดขอบให้ทั้งตาราง
        $sheet->getStyle('A1:H' . $lastRow)->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN]
            ]
        ]);
    }

    public function columnFormats(): array
    {
        return [
            'B' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'C' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'D' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'E' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'G' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'H' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
        ];
    }
}