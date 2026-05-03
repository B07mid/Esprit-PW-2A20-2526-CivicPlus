<?php
require_once __DIR__ . '/../../../includes/env.php';

civicplus_load_env();

$ref = isset($_GET['ref']) ? $_GET['ref'] : '';
if (empty($ref)) {
    header("HTTP/1.0 404 Not Found");
    exit;
}

$rapidApiKey = trim((string) getenv('RAPIDAPI_KEY'));
if ($rapidApiKey === '') {
    header("HTTP/1.0 503 Service Unavailable");
    exit;
}

$url = "https://google-map-places.p.rapidapi.com/maps/api/place/photo?maxwidth=400&photo_reference=" . $ref;

$ch = curl_init($url);
// CURLOPT_FOLLOWLOCATION permet de suivre les redirections si RapidAPI nous renvoie vers Google
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); 
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "x-rapidapi-host: google-map-places.p.rapidapi.com",
    "x-rapidapi-key: " . $rapidApiKey
]);

$image_data = curl_exec($ch);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

// On dit au navigateur "Ceci est une image !"
header("Content-Type: " . $content_type);
echo $image_data;
?>
