<?php
session_start();
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$response = [
    'logged_in' => false,
    'role'      => 'guest',
    'nom'       => null,
    'num_cin'   => null
];

if (isset($_SESSION['user_id'])) {
    $response['logged_in'] = true;
    $response['role']      = $_SESSION['role'] ?? 'user';
    $response['nom']       = $_SESSION['nom'] ?? 'Générique';
    $response['num_cin']   = $_SESSION['cin'] ?? null;
}

echo json_encode($response);



