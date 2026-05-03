<?php
require_once __DIR__ . '/config/config.php';
$stmt = $pdo->query("SELECT * FROM citoyen WHERE nom LIKE '%Marzougui%' OR prenom LIKE '%Ahmed%'");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($users);
