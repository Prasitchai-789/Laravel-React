<?php
include __DIR__ . '/../vendor/autoload.php';
$app = include __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $request = Illuminate\Http\Request::create('/mar/plan-order/pending-coa', 'GET', ['type' => 'cpo']);
    $response = app()->handle($request);
    echo $response->getContent();
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
