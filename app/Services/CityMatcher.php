<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class CityMatcher
{
    public static function matchCity($villageName)
    {
        if (!$villageName) return null;

        $words = self::extractKeywords($villageName);

        foreach ($words as $word) {

            $candidate = DB::connection('sqlsrv')
                ->table('Webapp_City')
                ->where(function ($q) use ($word) {
                    $q->where('SubDistrictName', 'LIKE', "%$word%")
                      ->orWhere('DistrictName', 'LIKE', "%$word%")
                      ->orWhere('ProvinceName', 'LIKE', "%$word%");
                })
                ->first();

            if ($candidate) {
                return (object)[
                    "subdistrict_id"   => $candidate->SubDistrictID,
                    "subdistrict_name" => $candidate->SubDistrictName,
                    "district_id"      => $candidate->DistrictID,
                    "district_name"    => $candidate->DistrictName,
                    "province_id"      => $candidate->ProvinceID,
                    "province_name"    => $candidate->ProvinceName,
                ];
            }
        }

        return null;
    }

    /**
     * แยกคำสำคัญจากข้อความหมู่บ้าน
     */
    private static function extractKeywords($text)
    {
        // ตัดคำพิเศษที่ไม่เกี่ยวกับพื้นที่
        $blacklist = [
            "บ้าน", "หมู่", "หมู่ที่", "ครูบ้าน",
            "จนท", "อบต", "โรงเรียน", "โรงพยาบาล"
        ];

        // แยกและล้างคำ
        $parts = preg_split('/\s+/', preg_replace('/[^ก-๙a-zA-Z]+/u', ' ', $text));

        $clean = collect($parts)
            ->map(fn($w) => trim($w))
            ->filter(fn($w) => mb_strlen($w) >= 2)
            ->reject(fn($w) => in_array($w, $blacklist))
            ->values()
            ->toArray();

        return $clean;
    }
}
