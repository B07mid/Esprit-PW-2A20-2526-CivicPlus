<?php
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../config/config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Non authentifié']);
    exit;
}

$num_cin = $_SESSION['user_id'];

try {
    $stmt = $pdo->prepare("SELECT * FROM citoyen WHERE num_cin = :num_cin");
    $stmt->bindValue(':num_cin', $num_cin, PDO::PARAM_INT);
    $stmt->execute();
    $citoyen = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($citoyen) {
        // Supprimer le mot de passe hash pour la sécurité
        unset($citoyen['mot_de_passe_hash']);
        echo json_encode(['success' => true, 'user' => $citoyen]);
    } else {
        echo json_encode(['error' => 'Utilisateur introuvable.']);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => "Erreur base de données"]);
}
