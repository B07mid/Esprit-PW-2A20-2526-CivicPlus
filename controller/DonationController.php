<?php
require_once '../model/Donation.php';
require_once '../model/ProjetCrowdfunding.php';
require_once '../config/config.php';
require_once __DIR__ . '/../../PointsCivisme/Model/CivismeModel.php';
require_once __DIR__ . '/../../../includes/SocialNotification.php';

class DonationController {
    private array $statutsPaiement = ['en_attente', 'confirmé', 'annulé'];
    private array $methodesPaiement = ['flouci', 'credit_card'];

    private function isValidDonationInput(array $data): bool {
        $cin = trim($data['num_cin'] ?? '');
        $idProjet = filter_var($data['id_projet'] ?? null, FILTER_VALIDATE_INT);
        $montant = filter_var($data['montant'] ?? null, FILTER_VALIDATE_FLOAT);
        $methode = trim($data['methode_paiement'] ?? '');

        $hasFlouciTransaction = $methode !== 'flouci'
            || trim($data['flouci_transaction_id'] ?? '') !== '';
        $usesSavedCard = $methode === 'credit_card'
            && preg_match('/^[a-f0-9]{16}$/', trim($data['saved_payment_card_id'] ?? ''))
            && preg_match('/^\d{3,4}$/', trim($data['cvv'] ?? ''));
        $hasCardFields = $methode !== 'credit_card'
            || $usesSavedCard
            || (
                trim($data['cardName'] ?? '') !== ''
                && preg_match('/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/', trim($data['cardNumber'] ?? ''))
                && preg_match('/^\d{2}\/\d{2}$/', trim($data['expiryDate'] ?? ''))
                && preg_match('/^\d{3,4}$/', trim($data['cvv'] ?? ''))
            );

        return preg_match('/^\d{8}$/', $cin)
            && $idProjet !== false
            && $idProjet > 0
            && $montant !== false
            && $montant > 0
            && in_array($methode, $this->methodesPaiement, true)
            && $hasFlouciTransaction
            && $hasCardFields;
    }

    private function savedCardBelongsToCitizen($pdo, int $cin, string $cardId): bool {
        if (!preg_match('/^[a-f0-9]{16}$/', $cardId)) {
            return false;
        }

        try {
            $stmt = $pdo->prepare("SELECT saved_payment_methods FROM citoyen WHERE num_cin = :cin LIMIT 1");
            $stmt->execute(['cin' => $cin]);
            foreach (preg_split('/\R/', (string)($stmt->fetchColumn() ?: '')) as $line) {
                if (str_starts_with(trim($line), $cardId . '|')) {
                    return true;
                }
            }
        } catch (Throwable $e) {
            return false;
        }

        return false;
    }

    private function uploadFlouciProof(array $file): ?string {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            return null;
        }

        $allowed = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];
        $tmp = $file['tmp_name'] ?? '';
        $mime = is_uploaded_file($tmp) ? mime_content_type($tmp) : '';
        if (!isset($allowed[$mime])) {
            return null;
        }

        $dir = dirname(__DIR__) . '/uploads/donations';
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $name = 'preuve_' . date('YmdHis') . '_' . bin2hex(random_bytes(4)) . '.' . $allowed[$mime];
        $target = $dir . '/' . $name;
        if (!move_uploaded_file($tmp, $target)) {
            return null;
        }

        return 'Modules/Crowdfunding/uploads/donations/' . $name;
    }

    private function redirectWith(string $base, array $params): void {
        $separator = strpos($base, '?') === false ? '?' : '&';
        header('Location: ' . $base . $separator . http_build_query($params));
        exit();
    }

    private function statutEstConfirme(string $statut): bool {
        return str_starts_with(strtolower(trim($statut)), 'confirm');
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

            if (
                ($_POST['methode_paiement'] ?? '') === 'credit_card'
                && trim($_POST['saved_payment_card_id'] ?? '') !== ''
                && !$this->savedCardBelongsToCitizen($pdo, intval($_POST['num_cin']), trim($_POST['saved_payment_card_id']))
            ) {
                $this->redirectWith($redirect, ['error' => 'validation']);
            }

            $statut = 'en_attente';
            $methode = htmlspecialchars(trim($_POST['methode_paiement'] ?? ''));
            $flouciTransactionId = $methode === 'flouci'
                ? htmlspecialchars(trim($_POST['flouci_transaction_id'] ?? ''), ENT_QUOTES, 'UTF-8')
                : null;
            $preuvePaiementImage = $methode === 'flouci'
                && isset($_FILES['preuve_paiement_image'])
                && ($_FILES['preuve_paiement_image']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK
                ? $this->uploadFlouciProof($_FILES['preuve_paiement_image'])
                : null;

            if ($methode === 'flouci' && $flouciTransactionId === '') {
                $this->redirectWith($redirect, ['error' => 'validation']);
            }

            $nouvelle = new Donation(
                null,
                intval($_POST['num_cin']),
                intval($_POST['id_projet']),
                floatval($_POST['montant']),
                htmlspecialchars(trim($_POST['reference_transaction'] ?? '')),
                $statut,
                $methode,
                $flouciTransactionId,
                $preuvePaiementImage
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
            $idDon = intval($_POST['id_don'] ?? 0);
            if ($idDon <= 0 || !in_array($statut, $allowed, true)) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false]);
                exit();
            }
            $stmtAvant = $pdo->prepare("SELECT num_cin, montant, statut_paiement FROM donation WHERE id_don = :id LIMIT 1");
            $stmtAvant->execute(['id' => $idDon]);
            $donationAvant = $stmtAvant->fetch(PDO::FETCH_ASSOC);

            $modifie = new Donation($idDon, null, null, null, null, $statut);
            $succes  = $modifie->modifierDonation($pdo);
            if ($succes && isset($_POST['id_projet'])) {
                ProjetCrowdfunding::refreshRaised($pdo, intval($_POST['id_projet']));
            }
            $pointsAjoutes = 0;
            if (
                $succes
                && $donationAvant
                && $this->statutEstConfirme($statut)
                && !$this->statutEstConfirme((string) ($donationAvant['statut_paiement'] ?? ''))
            ) {
                $pointsAjoutes = CivismeModel::ajouterPoints(
                    (int) $donationAvant['num_cin'],
                    (int) ((float) $donationAvant['montant'] * 10),
                    'don_crowdfunding',
                    1000,
                    30
                );
                cp_social_push_notification(
                    (string) $donationAvant['num_cin'],
                    'crowdfunding_donation_confirmed',
                    'Donation confirmee',
                    'Votre donation #' . $idDon . ' a ete confirmee.',
                    'Modules/Crowdfunding/view/index.html',
                    (string) ($_POST['id_projet'] ?? '')
                );
            }
            header('Content-Type: application/json');
            echo json_encode(['success' => $succes, 'points_ajoutes' => $pointsAjoutes]);
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
