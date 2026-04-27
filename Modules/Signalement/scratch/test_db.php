<?php
require_once '../config/config.php';
$stmt = $pdo->query("SELECT COUNT(*) as total FROM signalement");
$row = $stmt->fetch();
echo "Nombre de signalements dans la base : " . $row['total'];
?>
