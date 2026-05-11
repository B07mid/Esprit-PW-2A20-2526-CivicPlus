<?php
ob_start();
session_start();
require_once '../config/config.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

function crowdfunding_base_path(): string
{
    $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
    $base = preg_replace('#/Modules/Crowdfunding/controller/[^/]+$#', '', $script);

    if ($base === null || $base === '/' || $base === '.') {
        return '';
    }

    return rtrim($base, '/');
}

function crowdfunding_public_url(?string $path): string
{
    $base = crowdfunding_base_path();
    $fallback = ($base !== '' ? $base : '') . '/assets/img/RawShape.png';
    $path = trim((string) $path);

    if ($path === '') {
        return $fallback;
    }

    $path = str_replace('\\', '/', $path);

    if (preg_match('#^https?://#i', $path) || strpos($path, '//') === 0) {
        return $path;
    }

    $assetsPos = stripos($path, '/assets/');
    if ($assetsPos !== false && strpos($path, '/assets/') !== 0) {
        $path = substr($path, $assetsPos + 1);
    }

    $path = preg_replace('#^(\./|\../)+#', '', $path);

    if (strpos($path, '/') === 0) {
        if ($base !== '' && strpos($path, $base . '/') === 0) {
            return $path;
        }

        if ($base !== '' && stripos($path, '/assets/') === 0) {
            return $base . $path;
        }

        return $path;
    }

    return ($base !== '' ? $base . '/' : '/') . ltrim($path, '/');
}

function commentaire_with_photo_url(array $comment): array
{
    $comment['auteur_photo_url'] = crowdfunding_public_url($comment['auteur_photo'] ?? '');
    return $comment;
}

function crowdfunding_contains_profanity(string $text): bool
{
    $normalized = strtolower(html_entity_decode($text, ENT_QUOTES, 'UTF-8'));
    $normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $normalized) ?: $normalized;

    $terms = [
        'fuck', 'fucking', 'shit', 'bullshit', 'asshole', 'bitch', 'bastard',
        'dick', 'pussy', 'cunt', 'slut', 'whore', 'motherfucker', 'damn',
        'merde', 'putain', 'pute', 'salope', 'connard', 'connasse', 'con',
        'batard', 'encule', 'enculee', 'nique', 'ta gueule', 'bordel',
    ];

    foreach ($terms as $term) {
        $pattern = '/(^|[^a-z0-9])' . preg_quote($term, '/') . '([^a-z0-9]|$)/i';
        if (preg_match($pattern, $normalized)) {
            return true;
        }
    }

    return false;
}

function crowdfunding_current_user_is_admin(PDO $pdo): bool
{
    if (strtolower((string) ($_SESSION['role'] ?? '')) === 'admin') {
        return true;
    }

    $numCin = $_SESSION['cin'] ?? ($_SESSION['user_id'] ?? null);
    if ($numCin === null || !preg_match('/^\d+$/', (string) $numCin)) {
        return false;
    }

    try {
        $stmt = $pdo->prepare(
            "SELECT nom, email, statut_compte, niveau_badge
             FROM citoyen
             WHERE num_cin = :cin
             LIMIT 1"
        );
        $stmt->execute(['cin' => $numCin]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            return false;
        }

        return ($user['niveau_badge'] ?? '') === 'Admin'
            || ($user['statut_compte'] ?? '') === 'Admin'
            || ($user['email'] ?? '') === 'admin@civicplus.com'
            || strtolower((string) ($user['nom'] ?? '')) === 'admin';
    } catch (PDOException $e) {
        return false;
    }
}

