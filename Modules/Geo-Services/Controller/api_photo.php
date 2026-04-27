<?php
$ref = isset($_GET['ref']) ? $_GET['ref'] : '';
if (empty($ref)) {
    header("HTTP/1.0 404 Not Found");
    exit;
}

$url = "https://google-map-places.p.rapidapi.com/maps/api/place/photo?maxwidth=400&photo_reference=" . $ref;

$ch = curl_init($url);
// CURLOPT_FOLLOWLOCATION permet de suivre les redirections si RapidAPI nous renvoie vers Google
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); 
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "x-rapidapi-host: google-map-places.p.rapidapi.com",
    "x-rapidapi-key: 001f0482a7msh7a0d46c0684b00ap148602jsnadaf1a78a399" // Ta clé
]);

$image_data = curl_exec($ch);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

// On dit au navigateur "Ceci est une image !"
header("Content-Type: " . $content_type);
echo $image_data;
?>