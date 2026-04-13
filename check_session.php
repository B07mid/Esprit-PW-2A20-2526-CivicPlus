<?php
session_start();
header('Content-Type: application/json');

$response = ['isAdmin' => false];

if (isset($_SESSION['role']) && $_SESSION['role'] === 'admin') {
    $response['isAdmin'] = true;
}

echo json_encode($response);