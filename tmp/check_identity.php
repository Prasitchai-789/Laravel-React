<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$results = DB::connection('sqlsrv2')->select("
    SELECT name, is_identity
    FROM sys.columns
    WHERE object_id = OBJECT_ID('SOPlan')
    AND name = 'SOPID'
");

foreach ($results as $column) {
    echo "Column: {$column->name} | Is Identity: " . ($column->is_identity ? 'YES' : 'NO') . "\n";
}
