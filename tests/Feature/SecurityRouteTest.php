<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityRouteTest extends TestCase
{
    /**
     * Test that guests cannot access important routes.
     *
     * @return void
     */
    public function test_guests_cannot_access_important_routes()
    {
        // delivery plan update (POST /api/delivery-plan/update)
        $this->postJson('/api/delivery-plan/update', [])
             ->assertUnauthorized();

        // patrol admin (GET /api/patrol/admin/checkpoints)
        $this->getJson('/api/patrol/admin/checkpoints')
             ->assertUnauthorized();

        // store status (PUT /store-orders/1/status)
        $this->putJson('/store-orders/1/status', [])
             ->assertUnauthorized();

        // fertilizer delete (DELETE /fertilizer/productions/1)
        $this->deleteJson('/fertilizer/productions/1')
             ->assertUnauthorized();
    }

    /**
     * Test that guests cannot access dashboard and report routes.
     *
     * @return void
     */
    public function test_guests_cannot_access_dashboard_and_report_routes()
    {
        $routes = [
            '/dashboard',
            '/monitoring/dashboard',
            '/production-dashboard',
            '/palm/dashboard',
            '/cost-analysis/dashboard',
            '/purchase/dashboard',
            '/purchase/po-invoice-dashboard',
            '/sales/dashboard',
            '/stock/cpo-supply-dashboard',
            '/market/palm-price-report',
            '/qac/mill-daily-report',
            '/stock/report',
            '/stock/production-report',
            '/stock/valuation-report',
            '/yield-report',
            '/car-usage-report',
            '/purchase/executive-report'
        ];

        foreach ($routes as $route) {
            $this->getJson($route)->assertUnauthorized();
        }
    }
}
