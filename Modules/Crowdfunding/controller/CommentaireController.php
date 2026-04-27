<?php
ob_start();
session_start();
require_once '../config/config.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

// ── GET : tous les commentaires (admin) ──────────────────────────────────────
if ($action === 'getAll') {
    try {
        $stmt = $pdo->query(
            "SELECT cp.id_commentaire, cp.num_cin, cp.id_projet, cp.contenu, cp.date_publication,
                    CONCAT(c.prenom, ' ', c.nom) AS auteur,
                    p.titre AS titre_projet
             FROM commentaire_projet cp
             LEFT JOIN citoyen c ON c.num_cin = cp.num_cin
             LEFT JOIN projet_crowdfunding p ON p.id_projet = cp.id_projet
             ORDER BY cp.date_publication DESC"
        );
        ob_clean();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        ob_clean();
        echo json_encode([]);
    }
    exit;
}

// ── DELETE : supprimer un commentaire ────────────────────────────────────────
if ($action === 'delete' && isset($_GET['id'])) {
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


if ($action === 'getByProjet' && isset($_GET['id'])) {
    $id_projet = intval($_GET['id']);
    try {
        $stmt = $pdo->prepare(
            "SELECT cp.id_commentaire, cp.num_cin, cp.contenu, cp.date_publication,
                    CONCAT(c.prenom, ' ', c.nom) AS auteur
             FROM commentaire_projet cp
             LEFT JOIN citoyen c ON c.num_cin = cp.num_cin
             WHERE cp.id_projet = :id
             ORDER BY cp.date_publication ASC"
        );
        $stmt->execute(['id' => $id_projet]);
        ob_clean();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        ob_clean();
        echo json_encode([]);
    }
    exit;
}

// ── POST : ajouter un commentaire ────────────────────────────────────────────
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

    if ($id_projet <= 0 || $contenu === '') {
        ob_clean();
        http_response_code(400);
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }

    $contenu = htmlspecialchars($contenu, ENT_QUOTES, 'UTF-8');

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO commentaire_projet (num_cin, id_projet, contenu, date_publication)
             VALUES (:num_cin, :id_projet, :contenu, NOW())"
        );
        $stmt->execute(['num_cin' => $num_cin, 'id_projet' => $id_projet, 'contenu' => $contenu]);
        $newId = (int) $pdo->lastInsertId();

        $stmt2 = $pdo->prepare(
            "SELECT cp.id_commentaire, cp.num_cin, cp.contenu, cp.date_publication,
                    CONCAT(c.prenom, ' ', c.nom) AS auteur
             FROM commentaire_projet cp
             LEFT JOIN citoyen c ON c.num_cin = cp.num_cin
             WHERE cp.id_commentaire = :id"
        );
        $stmt2->execute(['id' => $newId]);
        ob_clean();
        echo json_encode(['success' => true, 'comment' => $stmt2->fetch(PDO::FETCH_ASSOC)]);
    } catch (PDOException $e) {
        ob_clean();
        echo json_encode(['error' => 'Erreur lors de l\'ajout du commentaire']);
    }
    exit;
}

ob_clean();
http_response_code(400);
echo json_encode(['error' => 'Action inconnue']);
