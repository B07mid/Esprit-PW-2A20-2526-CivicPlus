<?php
header('Content-Type: application/json; charset=utf-8');

$name = isset($_GET['name']) ? $_GET['name'] : '';
if (empty($name)) {
    echo json_encode(["error" => "Nom manquant"]);
    exit;
}

// On ajoute "Tunisie" pour être sûr que Google cherche au bon endroit
$query = urlencode($name . " Tunisie");

// --- 🛡️ LE BOUCLIER (CACHE) 🛡️ ---
$cache_dir = __DIR__ . '/cache/';
if (!is_dir($cache_dir)) mkdir($cache_dir, 0777, true);
$safe_name = preg_replace('/[^a-zA-Z0-9]/', '_', strtolower($name));
$cache_file = $cache_dir . 'rapidapi_' . $safe_name . '.json';

if (file_exists($cache_file)) {
    echo file_get_contents($cache_file);
    exit;
}
// ----------------------------------

$curl = curl_init();

curl_setopt_array($curl, [
    // On utilise l'endpoint 'textsearch' qui est fait pour chercher un lieu par son nom
    CURLOPT_URL => "https://google-map-places.p.rapidapi.com/maps/api/place/textsearch/json?query=" . $query . "&language=fr",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "x-rapidapi-host: google-map-places.p.rapidapi.com",
        "x-rapidapi-key: 001f0482a7msh7a0d46c0684b00ap148602jsnadaf1a78a399" // Ta clé !
    ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);
curl_close($curl);

if ($err) {
    echo json_encode(["error" => "Erreur réseau RapidAPI"]);
} else {
    $data = json_decode($response, true);
    
    // Si Google Maps a trouvé le lieu
    if (isset($data['results']) && count($data['results']) > 0) {
        $place = $data['results'][0];
        
        $photo_ref = '';
        if (isset($place['photos']) && count($place['photos']) > 0) {
            $photo_ref = $place['photos'][0]['photo_reference'];
        }

        $result = [
            "name" => $place['name'] ?? '',
            "rating" => $place['rating'] ?? 'N/A',
            "reviews" => $place['user_ratings_total'] ?? 0,
            "address" => $place['formatted_address'] ?? '',
            "icon" => $place['icon'] ?? '',
            "photo_ref" => $photo_ref // On envoie juste la référence secrète
        ];
        
        $json_out = json_encode($result);
        file_put_contents($cache_file, $json_out); 
        echo $json_out;
    } else {
        echo json_encode(["error" => "Non trouvé sur Google Maps"]);
    }
}
?>