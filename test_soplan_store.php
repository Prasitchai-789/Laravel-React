<?php
$cwd = getcwd();
require $cwd . '/vendor/autoload.php';
$app = require_once $cwd . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\MAR\SOPlanController;
use Illuminate\Http\Request;
use Carbon\Carbon;

$request = new Request();
$request->merge([
    'receiveDate' => Carbon::now()->format('Y-m-d'),
    'goodID' => '2152',
    'goodName' => 'เมล็ดในปาล์ม',
    'loadPlan' => '100',
    'custID' => '2022',
    'custName' => 'Test Customer',
    'destination' => 'Test Dest',
    'vehicles' => [
        [
            'numberCar' => 'TEST-1234',
            'driverName' => 'Mr. Test'
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
