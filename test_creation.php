<?php
$cwd = getcwd();
require $cwd . '/vendor/autoload.php';
$app = require_once $cwd . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\MAR\SOPlanController;
use App\Models\Certificate;
use App\Models\MAR\SOPlan;

$requestCpo = Request::create('/mar/plan-order', 'POST', [
    'receiveDate' => now()->format('Y-m-d'),
    'goodID' => 'TEST01',
    'goodName' => 'น้ำมันปาล์มดิบ',
    'loadPlan' => 10,
    'custID' => 'TESTCUST',
    'custName' => 'Test CPO Customer',
    'destination' => 'Test CPO Dest',
    'vehicles' => [
        ['numberCar' => 'TEST-CPO-CAR', 'driverName' => 'Driver CPO']
    ]
]);

$controller = new SOPlanController();
$resCpo = $controller->store($requestCpo);
echo "CPO Creation Response: " . $resCpo->getContent() . "\n";

$requestKn = Request::create('/mar/plan-order', 'POST', [
    'receiveDate' => now()->format('Y-m-d'),
    'goodID' => 'TEST02',
    'goodName' => 'เมล็ดในปาล์ม',
    'loadPlan' => 10,
    'custID' => 'TESTCUST',
    'custName' => 'Test KN Customer',
    'destination' => 'Test KN Dest',
    'vehicles' => [
        ['numberCar' => 'TEST-KN-CAR', 'driverName' => 'Driver KN']
    ]
]);

$resKn = $controller->store($requestKn);
echo "KN Creation Response: " . $resKn->getContent() . "\n";

$latestCerts = Certificate::orderBy('id', 'desc')->take(2)->get();
foreach ($latestCerts as $c) {
    echo "Created cert: " . $c->coa_number . " for SOPID " . $c->SOPID . "\n";
}

// Clean up
$sops = SOPlan::whereIn('SOPID', $latestCerts->pluck('SOPID'))->delete();
$latestCerts->each->delete();

