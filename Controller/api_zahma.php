<?php
session_start();
require_once '../config/config.php';
require_once __DIR__ . '/../../PointsCivisme/Model/CivismeModel.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

// Table: signalements_zahma
// Columns: id_zahma, place_id, statut (enum: 'Fluide','Lent','Zahma'), created_at, num_cin

try {
    if ($action === 'getAll') {
        $stmt = $pdo->prepare("
            SELECT id_zahma, place_id, statut, created_at, num_cin
            FROM signalements_zahma
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);

    } elseif ($action === 'get') {
        $place_id = $_GET['place_id'] ?? '';
        if (!$place_id) {
            echo json_encode(['error' => 'place_id missing']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT statut, created_at FROM signalements_zahma WHERE place_id = :place_id ORDER BY created_at DESC LIMIT 1");
        $stmt->execute(['place_id' => $place_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result) {
            echo json_encode(['success' => true, 'data' => $result]);
        } else {
            echo json_encode(['success' => false, 'message' => 'no data']);
        }

    } elseif ($action === 'report') {
        // Vérification : utilisateur connecté obligatoire
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'not_logged_in', 'message' => 'Vous devez être connecté pour signaler.']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $place_id = $data['place_id'] ?? '';
        $statut   = $data['statut'] ?? '';
        $num_cin  = $_SESSION['user_id']; // user_id = num_cin dans ce projet

        if (!$place_id || !$statut) {
            echo json_encode(['error' => 'Missing data: place_id=' . $place_id . ' statut=' . $statut]);
            exit;
        }

        // Validate enum value
        $allowed = ['Fluide', 'Lent', 'Zahma'];
        if (!in_array($statut, $allowed)) {
            echo json_encode(['error' => 'Invalid statut value: ' . $statut]);
            exit;
        }

        $pointsAjoutes = 0;

        if ($num_cin) {
            $stmt = $pdo->prepare("INSERT INTO signalements_zahma (place_id, statut, num_cin) VALUES (:place_id, :statut, :num_cin)");
            $stmt->execute(['place_id' => $place_id, 'statut' => $statut, 'num_cin' => $num_cin]);
            $pointsAjoutes = CivismeModel::ajouterPoints((int) $num_cin, 10, 'alerte_zahma', 30, 1);
        } else {
            $stmt = $pdo->prepare("INSERT INTO signalements_zahma (place_id, statut) VALUES (:place_id, :statut)");
            $stmt->execute(['place_id' => $place_id, 'statut' => $statut]);
        }

        echo json_encode(['success' => true, 'points_ajoutes' => $pointsAjoutes]);

    } else {
        echo json_encode(['error' => 'Invalid action']);
    }
} catch (Throwable $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
