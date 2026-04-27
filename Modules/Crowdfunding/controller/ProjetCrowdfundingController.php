<?php
ob_start();
session_start();
require_once '../Model/ProjetCrowdfunding.php';
require_once '../config/config.php';

// Auto-create demande_projet table if not exists
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS demande_projet (
        id_demande   INT AUTO_INCREMENT PRIMARY KEY,
        num_cin      BIGINT NOT NULL,
        titre        VARCHAR(255) NOT NULL,
        type_projet  VARCHAR(50) NOT NULL,
        description  TEXT NOT NULL,
        budget_cible DECIMAL(12,2) NOT NULL,
        ville        VARCHAR(100) NOT NULL,
        quartier     VARCHAR(100) NOT NULL,
        latitude     DECIMAL(10,7) DEFAULT NULL,
        longitude    DECIMAL(10,7) DEFAULT NULL,
        statut       ENUM('en_attente','acceptee','refusee') DEFAULT 'en_attente',
        date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (PDOException $e) {}

class ProjetCrowdfundingController {

    // R : Tous les projets (JSON)
    public function getAllAction($pdo) {
        ob_clean();
        header('Content-Type: application/json');
        echo json_encode(ProjetCrowdfunding::getAllProjets($pdo));
        exit();
    }

    // R : Un seul projet (JSON)
    public function getByIdAction($pdo) {
        if (isset($_GET['id'])) {
            ob_clean();
            header('Content-Type: application/json');
            echo json_encode(ProjetCrowdfunding::getProjetById($pdo, intval($_GET['id'])));
            exit();
        }
    }

    // C : Ajouter un projet (form POST -> redirect)
    public function addAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $allowed_types = ['infrastructure','sante','education','environnement','culture','sport','autre'];
            $type = in_array($_POST['type_projet'] ?? '', $allowed_types, true)
                    ? $_POST['type_projet'] : 'autre';
            $nouveau = new ProjetCrowdfunding(
                null,
                intval($_POST['num_cin']),
                htmlspecialchars(trim($_POST['titre'])),
                htmlspecialchars(trim($_POST['description'])),
                floatval($_POST['budget_cible']),
                0,
                'en_recherche_financement',
                htmlspecialchars(trim($_POST['ville'])),
                htmlspecialchars(trim($_POST['quartier'])),
                !empty($_POST['latitude'])  ? floatval($_POST['latitude'])  : null,
                !empty($_POST['longitude']) ? floatval($_POST['longitude']) : null,
                $type
            );
            if ($nouveau->ajouterProjet($pdo)) {
                ob_clean();
                header('Location: ../View/liste_projets.html?success=1');
                exit();
            }
        }
    }

    // U : Modifier statut/titre/etc. (JSON)
    public function updateAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $allowed_types = ['infrastructure','sante','education','environnement','culture','sport','autre'];
            $type = in_array($_POST['type_projet'] ?? '', $allowed_types, true)
                    ? $_POST['type_projet'] : 'autre';
            $modifie = new ProjetCrowdfunding(
                intval($_POST['id_projet']),
                null,
                htmlspecialchars(trim($_POST['titre']         ?? '')),
                htmlspecialchars(trim($_POST['description']   ?? '')),
                !empty($_POST['budget_cible']) ? floatval($_POST['budget_cible']) : null,
                0,
                htmlspecialchars(trim($_POST['statut_projet'] ?? '')),
                htmlspecialchars(trim($_POST['ville']         ?? '')),
                htmlspecialchars(trim($_POST['quartier']      ?? '')),
                null,
                null,
                $type
            );
            $succes = $modifie->modifierProjet($pdo);
            ob_clean();
            header('Content-Type: application/json');
            echo json_encode(['success' => $succes]);
            exit();
        }
    }

    // D : Supprimer un projet (JSON)
    public function deleteAction($pdo) {
        if (isset($_GET['id'])) {
            $succes = ProjetCrowdfunding::supprimerProjet($pdo, intval($_GET['id']));
            ob_clean();
            header('Content-Type: application/json');
            echo json_encode(['success' => $succes]);
            exit();
        }
    }
}

