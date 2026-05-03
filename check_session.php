<?php
session_start();
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$role = strtolower((string) ($_SESSION['role'] ?? 'guest'));
$isAdmin = $role === 'admin';

if (!$isAdmin && isset($_SESSION['user_id'])) {
    try {
        require_once __DIR__ . '/Modules/User/config/config.php';
        $stmt = $pdo->prepare(
            "SELECT nom, email, statut_compte, niveau_badge
             FROM citoyen
             WHERE num_cin = :cin
             LIMIT 1"
        );
        $stmt->execute(['cin' => $_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $isAdmin = ($user['niveau_badge'] ?? '') === 'Admin'
                || ($user['statut_compte'] ?? '') === 'Admin'
                || ($user['email'] ?? '') === 'admin@civicplus.com'
                || strtolower((string) ($user['nom'] ?? '')) === 'admin';
        }
    } catch (Throwable $e) {
        $isAdmin = false;
    }
}

echo json_encode([
    'logged_in' => isset($_SESSION['user_id']),
    'isAdmin' => $isAdmin,
    'role' => $isAdmin ? 'admin' : $role
]);
