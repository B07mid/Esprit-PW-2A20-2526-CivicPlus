<?php
session_start();
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../../../includes/validation.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Non authentifié']);
    exit;
}

$num_cin = (int) $_SESSION['user_id'];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Récupération des données POST
    $nom = cp_trimmed($_POST['nom'] ?? null);
    $prenom = cp_trimmed($_POST['prenom'] ?? null);
    $date_naissance = cp_trimmed($_POST['date_naissance'] ?? null);
    $genre = cp_trimmed($_POST['genre'] ?? null);
    $situation_familiale = cp_trimmed($_POST['situation_familiale'] ?? null);
    $email = cp_trimmed($_POST['email'] ?? null);
    $numero_telephone = cp_trimmed($_POST['numero_telephone'] ?? null);
    $adresse_postale = cp_trimmed($_POST['adresse_postale'] ?? null);
    $code_postal = cp_trimmed($_POST['code_postal'] ?? null);
    $ville = cp_trimmed($_POST['ville'] ?? null);
    $latitude_domicile = cp_trimmed($_POST['latitude_domicile'] ?? null);
    $longitude_domicile = cp_trimmed($_POST['longitude_domicile'] ?? null);
    $langue_preferee = cp_trimmed($_POST['langue_preferee'] ?? null);
    $preferences_ia_transport = cp_trimmed($_POST['preferences_ia_transport'] ?? null);

    $errors = cp_profile_validation_errors([
        'nom' => $nom,
        'prenom' => $prenom,
        'date_naissance' => $date_naissance,
        'genre' => $genre,
        'situation_familiale' => $situation_familiale,
        'email' => $email,
        'numero_telephone' => $numero_telephone,
        'adresse_postale' => $adresse_postale,
        'code_postal' => $code_postal,
        'ville' => $ville,
        'latitude_domicile' => $latitude_domicile,
        'longitude_domicile' => $longitude_domicile,
        'langue_preferee' => $langue_preferee,
        'preferences_ia_transport' => $preferences_ia_transport,
    ]);

    if (!empty($errors)) {
        cp_json_error($errors);
    }

    // Gestion de l'upload de photo
    $photo_path = null;
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $file_extension = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
        $mimeType = function_exists('mime_content_type')
            ? mime_content_type($_FILES['photo']['tmp_name'])
            : ($_FILES['photo']['type'] ?? '');

        if (!in_array($file_extension, $allowedExtensions, true) || strpos((string)$mimeType, 'image/') !== 0) {
            cp_json_error(['La photo doit etre une image valide.']);
        }

        $upload_dir = __DIR__ . '/../../../assets/img/profiles/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

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
