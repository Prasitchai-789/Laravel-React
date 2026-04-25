<?php

namespace App\Console\Commands;

use App\Models\WaterUsageReport;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ImportWaterUsageReports extends Command
{
    protected $signature = 'water-usage:import
        {path : Path to the Excel file}
        {--sheet= : Sheet name to import}
        {--start-row=5 : First data row}
        {--end-row= : Last data row}
        {--dry-run : Preview import without writing to database}';

    protected $description = 'Import water usage reports from an Excel file';

    public function handle(): int
    {
        $path = (string) $this->argument('path');

        if (! is_file($path)) {
            $this->error("File not found: {$path}");

            return self::FAILURE;
        }

        if (! Schema::hasColumns('water_usage_reports', [
            'wastewater_meter_before',
            'wastewater_meter_after',
            'water_treatment_meter_before',
            'water_treatment_meter_after',
            'water_treatment_volume',
            'sludge_weight_kg',
            'em_usage_liter',
            'molasses_usage_liter',
        ])) {
            $this->error('water_usage_reports is missing meter columns. Please run php artisan migrate first.');

            return self::FAILURE;
        }

        $spreadsheet = IOFactory::load($path);
        $sheet = $this->resolveSheet($spreadsheet);
        $startRow = max(1, (int) $this->option('start-row'));
        $endRow = $this->option('end-row') ? (int) $this->option('end-row') : $sheet->getHighestRow();
        $dryRun = (bool) $this->option('dry-run');
        $columns = $this->resolveColumns($sheet);

        $created = 0;
        $updated = 0;
        $skipped = 0;

        for ($row = $startRow; $row <= $endRow; $row++) {
            $reportDate = $this->parseThaiDate($sheet->getCell("A{$row}")->getFormattedValue());

            if (! $reportDate) {
                $skipped++;
                continue;
            }

            if (! $this->hasCompleteMeterReadings($sheet, $row)) {
                $skipped++;
                continue;
            }

            $data = [
                'report_date' => $reportDate,
                'wastewater_meter_before' => $this->number($sheet, "C{$row}"),
                'wastewater_meter_after' => $this->number($sheet, "D{$row}"),
                'water_treatment_meter_before' => $this->number($sheet, "F{$row}"),
                'water_treatment_meter_after' => $this->number($sheet, "G{$row}"),
                'sludge_weight_kg' => $columns['sludge'] ? $this->number($sheet, "{$columns['sludge']}{$row}") : 0,
                'em_usage_liter' => $columns['em'] ? $this->number($sheet, "{$columns['em']}{$row}") : 0,
                'molasses_usage_liter' => $columns['molasses'] ? $this->number($sheet, "{$columns['molasses']}{$row}") : 0,
                'note' => $columns['note'] ? $this->note($sheet, "{$columns['note']}{$row}") : null,
            ];
            $data['wastewater_volume'] = $this->calculateUsage($data['wastewater_meter_before'], $data['wastewater_meter_after']);
            $data['water_treatment_volume'] = $this->calculateUsage($data['water_treatment_meter_before'], $data['water_treatment_meter_after']);
            $data['raw_water_volume'] = $data['water_treatment_volume'];

            $exists = WaterUsageReport::query()
                ->whereDate('report_date', $reportDate)
                ->exists();

            if ($dryRun) {
                $this->line(sprintf(
                    '[%s] %s wastewater=%s treatment=%s EM=%s molasses=%s note=%s',
                    $exists ? 'UPDATE' : 'CREATE',
                    $reportDate,
                    number_format($data['wastewater_volume'], 2),
                    number_format($data['water_treatment_volume'], 2),
                    number_format($data['em_usage_liter'], 2),
                    number_format($data['molasses_usage_liter'], 2),
                    $data['note'] ?? '-',
                ));
            } else {
                WaterUsageReport::query()->updateOrCreate(
                    ['report_date' => $reportDate],
                    $data,
                );
            }

            $exists ? $updated++ : $created++;
        }

        $this->info(($dryRun ? 'Dry run complete.' : 'Import complete.'));
        $this->table(['Created', 'Updated', 'Skipped'], [[$created, $updated, $skipped]]);

        return self::SUCCESS;
    }

    private function resolveSheet(\PhpOffice\PhpSpreadsheet\Spreadsheet $spreadsheet): Worksheet
    {
        $sheetName = $this->option('sheet');

        if ($sheetName) {
            $sheet = $spreadsheet->getSheetByName((string) $sheetName);

            if (! $sheet) {
                throw new \InvalidArgumentException("Sheet not found: {$sheetName}");
            }

            return $sheet;
        }

        return $spreadsheet->getActiveSheet();
    }

    private function parseThaiDate(string $value): ?string
    {
        $date = trim($value);

        if (! preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $date, $matches)) {
            return null;
        }

        $month = (int) $matches[1];
        $day = (int) $matches[2];
        $year = (int) $matches[3];

        if ($year > 2400) {
            $year -= 543;
        }

        return Carbon::createFromDate($year, $month, $day)->toDateString();
    }

    private function resolveColumns(Worksheet $sheet): array
    {
        return [
            'sludge' => $this->findColumnByHeader($sheet, ['ตะกอน']),
            'em' => $this->findColumnByHeader($sheet, ['EM']),
            'molasses' => $this->findColumnByHeader($sheet, ['กากน้ำตาล']),
            'note' => $this->findColumnByHeader($sheet, ['หมายเหตุ']),
        ];
    }

    private function findColumnByHeader(Worksheet $sheet, array $needles): ?string
    {
        $highestColumn = $sheet->getHighestColumn();
        $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);

        for ($columnIndex = 1; $columnIndex <= $highestColumnIndex; $columnIndex++) {
            $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex);
            $header = $this->normalizeHeader($sheet->getCell("{$column}3")->getFormattedValue())
                . $this->normalizeHeader($sheet->getCell("{$column}4")->getFormattedValue());

            foreach ($needles as $needle) {
                if (str_contains($header, $needle)) {
                    return $column;
                }
            }
        }

        return null;
    }

    private function hasCompleteMeterReadings(Worksheet $sheet, int $row): bool
    {
        foreach (['C', 'D', 'F', 'G'] as $column) {
            $value = $sheet->getCell("{$column}{$row}")->getCalculatedValue();

            if ($value === null || trim((string) $value) === '') {
                return false;
            }
        }

        return true;
    }

    private function note(Worksheet $sheet, string $cell): ?string
    {
        $note = trim((string) $sheet->getCell($cell)->getFormattedValue());

        return $note !== '' ? $note : null;
    }

    private function normalizeHeader(string $value): string
    {
        return preg_replace('/\s+/u', '', trim($value)) ?? '';
    }

    private function number(Worksheet $sheet, string $cell): float
    {
        $value = $sheet->getCell($cell)->getCalculatedValue();

        if ($value === null || $value === '') {
            return 0;
        }

        return round((float) str_replace(',', '', (string) $value), 2);
    }

    private function calculateUsage(float $before, float $after): float
    {
        return round(max(0, $after - $before), 2);
    }
}
