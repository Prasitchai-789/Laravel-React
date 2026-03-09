<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$results = DB::connection('sqlsrv2')->select("
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'SOPlan'
");

foreach ($results as $column) {
    echo "Column: {$column->COLUMN_NAME} | Type: {$column->DATA_TYPE} | Nullable: {$column->IS_NULLABLE} | Default: {$column->COLUMN_DEFAULT}\n";
}

$pk = DB::connection('sqlsrv2')->select("
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE OBJECT_PROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + CONSTRAINT_NAME), 'IsPrimaryKey') = 1
    AND TABLE_NAME = 'SOPlan'
");

echo "\nPrimary Key(s):\n";
foreach ($pk as $p) {
    echo "{$p->COLUMN_NAME}\n";
}
