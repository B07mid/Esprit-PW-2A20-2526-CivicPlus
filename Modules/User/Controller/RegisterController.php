<?php

require_once __DIR__ . '/../Model/UserModel.php';
require_once __DIR__ . '/../config/services.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die('Acces invalide.');
}

function cleanInput(?string $value): ?string
{
    if ($value === null) {
        return null;
    }

    $value = trim($value);
    return $value === '' ? null : htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function redirigerVersInscription(array $params): void
{
    header('Location: ../View/register.html?' . http_build_query($params));
    exit;
}

function redirigerVersConnexion(array $params): void
{
    header('Location: ../View/login.html?' . http_build_query($params));
    exit;
}

function redirigerVersVerificationEmail(array $params): void
{
    header('Location: ../View/verify_email.html?' . http_build_query($params));
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
        'error' => $body === false ? 'HTTP request failed' : '',
    ];
}


// captcha
function validerJetonTurnstile(string $token, ?string $remoteIp): bool
{
    $secretKey = trim((string)civicplus_config('turnstile_secret_key'));

    if ($secretKey === '' || $token === '') {
        return false;
    }

    if (
        $secretKey === '1x0000000000000000000000000000000AA'
        && $token === 'XXXX.DUMMY.TOKEN.XXXX'
    ) {
        return true;
    }

    $payload = [
        'secret' => $secretKey,
        'response' => $token,
    ];

    if ($remoteIp) {
        $payload['remoteip'] = $remoteIp;
    }

    $response = envoyerJsonPost('https://challenges.cloudflare.com/turnstile/v0/siteverify', $payload);

    if ($response['status'] < 200 || $response['status'] >= 300) {
        error_log('Validation Turnstile echouee : ' . $response['body']);
        return false;
    }

    $result = json_decode($response['body'], true);

    return is_array($result) && !empty($result['success']);
}


// verif code page
function construireUrlPageVerification(string $email): string
{
    $appUrl = (string)civicplus_config('app_url', '');

    if ($appUrl !== '') {
        return $appUrl . '/Modules/User/View/verify_email.html?email=' . urlencode($email);
    }

    $forwardedProto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $forwardedProto === 'https';
    $scheme = $isHttps ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/civicplus/Modules/User/Controller/RegisterController.php'));
    $viewDir = str_replace('/Controller', '/View', $scriptDir);

    return $scheme . '://' . $host . $viewDir . '/verify_email.html?email=' . urlencode($email);
}


// enovyer code dans mail
function envoyerEmailVerification(string $email, string $nomComplet, string $codeVerification, string $urlPageVerification, DateTimeInterface $dateExpiration): bool
{
    $apiKey = trim((string)civicplus_config('brevo_api_key'));

    if ($apiKey === '') {
        error_log('Brevo API key is not configured.');
        return false;
    }

    $senderName = (string)civicplus_config('brevo_sender_name', 'CivicPlus');
    $senderEmail = (string)civicplus_config('brevo_sender_email', 'civicplus.tn@gmail.com');
    $nomSecurise = htmlspecialchars($nomComplet, ENT_QUOTES, 'UTF-8');
    $codeSecurise = htmlspecialchars($codeVerification, ENT_QUOTES, 'UTF-8');
    $lienSecurise = htmlspecialchars($urlPageVerification, ENT_QUOTES, 'UTF-8');
    $dateExpirationTexte = $dateExpiration->format('Y-m-d H:i');

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
        'subject' => 'Confirmez votre inscription CivicPlus',
        'htmlContent' => '
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
                <h2 style="margin-bottom: 12px;">Confirmez votre inscription CivicPlus</h2>
                <p>Bonjour ' . $nomSecurise . ',</p>
                <p>Entrez ce code sur la page de verification pour creer votre compte.</p>
                <div style="font-size: 30px; letter-spacing: 8px; font-weight: bold; margin: 18px 0; color: #0d6efd;">' . $codeSecurise . '</div>
                <p>Page de verification :</p>
                <p style="margin-bottom: 18px;">
                    <a href="' . $lienSecurise . '" style="display:inline-block;background:#0d6efd;color:#ffffff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:bold;">
                        Entrer le code
                    </a>
                </p>
                <p>Ce code expire le ' . htmlspecialchars($dateExpirationTexte, ENT_QUOTES, 'UTF-8') . '.</p>
                <p>Si vous n avez pas demande cette inscription, ignorez cet email.</p>
            </div>',
        'textContent' => "Bonjour {$nomComplet},\n\nVotre code de verification CivicPlus est: {$codeVerification}\n\nEntrez le code ici: {$urlPageVerification}\n\nCe code expire le {$dateExpirationTexte}.",
    ];

    $response = envoyerJsonPost('https://api.brevo.com/v3/smtp/email', $payload, [
        'api-key: ' . $apiKey,
    ]);

    if ($response['status'] < 200 || $response['status'] >= 300) {
        error_log('Email de verification Brevo echoue : ' . $response['body']);
        return false;
    }

    return true;
}

