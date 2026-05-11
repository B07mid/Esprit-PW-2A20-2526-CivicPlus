<?php
ob_start();
session_start();
require_once '../config/config.php';
require_once '../model/ProjetCrowdfunding.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

function actualite_json(array $payload, int $status = 200): void
{
    ob_clean();
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function actualite_current_cin(): ?int
{
    $cin = $_SESSION['user_id'] ?? ($_SESSION['cin'] ?? ($_SESSION['user']['num_cin'] ?? null));
    $cin = trim((string) $cin);
    return preg_match('/^\d+$/', $cin) ? (int) $cin : null;
}

function actualite_upload_image(?array $file): ?string
{
    if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK || ($file['size'] ?? 0) > 5 * 1024 * 1024) {
        return null;
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    $info = $tmpName !== '' ? getimagesize($tmpName) : false;
    $allowed = [
        IMAGETYPE_JPEG => 'jpg',
        IMAGETYPE_PNG => 'png',
        IMAGETYPE_WEBP => 'webp',
        IMAGETYPE_GIF => 'gif',
    ];

    if (!$info || !isset($allowed[$info[2]])) {
        return null;
    }

    $uploadDir = dirname(__DIR__) . '/uploads/actualites';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        return null;
    }

    $fileName = 'actualite_' . date('YmdHis') . '_' . bin2hex(random_bytes(4)) . '.' . $allowed[$info[2]];
    $target = $uploadDir . '/' . $fileName;

    if (!move_uploaded_file($tmpName, $target)) {
        return null;
    }

    return 'Modules/Crowdfunding/uploads/actualites/' . $fileName;
}

function actualite_is_project_owner(PDO $pdo, int $projectId, int $cin): bool
{
    $stmt = $pdo->prepare("SELECT num_cin FROM projet_crowdfunding WHERE id_projet = :id LIMIT 1");
    $stmt->execute(['id' => $projectId]);
    return (int) $stmt->fetchColumn() === $cin;
}

