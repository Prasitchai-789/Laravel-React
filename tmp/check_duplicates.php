<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Certificate;
use Illuminate\Support\Facades\DB;

$conn = 'sqlsrv3';

$duplicates = DB::connection($conn)->table('certificates')
    ->select('coa_number', DB::raw('count(*) as count'))
    ->whereNotNull('coa_number')
    ->where('coa_number', '!=', '-')
    ->groupBy('coa_number')
    ->havingRaw('count(*) > 1')
    ->get();

echo "Duplicate COA numbers found in $conn: " . count($duplicates) . "\n";
foreach ($duplicates as $d) {
    echo "COA: {$d->coa_number}, Count: {$d->count}\n";
    $certs = Certificate::where('coa_number', $d->coa_number)->get();
    foreach ($certs as $c) {
        echo "  - ID: {$c->id}, SOPID: {$c->SOPID}, Created: {$c->created_at}\n";
    }
}

$orphans = DB::connection($conn)->table('certificates')
    // We can't easily join across connections in SQL Server without fully qualified names
    // so we'll just check if SOPID is numeric or not as a proxy, or do a manual check.
    ->get();

$orphanCount = 0;
foreach($orphans as $c) {
    if (!\App\Models\MAR\SOPlan::where('SOPID', $c->SOPID)->exists()) {
        $orphanCount++;
    }
}
echo "Orphaned certificates (no matching SOPlan): $orphanCount\n";
