<?php
// Fichier : Modules/User/Controller/logout.php
session_start();
session_unset(); // Supprime toutes les variables de session
session_destroy(); // Détruit la session

// Redirige vers la page d'accueil
header("Location: /civicplus/index.html");
exit();
?>


