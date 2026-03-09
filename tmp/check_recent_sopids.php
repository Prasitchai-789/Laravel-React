<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$results = DB::connection('sqlsrv2')->select("
    SELECT TOP 20 SOPID, SOPDate, NumberCar 
    FROM SOPlan 
    ORDER BY SOPDate DESC
");

echo "Latest 20 SOPlan records:\n";
foreach ($results as $r) {
    echo "SOPID: " . ($r->SOPID === null ? 'NULL' : "'{$r->SOPID}'") . " | Date: {$r->SOPDate} | Car: {$r->NumberCar}\n";
}
