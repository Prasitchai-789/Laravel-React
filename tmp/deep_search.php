<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$date = '2026-03-06';
$custID = '1350';
$goodID = '2152';
$numberCar = '70-4021';
$amntLoad = 45;

echo "Searching for records with Date: $date, Cust: $custID, Good: $goodID, Car: $numberCar, Amnt: $amntLoad\n";

$all = DB::connection('sqlsrv2')->select("
    SELECT SOPID, SOPDate, CustID, GoodID, NumberCar, AmntLoad 
    FROM SOPlan 
    WHERE CustID = ? AND GoodID = ? AND CAST(SOPDate AS DATE) = ?
", [$custID, $goodID, $date]);

echo "Found " . count($all) . " records total for this date/cust/good.\n";
foreach ($all as $r) {
    echo "SOPID: " . ($r->SOPID === null ? 'NULL' : "'{$r->SOPID}'") . " | Car: {$r->NumberCar} | Amnt: {$r->AmntLoad} | Date: {$r->SOPDate}\n";
}

// Search by car specifically
echo "\nSearching specifically for car $numberCar on this date:\n";
$byCar = DB::connection('sqlsrv2')->select("
    SELECT SOPID, SOPDate, CustID, GoodID, NumberCar, AmntLoad 
    FROM SOPlan 
    WHERE NumberCar LIKE ? AND CAST(SOPDate AS DATE) = ?
", ["%$numberCar%", $date]);

foreach ($byCar as $r) {
    echo "SOPID: " . ($r->SOPID === null ? 'NULL' : "'{$r->SOPID}'") . " | Car: {$r->NumberCar} | Cust: {$r->CustID} | Amnt: {$r->AmntLoad}\n";
}
