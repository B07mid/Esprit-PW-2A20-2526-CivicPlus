<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../Model/SignalementTransport.php';

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

    if ($numCin === '') {
        $errors[] = 'Le CIN est obligatoire.';
    } elseif (!ctype_digit($numCin)) {
        $errors[] = 'Le CIN doit contenir uniquement des chiffres.';
    }

    if ($idLigne === '') {
        $errors[] = 'La ligne concernée est obligatoire.';
    } elseif (!ctype_digit($idLigne)) {
        $errors[] = 'La ligne sélectionnée est invalide.';
    }

    if ($typeProbleme === '') {
        $errors[] = 'Le type de problème est obligatoire.';
    }

    if ($description === '') {
        $errors[] = 'La description est obligatoire.';
    } elseif (mb_strlen($description) > 60) {
        $errors[] = 'La description ne doit pas depasser 60 caracteres.';
    }

    if ($moment === '') {
        $errors[] = 'Le moment de l’incident est obligatoire.';
    } else {
        $moment = str_replace('T', ' ', $moment) . ':00';
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


