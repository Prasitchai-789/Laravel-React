<?php
// app/Http/Controllers/QAC/COA/COAController.php
namespace App\Http\Controllers\QAC\COA;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Certificate;
use App\Models\MAR\SOPlan;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Notifications\TelegramService;

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

    private function makeNextCoaNumber(string $prefix, int $yearBE, ?string $currentSopid = null): string
    {
        $query = Certificate::where('coa_number', 'like', "{$prefix}%/{$yearBE}")
            ->where('status', 'A');

        if ($currentSopid) {
            $query->where('SOPID', '<>', $currentSopid);
        }

        $latestNumber = 0;
        foreach ($query->pluck('coa_number') as $coaNumber) {
            if (preg_match('/^' . preg_quote($prefix, '/') . '(\d+)\/' . $yearBE . '$/', trim((string) $coaNumber), $matches)) {
                $latestNumber = max($latestNumber, (int) $matches[1]);
            }
        }

        $runNumber = $latestNumber + 1;

        $formattedNumber = $runNumber < 1000
            ? str_pad($runNumber, 4, '0', STR_PAD_LEFT)
            : (string) $runNumber;

        return $prefix . $formattedNumber . "/{$yearBE}";
    }

    private function makeCoaLot(): string
    {
        $thaiDate = now()->addYears(543);

        return 'QAC' . $thaiDate->format('ym');
    }

    public function nextNumber(Request $request): JsonResponse
    {
        $now = now();
        $yearBE = $now->year + 543;
        $sopid = $request->get('sopid');
        $cert = $sopid ? Certificate::where('SOPID', $sopid)->first() : null;

        if ($cert && $cert->coa_number && $cert->coa_number !== '-' && $cert->status === 'A') {
            return response()->json([
                'success' => true,
                'coa_number' => $cert->coa_number,
                'coa_lot' => $cert->coa_lot ?: $this->makeCoaLot(),
                'existing' => true,
            ]);
        }

        $soplan = $sopid ? SOPlan::where('SOPID', $sopid)->first() : null;
        $prefix = $this->resolveCoaPrefix($request->get('type'), $soplan);

        return response()->json([
            'success' => true,
            'coa_number' => $this->makeNextCoaNumber($prefix, $yearBE, $sopid ? (string) $sopid : null),
            'coa_lot' => $this->makeCoaLot(),
            'existing' => false,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('📥 COA store request received:', $request->all());

            $tank = $this->textOrNull($request->input('tank', $request->input('coa_tank')));
            if (!$tank) {
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

            // Use frontend-sent values if available, otherwise use existing cert values or generate new
            $coaNumber = $request->get('coa_number');
            $coaLot = $request->get('coa_lot');

            if (!$coaNumber || $coaNumber == '-') {
                if ($cert && $cert->coa_number && $cert->coa_number != '-' && $cert->status === 'A') {
                    $coaNumber = $cert->coa_number;
                } else {
                    // Generate new coa_number
                    $soplan = SOPlan::where('SOPID', $request->get('SOPID'))->first();
                    $prefix = $this->resolveCoaPrefix($request->get('type'), $soplan);
                    $coaNumber = $this->makeNextCoaNumber($prefix, $yearBE, (string) $request->get('SOPID'));
                }
            }

            if (!$coaLot || $coaLot == '-') {
                if ($cert && $cert->coa_lot && $cert->coa_lot != '-') {
                    $coaLot = $cert->coa_lot;
                } else {
                    $coaLot = $this->makeCoaLot();
                }
            }

            if (!$cert) {
                $cert = new Certificate();
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
                Log::error('❌ Certificate save() failed: ' . $saveEx->getMessage());
                throw $saveEx;
            }

            // 6. Update SOPlan status to Waiting (W)
            SOPlan::where('SOPID', $request->get('SOPID'))->update([
                'Status_coa' => 'W'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'บันทึกข้อมูลเรียบร้อยแล้ว',
                'coa_number' => $coaNumber,
                'data' => $cert
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function approve(Request $request): JsonResponse
    {
        try {
            $sopid = $request->get('SOPID');
            if (!$sopid) {
                throw new \Exception('Missing SOPID');
            }

            DB::beginTransaction();

            // ตรวจสอบว่าเป็นการอนุมัติครั้งแรก (status ยังไม่ใช่ 'A')
            $cert = Certificate::where('SOPID', $sopid)->first();
            $isFirstApproval = $cert && $cert->status !== 'A';

            // 1. Update Certificate status to Approved (A) and save manager
            Certificate::where('SOPID', $sopid)->update([
                'status' => 'A',
                'coa_mgr' => $request->get('coa_mgr'),
                'updated_at' => $this->sqlServerDateTime()
            ]);

            // 2. Update SOPlan Status_coa to Approved (A)
            SOPlan::where('SOPID', $sopid)->update([
                'Status_coa' => 'A'
            ]);

            DB::commit();

            // 3. ส่งแจ้งเตือน Telegram เมื่ออนุมัติครั้งแรก
            if ($isFirstApproval && $cert) {
                try {
                    $soplan = SOPlan::where('SOPID', $sopid)->first();
                    $coaNumber = $cert->coa_number ?? '-';
                    $goodName  = $soplan?->GoodName ?? 'เมล็ดปาล์ม';
                    $numberCar = $soplan?->NumberCar ?? '-';
                    $siteUrl   = config('app.url', 'http://isanpalm.dyndns.info:8001/');

                    $message = "แจ้ง COA\n";
                    $message .= "🙎‍♂️ :{$coaNumber}\n";
                    $message .= "📦 :{$goodName}\n";
                    $message .= "🚍 :{$numberCar}\n";
                    $message .= "🌐 :{$siteUrl}";

                    $telegram = new TelegramService();
                    $telegram->sendToTelegramCOA($message);
                } catch (\Exception $telegramEx) {
                    Log::warning('⚠️ Telegram COA notification failed: ' . $telegramEx->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'อนุมัติผลวิเคราะห์เรียบร้อยแลัว'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function cancel(Request $request): JsonResponse
    {
        try {
            $sopid = $request->get('SOPID');
            if (!$sopid) {
                throw new \Exception('Missing SOPID');
            }

            DB::beginTransaction();

            // 1. Update Certificate status to Canceled (C)
            Certificate::where('SOPID', $sopid)->update([
                'status' => 'C',
                'updated_at' => $this->sqlServerDateTime()
            ]);

            // 2. Update SOPlan Status_coa to Canceled (C)
            SOPlan::where('SOPID', $sopid)->update([
                'Status_coa' => 'C'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'ยกเลิก COA เรียบร้อยแล้ว'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function updateWithLog(Request $request): JsonResponse
    {
        try {
            $sopid = $request->get('SOPID');
            if (!$sopid) {
                throw new \Exception('Missing SOPID');
            }

            // Capture before-state for audit
            $before = Certificate::where('SOPID', $sopid)->first()?->toArray();
            $wasApproved = ($before['status'] ?? null) === 'A';

            // Re-use store() logic to persist the updated data
            $storeResponse = $this->store($request);
            $storeData = $storeResponse->getData(true);

            if (!($storeData['success'] ?? false)) {
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
                'SOPID'        => $sopid,
                'edited_by'    => $request->get('edited_by', $request->get('coa_user_id', 'unknown')),
                'edited_by_name' => $request->get('edited_by_name', '-'),
                'edited_at'    => now()->toDateTimeString(),
                'changes'      => [
                    'ffa'          => ['before' => $before['result_FFA']  ?? null, 'after' => $request->get('ffa')],
                    'm_i'          => ['before' => $before['result_moisture'] ?? null, 'after' => $request->get('m_i')],
                    'iv'           => ['before' => $before['result_IV']   ?? null, 'after' => $request->get('iv')],
                    'dobi'         => ['before' => $before['result_dobi'] ?? null, 'after' => $request->get('dobi')],
                    'coa_tank'     => ['before' => $before['coa_tank']    ?? null, 'after' => $request->get('tank')],
                    'notes'        => ['before' => $before['coa_remark']  ?? null, 'after' => $request->get('notes')],
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
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
