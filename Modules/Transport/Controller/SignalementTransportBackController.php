<?php
require_once __DIR__ . '/../Model/SignalementTransport.php';

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../Model/SignalementTransport.php';

header('Content-Type: application/json; charset=utf-8');

$model = new SignalementTransport($pdo);
$action = $_GET['action'] ?? 'list';

try {
    switch ($action) {
        case 'list':
            $searchId = $_GET['search_id'] ?? null;
            $statut = $_GET['statut'] ?? null;
            $priorite = $_GET['priorite'] ?? null;

            echo json_encode([
                'success' => true,
                'data' => $model->getAllBack($searchId, $statut, $priorite)
            ]);
            break;

        case 'stats':
            echo json_encode([
                'success' => true,
                'data' => $model->getStatsBack()
            ]);
            break;

        case 'getOne':
            $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
            $item = $model->getOneBack($id);

            echo json_encode([
                'success' => $item ? true : false,
                'data' => $item
            ]);
            break;

        case 'delete':
            $id = isset($_POST['id']) ? (int) $_POST['id'] : 0;

            echo json_encode([
                'success' => $id > 0 ? $model->deleteBack($id) : false
            ]);
            break;

        case 'update':
            $id = isset($_POST['id_signalement']) ? (int) $_POST['id_signalement'] : 0;
            $typeProbleme = trim($_POST['type_probleme'] ?? '');
            $statut = isset($_POST['pris_en_compte_ia']) ? (int) $_POST['pris_en_compte_ia'] : 0;

            echo json_encode([
                'success' => $model->updateBack($id, $typeProbleme, $statut)
            ]);
            break;

        default:
            echo json_encode([
                'success' => false,
                'message' => 'Action invalide'
            ]);
            break;
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}


