<?php
require_once '../model/ProjetCrowdfunding.php';
require_once '../config/config.php';
require_once __DIR__ . '/ProjetDecisionMailer.php';

class ProjetCrowdfundingController {
    private array $typesProjet = ['infrastructure', 'sante', 'education', 'environnement', 'culture', 'sport', 'autre'];
    private array $statutsProjet = ['en_cours', 'termine'];

    private function jsonHeaders(): void {
        header('Content-Type: application/json');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
    }

    public function getAllAction($pdo) {
        $this->jsonHeaders();
        echo json_encode(ProjetCrowdfunding::getAllProjets($pdo));
        exit();
    }

    public function getPublicAction($pdo) {
        $this->jsonHeaders();
        echo json_encode(ProjetCrowdfunding::getPublicProjets($pdo));
        exit();
    }

    public function getByIdAction($pdo) {
        if (isset($_GET['id'])) {
            $this->jsonHeaders();
            echo json_encode(ProjetCrowdfunding::getProjetById($pdo, intval($_GET['id'])));
            exit();
        }
    }

    public function demandeCountAction($pdo) {
        $this->jsonHeaders();
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

    private function uploadProjetImage(?array $file, ?string $existingPath = null): ?string {
        if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            return $existingPath;
        }

        if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK || ($file['size'] ?? 0) > 5 * 1024 * 1024) {
            return null;
        }

        $tmpName = (string)($file['tmp_name'] ?? '');
        $info = $tmpName !== '' ? getimagesize($tmpName) : false;
        $allowed = [
            IMAGETYPE_JPEG => 'jpg',
            IMAGETYPE_PNG => 'png',
            IMAGETYPE_WEBP => 'webp',
            IMAGETYPE_GIF => 'gif',
        ];

        if (!$info || !isset($allowed[$info[2]])) {
            return null;
        }

