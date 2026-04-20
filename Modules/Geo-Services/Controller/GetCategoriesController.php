<?php
// On inclut la connexion et le modèle
require_once '../config/config.php';
require_once '../Model/PointInteret.php';

// On indique au navigateur qu'on va renvoyer du format JSON
header('Content-Type: application/json');

// On récupère les catégories depuis la base de données
$categoriesExistantes = PointInteret::getCategoriesDistinctes($pdo);

// On transforme le tableau PHP en texte JSON et on l'affiche
echo json_encode($categoriesExistantes);
?>


