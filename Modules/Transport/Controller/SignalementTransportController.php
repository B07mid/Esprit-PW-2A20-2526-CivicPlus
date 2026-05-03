<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../Model/SignalementTransport.php';
require_once __DIR__ . '/../../../includes/validation.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Méthode non autorisée.'
        ]);
        exit;
    }

    $numCin = isset($_POST['num_cin']) ? trim($_POST['num_cin']) : '';
    $idLigne = isset($_POST['id_ligne']) ? trim($_POST['id_ligne']) : '';
    $typeProbleme = isset($_POST['type_probleme']) ? trim($_POST['type_probleme']) : '';
    $description = isset($_POST['description']) ? trim($_POST['description']) : '';
    $moment = isset($_POST['moment']) ? trim($_POST['moment']) : '';

    $errors = [];

    if (!cp_valid_cin($numCin)) {
        $errors[] = 'Le CIN doit contenir exactement 8 chiffres.';
    }

    if ($idLigne === '') {
        $errors[] = 'La ligne concernée est obligatoire.';
    } elseif (!ctype_digit($idLigne) || (int)$idLigne <= 0) {
        $errors[] = 'La ligne sélectionnée est invalide.';
    }

    if ($typeProbleme === '') {
        $errors[] = 'Le type de problème est obligatoire.';
    }

    $typesAutorises = ['retard', 'panne', 'affluence', 'incident', 'station', 'autre'];
    if ($typeProbleme !== '' && !in_array($typeProbleme, $typesAutorises, true)) {
        $errors[] = 'Le type de probleme est invalide.';
    }

    if ($description === '') {
        $errors[] = 'La description est obligatoire.';
    } elseif (cp_strlen($description) < 10) {
        $errors[] = 'La description doit contenir au moins 10 caracteres.';
    } elseif (cp_strlen($description) > 60) {
        $errors[] = 'La description ne doit pas depasser 60 caracteres.';
    }

    if ($moment === '') {
        $errors[] = 'Le moment de l incident est obligatoire.';
    } else {
        $momentDate = DateTimeImmutable::createFromFormat('Y-m-d\TH:i', $moment);
        if (!$momentDate) {
            $errors[] = 'Le moment de l incident est invalide.';
        } else {
            $moment = $momentDate->format('Y-m-d H:i:s');
        }
    }

    if (isset($_FILES['piece_jointe']) && $_FILES['piece_jointe']['error'] !== UPLOAD_ERR_NO_FILE) {
        if ($_FILES['piece_jointe']['error'] !== UPLOAD_ERR_OK) {
            $errors[] = 'La piece jointe est invalide.';
        } else {
            $extension = strtolower(pathinfo($_FILES['piece_jointe']['name'], PATHINFO_EXTENSION));
            $mimeType = function_exists('mime_content_type')
                ? mime_content_type($_FILES['piece_jointe']['tmp_name'])
                : ($_FILES['piece_jointe']['type'] ?? '');
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
            $allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];

            if (!in_array($extension, $allowedExtensions, true) || !in_array($mimeType, $allowedMimeTypes, true)) {
                $errors[] = 'La piece jointe doit etre un fichier JPG, PNG ou PDF.';
            }
        }
    }

    if (!empty($errors)) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => implode(' ', $errors)
        ]);
        exit;
    }

    $numCinInt = (int) $numCin;
    $idLigneInt = (int) $idLigne;

    $model = new SignalementTransport($pdo);

    if (!$model->citoyenExists($numCinInt)) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Ce CIN n’existe pas dans la table citoyen.'
        ]);
        exit;
    }

    if (!$model->ligneExists($idLigneInt)) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'La ligne sélectionnée n’existe pas.'
        ]);
        exit;
    }



    $newId = $model->create($numCinInt, $idLigneInt, $typeProbleme, $description, $moment);

    $reportCode = 'TR-' . str_pad((string) $newId, 3, '0', STR_PAD_LEFT);

    echo json_encode([
        'success' => true,
        'message' => 'Signalement envoyé avec succès.',
        'report_id' => $reportCode
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur : ' . $e->getMessage()
    ]);
}


