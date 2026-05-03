<?php
declare(strict_types=1);

class AssistanceStore
{
    public static function ensureTables(PDO $pdo): void
    {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS assistance_ticket (
                id_ticket INT AUTO_INCREMENT PRIMARY KEY,
                num_cin INT NOT NULL,
                sujet VARCHAR(160) NOT NULL,
                description TEXT NOT NULL,
                categorie VARCHAR(60) NOT NULL DEFAULT 'general',
                statut VARCHAR(30) NOT NULL DEFAULT 'ouvert',
                moderation VARCHAR(30) NOT NULL DEFAULT 'fine',
                admin_reponse TEXT NULL,
                admin_cin INT NULL,
                date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                date_reponse DATETIME NULL,
                date_maj DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_assistance_ticket_user (num_cin),
                INDEX idx_assistance_ticket_statut (statut),
                INDEX idx_assistance_ticket_moderation (moderation)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS assistance_robot_chat (
                id_chat INT AUTO_INCREMENT PRIMARY KEY,
                num_cin INT NULL,
                message_utilisateur TEXT NOT NULL,
                reponse_robot TEXT NOT NULL,
                source_reponse VARCHAR(30) NOT NULL DEFAULT 'robot',
                date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_assistance_robot_user (num_cin),
                INDEX idx_assistance_robot_date (date_creation)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    }

    public static function createTicket(PDO $pdo, int $cin, string $subject, string $description, string $category): int
    {
        self::ensureTables($pdo);

        $stmt = $pdo->prepare(
            "INSERT INTO assistance_ticket (num_cin, sujet, description, categorie)
             VALUES (:cin, :subject, :description, :category)"
        );
        $stmt->execute([
            'cin' => $cin,
            'subject' => $subject,
            'description' => $description,
            'category' => $category,
        ]);

        return (int) $pdo->lastInsertId();
    }

    public static function getUserTickets(PDO $pdo, int $cin): array
    {
        self::ensureTables($pdo);

        $stmt = $pdo->prepare(
            "SELECT id_ticket, sujet, description, categorie, statut, moderation,
                    admin_reponse, date_creation, date_reponse, date_maj
             FROM assistance_ticket
             WHERE num_cin = :cin
               AND moderation <> 'deleted'
             ORDER BY date_maj DESC, date_creation DESC"
        );
        $stmt->execute(['cin' => $cin]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public static function getAdminTickets(PDO $pdo): array
    {
        self::ensureTables($pdo);

        $stmt = $pdo->query(
            "SELECT t.id_ticket, t.num_cin, c.nom, c.prenom, c.email,
                    t.sujet, t.description, t.categorie, t.statut, t.moderation,
                    t.admin_reponse, t.admin_cin, t.date_creation, t.date_reponse, t.date_maj
             FROM assistance_ticket t
             LEFT JOIN citoyen c ON c.num_cin = t.num_cin
             WHERE t.moderation <> 'deleted'
             ORDER BY
                CASE WHEN t.statut IN ('ouvert', 'en_cours') THEN 0 ELSE 1 END,
                t.date_maj DESC,
                t.date_creation DESC"
        );

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public static function updateTicket(PDO $pdo, int $ticketId, int $adminCin, string $reply, string $status, string $moderation): bool
    {
        self::ensureTables($pdo);

        $allowedStatuses = ['ouvert', 'en_cours', 'resolu', 'ferme'];
        $allowedModeration = ['fine', 'flagged', 'banned', 'deleted'];

        if (!in_array($status, $allowedStatuses, true)) {
            $status = 'en_cours';
        }
        if (!in_array($moderation, $allowedModeration, true)) {
            $moderation = 'fine';
        }

        $stmt = $pdo->prepare(
            "UPDATE assistance_ticket
             SET admin_reponse = :reply,
                 admin_cin = :admin_cin,
                 statut = :status,
                 moderation = :moderation,
                 date_reponse = CASE WHEN :reply_has_text = 1 THEN NOW() ELSE date_reponse END
             WHERE id_ticket = :id"
        );

        return $stmt->execute([
            'reply' => $reply !== '' ? $reply : null,
            'admin_cin' => $adminCin,
            'status' => $status,
            'moderation' => $moderation,
            'reply_has_text' => $reply !== '' ? 1 : 0,
            'id' => $ticketId,
        ]);
    }

    public static function logRobotChat(PDO $pdo, ?int $cin, string $message, string $reply, string $source): void
    {
        self::ensureTables($pdo);

        $stmt = $pdo->prepare(
            "INSERT INTO assistance_robot_chat (num_cin, message_utilisateur, reponse_robot, source_reponse)
             VALUES (:cin, :message, :reply, :source)"
        );
        $stmt->execute([
            'cin' => $cin,
            'message' => self::limitText($message, 1800),
            'reply' => self::limitText($reply, 2400),
            'source' => self::limitText($source, 30),
        ]);
    }

    public static function getUserRobotChats(PDO $pdo, int $cin): array
    {
        self::ensureTables($pdo);

        $stmt = $pdo->prepare(
            "SELECT id_chat, message_utilisateur, reponse_robot, source_reponse, date_creation
             FROM assistance_robot_chat
             WHERE num_cin = :cin
             ORDER BY date_creation DESC
             LIMIT 30"
        );
        $stmt->execute(['cin' => $cin]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public static function getAdminRobotChats(PDO $pdo): array
    {
        self::ensureTables($pdo);

        $stmt = $pdo->query(
            "SELECT r.id_chat, r.num_cin, c.nom, c.prenom, c.email,
                    r.message_utilisateur, r.reponse_robot, r.source_reponse, r.date_creation
             FROM assistance_robot_chat r
             LEFT JOIN citoyen c ON c.num_cin = r.num_cin
             ORDER BY r.date_creation DESC
             LIMIT 200"
        );

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public static function getCounts(PDO $pdo): array
    {
        self::ensureTables($pdo);

        return [
            'open_human' => self::count($pdo, "SELECT COUNT(*) FROM assistance_ticket WHERE statut IN ('ouvert', 'en_cours') AND moderation <> 'deleted'"),
            'flagged' => self::count($pdo, "SELECT COUNT(*) FROM assistance_ticket WHERE moderation = 'flagged'"),
            'robot_chats' => self::count($pdo, "SELECT COUNT(*) FROM assistance_robot_chat"),
        ];
    }

    private static function count(PDO $pdo, string $sql): int
    {
        try {
            return (int) $pdo->query($sql)->fetchColumn();
        } catch (Throwable $e) {
            return 0;
        }
    }

    private static function limitText(string $text, int $max): string
    {
        $text = trim($text);
        if (function_exists('mb_strlen') && mb_strlen($text, 'UTF-8') > $max) {
            return mb_substr($text, 0, $max, 'UTF-8');
        }

        if (!function_exists('mb_strlen') && strlen($text) > $max) {
            return substr($text, 0, $max);
        }

        return $text;
    }
}
