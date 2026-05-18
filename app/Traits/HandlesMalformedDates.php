<?php

namespace App\Traits;

use Carbon\Carbon;

trait HandlesMalformedDates
{
    /**
     * Override to handle malformed date strings from DB (e.g. 'Dec 25 2025 12:00:00:AM')
     */
    protected function asDateTime($value)
    {
        if (is_string($value) && (str_contains($value, ':AM') || str_contains($value, ':PM'))) {
            // Fix format like '12:00:00:AM' to '12:00:00 AM'
            $value = str_replace([':AM', ':PM'], [' AM', ' PM'], $value);
        }

        try {
            return parent::asDateTime($value);
        } catch (\Exception $e) {
            // Fallback to now if it still fails
            return now();
        }
    }
}
