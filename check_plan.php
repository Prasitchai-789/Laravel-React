<?php
$cwd = getcwd();
require $cwd . '/vendor/autoload.php';
$app = require_once $cwd . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MAR\SOPlan;

$plan = SOPlan::where('SOPID', '21629')->first();
if ($plan) {
    echo json_encode($plan->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
    $dateExpr = \Illuminate\Support\Facades\DB::connection('sqlsrv2')->select("SELECT CAST('{$plan->SOPDate}' AS DATE) as converted_date");
    echo "Converted date: " . $dateExpr[0]->converted_date . "\n";
} else {
    echo "Plan not found\n";
}
