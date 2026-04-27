<?php
require_once '../config/config.php';

header('Content-Type: application/json');

try {
    // Sélectionnez 'libelle' comme défini dans votre SQL 
    $sql = "SELECT id_type, libelle FROM type_document"; 
    $stmt = $pdo->query($sql);
    $types = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($types);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>


