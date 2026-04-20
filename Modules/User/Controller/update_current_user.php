<?php
session_start();
require_once __DIR__ . '/../config/config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Non authentifié']);
    exit;
}

$num_cin = (int) $_SESSION['user_id'];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Récupération des données POST
    $nom = $_POST['nom'] ?? '';
    $prenom = $_POST['prenom'] ?? '';
    $date_naissance = !empty($_POST['date_naissance']) ? $_POST['date_naissance'] : null;
    $genre = $_POST['genre'] ?? null;
    $situation_familiale = $_POST['situation_familiale'] ?? null;
    $email = $_POST['email'] ?? '';
    $numero_telephone = $_POST['numero_telephone'] ?? null;
    $adresse_postale = $_POST['adresse_postale'] ?? null;
    $code_postal = $_POST['code_postal'] ?? null;
    $ville = $_POST['ville'] ?? null;
    $latitude_domicile = !empty($_POST['latitude_domicile']) ? $_POST['latitude_domicile'] : null;
    $longitude_domicile = !empty($_POST['longitude_domicile']) ? $_POST['longitude_domicile'] : null;
    $langue_preferee = $_POST['langue_preferee'] ?? null;
    $preferences_ia_transport = $_POST['preferences_ia_transport'] ?? null;

    if (empty($nom) || empty($prenom) || empty($email)) {
         echo json_encode(['success' => false, 'error' => 'Veuillez remplir les champs obligatoires (Nom, Prénom, Email).']);
         exit;
    }

    try {
        $sql = "UPDATE citoyen SET 
                    nom = :nom,
                    prenom = :prenom,
                    date_naissance = :date_naissance,
                    genre = :genre,
                    situation_familiale = :situation_familiale,
                    email = :email,
                    numero_telephone = :numero_telephone,
                    adresse_postale = :adresse_postale,
                    code_postal = :code_postal,
                    ville = :ville,
                    latitude_domicile = :latitude_domicile,
                    longitude_domicile = :longitude_domicile,
                    langue_preferee = :langue_preferee,
                    preferences_ia_transport = :preferences_ia_transport
                WHERE num_cin = :num_cin";

        $stmt = $pdo->prepare($sql);
        
        $params = [
            ':nom' => $nom,
            ':prenom' => $prenom,
            ':date_naissance' => $date_naissance,
            ':genre' => $genre,
            ':situation_familiale' => $situation_familiale,
            ':email' => $email,
            ':numero_telephone' => $numero_telephone,
            ':adresse_postale' => $adresse_postale,
            ':code_postal' => $code_postal,
            ':ville' => $ville,
            ':latitude_domicile' => $latitude_domicile,
            ':longitude_domicile' => $longitude_domicile,
            ':langue_preferee' => $langue_preferee,
            ':preferences_ia_transport' => $preferences_ia_transport,
            ':num_cin' => $num_cin
        ];

        $stmt->execute($params);
        
        // Mettre à jour le nom en session si on a changé
        $_SESSION['nom'] = $nom . ' ' . $prenom;

        echo json_encode(['success' => true, 'message' => 'Profil mis à jour avec succès !']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la mise à jour: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
}
