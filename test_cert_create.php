<?php
$cwd = getcwd();
require $cwd . '/vendor/autoload.php';
$app = require_once $cwd . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MAR\SOPlan;
use App\Models\Certificate;
use Illuminate\Support\Facades\DB;

try {
    $now = now();
    $yearBE = $now->year + 543;
    $month = $now->format('m');
    $year2 = substr($yearBE, -2);
    $prefix = 'KN'; // Assume Seed

    $latestCert = Certificate::where('coa_number', 'like', "%/{$yearBE}")
        ->selectRaw("MAX(TRY_CAST(REPLACE(REPLACE(SUBSTRING(coa_number, 1, CHARINDEX('/', coa_number) - 1), 'CPO', ''), 'KN', '') AS INT)) as max_seq")
        ->first();
    $certBaseSeq = ($latestCert && $latestCert->max_seq) ? (int) $latestCert->max_seq : 0;

    $maxId = Certificate::max(DB::raw('TRY_CAST(id as INT)')) ?? 0;
    $idBaseSeq = (int) $maxId;

    $seq = $certBaseSeq + 1;
    $certId = (string) ($idBaseSeq + 1);

    $coaNumber = $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT) . "/{$yearBE}";
    $coaLot = 'QAC' . $year2 . $month . str_pad($seq, 4, '0', STR_PAD_LEFT);

    // Mock an SOPID
    $sopId = 999999;

    $certData = [
        'id' => $certId,
        'SOPID' => (string) $sopId,
        'date_coa' => $now->format('Y-m-d H:i:s.v'),
        'coa_number' => $coaNumber,
        'coa_lot' => $coaLot,
        'coa_tank' => '-',
        'status' => 'pending',
        'created_at' => $now->format('d/m/Y H:i:s'),
        'updated_at' => $now->format('d/m/Y H:i:s'),
        'spec_shell' => '< 10.00 %',
        'spec_kn_moisture' => '< 8.00 %'
    ];

    echo "Attempting to create Certificate with data:\n";
    print_r($certData);

    Certificate::create($certData);

    echo "Successfully created Certificate test record.\n";
    // Cleanup
    Certificate::where('SOPID', (string) $sopId)->delete();

} catch (\Exception $e) {
    echo "ERROR CREATING CERTIFICATE:\n";
    echo $e->getMessage() . "\n";
}