$num_cin = cleanInput($_POST['num_cin'] ?? null);
$nom = cleanInput($_POST['nom'] ?? null);
$prenom = cleanInput($_POST['prenom'] ?? null);
$date_naissance = cleanInput($_POST['date_naissance'] ?? null);
$genre = cleanInput($_POST['genre'] ?? null);
$situation_familiale = cleanInput($_POST['situation_familiale'] ?? null);
$email = cleanInput($_POST['email'] ?? null);
$numero_telephone = cleanInput($_POST['numero_telephone'] ?? null);
$adresse_postale = cleanInput($_POST['adresse_postale'] ?? null);
$code_postal = cleanInput($_POST['code_postal'] ?? null);
$ville = cleanInput($_POST['ville'] ?? null);
$latitude_domicile = cleanInput($_POST['latitude_domicile'] ?? null);
$longitude_domicile = cleanInput($_POST['longitude_domicile'] ?? null);
$mot_de_passe = $_POST['mot_de_passe'] ?? null;
$confirm_mot_de_passe = $_POST['confirm_mot_de_passe'] ?? null;
$langue_preferee = cleanInput($_POST['langue_preferee'] ?? 'fr');
$preferences_ia_transport = cleanInput($_POST['preferences_ia_transport'] ?? null);
$double_authentification_active = isset($_POST['double_authentification_active']) ? 1 : 0;
$turnstileToken = trim($_POST['cf-turnstile-response'] ?? '');

$errors = [];

if (!$num_cin || !preg_match('/^\d{8}$/', $num_cin)) {
    $errors[] = 'CIN invalide.';
}

if (!$nom) {
    $errors[] = 'Le nom est obligatoire.';
}

if (!$prenom) {
    $errors[] = 'Le prenom est obligatoire.';
}

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Email invalide.';
}

if (!$mot_de_passe || strlen($mot_de_passe) < 6) {
    $errors[] = 'Le mot de passe doit contenir au moins 6 caracteres.';
}

if ($mot_de_passe !== $confirm_mot_de_passe) {
    $errors[] = 'Les mots de passe ne correspondent pas.';
}

if ($latitude_domicile !== null && !is_numeric($latitude_domicile)) {
    $errors[] = 'Latitude invalide.';
}

if ($longitude_domicile !== null && !is_numeric($longitude_domicile)) {
    $errors[] = 'Longitude invalide.';
}

if (!validerJetonTurnstile($turnstileToken, $_SERVER['REMOTE_ADDR'] ?? null)) {
    $errors[] = 'Verification captcha invalide.';
}

if (!empty($errors)) {
    redirigerVersInscription(['error_message' => implode(' | ', $errors)]);
}

try {
    $citoyenModel = new citoyenModel();
    $citoyenModel->assurerTableInscriptionsEnAttente();
    $citoyenModel->supprimerInscriptionsEnAttenteExpirees();

    if ($citoyenModel->emailExists($email)) {
        redirigerVersInscription(['error' => 'email_exists']);
    }

    if ($citoyenModel->cinExists($num_cin)) {
        redirigerVersInscription(['error' => 'cin_exists']);
    }

    if ($citoyenModel->emailEnAttenteExiste($email) || $citoyenModel->cinEnAttenteExiste($num_cin)) {
        $citoyenModel->supprimerInscriptionEnAttenteParEmailOuCin($email, $num_cin);
    }

    $data = [
        'num_cin' => $num_cin,
        'nom' => $nom,
        'prenom' => $prenom,
        'date_naissance' => $date_naissance,
        'genre' => $genre,
        'situation_familiale' => $situation_familiale,
        'email' => $email,
        'numero_telephone' => $numero_telephone,
        'adresse_postale' => $adresse_postale,
        'code_postal' => $code_postal,
        'ville' => $ville,
        'latitude_domicile' => $latitude_domicile !== null ? (float)$latitude_domicile : null,
        'longitude_domicile' => $longitude_domicile !== null ? (float)$longitude_domicile : null,
        'mot_de_passe_hash' => password_hash($mot_de_passe, PASSWORD_DEFAULT),
        'double_authentification_active' => $double_authentification_active,
        'statut_compte' => 'actif',
        'points_civisme' => 0,
        'niveau_badge' => 'Novice',
        'langue_preferee' => $langue_preferee ?: 'fr',
        'preferences_ia_transport' => $preferences_ia_transport,
        'photo' => '',
    ];

    $codeVerification = (string)random_int(100000, 999999);
    $codeHash = hash('sha256', $codeVerification);
    $dureeMinutes = (int)civicplus_config('verification_ttl_minutes', 60);
    $dateExpiration = new DateTimeImmutable('+' . $dureeMinutes . ' minutes');

    if (!$citoyenModel->creerInscriptionEnAttente($data, $codeHash, $dateExpiration)) {
        redirigerVersInscription(['error' => 'register_failed']);
    }

    $nomComplet = trim(($prenom ?? '') . ' ' . ($nom ?? ''));
    $urlPageVerification = construireUrlPageVerification($email);

    if (!envoyerEmailVerification($email, $nomComplet, $codeVerification, $urlPageVerification, $dateExpiration)) {
        $citoyenModel->supprimerInscriptionEnAttenteParCodeHash($codeHash);
        redirigerVersInscription(['error' => 'email_send_failed']);
    }

    redirigerVersVerificationEmail(['email' => $email, 'sent' => '1']);
} catch (Exception $e) {
    error_log('Erreur inscription : ' . $e->getMessage());
    redirigerVersInscription(['error' => 'register_failed']);
}
