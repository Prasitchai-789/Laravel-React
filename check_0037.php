<?php
$cwd = getcwd();
require $cwd . '/vendor/autoload.php';
$app = require_once $cwd . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Certificate;
use App\Models\MAR\SOPlan;

$cert = Certificate::where('coa_number', 'LIKE', '%0037/2569%')->first();
if ($cert) {
    echo "Found Cert ID: {$cert->id}\n";
    echo "COA Number: {$cert->coa_number}\n";
    echo "SOPID: {$cert->SOPID}\n";

    $plan = SOPlan::where('SOPID', $cert->SOPID)->first();
    if ($plan) {
        echo "Linked to SOPlan GoodName: {$plan->GoodName}\n";
    } else {
        echo "No SOPlan found for this SOPID.\n";
    }
} else {
    echo "Could not find any cert matching '0037/2569'.\n";
}
