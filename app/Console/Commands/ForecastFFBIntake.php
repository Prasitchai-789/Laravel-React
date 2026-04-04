<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ForecastFFBIntake extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'forecast:palm-intake';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate daily FFB intake forecasts and detect anomalies for persistence';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Palm Analytics Forecasting...');
        
        try {
            $service = app(\App\Services\Production\PalmAnalyticsService::class);
            $service->persistAnalytics();
            
            $this->info('Forecast and Anomalies persisted successfully.');
            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Error during forecasting: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}
