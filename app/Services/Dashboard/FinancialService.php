<?php

namespace App\Services\Dashboard;

use Illuminate\Support\Facades\DB;

class FinancialService
{
    public function getAccountBalances($startDate, $endDate, array $accountCodes)
    {
        $placeholders = implode(',', array_fill(0, count($accountCodes), '?'));

        return DB::connection('sqlsrv2')->select("
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
        ", array_merge([$startDate, $endDate], $accountCodes));
    }
}
