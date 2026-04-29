<?php
require_once __DIR__ . '/config.php';
$db = new Database();
$pdo = $db->getConnection();
$stmt = $pdo->query("DESCRIBE civicplus.signalement");
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach($cols as $col) {
    echo $col['Field'] . " - " . $col['Type'] . "\n";
}
