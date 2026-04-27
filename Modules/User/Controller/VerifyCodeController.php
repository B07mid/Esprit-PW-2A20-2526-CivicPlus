<?php

require_once __DIR__ . '/../Model/UserModel.php';

function redirigerVersPageVerification(array $params): void
{
    header('Location: ../View/verify_email.html?' . http_build_query($params));
    exit;
}

function redirigerVersSuccesVerification(): void
{
    header('Location: ../View/verify_email.html?success=1');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirigerVersPageVerification(['verify' => 'invalid']);
}

$email = trim($_POST['email'] ?? '');
$code = preg_replace('/\D+/', '', $_POST['verification_code'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{6}$/', $code)) {
    redirigerVersPageVerification([
        'email' => $email,
        'verify' => 'invalid'
    ]);
}

try {
    $citoyenModel = new citoyenModel();
    $result = $citoyenModel->finaliserInscriptionEnAttenteParEmailEtCode($email, $code);

    if (!empty($result['success'])) {
        redirigerVersSuccesVerification();
    }

    redirigerVersPageVerification([
        'email' => $email,
        'verify' => $result['reason'] ?? 'failed'
    ]);
} catch (Exception $e) {
    error_log('Erreur verification code email : ' . $e->getMessage());
    redirigerVersPageVerification([
        'email' => $email,
        'verify' => 'failed'
    ]);
}
