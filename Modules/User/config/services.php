<?php

function civicplus_load_local_env(string $path): void
{
    if (!is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        if (str_starts_with($line, 'export ')) {
            $line = trim(substr($line, 7));
        }

        $separator = strpos($line, '=');
        if ($separator === false) {
            continue;
        }

        $name = trim(substr($line, 0, $separator));
        $value = trim(substr($line, $separator + 1));

        if (!preg_match('/^[A-Z_][A-Z0-9_]*$/i', $name)) {
            continue;
        }

        if ($value !== '' && (
            ($value[0] === '"' && substr($value, -1) === '"')
            || ($value[0] === "'" && substr($value, -1) === "'")
        )) {
            $value = substr($value, 1, -1);
        }

        if (getenv($name) === false) {
            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

civicplus_load_local_env(__DIR__ . '/../../../.env');

function civicplus_service_config(): array
{
    static $config = null;

    if ($config !== null) {
        return $config;
    }

    $config = [
        'brevo_api_key' => trim((string)getenv('BREVO_API_KEY')),
        'brevo_sender_name' => getenv('BREVO_SENDER_NAME') ?: 'CivicPlus',
        'brevo_sender_email' => getenv('BREVO_SENDER_EMAIL') ?: 'civicplus.tn@gmail.com',
        'turnstile_site_key' => getenv('TURNSTILE_SITE_KEY') ?: '1x00000000000000000000AA',
        'turnstile_secret_key' => getenv('TURNSTILE_SECRET_KEY') ?: '1x0000000000000000000000000000000AA',
        'verification_ttl_minutes' => 60,
        'app_url' => getenv('CIVICPLUS_APP_URL') ?: civicplus_detect_app_url(),
    ];

    $config['app_url'] = rtrim((string)$config['app_url'], '/');
    $config['verification_ttl_minutes'] = (int)$config['verification_ttl_minutes'];

    if ($config['verification_ttl_minutes'] < 5) {
        $config['verification_ttl_minutes'] = 60;
    }

    return $config;
}

function civicplus_detect_app_url(): string
{
    if (empty($_SERVER['HTTP_HOST'])) {
        return '';
    }

    $forwardedProto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $forwardedProto === 'https';
    $scheme = $isHttps ? 'https' : 'http';
    $scriptName = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
    $modulesPos = stripos($scriptName, '/Modules/');
    $basePath = $modulesPos === false ? rtrim(dirname($scriptName), '/\\') : substr($scriptName, 0, $modulesPos);

    return rtrim($scheme . '://' . $_SERVER['HTTP_HOST'] . $basePath, '/');
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
