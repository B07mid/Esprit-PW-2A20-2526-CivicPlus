<?php

function civicplus_service_config(): array
{
    static $config = null;

    if ($config !== null) {
        return $config;
    }

    $config = [
        'brevo_api_key' => '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',
        'brevo_sender_name' => 'CivicPlus',
        'brevo_sender_email' => 'civicplus.tn@gmail.com',
        'turnstile_site_key' => '1x00000000000000000000AA',
        'turnstile_secret_key' => '1x0000000000000000000000000000000AA',
        'verification_ttl_minutes' => 60,
        'app_url' => 'http://localhost/civicplus',
    ];

    $config['app_url'] = rtrim((string)$config['app_url'], '/');
    $config['verification_ttl_minutes'] = (int)$config['verification_ttl_minutes'];

    if ($config['verification_ttl_minutes'] < 5) {
        $config['verification_ttl_minutes'] = 60;
    }

    return $config;
}

function civicplus_config(string $key, $default = null)
{
    $config = civicplus_service_config();
    return $config[$key] ?? $default;
}

function civicplus_public_config(): array
{
    return [
        'turnstileSiteKey' => civicplus_config('turnstile_site_key'),
    ];
}

if (
    isset($_SERVER['SCRIPT_FILENAME'])
    && realpath((string)$_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)
) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(civicplus_public_config());
}
