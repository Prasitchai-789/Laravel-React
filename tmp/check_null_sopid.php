<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MAR\SOPlan;
use Illuminate\Support\Facades\DB;

$nullCount = SOPlan::whereNull('SOPID')->count();
echo "Total NULL SOPID records: $nullCount\n";

if ($nullCount > 0) {
    $recentNulls = SOPlan::whereNull('SOPID')->orderBy('SOPDate', 'DESC')->limit(10)->get();
    foreach ($recentNulls as $s) {
        echo "Row: Date={$s->SOPDate}, GoodName={$s->GoodName}, Car={$s->NumberCar}, Amnt={$s->AmntLoad}\n";
    }
}
