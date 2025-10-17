<?php

namespace App\Http\Controllers\ACC;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('ACC/FinancialReport', []);
    }
    public function getAccounts(Request $request)
    {
        $start_date = $request->start_date ?: date('Y-01-01');
        $end_date = $request->end_date ?: date('Y-m-d');

        if (!$start_date || !$end_date) {
            return response()->json([
                'status' => 'error',
                'message' => 'start_date หรือ end_date ไม่ถูกต้อง'
            ], 400);
        }

        // รับ account codes จาก React หรือ default
        $accountCodes = $request->input('account_codes', [
            '411001',
            '412001',
            '422001',
            '422003',
            '422004',
            '417000',
            '513001',
            '515101',
            '522001',
            '515103',
            '515102',
            '522003',
            '515104',
            '150401',
            '515202',
            '515201',
            '150402',
            '515212',
            '515213',
            '515302',
            '515303',
            '515305',
            '515304',
            '515401',
            '515403',
            '515404',
            '523033',
            '521005',
            '523029',
            '523023',
            '523032',
            '523015',
            '515503',
            '524003',
            '150502',
            '524005',
            '150501',
            '524002',
            '524004',
            '523001',
            '523002',
            '523005',
            '515501',
            '522006',
            '522009',
            '522008',
            '522007',
            '522010',
            '522011',
            '522013',
            '523031',
            '523006',
            '523011',
            '523007',
            '523008',
            '523010',
            '523009',
            '526004',
            '515208',
            '524007',
            '526003',
            '527003',
            '540001',
            '523019',
            '527008',
            '523025',
            '527006',
            '523030',
            '523022',
            '527009',
            '523013',
            '53600-04',
            '515220',
            '159001',
            '521003',
            '523034'
        ]);


        $placeholders = implode(',', array_fill(0, count($accountCodes), '?')); // ?, ?, ...

        $data = DB::connection('sqlsrv2')->select("
        SELECT
            AC.AccCode,
            AC.AccName,
            ISNULL(ROUND(SUM(
                CASE
                    WHEN G.DocuDate BETWEEN ? AND ? THEN
                        ISNULL(CASE WHEN AC.AccBalnDrCr = 'dr' THEN G.DrAmnt ELSE G.DrAmnt * -1 END, 0)
                        + ISNULL(CASE WHEN AC.AccBalnDrCr = 'cr' THEN G.CrAmnt ELSE G.CrAmnt * -1 END, 0)
                    ELSE 0
                END
            ), 2), 0) as total_amount
        FROM EMAcc AC
        LEFT JOIN GLDT G ON AC.AccID = G.AccID
        LEFT JOIN EMPeriod P ON G.PeriodID = P.PeriodID
        WHERE
            AC.AccCode IN ($placeholders)
            AND G.DocuType = 501
            AND G.DocuStatus = 'N'
            AND AC.AccControlFlag <> 2
        GROUP BY
            AC.AccCode,
            AC.AccName
        ORDER BY
            AC.AccCode
    ", array_merge([$start_date, $end_date], $accountCodes)); // merge parameter

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }
}
