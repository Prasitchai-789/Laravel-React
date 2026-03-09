<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MAR\SOPlan;
use Illuminate\Support\Facades\DB;

$date = '2026-03-06';
$custID = '1350';
$goodID = '2152';
$numberCar = '70-4021';
$amntLoad = 45;

$records = SOPlan::whereDate('SOPDate', $date)
    ->where('CustID', $custID)
    ->where('GoodID', $goodID)
    // ->where('NumberCar', 'like', "%$numberCar%") // อาจจะมีการตัดช่องว่าง
    ->where('AmntLoad', $amntLoad)
    ->get();

echo "Found " . $records->count() . " records.\n";
foreach ($records as $r) {
    echo "SOPID: " . ($r->SOPID === null ? 'NULL' : "'{$r->SOPID}'") . " | Date: {$r->SOPDate} | Car: {$r->NumberCar} | Amnt: {$r->AmntLoad}\n";
}

// Check raw DB for more insight
$raw = DB::connection('sqlsrv2')->select("SELECT TOP 10 SOPID, SOPDate, CustID, GoodID, NumberCar, AmntLoad FROM SOPlan WHERE SOPDate >= ? AND SOPDate < ? AND CustID = ?", [$date . ' 00:00:00', $date . ' 23:59:59', $custID]);
echo "\nRaw DB Query Results (All for this customer on this date):\n";
foreach ($raw as $r) {
    echo "SOPID: " . ($r->SOPID === null ? 'NULL' : "'{$r->SOPID}'") . " | Date: {$r->SOPDate} | Car: {$r->NumberCar} | Amnt: {$r->AmntLoad}\n";
}
