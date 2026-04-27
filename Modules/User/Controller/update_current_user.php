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

    // Gestion de l'upload de photo
    $photo_path = null;
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = __DIR__ . '/../../../assets/img/profiles/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        $file_extension = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
        $file_name = 'profile_' . $num_cin . '_' . time() . '.' . $file_extension;
        $target_file = $upload_dir . $file_name;

        if (move_uploaded_file($_FILES['photo']['tmp_name'], $target_file)) {
            $photo_path = 'assets/img/profiles/' . $file_name;
            $_SESSION['photo'] = $photo_path;
        }
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
                    preferences_ia_transport = :preferences_ia_transport" . ($photo_path ? ", photo = :photo" : "") . "
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

        if ($photo_path) {
            $params[':photo'] = $photo_path;
        }

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
