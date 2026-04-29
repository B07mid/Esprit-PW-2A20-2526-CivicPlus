<?php
require_once __DIR__ . '/config.php';

try {
    $db = new Database();
    $pdo = $db->getConnection();
    
    // Check if columns exist
    $stmt = $pdo->query("SHOW COLUMNS FROM signalement LIKE 'latitude'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE signalement ADD COLUMN latitude DECIMAL(10,8) NULL");
        echo "Colonne 'latitude' ajoutée avec succès.<br>";
    } else {
        echo "La colonne 'latitude' existe déjà.<br>";
    }

    $stmt = $pdo->query("SHOW COLUMNS FROM signalement LIKE 'longitude'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE signalement ADD COLUMN longitude DECIMAL(11,8) NULL");
        echo "Colonne 'longitude' ajoutée avec succès.<br>";
    } else {
        echo "La colonne 'longitude' existe déjà.<br>";
    }
    
    echo "Base de données mise à jour avec succès !";
} catch (PDOException $e) {
    echo "Erreur : " . $e->getMessage();
}
?>
