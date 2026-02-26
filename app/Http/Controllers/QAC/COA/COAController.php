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

class COAController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            Log::info('📥 COA store request received:', $request->all());

            $now = now();
            $yearBE = $now->year + 543;
            $month = $now->format('m');
            $day = $now->format('d');
            $year2 = substr($yearBE, -2);

            // 5. Update or Create Certificate
            // Check if exists for this SOPID to prevent duplicates
            $cert = Certificate::where('SOPID', $request->get('SOPID'))->first();

            // Use frontend-sent values if available, otherwise use existing cert values or generate new
            $coaNumber = $request->get('coa_number');
            $coaLot = $request->get('coa_lot');

            if (!$coaNumber || $coaNumber == '-') {
                if ($cert && $cert->coa_number && $cert->coa_number != '-') {
                    $coaNumber = $cert->coa_number;
                } else {
                    // Generate new coa_number
                    $soplan = SOPlan::where('SOPID', $request->get('SOPID'))->first();
                    $prefix = 'CPO';
                    if ($soplan) {
                        $gn = strtolower($soplan->GoodName ?? '');
                        if (str_contains($gn, 'เมล็ด') || str_contains($gn, 'kernel') || str_contains($gn, 'cpko')) {
                            $prefix = 'KN';
                        }
                    }

                    // Robust query to avoid TRY_CAST errors on partial strings
                    $allCertsThisYear = Certificate::where('coa_number', 'like', "%/{$yearBE}")->pluck('coa_number');
                    $certBaseSeq = 0;
                    foreach ($allCertsThisYear as $coa) {
                        if (preg_match('/(\d+)\/' . $yearBE . '/', $coa, $matches)) {
                            $seqVal = (int) $matches[1];
                            if ($seqVal > $certBaseSeq) {
                                $certBaseSeq = $seqVal;
                            }
                        }
                    }
                    $seq = $certBaseSeq + 1;
                    $coaNumber = $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT) . "/{$yearBE}";
                }
            }

            if (!$coaLot || $coaLot == '-') {
                if ($cert && $cert->coa_lot && $cert->coa_lot != '-') {
                    $coaLot = $cert->coa_lot;
                } else {
                    $coaLot = 'QAC' . $year2 . $month . '0001'; // Fallback
                }
            }

            if (!$cert) {
                // Get next ID if creating new
                $maxId = Certificate::max(DB::raw('TRY_CAST(id as INT)')) ?? 0;
                $nextId = (int) $maxId + 1;

                $cert = new Certificate();
                $cert->id = (string) $nextId;
                $cert->SOPID = (string) $request->get('SOPID');
                $cert->created_at = $now->format('d/m/Y H:i:s');
            }

            // Explicit assignment for better visibility and safety
            $cert->date_coa = $cert->date_coa ?? $now->format('Y-m-d H:i:s.v');
            $cert->coa_number = $coaNumber;
            $cert->coa_lot = $coaLot;
            $cert->coa_tank = $request->get('tank', '-');

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
            $cert->updated_at = $now->format('d/m/Y H:i:s');
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

            // 1. Update Certificate status to Approved (A) and save manager
            Certificate::where('SOPID', $sopid)->update([
                'status' => 'A',
                'coa_mgr' => $request->get('coa_mgr'),
                'updated_at' => now()->format('d/m/Y H:i:s')
            ]);

            // 2. Update SOPlan Status_coa to Approved (A)
            SOPlan::where('SOPID', $sopid)->update([
                'Status_coa' => 'A'
            ]);

            DB::commit();

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
                'updated_at' => now()->format('d/m/Y H:i:s')
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
}