<?php

namespace App\Services;

class ComputerService
{
    /**
     * Get computer inspection plan data.
     *
     * @param array $filters
     * @return array
     */
    public function getCheckPlan(array $filters = []): array
    {
        return [
            'data' => [
                [
                    'id' => 1,
                    'device_name' => 'PC-IT-01',
                    'status' => 'Pending',
                    'inspection_date' => '2026-04-25',
                ],
                [
                    'id' => 2,
                    'device_name' => 'PC-HR-02',
                    'status' => 'Completed',
                    'inspection_date' => '2026-04-20',
                ],
            ],
            'filters_applied' => $filters
        ];
    }
}
