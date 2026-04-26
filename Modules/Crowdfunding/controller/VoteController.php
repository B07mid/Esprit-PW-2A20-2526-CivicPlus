<?php
ob_start();
session_start();
require_once '../config/config.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

// ── GET : counts for every project at once ───────────────────────────────────
if ($action === 'allCounts') {
    $num_cin = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;
    try {
        $stmt = $pdo->query(
            "SELECT id_projet, type_vote, COUNT(*) AS cnt
             FROM vote_projet
             GROUP BY id_projet, type_vote"
        );
        $result = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $id = $row['id_projet'];
            if (!isset($result[$id])) $result[$id] = ['like' => 0, 'dislike' => 0, 'user_vote' => null];
            $result[$id][$row['type_vote']] = (int) $row['cnt'];
        }
        if ($num_cin) {
            $stmt2 = $pdo->prepare(
                "SELECT id_projet, type_vote FROM vote_projet WHERE num_cin = :cin"
            );
            $stmt2->execute(['cin' => $num_cin]);
            foreach ($stmt2->fetchAll(PDO::FETCH_ASSOC) as $uv) {
                $id = $uv['id_projet'];
                if (!isset($result[$id])) $result[$id] = ['like' => 0, 'dislike' => 0, 'user_vote' => null];
                $result[$id]['user_vote'] = $uv['type_vote'];
            }
        }
        ob_clean();
        echo json_encode($result);
    } catch (PDOException $e) {
        ob_clean();
        echo json_encode([]);
    }
    exit;
}

// ── POST : cast / toggle a vote ──────────────────────────────────────────────
// Enregistre, change ou annule le vote (like/dislike) d'un citoyen sur un projet.
// Si le même vote est soumis deux fois, il est supprimé (toggle off).
// Nécessite une session active; retourne les nouveaux compteurs du projet concerné.
if ($action === 'vote' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user_id'])) {
        ob_clean();
        http_response_code(401);
        echo json_encode(['error' => 'non_authentifie']);
        exit;
    }

    $num_cin   = intval($_SESSION['user_id']);
    $id_projet = intval($_POST['id_projet'] ?? 0);
    $type_vote = $_POST['type_vote'] ?? '';

    if ($id_projet <= 0 || !in_array($type_vote, ['like', 'dislike'], true)) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }

    try {
        // Check for an existing vote by this user on this project
        $stmt = $pdo->prepare(
            "SELECT id_vote, type_vote FROM vote_projet WHERE id_projet = :id AND num_cin = :cin"
        );
        $stmt->execute(['id' => $id_projet, 'cin' => $num_cin]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        $user_vote = null;
        if ($existing) {
            if ($existing['type_vote'] === $type_vote) {
                // Same vote → toggle off
                $pdo->prepare("DELETE FROM vote_projet WHERE id_vote = :id")
                    ->execute(['id' => $existing['id_vote']]);
            } else {
                // Different vote → switch
                $pdo->prepare(
                    "UPDATE vote_projet SET type_vote = :tv, date_vote = NOW() WHERE id_vote = :id"
                )->execute(['tv' => $type_vote, 'id' => $existing['id_vote']]);
                $user_vote = $type_vote;
            }
        } else {
            // New vote
            $pdo->prepare(
                "INSERT INTO vote_projet (num_cin, id_projet, type_vote, date_vote)
                 VALUES (:cin, :id, :tv, NOW())"
            )->execute(['cin' => $num_cin, 'id' => $id_projet, 'tv' => $type_vote]);
            $user_vote = $type_vote;
        }

        // Return updated counts for this project
        $stmt2 = $pdo->prepare(
            "SELECT type_vote, COUNT(*) AS cnt FROM vote_projet
             WHERE id_projet = :id GROUP BY type_vote"
        );
        $stmt2->execute(['id' => $id_projet]);
        $counts = ['like' => 0, 'dislike' => 0, 'user_vote' => $user_vote];
        foreach ($stmt2->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $counts[$row['type_vote']] = (int) $row['cnt'];
        }

        ob_clean();
        echo json_encode(['success' => true, 'counts' => $counts]);
    } catch (PDOException $e) {
        ob_clean();
        echo json_encode(['error' => 'Erreur DB']);
    }
    exit;
}

ob_clean();
http_response_code(400);
echo json_encode(['error' => 'Action invalide']);
exit;
