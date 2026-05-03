<?php

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../Model/SignalementTransport.php';
require_once __DIR__ . '/../../../includes/validation.php';

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
            $description = trim($_POST['description'] ?? '');
            $statut = isset($_POST['pris_en_compte_ia']) ? (int) $_POST['pris_en_compte_ia'] : 0;
            $errors = [];

            if ($id <= 0) {
                $errors[] = 'Signalement invalide.';
            }

            if (!cp_valid_required_text($typeProbleme, 2, 80)) {
                $errors[] = 'Le type de probleme doit contenir entre 2 et 80 caracteres.';
            }

            if (!cp_valid_required_text($description, 10, 60)) {
                $errors[] = 'La description doit contenir entre 10 et 60 caracteres.';
            }

            if (!in_array($statut, [0, 1, 2], true)) {
                $errors[] = 'Statut invalide.';
            }

            if (!empty($errors)) {
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'message' => implode(' ', $errors)
                ]);
                break;
            }

            echo json_encode([
                'success' => $model->updateBack($id, $typeProbleme, $description, $statut)
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


