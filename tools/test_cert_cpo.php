<?php
$cwd = getcwd();
require $cwd . '/vendor/autoload.php';
$app = require_once $cwd . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Certificate;

$today = \Carbon\Carbon::now()->format('Y-m-d');

// Fetch latest certificates
$latestCerts = Certificate::orderByRaw("TRY_CAST(id AS INT) DESC")->take(10)->get();

echo "Latest 10 Certificates:\n";
foreach ($latestCerts as $cert) {
    echo "- SOPID: {$cert->SOPID}, COA: {$cert->coa_number}, ID: {$cert->id}, FFA: {$cert->result_FFA}, Shell: {$cert->result_shell}, Created: {$cert->created_at}\n";
}
