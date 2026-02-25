<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Certificate;
use App\Models\MAR\SOPlan;

// Simulate fixed controller - using plain PHP array
$selectedYear = 2026;
$mapped = [];
$sopids = [];

$query = SOPlan::select('SOPlan.SOPID', 'SOPlan.SOPDate', 'SOPlan.GoodName', 'SOPlan.Status_coa')
    ->whereRaw('YEAR(TRY_CONVERT(DATE, SOPDate, 103)) = ?', [$selectedYear])
    ->orderByRaw('ISNULL(TRY_CAST(SOPlan.SOPID AS INT), 0) DESC');

foreach ($query->cursor() as $s) {
    $name = strtolower(($s->GoodName ?? ''));
    $type = 'other';
    if (str_contains($name, 'เมล็ด') || str_contains($name, 'kernel'))
        $type = 'palm-kernel';
    elseif (str_contains($name, 'cpo') || str_contains($name, 'น้ำมันปาล์มดิบ'))
        $type = 'cpo';

    if (!in_array($type, ['palm-kernel', 'cpo']))
        continue;

    $sopids[] = $s->SOPID;
    $mapped[] = ['SOPID' => $s->SOPID, 'GoodName' => $s->GoodName, 'type' => $type, 'coa_number' => null];
}

// NEW FIX: Use plain PHP array
if (!empty($sopids)) {
    $certs = [];
    foreach (array_chunk($sopids, 1000) as $chunk) {
        $chunkResult = Certificate::whereIn('SOPID', $chunk)->pluck('coa_number', 'SOPID');
        foreach ($chunkResult as $sopId => $coaNumber) {
            $certs[(string) $sopId] = $coaNumber;
        }
    }
    foreach ($mapped as &$item) {
        $item['coa_number'] = $certs[(string) $item['SOPID']] ?? null;
    }
    unset($item);
}

echo "=== FIXED RESULT (first 10): ===\n";
$count = 0;
foreach ($mapped as $m) {
    echo "SOPID:{$m['SOPID']} | " . ($m['coa_number'] ?? 'NULL') . "\n";
    if (++$count >= 10)
        break;
}
$withCoa = array_filter($mapped, fn($m) => !empty($m['coa_number']));
$withoutCoa = array_filter($mapped, fn($m) => empty($m['coa_number']));
echo "\nTotal: " . count($mapped) . " | With coa_number: " . count($withCoa) . " | Without: " . count($withoutCoa) . "\n";
