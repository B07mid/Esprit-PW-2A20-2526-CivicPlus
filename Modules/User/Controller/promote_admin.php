<?php
session_start();
require_once __DIR__ . '/../config/config.php';
header('Content-Type: application/json');

// Check admin role
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'error' => 'Accès refusé. Administrateurs uniquement.']);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    $num_cin = $data['num_cin'] ?? null;

    if (empty($num_cin)) {
        echo json_encode(['success' => false, 'error' => 'Num CIN manquant.']);
        exit;
    }

    try {
        $sql = "UPDATE citoyen 
                SET statut_compte = 'Admin', niveau_badge = 'Admin' 
                WHERE num_cin = :num_cin";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':num_cin' => $num_cin]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => "L'utilisateur a été promu administrateur avec succès."]);
        } else {
             echo json_encode(['success' => false, 'error' => "Action impossible. Utilisateur non trouvé ou déjà Admin."]);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la promotion: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée.']);
}
