<?php
ob_start();
session_start();
require_once '../config/config.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

// ── GET : tous les commentaires (admin) ──────────────────────────────────────
// Retourne tous les commentaires avec le nom de l'auteur, son statut de compte et le titre du projet.
// Utilisé par la page liste_commentaires.html pour peupler le tableau backoffice.
if ($action === 'getAll') {
    try {
        $stmt = $pdo->query(
            "SELECT cp.id_commentaire, cp.num_cin, cp.id_projet, cp.contenu, cp.date_publication,
                    cp.statut,
                    CONCAT(c.prenom, ' ', c.nom) AS auteur,
                    c.statut_compte,
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

// ── DELETE : supprimer un commentaire ────────────────────────────────────────// Supprime définitivement un commentaire par son ID (paramètre GET 'id').
// Appelé depuis le bouton Supprimer de la liste des commentaires en backoffice.if ($action === 'delete' && isset($_GET['id'])) {
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

// ── POST : modifier le contenu d'un commentaire ──────────────────────────────// Met à jour le texte d'un commentaire existant après sanitization XSS.
// Appelé depuis le modal d'édition de la page liste_commentaires.html.if ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id      = intval($_POST['id'] ?? 0);
    $contenu = trim($_POST['contenu'] ?? '');
    if ($id <= 0 || $contenu === '') {
        ob_clean(); echo json_encode(['success' => false]); exit;
    }
    $contenu = htmlspecialchars($contenu, ENT_QUOTES, 'UTF-8');
    try {
        $stmt = $pdo->prepare("UPDATE commentaire_projet SET contenu = :contenu WHERE id_commentaire = :id");
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

    if ($id_projet <= 0 || $contenu === '') {
        ob_clean();
        http_response_code(400);
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }

    $contenu = htmlspecialchars($contenu, ENT_QUOTES, 'UTF-8');

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
