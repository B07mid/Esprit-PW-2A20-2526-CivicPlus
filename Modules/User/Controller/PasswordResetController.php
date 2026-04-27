<?php

require_once __DIR__ . '/../Model/UserModel.php';
require_once __DIR__ . '/../config/services.php';

function redirigerVersReinitialisation(array $params): void
{
    header('Location: ../View/reset_password.html?' . http_build_query($params));
    exit;
}

function envoyerJsonPost(string $url, array $payload, array $headers = []): array
{
    $json = json_encode($payload);
    $headers = array_merge([
        'Content-Type: application/json',
        'Accept: application/json',
    ], $headers);

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $body = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        return [
            'status' => $status,
            'body' => $body === false ? '' : $body,
            'error' => $error,
        ];
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => $json,
            'timeout' => 15,
            'ignore_errors' => true,
        ],
    ]);

    $body = file_get_contents($url, false, $context);
    $status = 0;

    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $match)) {
        $status = (int)$match[1];
    }

    return [
        'status' => $status,
        'body' => $body === false ? '' : $body,
        'error' => $body === false ? 'Requete HTTP echouee' : '',
    ];
}

function envoyerEmailCodeReinitialisation(string $email, string $nomComplet, string $code): bool
{
    $apiKey = trim((string)civicplus_config('brevo_api_key'));

    if ($apiKey === '') {
        error_log('Cle API Brevo non configuree.');
        return false;
    }

    $senderName = (string)civicplus_config('brevo_sender_name', 'CivicPlus');
    $senderEmail = (string)civicplus_config('brevo_sender_email', 'civicplus.tn@gmail.com');
    $nomSecurise = htmlspecialchars($nomComplet, ENT_QUOTES, 'UTF-8');
    $codeSecurise = htmlspecialchars($code, ENT_QUOTES, 'UTF-8');

    $payload = [
        'sender' => [
            'name' => $senderName,
            'email' => $senderEmail,
        ],
        'to' => [
            [
                'email' => $email,
                'name' => $nomComplet,
            ],
        ],
        'subject' => 'Code de reinitialisation CivicPlus',
        'htmlContent' => '
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
                <h2 style="margin-bottom: 12px;">Réinitialisation du mot de passe</h2>
                <p>Bonjour ' . $nomSecurise . ',</p>
                <p>Entrez ce code sur CivicPlus pour choisir un nouveau mot de passe.</p>
                <div style="font-size: 30px; letter-spacing: 8px; font-weight: bold; margin: 18px 0; color: #0d6efd;">' . $codeSecurise . '</div>
                <p>Ce code expire après 60 minutes.</p>
                <p>Si vous n avez pas demandé cette action, ignorez cet email.</p>
            </div>',
        'textContent' => "Bonjour {$nomComplet},\n\nVotre code de reinitialisation CivicPlus est: {$code}\n\nCe code expire apres 60 minutes.",
    ];

    $response = envoyerJsonPost('https://api.brevo.com/v3/smtp/email', $payload, [
        'api-key: ' . $apiKey,
    ]);

    if ($response['status'] < 200 || $response['status'] >= 300) {
        error_log('Email reinitialisation Brevo echoue : ' . $response['body']);
        return false;
    }

    return true;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirigerVersReinitialisation(['error' => 'invalid']);
}

$action = $_POST['action'] ?? '';
$email = trim($_POST['email'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirigerVersReinitialisation(['error' => 'email_invalid']);
}

try {
    $citoyenModel = new citoyenModel();
    $citoyen = $citoyenModel->trouverCitoyenParEmail($email);

    if (!$citoyen) {
        redirigerVersReinitialisation(['error' => 'email_not_found']);
    }

    if ($action === 'demander_code') {
        $code = (string)random_int(100000, 999999);
        $dateExpiration = new DateTimeImmutable('+60 minutes');

        $citoyenModel->enregistrerCodeReinitialisation($email, hash('sha256', $code), $dateExpiration);

        $nomComplet = trim(($citoyen['prenom'] ?? '') . ' ' . ($citoyen['nom'] ?? ''));

        if (!envoyerEmailCodeReinitialisation($email, $nomComplet, $code)) {
            redirigerVersReinitialisation([
                'email' => $email,
                'error' => 'email_send_failed'
            ]);
        }

        redirigerVersReinitialisation([
            'email' => $email,
            'sent' => '1'
        ]);
    }

    if ($action === 'changer_mot_de_passe') {
        $code = preg_replace('/\D+/', '', $_POST['code_reinitialisation'] ?? '');
        $motDePasse = $_POST['nouveau_mot_de_passe'] ?? '';
        $confirmation = $_POST['confirmer_mot_de_passe'] ?? '';

        if (!preg_match('/^\d{6}$/', $code)) {
            redirigerVersReinitialisation(['email' => $email, 'sent' => '1', 'error' => 'code_invalid']);
        }

        if (strlen($motDePasse) < 6) {
            redirigerVersReinitialisation(['email' => $email, 'sent' => '1', 'error' => 'password_short']);
        }

        if ($motDePasse !== $confirmation) {
            redirigerVersReinitialisation(['email' => $email, 'sent' => '1', 'error' => 'password_mismatch']);
        }

        $result = $citoyenModel->reinitialiserMotDePasseAvecCode(
            $email,
            $code,
            password_hash($motDePasse, PASSWORD_DEFAULT)
        );

        if (!empty($result['success'])) {
            redirigerVersReinitialisation(['success' => '1']);
        }

        redirigerVersReinitialisation([
            'email' => $email,
            'sent' => '1',
            'error' => $result['reason'] ?? 'reset_failed'
        ]);
    }

    redirigerVersReinitialisation(['error' => 'invalid']);
} catch (Exception $e) {
    error_log('Erreur reinitialisation mot de passe : ' . $e->getMessage());
    redirigerVersReinitialisation(['email' => $email, 'error' => 'server']);
}
