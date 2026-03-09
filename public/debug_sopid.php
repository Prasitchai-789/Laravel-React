<?php
include __DIR__ . '/../vendor/autoload.php';
$app = include __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $conn = DB::connection('sqlsrv2');
    $pdo = $conn->getPdo();
    $stmt = $pdo->query("EXEC sp_help 'SOPlan'");
    
    $i = 0;
    do {
        echo "--- Dataset $i ---\n";
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if ($results) {
            foreach($results as $row) {
                 print_r($row);
                 // Stop early if we find identity info to avoid massive output
                 if (isset($row['Identity'])) {
                     break;
                 }
            }
        } else {
            echo "Empty dataset\n";
        }
        $i++;
    } while ($stmt->nextRowset());

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
