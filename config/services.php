<?php

require_once __DIR__ . '/../../../includes/env.php';

civicplus_load_env();

function civicplus_geo_public_config(): array
{
    $apiKey = trim((string) getenv('GOOGLE_MAPS_API_KEY'));

    if ($apiKey === '') {
        $apiKey = trim((string) getenv('MAPS_API_KEY'));
    }

    return [
        'googleMapsApiKey' => $apiKey,
    ];
}

if (
    isset($_SERVER['SCRIPT_FILENAME'])
    && realpath((string) $_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)
) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(civicplus_geo_public_config());
}
