<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/Modules/E-Administration/config/config.php';

function admin_count(PDO $pdo, string $sql, array $params = []): int
{
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    } catch (Throwable $e) {
        return 0;
    }
}

$counts = [
    'users_pending' => admin_count(
        $pdo,
        "SELECT COUNT(*) FROM inscriptions_citoyens_en_attente WHERE date_expiration >= NOW()"
    ),
    'eadmin_pending' => admin_count(
        $pdo,
        "SELECT COUNT(*) FROM demande_document WHERE statut_actuel = 'en_attente'"
    ),
    'transport_pending' => admin_count(
        $pdo,
        "SELECT COUNT(*) FROM signalement_transport WHERE pris_en_compte_ia = 0"
    ),
    'signalement_pending' => admin_count(
        $pdo,
        "SELECT COUNT(*) FROM signalement WHERE statut = 'ouvert'"
    ),
    'intervention_pending' => admin_count(
        $pdo,
        "SELECT COUNT(*) FROM intervention_maintenance WHERE statut_intervention = 'en_attente'"
    ),
    'crowdfunding_projects_pending' => admin_count(
        $pdo,
        "SELECT COUNT(*) FROM projet_crowdfunding WHERE statut_projet = 'en_recherche_financement'"
    ),
    'crowdfunding_donations_pending' => admin_count(
        $pdo,
        "SELECT COUNT(*) FROM donation WHERE statut_paiement = 'en_attente'"
    ),
    'crowdfunding_comments_pending' => admin_count(
        $pdo,
        "SELECT COUNT(*) FROM commentaire_projet WHERE statut IS NULL OR statut = 'visible'"
    ),
    'assistance_pending' => admin_count(
        $pdo,
        "SELECT COUNT(*) FROM assistance_ticket WHERE statut IN ('ouvert', 'en_cours') AND moderation <> 'deleted'"
    ),
];

$counts['signalement_total_pending'] = $counts['signalement_pending'] + $counts['intervention_pending'];
$counts['crowdfunding_total_pending'] =
    $counts['crowdfunding_projects_pending']
    + $counts['crowdfunding_donations_pending']
    + $counts['crowdfunding_comments_pending'];
$counts['admin_total_pending'] =
    $counts['users_pending']
    + $counts['eadmin_pending']
    + $counts['transport_pending']
    + $counts['signalement_total_pending']
    + $counts['crowdfunding_total_pending']
    + $counts['assistance_pending'];

echo json_encode([
    'success' => true,
    'counts' => $counts,
], JSON_UNESCAPED_UNICODE);
