<?php
$cwd = getcwd();
require $cwd . '/vendor/autoload.php';
$app = require_once $cwd . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Certificate;
use App\Models\MAR\SOPlan;

$coaToFind = 'CPO10007/2569';

echo "Searching for $coaToFind...\n\n";

// 1. Check Certificates table (React_Project_Old / sqlsrv)
$cert = Certificate::where('coa_number', $coaToFind)->first();
if ($cert) {
    echo "✅ FOUND in certificates table (React_Project_Old)!\n";
    echo json_encode($cert->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

    // Check if SOPID exists in SOPlan
    $plan = SOPlan::where('SOPID', $cert->SOPID)->first();
    if ($plan) {
        echo "Linked to SOPlan: {$plan->SOPID} - {$plan->GoodName}\n";
    } else {
        echo "⚠️ Linked SOPID {$cert->SOPID} NOT FOUND in SOPlan table.\n";
    }
} else {
    echo "❌ NOT FOUND in certificates table (React_Project_Old)!\n\n";
}

// 2. Let's do a wild card search just in case the format is slightly different
$wildcardCerts = Certificate::where('coa_number', 'like', '%10007%')->get();
if ($wildcardCerts->count() > 0) {
    echo "However, found these similar COA Numbers in certificates table:\n";
    foreach ($wildcardCerts as $wc) {
        echo "- {$wc->coa_number} (ID: {$wc->id}, SOPID: {$wc->SOPID})\n";
    }
    echo "\n";
}

// 3. Search SOPlan to see if maybe it's stored in a different column like Remarks?
$planWithRemark = SOPlan::where('Remarks', 'like', "%$coaToFind%")->orWhere('Status_coa', $coaToFind)->get();
if ($planWithRemark->count() > 0) {
    echo "Found '$coaToFind' mentioned in SOPlan table (WIN-React-Laravel):\n";
    foreach ($planWithRemark as $p) {
        echo "- SOPID: {$p->SOPID}, remarks/status: {$p->Remarks} / {$p->Status_coa}\n";
    }
}
