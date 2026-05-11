<?php
// On inclut la connexion et le modèle
<<<<<<< Updated upstream
require_once '../config/config.php';
require_once '../Model/PointInteret.php';
=======
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../Model/PointInteret.php';
>>>>>>> Stashed changes

// On indique au navigateur qu'on va renvoyer du format JSON
header('Content-Type: application/json');

// On récupère les catégories depuis la base de données
$categoriesExistantes = PointInteret::getCategoriesDistinctes($pdo);

// On transforme le tableau PHP en texte JSON et on l'affiche
echo json_encode($categoriesExistantes);
<<<<<<< Updated upstream
?>
=======
?>

>>>>>>> Stashed changes
