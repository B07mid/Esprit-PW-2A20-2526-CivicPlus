<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../User/config/config.php';
require_once __DIR__ . '/../model/AssistanceStore.php';

function assistance_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function assistance_current_cin(): ?int
{
    if (!empty($_SESSION['user_id']) && is_numeric($_SESSION['user_id'])) {
        return (int) $_SESSION['user_id'];
    }

    if (!empty($_SESSION['cin']) && is_numeric($_SESSION['cin'])) {
        return (int) $_SESSION['cin'];
    }

    return null;
}

function assistance_is_admin(PDO $pdo): bool
{
    if (strtolower((string) ($_SESSION['role'] ?? '')) === 'admin') {
        return true;
    }

    $cin = assistance_current_cin();
    if ($cin === null) {
        return false;
    }

    try {
        $stmt = $pdo->prepare(
            "SELECT nom, email, statut_compte, niveau_badge
             FROM citoyen
             WHERE num_cin = :cin
             LIMIT 1"
        );
        $stmt->execute(['cin' => $cin]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            return false;
        }

        return ($user['niveau_badge'] ?? '') === 'Admin'
            || ($user['statut_compte'] ?? '') === 'Admin'
            || ($user['email'] ?? '') === 'admin@civicplus.com'
            || strtolower((string) ($user['nom'] ?? '')) === 'admin';
    } catch (Throwable $e) {
        return false;
    }
}

function assistance_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $json = json_decode($raw, true);

    if (is_array($json)) {
        return $json;
    }

    return $_POST ?: [];
}

function assistance_clean_text($value, int $min, int $max, string $label): string
{
    $text = trim((string) $value);
    $length = function_exists('mb_strlen') ? mb_strlen($text, 'UTF-8') : strlen($text);

    if ($length < $min) {
        assistance_json(['success' => false, 'message' => $label . ' est trop court.'], 422);
    }
    if ($length > $max) {
        assistance_json(['success' => false, 'message' => $label . ' est trop long.'], 422);
    }

    return $text;
}

$cin = assistance_current_cin();
if ($cin === null) {
    assistance_json(['success' => false, 'message' => 'Connexion requise.'], 401);
}

try {
    AssistanceStore::ensureTables($pdo);
} catch (Throwable $e) {
    assistance_json(['success' => false, 'message' => 'Impossible de preparer le module Assistance.'], 500);
}

$action = (string) ($_GET['action'] ?? '');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'mine') {
            assistance_json([
                'success' => true,
                'tickets' => AssistanceStore::getUserTickets($pdo, $cin),
                'robotChats' => AssistanceStore::getUserRobotChats($pdo, $cin),
            ]);
        }

        if ($action === 'adminTickets') {
            if (!assistance_is_admin($pdo)) {
                assistance_json(['success' => false, 'message' => 'Acces admin requis.'], 403);
            }

            assistance_json([
                'success' => true,
                'tickets' => AssistanceStore::getAdminTickets($pdo),
                'counts' => AssistanceStore::getCounts($pdo),
            ]);
        }

        if ($action === 'adminRobot') {
            if (!assistance_is_admin($pdo)) {
                assistance_json(['success' => false, 'message' => 'Acces admin requis.'], 403);
            }

            assistance_json([
                'success' => true,
                'chats' => AssistanceStore::getAdminRobotChats($pdo),
                'counts' => AssistanceStore::getCounts($pdo),
            ]);
        }

        assistance_json(['success' => false, 'message' => 'Action inconnue.'], 404);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        assistance_json(['success' => false, 'message' => 'Methode non autorisee.'], 405);
    }

    $input = assistance_input();

    if ($action === 'createTicket') {
        $subject = assistance_clean_text($input['sujet'] ?? '', 5, 160, 'Le sujet');
        $description = assistance_clean_text($input['description'] ?? '', 12, 3000, 'La description');
        $category = assistance_clean_text($input['categorie'] ?? 'general', 2, 60, 'La categorie');

        $id = AssistanceStore::createTicket($pdo, $cin, $subject, $description, $category);
        assistance_json([
            'success' => true,
            'message' => 'Votre demande a ete envoyee a l equipe assistance.',
            'id_ticket' => $id,
        ]);
    }

    if ($action === 'updateTicket') {
        if (!assistance_is_admin($pdo)) {
            assistance_json(['success' => false, 'message' => 'Acces admin requis.'], 403);
        }

        $ticketId = (int) ($input['id_ticket'] ?? 0);
        if ($ticketId <= 0) {
            assistance_json(['success' => false, 'message' => 'Ticket invalide.'], 422);
        }

        $reply = trim((string) ($input['admin_reponse'] ?? ''));
        if ($reply !== '') {
            $reply = assistance_clean_text($reply, 2, 3000, 'La reponse');
        }

        $updated = AssistanceStore::updateTicket(
            $pdo,
            $ticketId,
            $cin,
            $reply,
            (string) ($input['statut'] ?? 'en_cours'),
            (string) ($input['moderation'] ?? 'fine')
        );

        assistance_json([
            'success' => $updated,
            'message' => $updated ? 'Ticket mis a jour.' : 'Mise a jour impossible.',
        ], $updated ? 200 : 500);
    }

    assistance_json(['success' => false, 'message' => 'Action inconnue.'], 404);
} catch (Throwable $e) {
    assistance_json(['success' => false, 'message' => 'Erreur assistance.'], 500);
}