// ── GET : tous les commentaires (admin) ──────────────────────────────────────
// Retourne tous les commentaires avec le nom de l'auteur, son statut de compte et le titre du projet.
// Utilisé par la page liste_commentaires.html pour peupler le tableau backoffice.
if ($action === 'getAll') {
    try {
        $stmt = $pdo->query(
            "SELECT cp.id_commentaire, cp.num_cin, cp.id_projet, cp.contenu, cp.date_publication,
                    cp.statut,
                    CONCAT(c.prenom, ' ', c.nom) AS auteur,
                    c.photo AS auteur_photo,
                    c.citoyen_id AS auteur_citoyen_id,
                    c.statut_compte,
                    p.titre AS titre_projet
             FROM commentaire_projet cp
             LEFT JOIN citoyen c ON c.num_cin = cp.num_cin
             INNER JOIN projet_crowdfunding p ON p.id_projet = cp.id_projet
             ORDER BY cp.date_publication DESC"
        );
        ob_clean();
        echo json_encode(array_map('commentaire_with_photo_url', $stmt->fetchAll(PDO::FETCH_ASSOC)));
    } catch (PDOException $e) {
        ob_clean();
        echo json_encode([]);
    }
    exit;
}

// ── DELETE : supprimer un commentaire ────────────────────────────────────────
// Supprime définitivement un commentaire par son ID (paramètre GET 'id').
// Appelé depuis le bouton Supprimer de la liste des commentaires en backoffice.
if ($action === 'delete' && isset($_GET['id'])) {
    if (!crowdfunding_current_user_is_admin($pdo)) {
        ob_clean();
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'admin_required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM commentaire_projet WHERE id_commentaire = :id");
        $stmt->execute(['id' => intval($_GET['id'])]);
        ob_clean();
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        ob_clean();
        echo json_encode(['success' => false]);
    }
    exit;
}

// ── POST : modifier le contenu d'un commentaire ──────────────────────────────
// Met à jour le texte d'un commentaire existant après sanitization XSS.
// Appelé depuis le modal d'édition de la page liste_commentaires.html.
if ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!crowdfunding_current_user_is_admin($pdo)) {
        ob_clean();
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'admin_required']);
        exit;
    }

    $id      = intval($_POST['id'] ?? 0);
    $contenu = trim($_POST['contenu'] ?? '');
    if ($id <= 0 || $contenu === '') {
        ob_clean(); echo json_encode(['success' => false]); exit;
    }
    $hasProfanity = crowdfunding_contains_profanity($contenu);
    $contenu = $hasProfanity ? '***************' : htmlspecialchars($contenu, ENT_QUOTES, 'UTF-8');
    try {
        $statutSql = $hasProfanity ? ", statut = 'censure'" : ", statut = 'visible'";
        $stmt = $pdo->prepare("UPDATE commentaire_projet SET contenu = :contenu{$statutSql} WHERE id_commentaire = :id");
        $stmt->execute(['contenu' => $contenu, 'id' => $id]);
        ob_clean(); echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        ob_clean(); echo json_encode(['success' => false]);
    }
    exit;
}

// ── GET : bloquer / débloquer un commentaire + l'utilisateur ────────────────
// Bascule le statut du commentaire entre 'visible' et 'bloqué'.
// Simultанément, bloque ou débloque le compte citoyen (statut_compte = 'bloqué_commentaires')
// pour qu'il ne puisse plus poster de nouveaux commentaires sur aucun projet.
if ($action === 'block' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    try {
        $pdo->prepare("UPDATE commentaire_projet SET statut = IF(statut='visible','bloqué','visible') WHERE id_commentaire = :id")
            ->execute(['id' => $id]);
        $row = $pdo->prepare("SELECT statut, num_cin FROM commentaire_projet WHERE id_commentaire = :id");
        $row->execute(['id' => $id]);
        $comment = $row->fetch(PDO::FETCH_ASSOC);
        $statut  = $comment['statut'];
        $num_cin = $comment['num_cin'];
        // Block / unblock the user account for comments
        if ($statut === 'bloqué') {
            $pdo->prepare("UPDATE citoyen SET statut_compte = 'bloqué_commentaires' WHERE num_cin = :cin")
                ->execute(['cin' => $num_cin]);
        } else {
            $pdo->prepare("UPDATE citoyen SET statut_compte = 'actif' WHERE num_cin = :cin AND statut_compte = 'bloqué_commentaires'")
                ->execute(['cin' => $num_cin]);
        }
        ob_clean(); echo json_encode(['success' => true, 'statut' => $statut]);
    } catch (PDOException $e) {
        ob_clean(); echo json_encode(['success' => false]);
    }
    exit;
}

