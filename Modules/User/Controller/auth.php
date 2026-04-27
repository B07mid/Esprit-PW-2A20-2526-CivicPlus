<?php
session_start();
require_once __DIR__ . '/../../../config.php';
header('Content-Type: application/json');

$response = [
    'logged_in' => false,
    'role'      => 'guest',
    'nom'       => null,
    'num_cin'   => null
];

if (isset($_SESSION['user_id'])) {
    // SESSSION RÉELLE (Utilisateur connecté normalement)
    $response['logged_in'] = true;
    $response['role']      = $_SESSION['role'] ?? 'user';
    $response['nom']       = $_SESSION['nom'] ?? 'Générique';
    $response['num_cin']   = $_SESSION['cin'] ?? null;
} elseif (isset($_SESSION['user'])) {
    // SESSION FORCÉE (Fallback pour tests/démo dans config.php)
    $response['logged_in'] = true;
    $response['role']      = $_SESSION['user']['role'] ?? 'user';
    $response['nom']       = ($_SESSION['user']['nom'] ?? '') . ' ' . ($_SESSION['user']['prenom'] ?? '');
    $response['num_cin']   = $_SESSION['user']['num_cin'] ?? null;
}

echo json_encode($response);



