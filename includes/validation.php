<?php

function cp_trimmed(?string $value): ?string
{
    if ($value === null) {
        return null;
    }

    $value = trim($value);
    return $value === '' ? null : $value;
}

function cp_strlen(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function cp_valid_email(?string $email): bool
{
    return $email !== null && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function cp_valid_cin(?string $cin): bool
{
    return $cin !== null && preg_match('/^\d{8}$/', $cin) === 1;
}

function cp_valid_optional_phone(?string $phone): bool
{
    return $phone === null || preg_match('/^\d{8,15}$/', $phone) === 1;
}

function cp_valid_optional_postal_code(?string $code): bool
{
    return $code === null || preg_match('/^\d{4}$/', $code) === 1;
}

function cp_valid_optional_number_range($value, float $min, float $max): bool
{
    if ($value === null || $value === '') {
        return true;
    }

    if (!is_numeric($value)) {
        return false;
    }

    $number = (float)$value;
    return $number >= $min && $number <= $max;
}

function cp_valid_optional_date_not_future(?string $date): bool
{
    if ($date === null) {
        return true;
    }

    $parsed = DateTimeImmutable::createFromFormat('Y-m-d', $date);
    if (!$parsed || $parsed->format('Y-m-d') !== $date) {
        return false;
    }

    $today = new DateTimeImmutable('today');
    return $parsed <= $today;
}

function cp_valid_required_text(?string $value, int $min = 1, int $max = 255): bool
{
    if ($value === null) {
        return false;
    }

    $length = cp_strlen($value);
    return $length >= $min && $length <= $max;
}

function cp_valid_optional_text(?string $value, int $max = 255): bool
{
    return $value === null || cp_strlen($value) <= $max;
}

function cp_password_errors(?string $password, ?string $confirmation, int $minLength = 6): array
{
    $errors = [];

    if ($password === null || strlen($password) < $minLength) {
        $errors[] = "Le mot de passe doit contenir au moins {$minLength} caracteres.";
    }

    if ($password !== $confirmation) {
        $errors[] = 'Les mots de passe ne correspondent pas.';
    }

    return $errors;
}

function cp_profile_validation_errors(array $data, bool $requireCin = false): array
{
    $errors = [];

    if ($requireCin && !cp_valid_cin($data['num_cin'] ?? null)) {
        $errors[] = 'Le CIN doit contenir exactement 8 chiffres.';
    }

    if (!cp_valid_required_text($data['nom'] ?? null, 2, 80)) {
        $errors[] = 'Le nom doit contenir au moins 2 caracteres.';
    }

    if (!cp_valid_required_text($data['prenom'] ?? null, 2, 80)) {
        $errors[] = 'Le prenom doit contenir au moins 2 caracteres.';
    }

    if (!cp_valid_email($data['email'] ?? null)) {
        $errors[] = 'Adresse email invalide.';
    }

    if (!cp_valid_optional_date_not_future($data['date_naissance'] ?? null)) {
        $errors[] = 'Date de naissance invalide.';
    }

    if (!cp_valid_optional_phone($data['numero_telephone'] ?? null)) {
        $errors[] = 'Le numero de telephone doit contenir entre 8 et 15 chiffres.';
    }

    if (!cp_valid_optional_postal_code($data['code_postal'] ?? null)) {
        $errors[] = 'Le code postal doit contenir exactement 4 chiffres.';
    }

    if (!cp_valid_optional_number_range($data['latitude_domicile'] ?? null, -90, 90)) {
        $errors[] = 'Latitude invalide.';
    }

    if (!cp_valid_optional_number_range($data['longitude_domicile'] ?? null, -180, 180)) {
        $errors[] = 'Longitude invalide.';
    }

    foreach (['adresse_postale', 'ville', 'langue_preferee', 'preferences_ia_transport', 'genre', 'situation_familiale'] as $field) {
        if (!cp_valid_optional_text($data[$field] ?? null, 255)) {
            $errors[] = "Le champ {$field} est trop long.";
        }
    }

    return $errors;
}

function cp_json_error(array $errors, int $status = 422): void
{
    http_response_code($status);
    echo json_encode([
        'success' => false,
        'error' => implode(' ', $errors),
        'message' => implode(' ', $errors),
    ]);
    exit;
}
