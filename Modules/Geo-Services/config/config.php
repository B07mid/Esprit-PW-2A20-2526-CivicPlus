<?php
// Paramètres de connexion à la base de données
$host = 'localhost'; // ou 'localhost'
$dbname = 'civicplus';
$username = 'root'; // Utilisateur par défaut sous XAMPP/WAMP
$password = ''; // Mot de passe par défaut (généralement vide)

try {
    // Création de l'instance PDO
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    // Configuration des options PDO pour une meilleure gestion des erreurs
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Configuration pour récupérer les résultats sous forme de tableau associatif par défaut
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
} catch (PDOException $e) {
    // En cas d'erreur de connexion, on arrête l'exécution et on affiche le message
    die("Erreur de connexion à la base de données : " . $e->getMessage());
}
<<<<<<< Updated upstream
?>
=======
?>


>>>>>>> Stashed changes
