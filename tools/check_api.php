<?php
$cwd = getcwd();
require $cwd . '/vendor/autoload.php';
$app = require_once $cwd . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\MAR\SOPlanController;

$request = Request::create('/mar/plan-order/pending-coa?type=cpo', 'GET');
$controller = new SOPlanController();
$response = $controller->pendingCOA($request);

$content = json_decode($response->getContent(), true);

if ($content['success']) {
    $found = false;
    foreach ($content['data'] as $item) {
        if ($item['SOPID'] == '21629') {
            echo "✅ Found SOPID 21629 in API response!\n";
            echo json_encode($item, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
            $found = true;
            break;
        }
    }
    if (!$found) {
        echo "❌ SOPID 21629 NOT FOUND in API response.\n";
    }
} else {
    echo "API Error.\n";
}
