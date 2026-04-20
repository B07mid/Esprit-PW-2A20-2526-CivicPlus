<?php

require_once __DIR__ . '/../Model/UserModel.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die('Accès invalide.');
}

function cleanInput(?string $value): ?string
{
    if ($value === null) {
        return null;
    }

    $value = trim($value);
    return $value === '' ? null : htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

$num_cin = cleanInput($_POST['num_cin'] ?? null);
$nom = cleanInput($_POST['nom'] ?? null);
$prenom = cleanInput($_POST['prenom'] ?? null);
$date_naissance = cleanInput($_POST['date_naissance'] ?? null);
$genre = cleanInput($_POST['genre'] ?? null);
$situation_familiale = cleanInput($_POST['situation_familiale'] ?? null);
$email = cleanInput($_POST['email'] ?? null);
$numero_telephone = cleanInput($_POST['numero_telephone'] ?? null);
$adresse_postale = cleanInput($_POST['adresse_postale'] ?? null);
$code_postal = cleanInput($_POST['code_postal'] ?? null);
$ville = cleanInput($_POST['ville'] ?? null);
$latitude_domicile = cleanInput($_POST['latitude_domicile'] ?? null);
$longitude_domicile = cleanInput($_POST['longitude_domicile'] ?? null);
$mot_de_passe = $_POST['mot_de_passe'] ?? null;
$confirm_mot_de_passe = $_POST['confirm_mot_de_passe'] ?? null;
$langue_preferee = cleanInput($_POST['langue_preferee'] ?? 'fr');
$preferences_ia_transport = cleanInput($_POST['preferences_ia_transport'] ?? null);
$double_authentification_active = isset($_POST['double_authentification_active']) ? 1 : 0;

$errors = [];

if (!$num_cin || !preg_match('/^\d{8}$/', $num_cin)) {
    $errors[] = 'CIN invalide.';
}

if (!$nom) {
    $errors[] = 'Le nom est obligatoire.';
}

if (!$prenom) {
    $errors[] = 'Le prénom est obligatoire.';
}

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Email invalide.';
}

if (!$mot_de_passe || strlen($mot_de_passe) < 6) {
    $errors[] = 'Le mot de passe doit contenir au moins 6 caractères.';
}

if ($mot_de_passe !== $confirm_mot_de_passe) {
    $errors[] = 'Les mots de passe ne correspondent pas.';
}

if ($latitude_domicile !== null && !is_numeric($latitude_domicile)) {
    $errors[] = 'Latitude invalide.';
}

if ($longitude_domicile !== null && !is_numeric($longitude_domicile)) {
    $errors[] = 'Longitude invalide.';
}

if (!empty($errors)) {
    $message = urlencode(implode(' | ', $errors));
    header("Location: ../View/register.html?error_message=$message");
    exit;
}
try {
    $citoyenModel = new citoyenModel();
if ($citoyenModel->emailExists($email)) {
    header('Location: ../View/register.html?error=email_exists');
    exit;
}

if ($citoyenModel->cinExists($num_cin)) {
    header('Location: ../View/register.html?error=cin_exists');
    exit;
}

    $data = [
        'num_cin' => $num_cin,
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
        'latitude_domicile' => $latitude_domicile !== null ? (float)$latitude_domicile : null,
        'longitude_domicile' => $longitude_domicile !== null ? (float)$longitude_domicile : null,
        'mot_de_passe_hash' => password_hash($mot_de_passe, PASSWORD_DEFAULT),
        'double_authentification_active' => $double_authentification_active,
        'statut_compte' => 'actif',
        'points_civisme' => 0,
        'niveau_badge' => 'Novice',
        'langue_preferee' => $langue_preferee ?: 'fr',
        'preferences_ia_transport' => $preferences_ia_transport
    ];

    $success = $citoyenModel->createcitoyen($data);

if ($success) {
    header('Location: ../View/login.html?register=success');
    exit;
} else {
    header('Location: ../View/register.html?error=register_failed');
    exit;
}
} catch (Exception $e) {
    echo "Erreur : " . $e->getMessage();
}