// =======================================================
// ROUTEUR INTERNE
// =======================================================
if (basename($_SERVER['PHP_SELF']) == 'ProjetCrowdfundingController.php') {
    $controller = new ProjetCrowdfundingController();

    if (isset($_GET['action'])) {
        if ($_GET['action'] === 'getAll')  $controller->getAllAction($pdo);
        if ($_GET['action'] === 'getById') $controller->getByIdAction($pdo);
        if ($_GET['action'] === 'delete')  $controller->deleteAction($pdo);

        if ($_GET['action'] === 'demandeCount') {
            try {
                $n = (int)$pdo->query("SELECT COUNT(*) FROM demande_projet WHERE statut = 'en_attente'")->fetchColumn();
                ob_clean(); header('Content-Type: application/json');
                echo json_encode(['count' => $n]);
            } catch (PDOException $e) {
                ob_clean(); header('Content-Type: application/json');
                echo json_encode(['count' => 0]);
            }
            exit;
        }

        if ($_GET['action'] === 'demandePending') {
            try {
                $stmt = $pdo->query("SELECT * FROM demande_projet WHERE statut = 'en_attente' ORDER BY date_demande DESC");
                ob_clean(); header('Content-Type: application/json');
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            } catch (PDOException $e) {
                ob_clean(); header('Content-Type: application/json');
                echo json_encode([]);
            }
            exit;
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $postAction = $_POST['action'] ?? '';

        // ── Citizen demande: form action has ?demande=1 ────────────────────
        if (isset($_GET['demande']) && $_GET['demande'] === '1') {
            $cin = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : intval($_POST['num_cin'] ?? 0);
            $allowed = ['infrastructure','sante','education','environnement','culture','sport','autre'];
            $type = in_array($_POST['type_projet'] ?? '', $allowed, true) ? $_POST['type_projet'] : 'autre';
            try {
                $stmt = $pdo->prepare(
                    "INSERT INTO demande_projet (num_cin,titre,type_projet,description,budget_cible,ville,quartier,latitude,longitude)
                     VALUES (:cin,:titre,:type,:desc,:budget,:ville,:quartier,:lat,:lng)"
                );
                $stmt->execute([
                    'cin'      => $cin,
                    'titre'    => htmlspecialchars(trim($_POST['titre']       ?? ''), ENT_QUOTES, 'UTF-8'),
                    'type'     => $type,
                    'desc'     => htmlspecialchars(trim($_POST['description'] ?? ''), ENT_QUOTES, 'UTF-8'),
                    'budget'   => floatval($_POST['budget_cible'] ?? 0),
                    'ville'    => htmlspecialchars(trim($_POST['ville']       ?? ''), ENT_QUOTES, 'UTF-8'),
                    'quartier' => htmlspecialchars(trim($_POST['quartier']    ?? ''), ENT_QUOTES, 'UTF-8'),
                    'lat'      => !empty($_POST['latitude'])  ? floatval($_POST['latitude'])  : null,
                    'lng'      => !empty($_POST['longitude']) ? floatval($_POST['longitude']) : null,
                ]);
                ob_clean();
                header('Location: ../View/citoyen_nouveau_projet.html?success=1');
            } catch (PDOException $e) {
                ob_clean();
                header('Location: ../View/citoyen_nouveau_projet.html?error=db_error');
            }
            exit;
        }

        if ($postAction === 'update') {
            $controller->updateAction($pdo);

        } elseif ($postAction === 'demandeAccept') {
            $id = intval($_GET['id'] ?? 0);
            ob_clean(); header('Content-Type: application/json');
            if (!$id) { echo json_encode(['success' => false]); exit; }
            try {
                $d = $pdo->prepare("SELECT * FROM demande_projet WHERE id_demande = :id AND statut = 'en_attente'");
                $d->execute(['id' => $id]);
                $row = $d->fetch(PDO::FETCH_ASSOC);
                if (!$row) { echo json_encode(['success' => false]); exit; }
                $pdo->prepare(
                    "INSERT INTO projet_crowdfunding (num_cin,titre,description,budget_cible,montant_actuel,statut_projet,ville,quartier,latitude,longitude,type_projet)
                     VALUES (:cin,:titre,:desc,:budget,0,'en_recherche_financement',:ville,:quartier,:lat,:lng,:type)"
                )->execute([
                    'cin'      => $row['num_cin'],
                    'titre'    => $row['titre'],
                    'desc'     => $row['description'],
                    'budget'   => $row['budget_cible'],
                    'ville'    => $row['ville'],
                    'quartier' => $row['quartier'],
                    'lat'      => $row['latitude'],
                    'lng'      => $row['longitude'],
                    'type'     => $row['type_projet'],
                ]);
                $pdo->prepare("UPDATE demande_projet SET statut='acceptee' WHERE id_demande=:id")->execute(['id' => $id]);
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            exit;

        } elseif ($postAction === 'demandeDecline') {
            $id = intval($_GET['id'] ?? 0);
            ob_clean(); header('Content-Type: application/json');
            try {
                $pdo->prepare("UPDATE demande_projet SET statut='refusee' WHERE id_demande=:id")->execute(['id' => $id]);
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                echo json_encode(['success' => false]);
            }
            exit;

        } else {
            $controller->addAction($pdo);
        }
    }
}
?>