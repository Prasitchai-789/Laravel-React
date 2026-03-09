<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$results = DB::connection('sqlsrv2')->select("
    SELECT name, definition
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('SOPlan')
");

echo "Check Constraints:\n";
foreach ($results as $r) {
    echo "Name: {$r->name} | Def: {$r->definition}\n";
}

$triggers = DB::connection('sqlsrv2')->select("
    SELECT name
    FROM sys.triggers
    WHERE parent_id = OBJECT_ID('SOPlan')
");

echo "\nTriggers:\n";
foreach ($triggers as $t) {
    echo "Name: {$t->name}\n";
}