function actualite_fetch_project(PDO $pdo, int $projectId): ?array
{
    $stmt = $pdo->prepare("SELECT id_projet, num_cin, titre FROM projet_crowdfunding WHERE id_projet = :id LIMIT 1");
    $stmt->execute(['id' => $projectId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);
    return $project ?: null;
}

function actualite_social_store_path(): string
{
    $dir = dirname(__DIR__, 2) . '/Social/data';
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    return $dir . '/social_store.json';
}

function actualite_normalize_social_store($raw): array
{
    $store = is_array($raw) ? $raw : [];
    foreach (['requests', 'friendships', 'notifications'] as $key) {
        if (!isset($store[$key]) || !is_array($store[$key])) {
            $store[$key] = [];
        }
    }
    if (!isset($store['conversations']) || !is_array($store['conversations'])) {
        $store['conversations'] = [];
    }
    return $store;
}

function actualite_social_url_for_project(int $projectId): string
{
    return 'Modules/Crowdfunding/view/index.html?project=' . $projectId;
}

function actualite_preview_text(string $text, int $max = 120): string
{
    $text = trim((string) preg_replace('/\s+/', ' ', $text));
    if (function_exists('mb_strlen') && function_exists('mb_substr')) {
        return mb_strlen($text, 'UTF-8') > $max ? mb_substr($text, 0, $max - 3, 'UTF-8') . '...' : $text;
    }
    return strlen($text) > $max ? substr($text, 0, $max - 3) . '...' : $text;
}

function actualite_notify_project_likers(PDO $pdo, int $projectId, int $ownerCin, string $projectTitle, string $updateTitle, string $note): void
{
    $stmt = $pdo->prepare(
        "SELECT DISTINCT CAST(num_cin AS CHAR) AS num_cin
         FROM vote_projet
         WHERE id_projet = :id AND type_vote = 'like' AND num_cin <> :owner"
    );
    $stmt->execute(['id' => $projectId, 'owner' => $ownerCin]);
    $likers = array_values(array_filter($stmt->fetchAll(PDO::FETCH_COLUMN), static function ($cin): bool {
        return preg_match('/^\d{8}$/', (string) $cin) === 1;
    }));

    if (!$likers) {
        return;
    }

    $path = actualite_social_store_path();
    $handle = @fopen($path, 'c+');
    if (!$handle) {
        return;
    }

    flock($handle, LOCK_EX);
    rewind($handle);
    $json = stream_get_contents($handle);
    $store = actualite_normalize_social_store($json ? json_decode($json, true) : null);
    $now = gmdate('c');
    $projectTitle = trim($projectTitle) !== '' ? $projectTitle : 'un projet';
    $preview = actualite_preview_text($note);

    foreach ($likers as $likerCin) {
        $store['notifications'][] = [
            'id' => 'crowd_update_' . bin2hex(random_bytes(8)),
            'type' => 'crowdfunding_update',
            'toCin' => (string) $likerCin,
            'fromCin' => (string) $ownerCin,
            'title' => 'Projet mis à jour',
            'text' => $updateTitle . ' sur "' . $projectTitle . '"' . ($preview !== '' ? ' : ' . $preview : ''),
            'url' => actualite_social_url_for_project($projectId),
            'projectId' => (string) $projectId,
            'createdAt' => $now,
            'seenBy' => [],
        ];
    }

    if (count($store['notifications']) > 200) {
        $store['notifications'] = array_slice($store['notifications'], -200);
    }

    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
}

ProjetCrowdfunding::assurerColonnesSuivi($pdo);

if ($action === 'getByProjet' && isset($_GET['id'])) {
    $idProjet = (int) $_GET['id'];
    if ($idProjet <= 0) {
        actualite_json(['success' => false, 'updates' => []], 400);
    }

    try {
        $stmt = $pdo->prepare(
            "SELECT id_actualite, id_projet, titre_actu, contenu_actu, photo_url, date_actualite
             FROM actualite_projet
             WHERE id_projet = :id
             ORDER BY date_actualite ASC, id_actualite ASC"
        );
        $stmt->execute(['id' => $idProjet]);
        actualite_json(['success' => true, 'updates' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (PDOException $e) {
        actualite_json(['success' => false, 'updates' => []], 500);
    }
}

if ($action === 'add' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $cin = actualite_current_cin();
    if ($cin === null) {
        actualite_json(['success' => false, 'error' => 'non_authentifie'], 401);
    }

    $idProjet = (int) ($_POST['id_projet'] ?? 0);
    $contenu = trim((string) ($_POST['contenu_actu'] ?? ''));

    if ($idProjet <= 0 || strlen($contenu) < 2) {
        actualite_json(['success' => false, 'error' => 'validation'], 400);
    }

    $project = actualite_fetch_project($pdo, $idProjet);
    if (!$project || (int) ($project['num_cin'] ?? 0) !== $cin) {
        actualite_json(['success' => false, 'error' => 'owner_required'], 403);
    }

    $photoUrl = actualite_upload_image($_FILES['photo_actualite'] ?? null);
    if ($photoUrl === null) {
        actualite_json(['success' => false, 'error' => 'image'], 400);
    }

    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM actualite_projet WHERE id_projet = :id");
        $stmt->execute(['id' => $idProjet]);
        $nextNumber = (int) $stmt->fetchColumn() + 1;

        $insert = $pdo->prepare(
            "INSERT INTO actualite_projet (id_projet, titre_actu, contenu_actu, photo_url, date_actualite)
             VALUES (:id_projet, :titre, :contenu, :photo, NOW())"
        );
        $updateTitle = 'Mise à jour ' . $nextNumber;
        $insert->execute([
            'id_projet' => $idProjet,
            'titre' => $updateTitle,
            'contenu' => $contenu,
            'photo' => $photoUrl,
        ]);

        $idActualite = (int) $pdo->lastInsertId();
        try {
            actualite_notify_project_likers($pdo, $idProjet, $cin, (string) ($project['titre'] ?? ''), $updateTitle, $contenu);
        } catch (Throwable $e) {
            error_log('Erreur notification actualite crowdfunding : ' . $e->getMessage());
        }
        $stmt = $pdo->prepare(
            "SELECT id_actualite, id_projet, titre_actu, contenu_actu, photo_url, date_actualite
             FROM actualite_projet
             WHERE id_actualite = :id"
        );
        $stmt->execute(['id' => $idActualite]);
        actualite_json(['success' => true, 'update' => $stmt->fetch(PDO::FETCH_ASSOC)]);
    } catch (PDOException $e) {
        actualite_json(['success' => false, 'error' => 'database'], 500);
    }
}

actualite_json(['success' => false, 'error' => 'Action inconnue'], 400);
