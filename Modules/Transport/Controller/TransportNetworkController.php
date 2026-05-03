<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../Model/TransportNetwork.php';

$model = new TransportNetwork($pdo);
$action = $_GET['action'] ?? $_POST['action'] ?? '';

function sendJson(bool $success, array $payload = [], int $status = 200): void
{
    http_response_code($status);
    echo json_encode(array_merge(['success' => $success], $payload));
    exit;
}

try {
    switch ($action) {
        case 'stats':
            sendJson(true, ['data' => $model->getStats()]);
            break;

        case 'options':
            sendJson(true, ['data' => $model->getOptions()]);
            break;

        case 'listLines':
            sendJson(true, [
                'data' => $model->listLines(
                    trim($_GET['search'] ?? ''),
                    trim($_GET['type'] ?? '')
                )
            ]);
            break;

        case 'saveLine':
            sendJson(true, [
                'data' => $model->saveLine(
                    isset($_POST['id_ligne']) && $_POST['id_ligne'] !== '' ? (int)$_POST['id_ligne'] : null,
                    $_POST['nom_ligne'] ?? '',
                    $_POST['type_transport'] ?? ''
                ),
                'message' => 'Ligne enregistree avec succes.'
            ]);
            break;

        case 'deleteLine':
            sendJson(true, [
                'data' => ['deleted' => $model->deleteLine((int)($_POST['id_ligne'] ?? 0))],
                'message' => 'Ligne supprimee avec succes.'
            ]);
            break;

        case 'listStations':
            sendJson(true, [
                'data' => $model->listStations(trim($_GET['search'] ?? ''))
            ]);
            break;

        case 'saveStation':
            sendJson(true, [
                'data' => $model->saveStation(
                    isset($_POST['id_station']) && $_POST['id_station'] !== '' ? (int)$_POST['id_station'] : null,
                    $_POST['nom_station'] ?? '',
                    $_POST['latitude'] ?? '',
                    $_POST['longitude'] ?? ''
                ),
                'message' => 'Station enregistree avec succes.'
            ]);
            break;

        case 'deleteStation':
            sendJson(true, [
                'data' => ['deleted' => $model->deleteStation((int)($_POST['id_station'] ?? 0))],
                'message' => 'Station supprimee avec succes.'
            ]);
            break;

        case 'listParcours':
            sendJson(true, [
                'data' => $model->listParcours(
                    trim($_GET['search'] ?? ''),
                    isset($_GET['id_ligne']) && $_GET['id_ligne'] !== '' ? (int)$_GET['id_ligne'] : null
                )
            ]);
            break;

        case 'saveParcours':
            sendJson(true, [
                'data' => $model->saveParcours(
                    isset($_POST['original_id_ligne']) && $_POST['original_id_ligne'] !== '' ? (int)$_POST['original_id_ligne'] : null,
                    isset($_POST['original_id_station']) && $_POST['original_id_station'] !== '' ? (int)$_POST['original_id_station'] : null,
                    (int)($_POST['id_ligne'] ?? 0),
                    (int)($_POST['id_station'] ?? 0),
                    (int)($_POST['id_der_station'] ?? 0),
                    (int)($_POST['ordre_passage'] ?? 0),
                    isset($_POST['create_reverse']) && $_POST['create_reverse'] === '1'
                ),
                'message' => 'Parcours enregistre avec succes.'
            ]);
            break;

        case 'deleteParcours':
            sendJson(true, [
                'data' => ['deleted' => $model->deleteParcours((int)($_POST['id_ligne'] ?? 0), (int)($_POST['id_station'] ?? 0))],
                'message' => 'Parcours supprime avec succes.'
            ]);
            break;

        default:
            sendJson(false, ['message' => 'Action invalide.'], 400);
    }
} catch (InvalidArgumentException $e) {
    sendJson(false, ['message' => $e->getMessage()], 422);
} catch (PDOException $e) {
    $message = 'Operation impossible. Verifiez que cet element n est pas deja utilise ou duplique.';
    sendJson(false, ['message' => $message, 'detail' => $e->getMessage()], 409);
} catch (Throwable $e) {
    sendJson(false, ['message' => 'Erreur serveur : ' . $e->getMessage()], 500);
}
