<?php
require_once __DIR__ . '/../config/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die('Accès invalide.');
}

try {
    $sql = "UPDATE citoyen SET
                num_cin = :num_cin,
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
                double_authentification_active = :double_authentification_active,
                statut_compte = :statut_compte,
                points_civisme = :points_civisme,
                niveau_badge = :niveau_badge,
                langue_preferee = :langue_preferee,
                preferences_ia_transport = :preferences_ia_transport
            WHERE num_cin = :num_cin_original";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':num_cin' => $_POST['num_cin'],
        ':nom' => $_POST['nom'],
        ':prenom' => $_POST['prenom'],
        ':date_naissance' => $_POST['date_naissance'] ?: null,
        ':genre' => $_POST['genre'] ?: null,
        ':situation_familiale' => $_POST['situation_familiale'] ?: null,
        ':email' => $_POST['email'],
        ':numero_telephone' => $_POST['numero_telephone'] ?: null,
        ':adresse_postale' => $_POST['adresse_postale'] ?: null,
        ':code_postal' => $_POST['code_postal'] ?: null,
        ':ville' => $_POST['ville'] ?: null,
        ':latitude_domicile' => $_POST['latitude_domicile'] !== '' ? $_POST['latitude_domicile'] : null,
        ':longitude_domicile' => $_POST['longitude_domicile'] !== '' ? $_POST['longitude_domicile'] : null,
        ':double_authentification_active' => $_POST['double_authentification_active'] ?? 0,
        ':statut_compte' => $_POST['statut_compte'] ?: 'actif',
        ':points_civisme' => $_POST['points_civisme'] !== '' ? $_POST['points_civisme'] : 0,
        ':niveau_badge' => $_POST['niveau_badge'] ?: 'Novice',
        ':langue_preferee' => $_POST['langue_preferee'] ?: 'fr',
        ':preferences_ia_transport' => $_POST['preferences_ia_transport'] ?: null,
        ':num_cin_original' => $_POST['num_cin_original']
    ]);

    header('Location: ../view/user_list.html?success=updated');
    exit;
} catch (PDOException $e) {
    die("Erreur mise à jour : " . $e->getMessage());
}


