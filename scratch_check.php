<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MAR\Order;
use App\Models\MAR\DeliveryPlanItem;

$order = Order::where('product', 'น้ำมันปาล์มดิบ')->where('is_completed', 0)->first();
if ($order) {
    echo "Order ID: " . $order->id . "\n";
    echo "Order Qty: " . $order->quantity . "\n";
    echo "Total Planned (from withSum mock): " . $order->deliveryPlanItems()->sum('quantity') . "\n";
    $item = $order->deliveryPlanItems()->first();
    if ($item) {
        echo "Item Qty Sample: " . $item->quantity . "\n";
    }
} else {
    echo "No active orders found for CPO\n";
}
