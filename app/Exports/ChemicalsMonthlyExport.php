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

    /**
     * คำนวณตัวอักษรคอลัมน์สุดท้ายแบบ dynamic
     */
    private function getLastColumn(): string
    {
        // data[0] คือ header row → จำนวนคอลัมน์
        $colCount = !empty($this->data) ? count($this->data[0]) : 1;
        // แปลงเลขเป็นตัวอักษร (1=A, 2=B, ..., 27=AA, ...)
        $letter = '';
        while ($colCount > 0) {
            $colCount--;
            $letter = chr(65 + ($colCount % 26)) . $letter;
            $colCount = intdiv($colCount, 26);
        }
        return $letter;
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

        // Dynamic headings จาก data row แรก
        return !empty($this->data) ? $this->data[0] : ['วันที่'];
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
        $lastCol = $this->getLastColumn();
        $lastRow = count($this->data) + 1; // +1 เพราะมีหัวข้อ

        // === สไตล์ หัวตาราง (แถวที่ 1) ===
        $sheet->getStyle("A1:{$lastCol}1")->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11,
                'name' => 'TH Sarabun New',
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '7C3AED'], // สี violet-600
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '5B21B6'], // สี violet-800
                ],
            ],
        ]);

        // ความสูงหัวข้อ
        $sheet->getRowDimension(1)->setRowHeight(30);

        // === สไตล์ แถวข้อมูล (สลับสี) ===
        for ($row = 2; $row <= $lastRow; $row++) {
            $bgColor = ($row % 2 === 0) ? 'F5F3FF' : 'FFFFFF'; // violet-50 สลับขาว
            $sheet->getStyle("A{$row}:{$lastCol}{$row}")->applyFromArray([
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => $bgColor],
                ],
                'font' => [
                    'size' => 11,
                    'name' => 'TH Sarabun New',
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'DDD6FE'], // สี violet-200
                    ],
                ],
            ]);
        }

        // === สไตล์ แถวผลรวม (แถวสุดท้าย) ===
        if ($lastRow > 2) {
            $sheet->getStyle("A{$lastRow}:{$lastCol}{$lastRow}")->applyFromArray([
                'font' => [
                    'bold' => true,
                    'size' => 11,
                    'name' => 'TH Sarabun New',
                    'color' => ['rgb' => '5B21B6'], // สี violet-800
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'EDE9FE'], // สี violet-100
                ],
                'borders' => [
                    'top' => [
                        'borderStyle' => Border::BORDER_DOUBLE,
                        'color' => ['rgb' => '7C3AED'],
                    ],
                    'bottom' => [
                        'borderStyle' => Border::BORDER_DOUBLE,
                        'color' => ['rgb' => '7C3AED'],
                    ],
                ],
            ]);
        }

        // === ความกว้างคอลัมน์ (dynamic) ===
        $sheet->getColumnDimension('A')->setWidth(14); // วันที่
        $colCount = !empty($this->data) ? count($this->data[0]) : 1;
        for ($i = 1; $i < $colCount; $i++) {
            $colLetter = chr(65 + $i); // B, C, D, ...
            if ($i < 26) {
                $sheet->getColumnDimension($colLetter)->setWidth(16);
            }
        }

        // === จัดกลาง ข้อมูลตัวเลข (คอลัมน์ B เป็นต้นไป) ===
        for ($i = 1; $i < $colCount; $i++) {
            $colLetter = chr(65 + $i);
            if ($i < 26) {
                for ($row = 2; $row <= $lastRow; $row++) {
                    $sheet->getStyle("{$colLetter}{$row}")->applyFromArray([
                        'alignment' => [
                            'horizontal' => Alignment::HORIZONTAL_CENTER,
                        ],
                    ]);
                }
            }
        }

        // === จัดกลาง คอลัมน์วันที่ ===
        $sheet->getStyle("A2:A{$lastRow}")->applyFromArray([
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);
    }

    public function columnFormats(): array
    {
        // Dynamic: format ตัวเลขสำหรับทุกคอลัมน์ (ยกเว้น A = วันที่)
        $formats = [];
        $colCount = !empty($this->data) ? count($this->data[0]) : 1;
        for ($i = 1; $i < $colCount && $i < 26; $i++) {
            $colLetter = chr(65 + $i);
            $formats[$colLetter] = NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1;
        }
        return $formats;
    }
}