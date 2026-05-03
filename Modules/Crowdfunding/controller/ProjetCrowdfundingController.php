<?php
require_once '../model/ProjetCrowdfunding.php';
require_once '../config/config.php';

class ProjetCrowdfundingController {
    private array $typesProjet = ['infrastructure', 'sante', 'education', 'environnement', 'culture', 'sport', 'autre'];
    private array $statutsProjet = ['en_recherche_financement', 'financé', 'en_cours', 'terminé', 'annulé'];

    // Retourne la liste complète de tous les projets crowdfunding en format JSON.
    // Réponse utilisée par les pages admin et citoyen pour afficher les projets.
    public function getAllAction($pdo) {
        header('Content-Type: application/json');
        echo json_encode(ProjetCrowdfunding::getAllProjets($pdo));
        exit();
    }

    // Retourne les données d'un seul projet en JSON, identifié par le paramètre GET 'id'.
    // Utilisé pour pré-remplir le formulaire de donation avec le nom du projet.
    public function getByIdAction($pdo) {
        if (isset($_GET['id'])) {
            header('Content-Type: application/json');
            echo json_encode(ProjetCrowdfunding::getProjetById($pdo, intval($_GET['id'])));
            exit();
        }
    }

    public function demandeCountAction($pdo) {
        header('Content-Type: application/json');
        echo json_encode(['count' => ProjetCrowdfunding::countDemandes($pdo)]);
        exit();
    }

    private function isValidProjetInput(array $data): bool {
        $cin = trim($data['num_cin'] ?? '');
        $titre = trim($data['titre'] ?? '');
        $type = trim($data['type_projet'] ?? 'autre');
        $description = trim($data['description'] ?? '');
        $budget = filter_var($data['budget_cible'] ?? null, FILTER_VALIDATE_FLOAT);
        $ville = trim($data['ville'] ?? '');
        $quartier = trim($data['quartier'] ?? '');
        $latitude = trim($data['latitude'] ?? '');
        $longitude = trim($data['longitude'] ?? '');

        if (!preg_match('/^\d{8}$/', $cin)) return false;
        if (strlen($titre) < 3 || !in_array($type, $this->typesProjet, true)) return false;
        if (strlen($description) < 10 || $budget === false || $budget <= 0) return false;
        if (strlen($ville) < 2 || strlen($quartier) < 2) return false;
        if ($latitude !== '' && (!is_numeric($latitude) || $latitude < -90 || $latitude > 90)) return false;
        if ($longitude !== '' && (!is_numeric($longitude) || $longitude < -180 || $longitude > 180)) return false;
        return true;
    }

    private function isValidProjetUpdate(array $data): bool {
        $statut = trim($data['statut_projet'] ?? '');
        return intval($data['id_projet'] ?? 0) > 0
            && strlen(trim($data['titre'] ?? '')) >= 3
            && strlen(trim($data['description'] ?? '')) >= 10
            && filter_var($data['budget_cible'] ?? null, FILTER_VALIDATE_FLOAT) !== false
            && floatval($data['budget_cible']) > 0
            && strlen(trim($data['ville'] ?? '')) >= 2
            && strlen(trim($data['quartier'] ?? '')) >= 2
            && in_array($statut, $this->statutsProjet, true);
    }

    // Traite le formulaire POST de création d'un nouveau projet.
    // Sanitize les entrées, instancie le modèle et redirige vers la liste en cas de succès.
    public function addAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $redirect = isset($_GET['demande'])
                ? '../view/citoyen_nouveau_projet.html'
                : '../view/liste_projets.html';

            if (!$this->isValidProjetInput($_POST)) {
                header('Location: ' . $redirect . '?error=validation');
                exit();
            }

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
                htmlspecialchars(trim($_POST['type_projet']))
            );
            if ($nouveau->ajouterProjet($pdo)) {
                header('Location: ' . $redirect . '?success=1');
                exit();
            }
        }
    }

    // Met à jour les champs d'un projet existant via un POST JSON.
    // Appelé depuis le modal d'édition de la page liste_projets.html.
    public function updateAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!$this->isValidProjetUpdate($_POST)) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false]);
                exit();
            }

            $modifie = new ProjetCrowdfunding(
                intval($_POST['id_projet']),
                null,
                htmlspecialchars(trim($_POST['titre']         ?? '')),
                htmlspecialchars(trim($_POST['description']   ?? '')),
                !empty($_POST['budget_cible']) ? floatval($_POST['budget_cible']) : null,
                0,
                htmlspecialchars(trim($_POST['statut_projet'] ?? '')),
                htmlspecialchars(trim($_POST['ville']         ?? '')),
                htmlspecialchars(trim($_POST['quartier']      ?? ''))
            );
            $succes = $modifie->modifierProjet($pdo);
            header('Content-Type: application/json');
            echo json_encode(['success' => $succes]);
            exit();
        }
    }

    // Supprime un projet via son ID passé en GET et retourne le résultat en JSON.
    // Appelé depuis le bouton Supprimer de la liste des projets en backoffice.
    public function deleteAction($pdo) {
        if (isset($_GET['id'])) {
            $succes = ProjetCrowdfunding::supprimerProjet($pdo, intval($_GET['id']));
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
        if ($_GET['action'] === 'getAll')       $controller->getAllAction($pdo);
        if ($_GET['action'] === 'getById')      $controller->getByIdAction($pdo);
        if ($_GET['action'] === 'delete')       $controller->deleteAction($pdo);
        if ($_GET['action'] === 'demandeCount') $controller->demandeCountAction($pdo);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['action']) && $_POST['action'] === 'update') {
            $controller->updateAction($pdo);
        } else {
            $controller->addAction($pdo);
        }
    }
}
?>
