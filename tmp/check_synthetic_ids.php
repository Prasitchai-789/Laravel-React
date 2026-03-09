<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MAR\SOPlan;
use App\Models\Certificate;
use Illuminate\Support\Facades\DB;

$pCountSOPlan = SOPlan::where('SOPID', 'like', 'P-%')->count();
echo "SOPlan records with P- prefix in SOPID: $pCountSOPlan\n";

$pCountCert = Certificate::where('SOPID', 'like', 'P-%')->count();
echo "Certificate records with P- prefix in SOPID: $pCountCert\n";

if ($pCountCert > 0) {
    $recentP = Certificate::where('SOPID', 'like', 'P-%')->orderBy('id', 'DESC')->limit(5)->get();
    foreach ($recentP as $c) {
        echo "Cert ID: {$c->id}, SOPID: {$c->SOPID}, COA: {$c->coa_number}\n";
    }
}
