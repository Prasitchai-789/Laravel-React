<?php
$cwd = getcwd();
require $cwd . '/vendor/autoload.php';
$app = require_once $cwd . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Certificate;

$ids = [21247, 21248, 21251, 21252, 21253, 21254, 21255, 21256, 21257, 21232, 21233, 21236, 21237, 21238, 21249, 21258];

$certs = Certificate::whereIn('id', $ids)
    ->orderByRaw("TRY_CAST(id AS INT) ASC")
    ->get(['id', 'coa_number', 'SOPID', 'created_at']);

echo "Certificates sorted by Numeric ID:\n";
echo "--------------------------------------------------------\n";
printf("%-8s | %-16s | %-8s | %-20s\n", "ID", "COA Number", "SOPID", "Created At");
echo "--------------------------------------------------------\n";
foreach ($certs as $cert) {
    printf(
        "%-8s | %-16s | %-8s | %-20s\n",
        $cert->id,
        $cert->coa_number,
        $cert->SOPID,
        $cert->created_at
    );
}
echo "--------------------------------------------------------\n";
