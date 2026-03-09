<?php
include __DIR__ . '/../vendor/autoload.php';
$app = include __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $res = DB::connection('sqlsrv3')->select("
        SELECT TOP 10 SOPID, coa_number, created_at 
        FROM certificates 
        ORDER BY TRY_CAST(id AS INT) DESC
    ");
    print_r($res);
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
