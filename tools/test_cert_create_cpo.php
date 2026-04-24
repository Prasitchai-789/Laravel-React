<?php
$cwd = getcwd();
require $cwd . '/vendor/autoload.php';
$app = require_once $cwd . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MAR\SOPlan;
use App\Models\Certificate;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\MAR\SOPlanController;
use Illuminate\Http\Request;
use Carbon\Carbon;

// Simulating CPO creation via SOPlanController
$request = new Request();
$request->merge([
    'receiveDate' => Carbon::now()->format('Y-m-d'),
    'goodID' => '2160',
    'goodName' => 'น้ำมันปาล์มดิบ A',
    'loadPlan' => '100',
    'custID' => '2022',
    'custName' => 'Test Customer',
    'destination' => 'Test Dest',
    'vehicles' => [
        [
            'numberCar' => 'TEST-CPO-1234',
            'driverName' => 'Mr. CPO'
        ]
    ]
]);

$controller = new SOPlanController();
$response = $controller->store($request);
if (method_exists($response, 'getContent')) {
    echo $response->getContent() . "\n";
} else {
    print_r($response);
}

// Fetch the most recently added SOPlan to get the SOPID
$latestPlan = SOPlan::orderByRaw('CAST(SOPID AS INT) DESC')->first();
echo "Latest SOPlan: {$latestPlan->SOPID} - {$latestPlan->GoodName}\n";

$certCount = Certificate::where('SOPID', $latestPlan->SOPID)->count();
echo "Certificate for SOPID {$latestPlan->SOPID}: " . ($certCount > 0 ? "EXISTS" : "DOES NOT EXIST") . "\n";
