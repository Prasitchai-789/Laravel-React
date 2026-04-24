<?php
$cwd = getcwd();
require $cwd . '/vendor/autoload.php';
$app = require_once $cwd . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Certificate;

$certs = Certificate::orderByRaw("TRY_CAST(id as INT) DESC")->take(30)->get();

echo "Latest 30 Certificates:\n";
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