if ($action === 'getByProjet' && isset($_GET['id'])) {
    // Retourne tous les commentaires visibles d'un projet spécifique pour la vue citoyen.
    // Utilisé par le modal projet dans citoyen_liste_projets.js pour afficher les commentaires.
    $id_projet = intval($_GET['id']);
    $isAdmin = crowdfunding_current_user_is_admin($pdo);
    $visibilitySql = $isAdmin ? '' : "AND (cp.statut IS NULL OR cp.statut IN ('visible', 'censure'))";

    try {
        $stmt = $pdo->prepare(
            "SELECT cp.id_commentaire, cp.num_cin, cp.contenu, cp.date_publication, cp.statut,
                    CONCAT(c.prenom, ' ', c.nom) AS auteur,
                    c.photo AS auteur_photo,
                    c.citoyen_id AS auteur_citoyen_id
             FROM commentaire_projet cp
             LEFT JOIN citoyen c ON c.num_cin = cp.num_cin
             WHERE cp.id_projet = :id
               $visibilitySql
             ORDER BY cp.date_publication ASC"
        );
        $stmt->execute(['id' => $id_projet]);
        ob_clean();
        echo json_encode(array_map('commentaire_with_photo_url', $stmt->fetchAll(PDO::FETCH_ASSOC)));
    } catch (PDOException $e) {
        ob_clean();
        echo json_encode([]);
    }
    exit;
}

// ── POST : ajouter un commentaire ────────────────────────────────────────────
// Enregistre un nouveau commentaire posté par un citoyen connecté sur un projet.
// Vérifie l'authentification via session, refuse si le compte est bloqué_commentaires,
// sanitize le contenu, puis retourne le commentaire inséré en JSON.
if ($action === 'add' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user_id'])) {
        ob_clean();
        http_response_code(401);
        echo json_encode(['error' => 'non_authentifie']);
        exit;
    }

    $num_cin   = intval($_SESSION['user_id']);
    $id_projet = intval($_POST['id_projet'] ?? 0);
    $contenu   = trim($_POST['contenu'] ?? '');

    if ($id_projet <= 0 || strlen($contenu) < 2) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }

    $hasProfanity = crowdfunding_contains_profanity($contenu);
    $contenu = $hasProfanity ? '***************' : htmlspecialchars($contenu, ENT_QUOTES, 'UTF-8');
    $statut = $hasProfanity ? 'censure' : 'visible';

    // Reject if the user is blocked from commenting
    $checkStmt = $pdo->prepare("SELECT statut_compte FROM citoyen WHERE num_cin = :cin");
    $checkStmt->execute(['cin' => $num_cin]);
    $userStatut = $checkStmt->fetchColumn();
    if ($userStatut === 'bloqué_commentaires') {
        ob_clean();
        http_response_code(403);
        echo json_encode(['error' => 'compte_bloqué']);
        exit;
    }

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO commentaire_projet (num_cin, id_projet, contenu, date_publication, statut)
             VALUES (:num_cin, :id_projet, :contenu, NOW(), :statut)"
        );
        $stmt->execute(['num_cin' => $num_cin, 'id_projet' => $id_projet, 'contenu' => $contenu, 'statut' => $statut]);
        $newId = (int) $pdo->lastInsertId();

        $stmt2 = $pdo->prepare(
            "SELECT cp.id_commentaire, cp.num_cin, cp.contenu, cp.date_publication, cp.statut,
                    CONCAT(c.prenom, ' ', c.nom) AS auteur,
                    c.photo AS auteur_photo,
                    c.citoyen_id AS auteur_citoyen_id
             FROM commentaire_projet cp
             LEFT JOIN citoyen c ON c.num_cin = cp.num_cin
             WHERE cp.id_commentaire = :id"
        );
        $stmt2->execute(['id' => $newId]);
        ob_clean();
        $comment = $stmt2->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'comment' => $comment ? commentaire_with_photo_url($comment) : null]);
    } catch (PDOException $e) {
        ob_clean();
        echo json_encode(['error' => 'Erreur lors de l\'ajout du commentaire']);
    }
    exit;
}

ob_clean();
http_response_code(400);
echo json_encode(['error' => 'Action inconnue']);
