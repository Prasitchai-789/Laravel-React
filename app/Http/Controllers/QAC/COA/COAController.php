<?php

// app/Http/Controllers/QAC/COA/COAController.php

namespace App\Http\Controllers\QAC\COA;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Notifications\TelegramService;
use App\Models\Certificate;
use App\Models\MAR\SOPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class COAController extends Controller
{
    private function sqlServerDateTime($date = null): string
    {
        return ($date ? \Carbon\Carbon::parse($date) : now())->format('Y-m-d H:i:s');
    }

    private function sqlServerDateTimeWithMilliseconds($date = null): string
    {
        return ($date ? \Carbon\Carbon::parse($date) : now())->format('Y-m-d H:i:s.v');
    }

    private function textOrNull($value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function resolveCoaPrefix(?string $type = null, ?SOPlan $soplan = null): string
    {
        if ($type === 'seed' || $type === 'palm-kernel') {
            return 'KN';
        }

        if ($type === 'oil' || $type === 'cpo') {
            return 'CPO';
        }

        if ($soplan) {
            $gn = strtolower($soplan->GoodName ?? '');
            if (str_contains($gn, 'เมล็ด') || str_contains($gn, 'kernel') || str_contains($gn, 'cpko')) {
                return 'KN';
            }
        }

        return 'CPO';
    }

    private function makeNextCoaIdentity(string $prefix, int $yearBE, ?string $currentSopid = null): array
    {
        $query = Certificate::where('coa_number', 'like', "{$prefix}%/{$yearBE}")
            ->whereNotNull('coa_number')
            ->where('coa_number', '<>', '-');

        if ($currentSopid) {
            $query->where('SOPID', '<>', $currentSopid);
        }

        $latestNumber = 0;
        foreach ($query->pluck('coa_number') as $coaNumber) {
            if (preg_match('/^'.preg_quote($prefix, '/').'(\d+)\/'.$yearBE.'$/', trim((string) $coaNumber), $matches)) {
                $latestNumber = max($latestNumber, (int) $matches[1]);
            }
        }

        $runNumber = $latestNumber + 1;

        $formattedNumber = $runNumber < 1000
            ? str_pad($runNumber, 4, '0', STR_PAD_LEFT)
            : (string) $runNumber;

        return [
            'coa_number' => $prefix.$formattedNumber."/{$yearBE}",
            'coa_lot' => $this->makeCoaLot(),
        ];
    }

    private function makeCoaLot(): string
    {
        $thaiDate = now()->addYears(543);

        return 'QAC'.$thaiDate->format('ym');
    }

    private function resolveCoaTypeLabel(?Certificate $cert = null, ?SOPlan $soplan = null): string
    {
        $coaNumber = strtoupper((string) ($cert?->coa_number ?? ''));
        if (str_starts_with($coaNumber, 'KN')) {
            return 'เมล็ดในปาล์ม (KN)';
        }

        if (str_starts_with($coaNumber, 'CPO')) {
            return 'น้ำมันปาล์มดิบ (CPO)';
        }

        return $this->resolveCoaPrefix(null, $soplan) === 'KN'
            ? 'เมล็ดในปาล์ม (KN)'
            : 'น้ำมันปาล์มดิบ (CPO)';
    }

    private function buildCoaTelegramMessage(string $sopid, ?Certificate $cert, ?SOPlan $soplan, ?string $approvedBy): string
    {
        $typeLabel = $this->resolveCoaTypeLabel($cert, $soplan);

        return implode("\n", [
            '✅ แจ้ง COA อนุมัติแล้ว',
            "🧪 ประเภท : {$typeLabel}",
            '📄 COA No. : '.($cert?->coa_number ?: '-'),
            '🏷️ Lot No. : '.($cert?->coa_lot ?: '-'),
            '📦 สินค้า : '.($soplan?->GoodName ?: $typeLabel),
            '🚛 : '.($soplan?->NumberCar ?: '-'),
            '👤 : '.($soplan?->DriverName ?: '-'),
            '📍 : '.($soplan?->Recipient ?: '-'),
            '🖊️ : '.($approvedBy ?: ($cert?->coa_mgr ?: '-')),
        ]);
    }

    public function nextNumber(Request $request): JsonResponse
    {
        $now = now();
        $yearBE = $now->year + 543;
        $sopid = $request->get('sopid');
        $cert = $sopid ? Certificate::where('SOPID', $sopid)->first() : null;

        if ($cert && $cert->status !== 'pending' && $cert->coa_number && $cert->coa_number !== '-') {
            return response()->json([
                'success' => true,
                'coa_number' => $cert->coa_number,
                'coa_lot' => $cert->coa_lot ?: null,
                'existing' => true,
            ]);
        }

        $soplan = $sopid ? SOPlan::where('SOPID', $sopid)->first() : null;
        $prefix = $this->resolveCoaPrefix($request->get('type'), $soplan);
        $identity = $this->makeNextCoaIdentity($prefix, $yearBE, $sopid ? (string) $sopid : null);

        return response()->json([
            'success' => true,
            'coa_number' => $identity['coa_number'],
            'coa_lot' => $identity['coa_lot'],
            'existing' => false,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('📥 COA store request received:', $request->all());

            $tank = $this->textOrNull($request->input('tank', $request->input('coa_tank')));
            if (! $tank) {
                return response()->json([
                    'success' => false,
                    'field' => 'tank',
                    'message' => 'กรุณาเลือก Tank ก่อนบันทึก COA',
                ], 422);
            }

            DB::beginTransaction();

            $now = now();
            $yearBE = $now->year + 543;

            // 5. Update or Create Certificate
            // Check if exists for this SOPID to prevent duplicates
            $cert = Certificate::where('SOPID', $request->get('SOPID'))->first();

            $requestedCoaNumber = $this->textOrNull($request->get('coa_number'));
            $requestedCoaLot = $this->textOrNull($request->get('coa_lot'));
            $shouldPreserveExistingIdentity = $cert && $cert->status !== 'pending';
            $coaNumber = $shouldPreserveExistingIdentity && $cert->coa_number && $cert->coa_number !== '-' ? $cert->coa_number : null;
            $coaLot = $shouldPreserveExistingIdentity && $cert->coa_lot && $cert->coa_lot !== '-' ? $cert->coa_lot : null;

            if (! $coaNumber && $requestedCoaNumber) {
                $isDuplicatedCoaNumber = Certificate::where('coa_number', $requestedCoaNumber)
                    ->where('SOPID', '<>', (string) $request->get('SOPID'))
                    ->exists();

                if ($isDuplicatedCoaNumber) {
                    DB::rollBack();

                    return response()->json([
                        'success' => false,
                        'field' => 'coa_number',
                        'message' => 'เลข COA นี้ถูกใช้แล้ว กรุณากดรันเลขใหม่อีกครั้ง',
                    ], 422);
                }
            }

            if (! $coaNumber || ! $coaLot) {
                $soplan = SOPlan::where('SOPID', $request->get('SOPID'))->first();
                $prefix = $this->resolveCoaPrefix($request->get('type'), $soplan);
                $identity = $this->makeNextCoaIdentity($prefix, $yearBE, (string) $request->get('SOPID'));

                $coaNumber = $coaNumber ?: ($requestedCoaNumber ?: $identity['coa_number']);
                $coaLot = $coaLot ?: ($requestedCoaLot ?: $identity['coa_lot']);
            }

            if (! $cert) {
                $cert = new Certificate;
                $cert->SOPID = (string) $request->get('SOPID');
                $cert->created_at = $this->sqlServerDateTime($now);
            }

            // Explicit assignment for better visibility and safety
            $cert->date_coa = $cert->date_coa ?? $this->sqlServerDateTimeWithMilliseconds($now);
            $cert->coa_number = $coaNumber;
            $cert->coa_lot = $coaLot;
            $cert->coa_tank = $tank;

            // Results
            $cert->result_FFA = $request->get('ffa');
            $cert->result_moisture = $request->get('m_i');
            $cert->result_IV = $request->get('iv');
            $cert->result_dobi = $request->get('dobi');
            $cert->result_shell = $request->get('result_shell');
            $cert->result_kn_moisture = $request->get('result_kn_moisture');

            // Specs
            $cert->spec_FFA = $request->get('spec_ffa');
            $cert->spec_moisture = $request->get('spec_moisture');
            $cert->spec_IV = $request->get('spec_iv');
            $cert->spec_dobi = $request->get('spec_dobi');
            $cert->spec_shell = $request->get('spec_shell');
            $cert->spec_kn_moisture = $request->get('spec_kn_moisture');

            // Set users based on new explicit payload or fallbacks
            $cert->coa_user = $request->get('coa_user_id', $request->get('coa_user', $request->get('inspector')));

            // Only update manager if it's explicitly sent in store (usually done in approve)
            if ($request->has('coa_mgr') && $request->get('coa_mgr') !== '') {
                $cert->coa_mgr = $request->get('coa_mgr');
            }

            $cert->status = 'W';
            $cert->updated_at = $this->sqlServerDateTime($now);
            $cert->coa_remark = $request->get('notes');

            Log::info('💾 Cert about to save:', $cert->toArray());

            try {
                $cert->save();
            } catch (\Exception $saveEx) {
                Log::error('❌ Certificate save() failed: '.$saveEx->getMessage());
                throw $saveEx;
            }

            // 6. Update SOPlan status to Waiting (W)
            SOPlan::where('SOPID', $request->get('SOPID'))->update([
                'Status_coa' => 'W',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'บันทึกข้อมูลเรียบร้อยแล้ว',
                'coa_number' => $coaNumber,
                'coa_lot' => $coaLot,
                'data' => $cert,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function approve(Request $request): JsonResponse
    {
        try {
            $sopid = $request->get('SOPID');
            if (! $sopid) {
                throw new \Exception('Missing SOPID');
            }

            DB::beginTransaction();

            // Lock row so repeated/double-click approvals cannot send duplicate Telegram messages.
            $cert = Certificate::where('SOPID', $sopid)->lockForUpdate()->first();
            if (! $cert) {
                throw new \Exception('ไม่พบข้อมูล COA');
            }

            $isFirstApproval = $cert->status !== 'A';
            if (! $isFirstApproval) {
                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'รายการนี้อนุมัติแล้ว',
                    'already_approved' => true,
                ]);
            }

            // 1. Update Certificate status to Approved (A) and save manager
            $cert->status = 'A';
            $cert->coa_mgr = $request->get('coa_mgr');
            $cert->updated_at = $this->sqlServerDateTime();
            $cert->save();

            // 2. Update SOPlan Status_coa to Approved (A)
            SOPlan::where('SOPID', $sopid)->update([
                'Status_coa' => 'A',
            ]);

            DB::commit();

            // 3. ส่งแจ้งเตือน Telegram เมื่ออนุมัติครั้งแรก
            if ($isFirstApproval) {
                try {
                    $soplan = SOPlan::where('SOPID', $sopid)->first();
                    $message = $this->buildCoaTelegramMessage(
                        (string) $sopid,
                        $cert,
                        $soplan,
                        $request->get('coa_mgr')
                    );

                    $telegram = new TelegramService;
                    $telegram->sendToTelegramCOA($message);
                    Log::info('✅ Telegram COA notification sent', [
                        'SOPID' => $sopid,
                        'coa_number' => $cert->coa_number,
                        'coa_type' => $this->resolveCoaTypeLabel($cert, $soplan),
                    ]);
                } catch (\Exception $telegramEx) {
                    Log::warning('⚠️ Telegram COA notification failed: '.$telegramEx->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'อนุมัติผลวิเคราะห์เรียบร้อยแลัว',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function cancel(Request $request): JsonResponse
    {
        try {
            $sopid = $request->get('SOPID');
            if (! $sopid) {
                throw new \Exception('Missing SOPID');
            }

            DB::beginTransaction();

            // 1. Update Certificate status to Canceled (C)
            Certificate::where('SOPID', $sopid)->update([
                'status' => 'C',
                'updated_at' => $this->sqlServerDateTime(),
            ]);

            // 2. Update SOPlan Status_coa to Canceled (C)
            SOPlan::where('SOPID', $sopid)->update([
                'Status_coa' => 'C',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'ยกเลิก COA เรียบร้อยแล้ว',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateWithLog(Request $request): JsonResponse
    {
        try {
            $sopid = $request->get('SOPID');
            if (! $sopid) {
                throw new \Exception('Missing SOPID');
            }

            // Capture before-state for audit
            $before = Certificate::where('SOPID', $sopid)->first()?->toArray();
            $wasApproved = ($before['status'] ?? null) === 'A';

            // Re-use store() logic to persist the updated data
            $storeResponse = $this->store($request);
            $storeData = $storeResponse->getData(true);

            if (! ($storeData['success'] ?? false)) {
                return response()->json($storeData, 500);
            }

            if ($wasApproved) {
                Certificate::where('SOPID', $sopid)->update([
                    'status' => 'A',
                    'updated_at' => $this->sqlServerDateTime(),
                ]);

                SOPlan::where('SOPID', $sopid)->update([
                    'Status_coa' => 'A',
                ]);
            }

            // Record audit log
            Log::info('📝 COA Edit After Approval', [
                'SOPID' => $sopid,
                'edited_by' => $request->get('edited_by', $request->get('coa_user_id', 'unknown')),
                'edited_by_name' => $request->get('edited_by_name', '-'),
                'edited_at' => now()->toDateTimeString(),
                'changes' => [
                    'ffa' => ['before' => $before['result_FFA'] ?? null, 'after' => $request->get('ffa')],
                    'm_i' => ['before' => $before['result_moisture'] ?? null, 'after' => $request->get('m_i')],
                    'iv' => ['before' => $before['result_IV'] ?? null, 'after' => $request->get('iv')],
                    'dobi' => ['before' => $before['result_dobi'] ?? null, 'after' => $request->get('dobi')],
                    'coa_tank' => ['before' => $before['coa_tank'] ?? null, 'after' => $request->get('tank')],
                    'notes' => ['before' => $before['coa_remark'] ?? null, 'after' => $request->get('notes')],
                ],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'บันทึกข้อมูลพร้อมบันทึก Log เรียบร้อยแล้ว',
                'coa_number' => $storeData['coa_number'] ?? null,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
