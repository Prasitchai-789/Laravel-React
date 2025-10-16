<?php

require __DIR__ . '/vendor/autoload.php'; // ✅ ใช้ autoload ของ Composer แทน require ตรงๆ

use TCPDF_FONTS;

// 🔹 path ของไฟล์ฟอนต์ TTF (ตรวจสอบให้แน่ใจว่ามีอยู่จริง)
$ttf = __DIR__ . '/storage/fonts/THSarabunNew.ttf';

if (!file_exists($ttf)) {
    die("❌ ไม่พบไฟล์ฟอนต์: $ttf\n");
}

try {
    // 🔹 แปลงฟอนต์ให้เป็นแบบที่ TCPDF ใช้ได้
    $fontname = TCPDF_FONTS::addTTFfont($ttf, 'TrueTypeUnicode', '', 32);
    echo "✅ Font added successfully: $fontname\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
