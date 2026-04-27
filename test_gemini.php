<?php
$api_key = 'AIzaSyAx1e3ndfxpDmWnSqNfPVcsAZgXGcclR3g';
$context = stream_context_create(['ssl'=>['verify_peer'=>false]]);
$result = file_get_contents("https://generativelanguage.googleapis.com/v1beta/models?key=$api_key", false, $context);
$d = json_decode($result, true);
foreach($d['models'] as $m) {
    if ($m['name'] === 'models/gemini-2.5-flash') {
        print_r($m['supportedGenerationMethods']);
    }
}
