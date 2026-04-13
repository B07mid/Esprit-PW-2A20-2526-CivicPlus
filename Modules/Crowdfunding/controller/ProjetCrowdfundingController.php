<?php
require_once '../model/ProjetCrowdfunding.php';
require_once '../config/config.php';

class ProjetCrowdfundingController {

    // R : Tous les projets (JSON)
    public function getAllAction($pdo) {
        header('Content-Type: application/json');
        echo json_encode(ProjetCrowdfunding::getAllProjets($pdo));
        exit();
    }

    // R : Un seul projet (JSON)
    public function getByIdAction($pdo) {
        if (isset($_GET['id'])) {
            header('Content-Type: application/json');
            echo json_encode(ProjetCrowdfunding::getProjetById($pdo, intval($_GET['id'])));
            exit();
        }
    }

    // C : Ajouter un projet (form POST → redirect)
    public function addAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
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
                !empty($_POST['longitude']) ? floatval($_POST['longitude']) : null
            );
            if ($nouveau->ajouterProjet($pdo)) {
                header('Location: ../view/liste_projets.html?success=1');
                exit();
            }
        }
    }

    // U : Modifier statut/titre/etc. (JSON)
    public function updateAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
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

    // D : Supprimer un projet (JSON)
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
        if ($_GET['action'] === 'getAll')  $controller->getAllAction($pdo);
        if ($_GET['action'] === 'getById') $controller->getByIdAction($pdo);
        if ($_GET['action'] === 'delete')  $controller->deleteAction($pdo);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['action']) && $_POST['action'] === 'update') {
            $controller->updateAction($pdo);
        } else {
            $controller->addAction($pdo);
        }
    }
}
?>

    public function __construct() {
        $this->model = new ProjetCrowdfunding();
    }

    public function list(): void {
        $projets = $this->model->getAll();
        require __DIR__ . '/../view/projet/list.php';
    }

    public function add(): void {
        $errors = [];
        $old    = [];
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $old    = $this->collect();
            $errors = $this->validate($old);
            if (empty($errors)) {
                try {
                    $this->model->add($old);
                    header('Location: index.php?action=list&flash=added');
                    exit;
                } catch (PDOException $e) {
                    if ($e->getCode() === '23000') {
                        $errors[] = 'CIN ' . htmlspecialchars($old['num_cin']) . ' does not exist in the citizen registry. Please enter a valid CIN.';
                    } else {
                        $errors[] = 'A database error occurred. Please try again.';
                    }
                }
            }
        }
        require __DIR__ . '/../view/projet/add.php';
    }

    public function edit(): void {
        $id     = intval($_GET['id'] ?? 0);
        $errors = [];

        $projet = $this->model->getById($id);
        if (!$projet) {
            header('Location: index.php?action=list');
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $old    = $this->collect();
            $errors = $this->validate($old);
            if (empty($errors)) {
                try {
                    $this->model->update($id, $old);
                    header('Location: index.php?action=list&flash=updated');
                    exit;
                } catch (PDOException $e) {
                    if ($e->getCode() === '23000') {
                        $errors[] = 'CIN ' . htmlspecialchars($old['num_cin']) . ' does not exist in the citizen registry. Please enter a valid CIN.';
                    } else {
                        $errors[] = 'A database error occurred. Please try again.';
                    }
                }
            }
            // repopulate form with submitted values on error
            $projet = array_merge($projet, $old);
        }

        require __DIR__ . '/../view/projet/edit.php';
    }

    public function delete(): void {
        $id = intval($_GET['id'] ?? 0);
        if ($id > 0) {
            $this->model->delete($id);
        }
        header('Location: index.php?action=list&flash=deleted');
        exit;
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function collect(): array {
        $allowed_statuts = ['en_recherche_financement', 'financé', 'en_cours', 'terminé', 'annulé'];
        $statut = trim($_POST['statut_projet'] ?? '');

        return [
            'num_cin'       => intval($_POST['num_cin'] ?? 0),
            'titre'         => trim($_POST['projTitle'] ?? ''),
            'description'   => trim($_POST['projDesc'] ?? ''),
            'budget_cible'  => filter_var($_POST['projBudget'] ?? '', FILTER_VALIDATE_FLOAT),
            'montant_actuel'=> filter_var($_POST['projRaised'] ?? '0', FILTER_VALIDATE_FLOAT) ?: 0.0,
            'statut_projet' => in_array($statut, $allowed_statuts, true) ? $statut : '',
            'ville'         => trim($_POST['projCity'] ?? ''),
            'quartier'      => trim($_POST['projNeighborhood'] ?? ''),
            'latitude'      => filter_var($_POST['latitude'] ?? '0', FILTER_VALIDATE_FLOAT) ?: 0.0,
            'longitude'     => filter_var($_POST['longitude'] ?? '0', FILTER_VALIDATE_FLOAT) ?: 0.0,
        ];
    }

    private function validate(array $d): array {
        $errors = [];
        if ($d['num_cin'] <= 0)                             $errors[] = 'Le numéro CIN est obligatoire.';
        if ($d['titre'] === '')                             $errors[] = 'Le titre est obligatoire.';
        if ($d['budget_cible'] === false || $d['budget_cible'] <= 0)
                                                            $errors[] = 'Le budget cible doit être un nombre positif.';
        if ($d['statut_projet'] === '')                     $errors[] = 'Le statut du projet est invalide.';
        if ($d['ville'] === '')                             $errors[] = 'La ville est obligatoire.';
        if ($d['quartier'] === '')                          $errors[] = 'Le quartier est obligatoire.';
        return $errors;
    }
}
