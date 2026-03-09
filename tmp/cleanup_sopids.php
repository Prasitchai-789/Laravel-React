<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MAR\SOPlan;
use App\Models\Certificate;
use Illuminate\Support\Facades\DB;

DB::connection('sqlsrv2')->beginTransaction();
DB::connection('sqlsrv3')->beginTransaction();

try {
    // 1. Get current max numeric SOPID
    $maxSopId = (int) SOPlan::selectRaw('MAX(TRY_CAST(SOPID AS INT)) as max_id')->value('max_id') ?: 21589;
    echo "Current Max SOPID: $maxSopId\n";

    // 2. Find SOPlan records with NULL SOPID
    // Note: Since SOPID is part of the primary key in the Model but NULL in DB, 
    // we use raw query to be safe.
    $nullRecords = DB::connection('sqlsrv2')->select("SELECT * FROM SOPlan WHERE SOPID IS NULL ORDER BY SOPDate ASC");
    
    echo "Found " . count($nullRecords) . " records with NULL SOPID.\n";

    foreach ($nullRecords as $index => $record) {
        $newSopId = (string)($maxSopId + $index + 1);
        
        // Create synthetic ID that was used to link this record
        $dateKey = $record->SOPDate ? substr($record->SOPDate, 0, 10) : '0000-00-00';
        $carKey = trim($record->NumberCar ?: '-');
        $syntheticId = "P-{$dateKey}-{$record->CustID}-{$record->GoodID}-{$carKey}-" . (int)$record->AmntLoad;

        echo "Processing Record: SyntheticID=$syntheticId -> NewSOPID=$newSopId\n";

        // Update SOPlan record
        // We need to use a where clause that uniquely identifies the row since SOPID is NULL
        $affectedSoplan = DB::connection('sqlsrv2')->table('SOPlan')
            ->whereNull('SOPID')
            ->where('SOPDate', $record->SOPDate)
            ->where('CustID', $record->CustID)
            ->where('GoodID', $record->GoodID)
            ->where('NumberCar', $record->NumberCar)
            ->where('AmntLoad', $record->AmntLoad)
            ->update(['SOPID' => $newSopId]);

        if ($affectedSoplan > 0) {
            echo "  - Updated SOPlan: $affectedSoplan row(s)\n";
            
            // Update Certificate record if it exists with the synthetic ID
            $affectedCert = DB::connection('sqlsrv3')->table('certificates')
                ->where('SOPID', $syntheticId)
                ->update(['SOPID' => $newSopId]);
            
            if ($affectedCert > 0) {
                echo "  - Updated Certificate: $affectedCert row(s)\n";
            } else {
                echo "  - No matching certificate found for $syntheticId\n";
            }
        } else {
            echo "  - Failed to update SOPlan record!\n";
        }
    }

    DB::connection('sqlsrv2')->commit();
    DB::connection('sqlsrv3')->commit();
    echo "\nCleanup completed successfully.\n";

} catch (\Exception $e) {
    DB::connection('sqlsrv2')->rollBack();
    DB::connection('sqlsrv3')->rollBack();
    echo "\nError during cleanup: " . $e->getMessage() . "\n";
}
