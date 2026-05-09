<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Routing\Route as LaravelRoute;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class ApiSummaryController extends Controller
{
    public function index(Request $request): Response
    {
        $routes = collect(Route::getRoutes())
            ->map(fn (LaravelRoute $route) => $this->formatRoute($route))
            ->filter()
            ->sortBy(fn (array $route) => "{$route['group']}|{$route['uri']}|{$route['name']}")
            ->values();

        return Inertia::render('Admin/ApiSummary', [
            'apiRoutes' => $routes,
            'groups' => $routes->pluck('group')->unique()->values(),
            'summary' => [
                'total' => $routes->count(),
                'get' => $routes->filter(fn ($route) => in_array('GET', $route['methods'], true))->count(),
                'write' => $routes->filter(fn ($route) => count(array_diff($route['methods'], ['GET'])) > 0)->count(),
            ],
        ]);
    }

    private function formatRoute(LaravelRoute $route): ?array
    {
        $uri = trim($route->uri(), '/');

        if (!$this->isApiUri($uri)) {
            return null;
        }

        $methods = array_values(array_filter($route->methods(), fn (string $method) => $method !== 'HEAD'));
        $actionName = $route->getActionName();
        [$controller, $action] = $this->splitAction($actionName);
        $name = $route->getName() ?: $this->humanize($action ?: $uri);

        return [
            'methods' => $methods,
            'uri' => '/' . $uri,
            'name' => $name,
            'group' => $this->groupFromUri($uri),
            'description' => $this->describe($uri, $controller, $action),
            'controller' => $controller,
            'action' => $action,
            'parameters' => $route->parameterNames(),
            'query_hints' => $this->queryHints($uri, $action),
            'middleware' => $this->visibleMiddleware($route),
        ];
    }

    private function isApiUri(string $uri): bool
    {
        return preg_match('#(^|/)api($|/)#', $uri) === 1;
    }

    private function splitAction(string $actionName): array
    {
        if ($actionName === 'Closure' || !str_contains($actionName, '@')) {
            return [$actionName, null];
        }

        [$controller, $action] = explode('@', $actionName, 2);

        return [class_basename($controller), $action];
    }

    private function groupFromUri(string $uri): string
    {
        $segments = explode('/', $uri);
        $apiIndex = array_search('api', $segments, true);

        if ($apiIndex === 0) {
            return $segments[1] ?? 'general';
        }

        if ($apiIndex !== false) {
            return $segments[0] ?: 'general';
        }

        return 'general';
    }

    private function describe(string $uri, ?string $controller, ?string $action): string
    {
        $descriptions = [
            'api/executive/production-report' => 'ดึงรายงานการผลิตผู้บริหาร แยก CPO, kernel, shell, fiber พร้อมปริมาณ, yield, ราคา และมูลค่า',
            'api/executive/soplan-report' => 'ดึงแผนขาย/แผนโหลดสินค้าเพื่อใช้ในหน้ารายงานผู้บริหาร',
            'api/executive/production-summary' => 'ดึงสรุปผลผลิตรวมและตัวชี้วัดการผลิตตามช่วงวันที่',
            'api/executive/cpo-summary' => 'ดึงสรุป CPO เช่น stock ล่าสุด, % yield น้ำหนัก, yield oil room และปริมาณแยกแทงค์',
            'api/executive/purchase-summary' => 'ดึงสรุปการรับซื้อผลปาล์ม เช่น ปริมาณ ราคาเฉลี่ย และยอดรวมตามช่วงวันที่',
            'api/purchase/poinv-dashboard' => 'ดึง dashboard ใบรับซื้อ/PO Invoice พร้อมยอดรวมและแนวโน้ม',
            'api/purchase/summary' => 'ดึงสรุปการจัดซื้อรายช่วงวันที่สำหรับ card/dashboard',
            'api/purchase/detailed-report' => 'ดึงรายงานจัดซื้อแบบละเอียดสำหรับตารางและการวิเคราะห์',
            'api/purchase/poinv-summary' => 'ดึงยอดสรุป PO Invoice จากระบบ WIN',
            'api/purchase/poinv-monthly' => 'ดึงยอด PO Invoice รายเดือนเพื่อทำกราฟหรือสรุปรายเดือน',
            'api/purchase/order-forecast' => 'ดึงข้อมูลคาดการณ์คำสั่งซื้อและวัตถุดิบที่ต้องใช้',
            'api/purchase/po-list' => 'ดึงรายการใบสั่งซื้อพร้อมเงื่อนไขกรอง',
            'api/purchase/poinv-chart' => 'ดึงข้อมูลกราฟ PO Invoice',
            'api/sales/summary-card' => 'ดึงยอดขายสำหรับ summary card เช่น ยอดขาย ปริมาณ และค่าเฉลี่ย',
            'api/sales/detailed-summary' => 'ดึงสรุปยอดขายแบบละเอียดสำหรับหน้ารายงานการขาย',
            'api/sales/top-customers' => 'ดึงอันดับลูกค้ายอดขายสูงสุด',
            'api/financial/accounts' => 'ดึงยอดบัญชี/งบทดลองสำหรับหน้าการเงิน',
            'api/stock/valuation-summary' => 'ดึงสรุปมูลค่าสต๊อกสินค้าและยอดคงเหลือ',
            'api/stock/cpo-supply-dashboard' => 'ดึงข้อมูล supply CPO, stock, forecast และตัวชี้วัดที่เกี่ยวข้อง',
            'api/qac/mill-daily-data' => 'ดึงข้อมูลรายงานการผลิตประจำวันของ QAC/Mill Daily',
            'api/qac/mill-daily-additional' => 'บันทึกข้อมูลเพิ่มเติมของรายงาน Mill Daily',
            'yield-report/api' => 'ดึงข้อมูลรายงาน % Yield แบบรายงาน',
            'yield-table/api' => 'ดึงข้อมูลตาราง % Yield รายวัน/รายเดือน',
            'cpo/api' => 'ดึงรายการบันทึก CPO และข้อมูลคุณภาพ/ปริมาณน้ำมันปาล์มดิบ',
            'skim-mix/api' => 'ดึงรายการบันทึก Skim/Mix',
            'stock/kernel/api' => 'ดึงข้อมูล stock kernel จาก silo record',
            'stock/by-products/api' => 'ดึงข้อมูล stock สินค้า by-product เช่น shell, fiber หรือรายการที่เกี่ยวข้อง',
            'stock/productions/api' => 'ดึงข้อมูลปริมาณการผลิตสินค้า by-product',
            'stock/sales/api' => 'ดึงข้อมูลยอดขายสินค้า stock/by-product',
            'api/patrol/checkpoints' => 'ดึงจุดตรวจ QR สำหรับงาน patrol',
            'api/patrol/logs' => 'ดึงประวัติการตรวจพื้นที่ patrol',
            'api/patrol/scan' => 'บันทึกผลการสแกน QR patrol',
            'api/patrol/admin/checkpoints' => 'จัดการจุดตรวจ QR สำหรับผู้ดูแลระบบ',
            'api/monitoring/devices' => 'ดึงรายการอุปกรณ์ monitoring และสถานะล่าสุด',
            'api/monitoring/dashboard/overview' => 'ดึงภาพรวม monitoring สำหรับ dashboard',
            'api/monitoring/dashboard/status' => 'ดึงสถานะระบบ monitoring',
            'api/monitoring/dashboard/map' => 'ดึงข้อมูลแผนที่ของอุปกรณ์ monitoring',
            'api/monitoring/agent/report' => 'รับข้อมูล report จาก agent monitoring',
            'api/employees' => 'ดึงรายชื่อพนักงานสำหรับเลือกผู้ใช้หรือผูกบัญชี',
        ];

        if (isset($descriptions[$uri])) {
            return $descriptions[$uri];
        }

        return $this->inferDescription($uri, $controller, $action);
    }

    private function inferDescription(string $uri, ?string $controller, ?string $action): string
    {
        $target = $this->humanize($this->groupFromUri($uri));

        if (!$action) {
            return "เส้น API สำหรับ {$target}";
        }

        if (str_starts_with($action, 'get')) {
            return 'ดึงข้อมูล ' . $this->humanize(substr($action, 3)) . " สำหรับ {$target}";
        }

        if (str_starts_with($action, 'api')) {
            return 'ดึงข้อมูล ' . $this->humanize(substr($action, 3)) . " สำหรับ {$target}";
        }

        if (str_starts_with($action, 'store') || str_starts_with($action, 'save')) {
            return "บันทึกข้อมูล {$target}";
        }

        if (str_starts_with($action, 'update')) {
            return "แก้ไขข้อมูล {$target}";
        }

        if (str_starts_with($action, 'destroy') || str_starts_with($action, 'delete')) {
            return "ลบข้อมูล {$target}";
        }

        if ($controller) {
            return "เส้น API ของ {$controller} สำหรับ " . $this->humanize($action);
        }

        return "เส้น API สำหรับ {$target}";
    }

    private function queryHints(string $uri, ?string $action): array
    {
        $hints = [];
        $text = strtolower($uri . ' ' . ($action ?? ''));

        if (str_contains($text, 'summary') || str_contains($text, 'report') || str_contains($text, 'dashboard') || str_contains($text, 'forecast')) {
            $hints[] = 'start_date';
            $hints[] = 'end_date';
        }

        if (str_contains($text, 'monthly') || str_contains($text, 'yield-table')) {
            $hints[] = 'month';
        }

        if (str_contains($text, 'good') || str_contains($text, 'purchase')) {
            $hints[] = 'good_id';
        }

        if (str_contains($text, 'search') || str_contains($text, 'list') || str_contains($text, 'logs')) {
            $hints[] = 'search';
        }

        return array_values(array_unique($hints));
    }

    private function visibleMiddleware(LaravelRoute $route): array
    {
        return collect($route->gatherMiddleware())
            ->filter(fn ($middleware) => str_starts_with($middleware, 'auth') || str_starts_with($middleware, 'permission'))
            ->values()
            ->all();
    }

    private function humanize(string $value): string
    {
        $value = preg_replace('/(?<!^)[A-Z]/', ' $0', $value) ?? $value;
        $value = str_replace(['-', '_', '.', '/'], ' ', $value);

        return trim(preg_replace('/\s+/', ' ', $value) ?? $value);
    }
}
