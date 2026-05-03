<?php
require_once 'Modules/User/config/config.php';
try {
    // Migrate photo_profil to photo if photo is empty and photo_profil exists
    $pdo->exec("UPDATE citoyen SET photo = photo_profil WHERE photo IS NULL OR photo = '' AND photo_profil IS NOT NULL AND photo_profil != ''");
    echo "Migration successful.";
} catch (Exception $e) {
    echo "Migration skipped or error: " . $e->getMessage();
}
?>
