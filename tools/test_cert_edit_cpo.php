<?php
$cwd = getcwd();
require $cwd . '/vendor/autoload.php';
$app = require_once $cwd . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Certificate;
use Illuminate\Http\Request;
use App\Http\Controllers\QAC\COA\COAController;

// 1. Fetch latest CPO records
$cert = Certificate::where('coa_number', 'LIKE', 'CPO%')->orderByRaw("TRY_CAST(id AS INT) DESC")->first();
if (!$cert) {
    echo "No CPO certs found.\n";
    exit;
}

echo "Found latest CPO cert: ID {$cert->id}, SOPID {$cert->SOPID}, COA {$cert->coa_number}\n";

// 2. Simulate editing the CPO number and sending it via the controller
$newCoaNumber = "CPO9999/2569";
$request = new Request([], [
    'SOPID' => $cert->SOPID,
    'coa_number' => $newCoaNumber,
    'coa_lot' => $cert->coa_lot,
    'tank' => '9',
    'ffa' => 5,
    'm_i' => 2,
    'iv' => 1,
    'dobi' => 3,
    'inspector' => 'System Tester'
], [], [], [], ['REQUEST_URI' => '/qac/coa/store', 'REQUEST_METHOD' => 'POST']);

$controller = new COAController();
$response = $controller->store($request);
if (method_exists($response, 'getContent')) {
    echo "Response: " . $response->getContent() . "\n";
} else {
    echo "Response: ";
    print_r($response);
}

// 3. Verify in DB
$updatedCert = Certificate::find($cert->id);
echo "DB Check -> COA: {$updatedCert->coa_number}, Tank: {$updatedCert->coa_tank}\n";

// 4. Revert
$updatedCert->coa_number = $cert->coa_number;
$updatedCert->coa_tank = $cert->coa_tank;
$updatedCert->result_FFA = $cert->result_FFA;
$updatedCert->result_moisture = $cert->result_moisture;
$updatedCert->result_IV = $cert->result_IV;
$updatedCert->result_dobi = $cert->result_dobi;
$updatedCert->save();
echo "Reverted to {$cert->coa_number}\n";
