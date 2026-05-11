<?php
session_start();
require_once '../config/config.php';
require_once __DIR__ . '/../../PointsCivisme/Model/CivismeModel.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

try {
    $pdo->exec("DELETE FROM lieux_de_garde WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)");

    // ── GET: fetch all declared gardes ──────────────────────────────────────
    if ($action === 'getAll') {
        $stmt = $pdo->prepare("
            SELECT id, place_id, nom_lieu, num_cin, created_at
            FROM lieux_de_garde
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $rows]);

    // ── GET: check if a specific place is declared ──────────────────────────
    } elseif ($action === 'check') {
        $place_id = $_GET['place_id'] ?? '';
        if (!$place_id) { echo json_encode(['error' => 'place_id missing']); exit; }

        $stmt = $pdo->prepare("SELECT id FROM lieux_de_garde WHERE place_id = :pid AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY created_at DESC LIMIT 1");
        $stmt->execute(['pid' => $place_id]);
        $row = $stmt->fetch();
        echo json_encode(['success' => true, 'declared' => !empty($row)]);

    // ── POST: declare a garde ───────────────────────────────────────────────
    } elseif ($action === 'declare') {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'not_logged_in', 'message' => 'Vous devez être connecté.']);
            exit;
        }

        $data     = json_decode(file_get_contents('php://input'), true);
        $place_id = trim($data['place_id'] ?? '');
        $nom_lieu = trim($data['nom_lieu'] ?? '');
        $num_cin  = $_SESSION['user_id'];

        if (!$place_id || !$nom_lieu) {
            echo json_encode(['error' => 'Missing data']);
            exit;
        }

        // Prevent duplicate from same user on same place
        $stmt = $pdo->prepare("SELECT id FROM lieux_de_garde WHERE place_id = :pid AND num_cin = :cin AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
        $stmt->execute(['pid' => $place_id, 'cin' => $num_cin]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => true, 'already' => true]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO lieux_de_garde (place_id, nom_lieu, num_cin) VALUES (:pid, :nom, :cin)");
        $stmt->execute(['pid' => $place_id, 'nom' => $nom_lieu, 'cin' => $num_cin]);
        $pointsAjoutes = CivismeModel::ajouterPoints((int) $num_cin, 50, 'declaration_garde', 100, null);

        echo json_encode(['success' => true, 'already' => false, 'points_ajoutes' => $pointsAjoutes]);

    // ── DELETE: remove a garde declaration ──────────────────────────────────
    } elseif ($action === 'remove') {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'not_logged_in']);
            exit;
        }

        $data     = json_decode(file_get_contents('php://input'), true);
        $place_id = trim($data['place_id'] ?? '');
        $stmt = $pdo->prepare("DELETE FROM lieux_de_garde WHERE place_id = :pid AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
        $stmt->execute(['pid' => $place_id]);

        echo json_encode(['success' => true]);

    } else {
        echo json_encode(['error' => 'Invalid action']);
    }

} catch (Throwable $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
