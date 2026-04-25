<?php

namespace App\Services;

class ProductionService
{
    /**
     * Get production data for charts.
     *
     * @param array $filters
     * @return array
     */
    public function getChartData(array $filters = []): array
    {
        return [
            'labels' => ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            'datasets' => [
                [
                    'label' => 'Production Volume',
                    'data' => [65, 59, 80, 81, 56]
                ]
            ],
            'filters_applied' => $filters
        ];
    }
}
