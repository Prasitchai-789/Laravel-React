<?php

namespace App\Exports;

use App\Models\WIN\ICStockDetail;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StoreExport implements FromCollection, WithHeadings, WithStyles
{
    public function collection()
    {
        return ICStockDetail::with('EMGood', 'GoodUnit')
            ->whereHas('EMGood', function($query) {
                $query->where('GoodCode', 'like', 'ST-SM%')
                      ->orWhere('GoodCode', 'like', 'ST-FP%')
                      ->orWhere('GoodCode', 'like', 'ST-EQ%')
                      ->orWhere('GoodCode', 'like', 'ST-EL%');
            })
            ->get()
            ->map(function ($item, $index) {
                return [
                    'id' => $index + 1,
                    'good_id' => $item->GoodID,
                    'good_code' => $item->EMGood->GoodCode ?? '',
                    'good_unit' => $item->GoodUnit->GoodUnitID ?? 'pcs',
                    'stock_qty' => $item->GoodStockQty ?? 0,
                    'safety_stock' => 0,
                    'price' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            });
    }

    public function headings(): array
    {
        return [
            'id',
            'good_id',
            'good_code',
            'good_unit',
            'stock_qty',
            'safety_stock',
            'price',
            'created_at',
            'updated_at',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1:J1')->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $sheet->getStyle('A1:J1')->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('00B7EB');
    }
}
