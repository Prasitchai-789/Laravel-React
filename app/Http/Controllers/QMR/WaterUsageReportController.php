<?php

namespace App\Http\Controllers\QMR;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Notifications\TelegramService;
use App\Models\WaterUsageReport;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WaterUsageReportController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['date_from', 'date_to', 'search']);
        $latestReading = WaterUsageReport::query()
            ->latest('report_date')
            ->first();

        $reports = WaterUsageReport::query()
            ->with('user:id,name,email')
            ->when($filters['date_from'] ?? null, fn ($query, $date) => $query->whereDate('report_date', '>=', $date))
            ->when($filters['date_to'] ?? null, fn ($query, $date) => $query->whereDate('report_date', '<=', $date))
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where('note', 'like', "%{$search}%"))
            ->latest('report_date')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (WaterUsageReport $report) => [
                'id' => $report->id,
                'report_date' => $this->normalizeDate($report->report_date),
                'wastewater_meter_before' => $report->wastewater_meter_before,
                'wastewater_meter_after' => $report->wastewater_meter_after,
                'wastewater_volume' => $report->wastewater_volume,
                'water_treatment_meter_before' => $report->water_treatment_meter_before,
                'water_treatment_meter_after' => $report->water_treatment_meter_after,
                'water_treatment_volume' => $report->water_treatment_volume,
                'raw_water_volume' => $report->raw_water_volume,
                'sludge_weight_kg' => $report->sludge_weight_kg,
                'em_usage_liter' => $report->em_usage_liter,
                'molasses_usage_liter' => $report->molasses_usage_liter,
                'note' => $report->note,
                'created_at' => $report->created_at,
                'user' => $report->user ? [
                    'id' => $report->user->id,
                    'name' => $report->user->name,
                    'email' => $report->user->email,
                ] : null,
            ]);

        $summaryQuery = WaterUsageReport::query()
            ->when($filters['date_from'] ?? null, fn ($query, $date) => $query->whereDate('report_date', '>=', $date))
            ->when($filters['date_to'] ?? null, fn ($query, $date) => $query->whereDate('report_date', '<=', $date));

        return Inertia::render('QMR/WaterUsageReports', [
            'reports' => $reports,
            'filters' => $filters,
            'summary' => [
                'count' => (clone $summaryQuery)->count(),
                'wastewater_volume' => (float) (clone $summaryQuery)->sum('wastewater_volume'),
                'water_treatment_volume' => (float) (clone $summaryQuery)->sum('water_treatment_volume'),
                'sludge_weight_kg' => (float) (clone $summaryQuery)->sum('sludge_weight_kg'),
                'em_usage_liter' => (float) (clone $summaryQuery)->sum('em_usage_liter'),
                'molasses_usage_liter' => (float) (clone $summaryQuery)->sum('molasses_usage_liter'),
            ],
            'latestMeterReading' => $latestReading ? [
                'report_date' => $this->normalizeDate($latestReading->report_date),
                'wastewater_meter_after' => $latestReading->wastewater_meter_after,
                'water_treatment_meter_after' => $latestReading->water_treatment_meter_after,
            ] : null,
        ]);
    }

    public function store(Request $request, TelegramService $telegram): RedirectResponse
    {
        $validated = $request->validate([
            'report_date' => ['required', 'date'],
            'wastewater_meter_before' => ['required', 'numeric', 'min:0'],
            'wastewater_meter_after' => ['required', 'numeric', 'min:0', 'gte:wastewater_meter_before'],
            'water_treatment_meter_before' => ['required', 'numeric', 'min:0'],
            'water_treatment_meter_after' => ['required', 'numeric', 'min:0', 'gte:water_treatment_meter_before'],
            'sludge_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'em_usage_liter' => ['nullable', 'numeric', 'min:0'],
            'molasses_usage_liter' => ['nullable', 'numeric', 'min:0'],
            'note' => ['nullable', 'string', 'max:2000'],
        ], $this->validationMessages());

        $validated['report_date'] = $this->normalizeDate($validated['report_date']);
        $validated = $this->prepareWaterUsageData($validated);

        $report = WaterUsageReport::query()
            ->whereDate('report_date', $validated['report_date'])
            ->first();

        if ($report) {
            $report->update([
                ...$validated,
                'user_id' => $request->user()?->id,
            ]);

            $this->notifyTelegram($telegram, $report->fresh('user'), 'อัปเดตข้อมูลน้ำ');

            return back()->with('success', 'อัปเดตข้อมูลน้ำของวันที่นี้เรียบร้อยแล้ว');
        }

        $report = WaterUsageReport::create([
            ...$validated,
            'user_id' => $request->user()?->id,
        ]);

        $this->notifyTelegram($telegram, $report->load('user'), 'บันทึกข้อมูลน้ำ');

        return back()->with('success', 'บันทึกข้อมูลน้ำเรียบร้อยแล้ว');
    }

    public function update(Request $request, WaterUsageReport $waterUsageReport, TelegramService $telegram): RedirectResponse
    {
        $validated = $request->validate([
            'report_date' => ['required', 'date', Rule::unique('water_usage_reports', 'report_date')->ignore($waterUsageReport->id)],
            'wastewater_meter_before' => ['required', 'numeric', 'min:0'],
            'wastewater_meter_after' => ['required', 'numeric', 'min:0', 'gte:wastewater_meter_before'],
            'water_treatment_meter_before' => ['required', 'numeric', 'min:0'],
            'water_treatment_meter_after' => ['required', 'numeric', 'min:0', 'gte:water_treatment_meter_before'],
            'sludge_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'em_usage_liter' => ['nullable', 'numeric', 'min:0'],
            'molasses_usage_liter' => ['nullable', 'numeric', 'min:0'],
            'note' => ['nullable', 'string', 'max:2000'],
        ], $this->validationMessages());

        $validated['report_date'] = $this->normalizeDate($validated['report_date']);
        $validated = $this->prepareWaterUsageData($validated);

        $waterUsageReport->update($validated);
        $this->notifyTelegram($telegram, $waterUsageReport->fresh('user'), 'อัปเดตข้อมูลน้ำ');

        return back()->with('success', 'อัปเดตข้อมูลน้ำเรียบร้อยแล้ว');
    }

    public function destroy(WaterUsageReport $waterUsageReport): RedirectResponse
    {
        $waterUsageReport->delete();

        return back()->with('success', 'ลบข้อมูลน้ำเรียบร้อยแล้ว');
    }

    private function notifyTelegram(TelegramService $telegram, WaterUsageReport $report, string $title): void
    {
        try {
            $message = implode("\n", [
                "💧 {$title}",
                'วันที่: ' . $this->formatDateThai($report->report_date),
                'น้ำเสีย: ' . number_format((float) $report->wastewater_meter_before, 2) . ' - ' . number_format((float) $report->wastewater_meter_after, 2) . ' = ' . number_format((float) $report->wastewater_volume, 2) . ' ลบ.ม.',
                'Water treatment: ' . number_format((float) $report->water_treatment_meter_before, 2) . ' - ' . number_format((float) $report->water_treatment_meter_after, 2) . ' = ' . number_format((float) $report->water_treatment_volume, 2) . ' ลบ.ม.',
                'ปริมาณตะกอนลงบ่อ: ' . number_format((float) $report->sludge_weight_kg, 2) . ' Kg',
                'ปริมาณการใช้ EM: ' . number_format((float) $report->em_usage_liter, 2) . ' ลิตร',
                'กากน้ำตาล: ' . number_format((float) $report->molasses_usage_liter, 2) . ' ลิตร',
                'ผู้บันทึก: ' . ($report->user?->name ?? '-'),
                'หมายเหตุ: ' . ($report->note ?: '-'),
            ]);

            $telegram->sendToTelegramQMR($message);
        } catch (\Throwable $exception) {
            Log::warning('Water usage Telegram notification failed.', [
                'report_id' => $report->id,
                'error' => $exception->getMessage(),
            ]);

            // Telegram failure must not block saving the report.
        }
    }

    private function validationMessages(): array
    {
        return [
            'report_date.required' => 'กรุณาระบุวันที่',
            'report_date.date' => 'รูปแบบวันที่ไม่ถูกต้อง',
            'report_date.unique' => 'วันที่นี้มีข้อมูลอยู่แล้ว',
            'wastewater_meter_before.required' => 'กรุณาระบุเลขมิเตอร์น้ำเสียก่อน',
            'wastewater_meter_before.numeric' => 'เลขมิเตอร์น้ำเสียก่อนต้องเป็นตัวเลข',
            'wastewater_meter_before.min' => 'เลขมิเตอร์น้ำเสียก่อนต้องไม่ติดลบ',
            'wastewater_meter_after.required' => 'กรุณาระบุเลขมิเตอร์น้ำเสียหลัง',
            'wastewater_meter_after.numeric' => 'เลขมิเตอร์น้ำเสียหลังต้องเป็นตัวเลข',
            'wastewater_meter_after.min' => 'เลขมิเตอร์น้ำเสียหลังต้องไม่ติดลบ',
            'wastewater_meter_after.gte' => 'เลขมิเตอร์น้ำเสียหลังต้องมากกว่าหรือเท่ากับเลขก่อน',
            'water_treatment_meter_before.required' => 'กรุณาระบุเลขมิเตอร์ water treatment ก่อน',
            'water_treatment_meter_before.numeric' => 'เลขมิเตอร์ water treatment ก่อนต้องเป็นตัวเลข',
            'water_treatment_meter_before.min' => 'เลขมิเตอร์ water treatment ก่อนต้องไม่ติดลบ',
            'water_treatment_meter_after.required' => 'กรุณาระบุเลขมิเตอร์ water treatment หลัง',
            'water_treatment_meter_after.numeric' => 'เลขมิเตอร์ water treatment หลังต้องเป็นตัวเลข',
            'water_treatment_meter_after.min' => 'เลขมิเตอร์ water treatment หลังต้องไม่ติดลบ',
            'water_treatment_meter_after.gte' => 'เลขมิเตอร์ water treatment หลังต้องมากกว่าหรือเท่ากับเลขก่อน',
            'sludge_weight_kg.numeric' => 'ปริมาณตะกอนลงบ่อต้องเป็นตัวเลข',
            'sludge_weight_kg.min' => 'ปริมาณตะกอนลงบ่อต้องไม่ติดลบ',
            'em_usage_liter.numeric' => 'ปริมาณการใช้ EM ต้องเป็นตัวเลข',
            'em_usage_liter.min' => 'ปริมาณการใช้ EM ต้องไม่ติดลบ',
            'molasses_usage_liter.numeric' => 'กากน้ำตาลต้องเป็นตัวเลข',
            'molasses_usage_liter.min' => 'กากน้ำตาลต้องไม่ติดลบ',
            'note.max' => 'หมายเหตุต้องไม่เกิน 2,000 ตัวอักษร',
        ];
    }

    private function prepareWaterUsageData(array $validated): array
    {
        $validated['wastewater_volume'] = $this->calculateMeterUsage(
            $validated['wastewater_meter_before'],
            $validated['wastewater_meter_after'],
        );
        $validated['water_treatment_volume'] = $this->calculateMeterUsage(
            $validated['water_treatment_meter_before'],
            $validated['water_treatment_meter_after'],
        );
        $validated['raw_water_volume'] = $validated['water_treatment_volume'];
        $validated['sludge_weight_kg'] = $validated['sludge_weight_kg'] ?? 0;
        $validated['em_usage_liter'] = $validated['em_usage_liter'] ?? 0;
        $validated['molasses_usage_liter'] = $validated['molasses_usage_liter'] ?? 0;

        return $validated;
    }

    private function calculateMeterUsage(mixed $before, mixed $after): float
    {
        return round((float) $after - (float) $before, 2);
    }

    private function normalizeDate(mixed $value): string
    {
        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value)->toDateString();
        }

        $date = trim((string) $value);
        $date = preg_replace('/:(AM|PM)$/i', ' $1', $date) ?? $date;

        try {
            return Carbon::parse($date)->toDateString();
        } catch (\Throwable) {
            return substr($date, 0, 10);
        }
    }

    private function formatDateThai(mixed $value): string
    {
        try {
            return Carbon::parse($this->normalizeDate($value))->format('d/m/Y');
        } catch (\Throwable) {
            return (string) $value;
        }
    }
}
