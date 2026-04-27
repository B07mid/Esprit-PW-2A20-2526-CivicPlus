<?php
require_once 'Modules/User/config/config.php';
$stmt = $pdo->query('SELECT num_cin, nom, photo FROM citoyen');
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "CIN: " . $row['num_cin'] . " | Name: " . $row['nom'] . " | Photo: " . $row['photo'] . "\n";
}
?>
