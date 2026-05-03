<?php
require_once '../model/Donation.php';
require_once '../model/ProjetCrowdfunding.php';
require_once '../config/config.php';

class DonationController {
    private array $statutsPaiement = ['en_attente', 'confirmé', 'annulé'];
    private array $methodesPaiement = ['carte_bancaire', 'virement', 'mobile_money', 'especes'];

    private function isValidDonationInput(array $data): bool {
        $cin = trim($data['num_cin'] ?? '');
        $idProjet = filter_var($data['id_projet'] ?? null, FILTER_VALIDATE_INT);
        $montant = filter_var($data['montant'] ?? null, FILTER_VALIDATE_FLOAT);
        $methode = trim($data['methode_paiement'] ?? '');

        return preg_match('/^\d{8}$/', $cin)
            && $idProjet !== false
            && $idProjet > 0
            && $montant !== false
            && $montant > 0
            && in_array($methode, $this->methodesPaiement, true);
    }

    private function redirectWith(string $base, array $params): void {
        $separator = strpos($base, '?') === false ? '?' : '&';
        header('Location: ' . $base . $separator . http_build_query($params));
        exit();
    }

    // Retourne toutes les donations en format JSON.
    // Appelé par la page liste_donations.html pour peupler le tableau backoffice.
    public function getAllAction($pdo) {
        header('Content-Type: application/json');
        echo json_encode(Donation::getAllDonations($pdo));
        exit();
    }

    // Traite le formulaire POST de création d'une donation citoyenne.
    // Valide le statut, insère en base, rafraîchit le montant collecté du projet, et redirige.
    public function addAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $redirect = isset($_GET['citoyen'])
                ? '../view/citoyen_nouvelle_donation.html'
                : '../view/liste_donations.html';
            if (isset($_GET['citoyen']) && intval($_POST['id_projet'] ?? 0) > 0) {
                $redirect .= '?id_projet=' . intval($_POST['id_projet']);
            }

            if (!$this->isValidDonationInput($_POST)) {
                $this->redirectWith($redirect, ['error' => 'validation']);
            }

            $statut = 'en_attente';
            $methode = htmlspecialchars(trim($_POST['methode_paiement'] ?? ''));

            $nouvelle = new Donation(
                null,
                intval($_POST['num_cin']),
                intval($_POST['id_projet']),
                floatval($_POST['montant']),
                htmlspecialchars(trim($_POST['reference_transaction'] ?? '')),
                $statut,
                $methode
            );
            try {
                if ($nouvelle->ajouterDonation($pdo)) {
                    ProjetCrowdfunding::refreshRaised($pdo, intval($_POST['id_projet']));
                    $this->redirectWith($redirect, ['success' => '1']);
                }
            } catch (PDOException $e) {
                if ($e->getCode() === '23000') {
                    $this->redirectWith($redirect, ['error' => 'cin_not_found']);
                } else {
                    $this->redirectWith($redirect, ['error' => 'db_error']);
                }
            }
        }
    }

    // Modifie le statut de paiement d'une donation existante via POST.
    // Appelé depuis le tableau backoffice après double-clic sur la cellule statut.
    public function updateAction($pdo) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $allowed = $this->statutsPaiement;
            $statut  = htmlspecialchars(trim($_POST['statut_paiement'] ?? ''));
            if (intval($_POST['id_don'] ?? 0) <= 0 || !in_array($statut, $allowed, true)) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false]);
                exit();
            }
            $modifie = new Donation(intval($_POST['id_don']), null, null, null, null, $statut);
            $succes  = $modifie->modifierDonation($pdo);
            if ($succes && isset($_POST['id_projet'])) {
                ProjetCrowdfunding::refreshRaised($pdo, intval($_POST['id_projet']));
            }
            header('Content-Type: application/json');
            echo json_encode(['success' => $succes]);
            exit();
        }
    }

    // Supprime une donation et rafraîchit le montant collecté du projet concerné.
    // Appelé depuis le bouton Supprimer de la liste des donations en backoffice.
    public function deleteAction($pdo) {
        if (isset($_GET['id'])) {
            $id   = intval($_GET['id']);
            $stmt = $pdo->prepare('SELECT id_projet FROM donation WHERE id_don = :id');
            $stmt->execute(['id' => $id]);
            $row  = $stmt->fetch(PDO::FETCH_ASSOC);
            $succes = Donation::supprimerDonation($pdo, $id);
            if ($succes && $row) {
                ProjetCrowdfunding::refreshRaised($pdo, $row['id_projet']);
            }
            header('Content-Type: application/json');
            echo json_encode(['success' => $succes]);
            exit();
        }
    }
}

// =======================================================
// ROUTEUR INTERNE
// =======================================================
if (basename($_SERVER['PHP_SELF']) == 'DonationController.php') {
    $controller = new DonationController();

    if (isset($_GET['action'])) {
        if ($_GET['action'] === 'getAll')  $controller->getAllAction($pdo);
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