        $uploadDir = dirname(__DIR__) . '/uploads/projets';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
            return null;
        }

        $fileName = 'projet_' . date('YmdHis') . '_' . bin2hex(random_bytes(4)) . '.' . $allowed[$info[2]];
        $target = $uploadDir . '/' . $fileName;

        if (!move_uploaded_file($tmpName, $target)) {
            return null;
        }

        return 'Modules/Crowdfunding/uploads/projets/' . $fileName;
    }

    private function isValidStatutProjet(string $statut): bool {
        return in_array($statut, $this->statutsProjet, true);
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
            && $this->isValidStatutProjet($statut);
    }

    public function addAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') return;

        $redirect = isset($_GET['demande'])
            ? '../view/citoyen_nouveau_projet.html'
            : '../view/liste_projets.html';

        if (!$this->isValidProjetInput($_POST)) {
            header('Location: ' . $redirect . '?error=validation');
            exit();
        }

        $imagePath = $this->uploadProjetImage($_FILES['image_projet'] ?? null);
        if ($imagePath === null) {
            header('Location: ' . $redirect . '?error=image');
            exit();
        }

        $nouveau = new ProjetCrowdfunding(
            null,
            intval($_POST['num_cin']),
            htmlspecialchars(trim($_POST['titre'])),
            htmlspecialchars(trim($_POST['description'])),
            floatval($_POST['budget_cible']),
            0,
            'en_cours',
            htmlspecialchars(trim($_POST['ville'])),
            htmlspecialchars(trim($_POST['quartier'])),
            !empty($_POST['latitude'])  ? floatval($_POST['latitude'])  : null,
            !empty($_POST['longitude']) ? floatval($_POST['longitude']) : null,
            htmlspecialchars(trim($_POST['type_projet'])),
            $imagePath
        );

        if ($nouveau->ajouterProjet($pdo)) {
            header('Location: ' . $redirect . '?success=1');
            exit();
        }
    }

    public function updateAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') return;

        if (!$this->isValidProjetUpdate($_POST)) {
            $this->jsonHeaders();
            echo json_encode(['success' => false]);
            exit();
        }

        $idProjet = intval($_POST['id_projet']);
        $statut = htmlspecialchars(trim($_POST['statut_projet'] ?? ''));
        $projetAvantModification = ProjetCrowdfunding::getProjetAvecCitoyen($pdo, $idProjet);

        if (!$projetAvantModification) {
            $this->jsonHeaders();
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'not_found']);
            exit();
        }

        $imagePath = $this->uploadProjetImage($_FILES['image_projet'] ?? null, $projetAvantModification['image_url'] ?? null);
        if ($imagePath === null) {
            $this->jsonHeaders();
            echo json_encode(['success' => false, 'error' => 'image']);
            exit();
        }

        $modifie = new ProjetCrowdfunding(
            $idProjet,
            null,
            htmlspecialchars(trim($_POST['titre'] ?? '')),
            htmlspecialchars(trim($_POST['description'] ?? '')),
            !empty($_POST['budget_cible']) ? floatval($_POST['budget_cible']) : null,
            0,
            $statut,
            htmlspecialchars(trim($_POST['ville'] ?? '')),
            htmlspecialchars(trim($_POST['quartier'] ?? '')),
            null,
            null,
            'autre',
            $imagePath
        );

        $this->jsonHeaders();
        echo json_encode([
            'success' => $modifie->modifierProjet($pdo),
            'email_expected' => false,
            'email_sent' => null,
            'email_recipient' => null,
        ]);
        exit();
    }

    public function decisionAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') return;

        $idProjet = intval($_POST['id_projet'] ?? 0);
        $decision = trim($_POST['decision'] ?? '');
        if ($idProjet <= 0 || !in_array($decision, ['accepte', 'rejete'], true)) {
            $this->jsonHeaders();
            echo json_encode(['success' => false, 'error' => 'validation']);
            exit();
        }

        $projet = ProjetCrowdfunding::getProjetAvecCitoyen($pdo, $idProjet);
        if (!$projet) {
            $this->jsonHeaders();
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'not_found']);
            exit();
        }

        $succes = ProjetCrowdfunding::changerDecisionAdmin($pdo, $idProjet, $decision);
        $emailEnvoye = false;
        $emailDestinataire = $projet['email'] ?? null;

        if ($succes) {
            $emailEnvoye = envoyerEmailDecisionProjet($projet, $decision);
            ProjetCrowdfunding::enregistrerStatutEmailDecision($pdo, $idProjet, $emailEnvoye, $emailDestinataire);
        }

        $this->jsonHeaders();
        echo json_encode([
            'success' => $succes,
            'email_expected' => true,
            'email_sent' => $emailEnvoye,
            'email_recipient' => $emailDestinataire,
        ]);
        exit();
    }

    public function deleteAction($pdo) {
        if (isset($_GET['id'])) {
            $succes = ProjetCrowdfunding::supprimerProjet($pdo, intval($_GET['id']));
            $this->jsonHeaders();
            echo json_encode(['success' => $succes]);
            exit();
        }
    }
}

if (basename($_SERVER['PHP_SELF']) == 'ProjetCrowdfundingController.php') {
    $controller = new ProjetCrowdfundingController();

    if (isset($_GET['action'])) {
        if ($_GET['action'] === 'getAll')       $controller->getAllAction($pdo);
        if ($_GET['action'] === 'getPublic')    $controller->getPublicAction($pdo);
        if ($_GET['action'] === 'getById')      $controller->getByIdAction($pdo);
        if ($_GET['action'] === 'delete')       $controller->deleteAction($pdo);
        if ($_GET['action'] === 'demandeCount') $controller->demandeCountAction($pdo);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['action']) && $_POST['action'] === 'update') {
            $controller->updateAction($pdo);
        } elseif (isset($_POST['action']) && $_POST['action'] === 'decision') {
            $controller->decisionAction($pdo);
        } else {
            $controller->addAction($pdo);
        }
    }
}
?>
