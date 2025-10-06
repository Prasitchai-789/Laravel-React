<?php
require __DIR__ . '/vendor/tecnickcom/tcpdf/tcpdf.php';

// path ของไฟล์ TTF
$ttf = __DIR__ . '/storage/fonts/THSarabunNew.ttf';

// แปลงฟอนต์
$fontname = TCPDF_FONTS::addTTFfont($ttf, 'TrueTypeUnicode', '', 32);
echo "Font added: $fontname\n";
