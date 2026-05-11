<?php

require_once __DIR__ . '/../../../includes/env.php';

civicplus_load_env();

function crowdfunding_env(string $name, string $default = ''): string
{
    $value = getenv($name);

    return $value === false ? $default : trim((string)$value);
}

function crowdfunding_json_post(string $url, array $payload, array $headers = []): array
{
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
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

function crowdfunding_escape(?string $value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function envoyerEmailDecisionProjet(array $projet, string $nouveauStatut): bool
{
    $apiKey = crowdfunding_env('BREVO2');

    if ($apiKey === '') {
        error_log('BREVO2 API key is not configured.');
        return false;
    }

    $email = trim((string)($projet['email'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        error_log('Email citoyen invalide pour le projet #' . ($projet['id_projet'] ?? 'inconnu'));
        return false;
    }

    $senderEmail = crowdfunding_env('BREVO2_SENDER_EMAIL', 'civicplus.tn.support@gmail.com');
    $senderName = crowdfunding_env('BREVO2_SENDER_NAME', 'CivicPlus Support');
    $nomComplet = trim((string)($projet['prenom'] ?? '') . ' ' . (string)($projet['nom'] ?? ''));
    $nomDestinataire = $nomComplet !== '' ? $nomComplet : 'Citoyen CivicPlus';

    $idProjet = (string)($projet['id_projet'] ?? '');
    $titre = (string)($projet['titre'] ?? 'projet crowdfunding');
    $ville = (string)($projet['ville'] ?? '');
    $quartier = (string)($projet['quartier'] ?? '');
    $isApproved = $nouveauStatut === 'accepte';

    $subject = $isApproved
        ? 'Votre projet CivicPlus a ete accepte'
        : 'Votre projet CivicPlus a ete rejete';

    $statusLine = $isApproved
        ? 'Bonne nouvelle : votre projet a ete accepte et il est maintenant visible dans le catalogue crowdfunding.'
        : 'Apres verification, votre projet n a pas ete accepte par l administration.';

    $safeSubject = crowdfunding_escape($subject);
    $safeNom = crowdfunding_escape($nomDestinataire);
    $safeId = crowdfunding_escape($idProjet);
    $safeTitre = crowdfunding_escape($titre);
    $safeVille = crowdfunding_escape($ville);
    $safeQuartier = crowdfunding_escape($quartier);
    $safeStatusLine = crowdfunding_escape($statusLine);
    $safeSupportEmail = crowdfunding_escape($senderEmail);

    $htmlContent = '
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 620px;">
            <h2 style="margin: 0 0 12px; color: #0f172a;">' . $safeSubject . '</h2>
            <p>Bonjour ' . $safeNom . ',</p>
            <p>' . $safeStatusLine . '</p>
            <div style="margin: 18px 0; padding: 14px 16px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px;">
                <p style="margin: 0;"><strong>Reference :</strong> #' . $safeId . '</p>
                <p style="margin: 6px 0 0;"><strong>Projet :</strong> ' . $safeTitre . '</p>
                <p style="margin: 6px 0 0;"><strong>Localisation :</strong> ' . $safeQuartier . ', ' . $safeVille . '</p>
            </div>
            <p>Pour toute question, contactez notre support : <a href="mailto:' . $safeSupportEmail . '">' . $safeSupportEmail . '</a>.</p>
            <p style="color: #64748b; font-size: 13px;">Cordialement,<br>L equipe CivicPlus Support</p>
        </div>';

    $textContent = "Bonjour {$nomDestinataire},\n\n"
        . $statusLine . "\n\n"
        . "Reference: #{$idProjet}\n"
        . "Projet: {$titre}\n"
        . "Localisation: {$quartier}, {$ville}\n\n"
        . "Support: {$senderEmail}\n\n"
        . "Cordialement,\nL equipe CivicPlus Support";

    $payload = [
        'sender' => [
            'name' => $senderName,
            'email' => $senderEmail,
        ],
        'to' => [
            [
                'email' => $email,
                'name' => $nomDestinataire,
            ],
        ],
        'subject' => $subject,
        'htmlContent' => $htmlContent,
        'textContent' => $textContent,
    ];

    $response = crowdfunding_json_post('https://api.brevo.com/v3/smtp/email', $payload, [
        'api-key: ' . $apiKey,
    ]);

    if ($response['status'] < 200 || $response['status'] >= 300) {
        error_log('Email decision projet Brevo echoue : ' . $response['body']);
        return false;
    }

    return true;
}
