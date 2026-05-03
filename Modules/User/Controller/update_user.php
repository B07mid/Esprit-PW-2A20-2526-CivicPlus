<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../../../includes/validation.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die('Accès invalide.');
}

$data = [
    'num_cin' => cp_trimmed($_POST['num_cin'] ?? null),
    'num_cin_original' => cp_trimmed($_POST['num_cin_original'] ?? null),
    'nom' => cp_trimmed($_POST['nom'] ?? null),
    'prenom' => cp_trimmed($_POST['prenom'] ?? null),
    'date_naissance' => cp_trimmed($_POST['date_naissance'] ?? null),
    'genre' => cp_trimmed($_POST['genre'] ?? null),
    'situation_familiale' => cp_trimmed($_POST['situation_familiale'] ?? null),
    'email' => cp_trimmed($_POST['email'] ?? null),
    'numero_telephone' => cp_trimmed($_POST['numero_telephone'] ?? null),
    'adresse_postale' => cp_trimmed($_POST['adresse_postale'] ?? null),
    'code_postal' => cp_trimmed($_POST['code_postal'] ?? null),
    'ville' => cp_trimmed($_POST['ville'] ?? null),
    'latitude_domicile' => cp_trimmed($_POST['latitude_domicile'] ?? null),
    'longitude_domicile' => cp_trimmed($_POST['longitude_domicile'] ?? null),
    'double_authentification_active' => cp_trimmed($_POST['double_authentification_active'] ?? '0') ?? '0',
    'statut_compte' => cp_trimmed($_POST['statut_compte'] ?? null) ?? 'actif',
    'points_civisme' => cp_trimmed($_POST['points_civisme'] ?? '0') ?? '0',
    'niveau_badge' => cp_trimmed($_POST['niveau_badge'] ?? null) ?? 'Novice',
    'langue_preferee' => cp_trimmed($_POST['langue_preferee'] ?? null) ?? 'fr',
    'preferences_ia_transport' => cp_trimmed($_POST['preferences_ia_transport'] ?? null),
];

$errors = cp_profile_validation_errors($data, true);

if (!cp_valid_cin($data['num_cin_original'])) {
    $errors[] = 'CIN original invalide.';
}

if (!in_array($data['double_authentification_active'], ['0', '1'], true)) {
    $errors[] = 'Valeur 2FA invalide.';
}

if (!ctype_digit((string)$data['points_civisme'])) {
    $errors[] = 'Les points civisme doivent etre un entier positif.';
}

if (!in_array($data['niveau_badge'], ['Novice', 'Admin'], true)) {
    $errors[] = 'Niveau badge invalide.';
}

if (!empty($errors)) {
    die('Controle de saisie : ' . implode(' ', $errors));
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
        ':num_cin' => $data['num_cin'],
        ':nom' => $data['nom'],
        ':prenom' => $data['prenom'],
        ':date_naissance' => $data['date_naissance'],
        ':genre' => $data['genre'],
        ':situation_familiale' => $data['situation_familiale'],
        ':email' => $data['email'],
        ':numero_telephone' => $data['numero_telephone'],
        ':adresse_postale' => $data['adresse_postale'],
        ':code_postal' => $data['code_postal'],
        ':ville' => $data['ville'],
        ':latitude_domicile' => $data['latitude_domicile'],
        ':longitude_domicile' => $data['longitude_domicile'],
        ':double_authentification_active' => $data['double_authentification_active'],
        ':statut_compte' => $data['statut_compte'],
        ':points_civisme' => $data['points_civisme'],
        ':niveau_badge' => $data['niveau_badge'],
        ':langue_preferee' => $data['langue_preferee'],
        ':preferences_ia_transport' => $data['preferences_ia_transport'],
        ':num_cin_original' => $data['num_cin_original']
    ]);

    header('Location: ../view/user_list.html?success=updated');
    exit;
} catch (PDOException $e) {
    die("Erreur mise à jour : " . $e->getMessage());
}


