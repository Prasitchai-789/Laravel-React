<?php
include __DIR__ . '/../vendor/autoload.php';
$app = include __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $res = DB::connection('sqlsrv2')->select("
        SELECT SOPID, GoodName, GoodID 
        FROM SOPlan 
        WHERE SOPID = '21606'
    ");
    print_r($res);
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
