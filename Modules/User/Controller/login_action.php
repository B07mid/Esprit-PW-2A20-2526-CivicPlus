<?php
session_start();
require_once __DIR__ . '/../config/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../View/login.html');
    exit;
}

$identifier = trim($_POST['email'] ?? ''); // Peut être Email, CIN ou tel
$password = trim($_POST['password'] ?? '');

if (empty($identifier) || empty($password)) {
    header('Location: ../View/login.html?error=empty');
    exit;
}

try {
    // On cherche dans la table "citoyen" par num_cin, email ou numéro de téléphone
    $sql = "SELECT num_cin, nom, prenom, email, mot_de_passe_hash, statut_compte, niveau_badge, photo 
            FROM citoyen 
            WHERE email = :id OR num_cin = :id OR numero_telephone = :id 
            LIMIT 1";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $identifier]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // ❌ USER NOT FOUND
    if (!$user) {
         // Fallback historique: on cherche dans users table au cas où il y a un vieux compte admin
         $sqlCheckOld = "SELECT id, nom, prenom, email, password, role FROM users WHERE email = :id LIMIT 1";
         $stmtOld = $pdo->prepare($sqlCheckOld);
         $stmtOld->execute(['id' => $identifier]);
         $oldUser = $stmtOld->fetch(PDO::FETCH_ASSOC);

         if ($oldUser) {
             if (password_verify($password, $oldUser['password'])) {
                 $_SESSION['user_id'] = $oldUser['id'];
                 $_SESSION['cin'] = null;
                 $_SESSION['nom'] = $oldUser['nom'] . ' ' . $oldUser['prenom'];
                 $_SESSION['role'] = $oldUser['role'] === 'admin' ? 'admin' : 'user';
                 header('Location: ../../../index.html');
                 exit;
             }
         }

        header('Location: ../View/login.html?error=email');
        exit;
    }

    // ❌ WRONG PASSWORD
    if (!password_verify($password, $user['mot_de_passe_hash'])) {
        header('Location: ../View/login.html?error=password');
        exit;
    }

    // ✅ SUCCESS
    // Déterminer le rôle
    $role = 'user';
    if ($user['niveau_badge'] === 'Admin' || $user['statut_compte'] === 'Admin' || $user['email'] === 'admin@civicplus.com' || strtolower($user['nom']) === 'admin') {
        $role = 'admin';
    }

    $_SESSION['user_id'] = $user['num_cin'];
    $_SESSION['cin'] = $user['num_cin'];
    $_SESSION['nom'] = $user['nom'] . ' ' . $user['prenom'];
    $_SESSION['role'] = $role;
    $_SESSION['photo'] = $user['photo'];

    // Redirige vers la page d'accueil ou portfolio
    header('Location: ../../../index.html');
    exit;

} catch (Exception $e) {
    header('Location: ../View/login.html?error=server');
    exit;
}


