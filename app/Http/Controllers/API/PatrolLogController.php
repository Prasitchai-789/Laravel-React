<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Notifications\TelegramService;
use App\Models\Checkpoint;
use App\Models\GuardPatrolLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PatrolLogController extends Controller
{
    public function __construct(private readonly TelegramService $telegramService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'checkpoint_id' => ['nullable', 'integer', 'exists:checkpoints,id'],
            'guard_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'string', 'in:ok,out_of_radius,invalid_checkpoint,inactive_checkpoint'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $logs = GuardPatrolLog::query()
            ->with(['checkpoint:id,code,name,area', 'securityGuard:id,name,email'])
            ->when($data['checkpoint_id'] ?? null, fn ($query, $checkpointId) => $query->where('checkpoint_id', $checkpointId))
            ->when($data['guard_id'] ?? null, fn ($query, $guardId) => $query->where('guard_id', $guardId))
            ->when($data['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($data['date_from'] ?? null, fn ($query, $date) => $query->whereDate('checked_at', '>=', $date))
            ->when($data['date_to'] ?? null, fn ($query, $date) => $query->whereDate('checked_at', '<=', $date))
            ->latest('checked_at')
            ->paginate($data['per_page'] ?? 30);

        return response()->json($logs);
    }

    public function checkpoints(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Checkpoint::query()
                ->where('is_active', true)
                ->orderBy('area')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'checkpoint_code' => ['required_without:qr_code', 'string', 'max:500'],
            'qr_code' => ['required_without:checkpoint_code', 'string', 'max:500'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'guard_id' => ['nullable', 'integer', 'exists:users,id'],
            'guard_name' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $checkpointCode = $this->normalizeCheckpointCode($data['checkpoint_code'] ?? $data['qr_code']);
        if (mb_strlen($checkpointCode) > 80) {
            return response()->json([
                'success' => false,
                'message' => 'รูปแบบ QR Code ไม่ถูกต้อง',
            ], 422);
        }
        $scanLatitude = (float) $data['latitude'];
        $scanLongitude = (float) $data['longitude'];
        $checkpoint = Checkpoint::query()->where('code', $checkpointCode)->first();
        $status = GuardPatrolLog::STATUS_INVALID_CHECKPOINT;
        $distanceMeters = null;
        $isWithinRadius = false;

        if ($checkpoint && ! $checkpoint->is_active) {
            $status = GuardPatrolLog::STATUS_INACTIVE_CHECKPOINT;
        }

        if ($checkpoint && $checkpoint->is_active) {
            $distanceMeters = $this->calculateDistanceMeters(
                $scanLatitude,
                $scanLongitude,
                $checkpoint->latitude,
                $checkpoint->longitude
            );
            $isWithinRadius = $distanceMeters <= $checkpoint->radius_meters;
            $status = $isWithinRadius
                ? GuardPatrolLog::STATUS_OK
                : GuardPatrolLog::STATUS_OUT_OF_RADIUS;
        }

        $log = GuardPatrolLog::create([
            'checkpoint_id' => $checkpoint?->id,
            'guard_id' => $data['guard_id'] ?? $request->user()?->id,
            'guard_name' => $data['guard_name'] ?? $request->user()?->name,
            'checkpoint_code' => $checkpointCode,
            'scan_latitude' => $scanLatitude,
            'scan_longitude' => $scanLongitude,
            'checkpoint_latitude' => $checkpoint?->latitude,
            'checkpoint_longitude' => $checkpoint?->longitude,
            'allowed_radius_meters' => $checkpoint?->radius_meters,
            'distance_meters' => $distanceMeters !== null ? round($distanceMeters, 2) : null,
            'is_within_radius' => $isWithinRadius,
            'status' => $status,
            'note' => $data['note'] ?? null,
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
            'checked_at' => now(),
        ]);

        $telegramSent = $this->sendTelegramAlert($log->fresh(['checkpoint', 'securityGuard']));

        if ($telegramSent) {
            $log->update([
                'telegram_sent' => true,
                'telegram_sent_at' => now(),
            ]);
        }

        return response()->json([
            'success' => $isWithinRadius,
            'message' => $this->responseMessage($status),
            'data' => $log->fresh(['checkpoint', 'securityGuard']),
        ], $status === GuardPatrolLog::STATUS_OK ? 201 : 422);
    }

    private function calculateDistanceMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadiusMeters = 6371000;
        $latFrom = deg2rad($lat1);
        $lonFrom = deg2rad($lon1);
        $latTo = deg2rad($lat2);
        $lonTo = deg2rad($lon2);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $a = sin($latDelta / 2) ** 2
            + cos($latFrom) * cos($latTo) * sin($lonDelta / 2) ** 2;

        return $earthRadiusMeters * (2 * atan2(sqrt($a), sqrt(1 - $a)));
    }

    private function normalizeCheckpointCode(string $payload): string
    {
        $payload = trim($payload);
        $query = parse_url($payload, PHP_URL_QUERY);

        if (is_string($query)) {
            parse_str($query, $params);
            foreach (['checkpoint_code', 'code', 'qr_code', 'qr'] as $key) {
                if (! empty($params[$key]) && is_string($params[$key])) {
                    return trim($params[$key]);
                }
            }
        }

        $path = parse_url($payload, PHP_URL_PATH);
        if (is_string($path) && str_contains($payload, '://')) {
            $segments = array_values(array_filter(explode('/', $path)));
            return trim((string) end($segments));
        }

        return $payload;
    }

    private function sendTelegramAlert(GuardPatrolLog $log): bool
    {
        try {
            $this->telegramService->sendToTelegramTest($this->telegramMessage($log));

            return true;
        } catch (\Throwable $exception) {
            Log::error('Guard patrol Telegram alert failed', [
                'guard_patrol_log_id' => $log->id,
                'error' => $exception->getMessage(),
            ]);

            return false;
        }
    }

    private function telegramMessage(GuardPatrolLog $log): string
    {
        $checkpointName = e($log->checkpoint?->name ?? 'ไม่พบจุดตรวจ');
        $area = $log->checkpoint?->area ? ' (' . e($log->checkpoint->area) . ')' : '';
        $guard = e($log->securityGuard?->name ?? $log->guard_name ?? 'ไม่ระบุผู้ตรวจ');
        $checkpointCode = e($log->checkpoint_code);
        $scanLatitude = number_format($log->scan_latitude, 7, '.', '');
        $scanLongitude = number_format($log->scan_longitude, 7, '.', '');
        $distance = $log->distance_meters !== null ? number_format($log->distance_meters, 2) . ' m' : '-';
        $radius = $log->allowed_radius_meters !== null ? number_format($log->allowed_radius_meters) . ' m' : '-';
        $status = match ($log->status) {
            GuardPatrolLog::STATUS_OK => 'ผ่าน',
            GuardPatrolLog::STATUS_OUT_OF_RADIUS => 'นอกพื้นที่',
            GuardPatrolLog::STATUS_INACTIVE_CHECKPOINT => 'จุดตรวจถูกปิดใช้งาน',
            default => 'QR ไม่ถูกต้อง',
        };

        return implode("\n", array_filter([
            'Guard Patrol Alert',
            "สถานะ: {$status}",
            "รปภ.: {$guard}",
            "จุดตรวจ: {$checkpointName}{$area}",
            "QR: {$checkpointCode}",
            "ระยะห่าง: {$distance} / {$radius}",
            "พิกัดที่สแกน: {$scanLatitude}, {$scanLongitude}",
            'เวลา: ' . $log->checked_at?->format('Y-m-d H:i:s'),
            $log->note ? 'หมายเหตุ: ' . e($log->note) : null,
        ]));
    }

    private function responseMessage(string $status): string
    {
        return match ($status) {
            GuardPatrolLog::STATUS_OK => 'บันทึกการตรวจพื้นที่สำเร็จ',
            GuardPatrolLog::STATUS_OUT_OF_RADIUS => 'อยู่นอกระยะที่กำหนดของจุดตรวจ',
            GuardPatrolLog::STATUS_INACTIVE_CHECKPOINT => 'จุดตรวจนี้ถูกปิดใช้งาน',
            default => 'ไม่พบ QR Code ของจุดตรวจ',
        };
    }

    public function adminCheckpoints(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Checkpoint::query()
                ->orderBy('area')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function storeCheckpoint(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:80', 'unique:checkpoints,code'],
            'name' => ['required', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'radius_meters' => ['required', 'integer', 'min:1', 'max:10000'],
            'is_active' => ['boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $checkpoint = Checkpoint::create($data);

        return response()->json([
            'success' => true,
            'message' => 'สร้างจุดตรวจสำเร็จ',
            'data' => $checkpoint,
        ], 201);
    }

    public function updateCheckpoint(Request $request, int $id): JsonResponse
    {
        $checkpoint = Checkpoint::findOrFail($id);

        $data = $request->validate([
            'code' => ['required', 'string', 'max:80', 'unique:checkpoints,code,' . $checkpoint->id],
            'name' => ['required', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'radius_meters' => ['required', 'integer', 'min:1', 'max:10000'],
            'is_active' => ['boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $checkpoint->update($data);

        return response()->json([
            'success' => true,
            'message' => 'อัปเดตจุดตรวจสำเร็จ',
            'data' => $checkpoint,
        ]);
    }

    public function destroyCheckpoint(int $id): JsonResponse
    {
        $checkpoint = Checkpoint::findOrFail($id);
        $checkpoint->delete();

        return response()->json([
            'success' => true,
            'message' => 'ลบจุดตรวจสำเร็จ',
        ]);
    }
}
